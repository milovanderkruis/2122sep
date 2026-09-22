"""De artikelen van de site opsommen en de woorden van elk artikel tellen.

Alleen standaardbibliotheek. De MCP-server (server.py) is een dunne laag hierboven.
"""
import re
import ssl
import urllib.request
from html.parser import HTMLParser

USER_AGENT = "4-testing-articles-mcp/1.0 (+https://milovanderkruis.github.io/2122sep/)"
FETCH_TIMEOUT_SECONDS = 15
MAX_BYTES = 5_000_000

# Woorden met een apostrof of streepje ("beginner's", "e-mail") tellen als één woord.
WORD = re.compile(r"[^\W_]+(?:['’-][^\W_]+)*")


class _CardParser(HTMLParser):
    """Zoekt in elke <li class="article-card"> de titellink: <h2><a href="...">titel</a></h2>."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found = []
        self._in_card = False
        self._in_h2 = False
        self._href = None
        self._text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "li" and "article-card" in (attrs.get("class") or "").split():
            self._in_card = True
        elif self._in_card and tag == "h2":
            self._in_h2 = True
        elif self._in_card and self._in_h2 and tag == "a" and attrs.get("href"):
            self._href = attrs["href"]
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self._href is not None:
            title = " ".join("".join(self._text).split())
            self.found.append({"title": title, "url": self._href})
            self._href = None
        elif tag == "h2":
            self._in_h2 = False
        elif tag == "li":
            self._in_card = False


def parse_articles(html):
    """Geeft [{"title": ..., "url": ...}] in de volgorde van de pagina."""
    parser = _CardParser()
    parser.feed(html)
    parser.close()
    return parser.found


class _TextParser(HTMLParser):
    """Verzamelt zichtbare tekst in drie bakken: <article>, <main> en de hele pagina."""

    # Nooit tekst van het artikel zelf.
    ALWAYS_SKIP = {"script", "style", "noscript", "template", "svg", "head", "nav", "aside", "form"}
    # Menubalk- en voettekstonderdelen: alleen overslaan buiten een <article>. Een kop in
    # het artikel zelf (<article><header><h1>) hoort er wel bij.
    SKIP_OUTSIDE_ARTICLE = {"header", "footer"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.article, self.main, self.page = [], [], []
        self._skip = []  # stapel met de tags die we overslaan
        self._article_depth = 0
        self._main_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag == "article":
            self._article_depth += 1
        elif tag == "main":
            self._main_depth += 1
        if tag in self.ALWAYS_SKIP or (tag in self.SKIP_OUTSIDE_ARTICLE and not self._article_depth):
            self._skip.append(tag)

    def handle_endtag(self, tag):
        if self._skip and self._skip[-1] == tag:
            self._skip.pop()
        if tag == "article" and self._article_depth:
            self._article_depth -= 1
        elif tag == "main" and self._main_depth:
            self._main_depth -= 1

    def handle_data(self, data):
        if self._skip:
            return
        self.page.append(data)
        if self._main_depth:
            self.main.append(data)
        if self._article_depth:
            self.article.append(data)


def count_words(html):
    """Telt de woorden van het artikel: eerst <article>, anders <main>, anders de hele pagina.

    Geeft None (en niet 0) als er geen tekst te vinden is, bijvoorbeeld bij een pagina die
    alleen met JavaScript wordt opgebouwd. Een verzonnen 0 zou misleiden.
    """
    parser = _TextParser()
    parser.feed(html)
    parser.close()
    for bucket in (parser.article, parser.main, parser.page):
        count = len(WORD.findall(" ".join(bucket)))
        if count:
            return count
    return None


def list_articles(html, fetch):
    """De lijst voor de MCP-tool: titel, aantal woorden en url van elk artikel op de site.

    `html` is de artikelpagina van de site en `fetch(url)` haalt een artikel op (tekst).
    Lukt het tellen niet, dan staat er word_count None met een uitleg in word_count_note.
    """
    result = []
    for article in parse_articles(html):
        entry = {"title": article["title"], "word_count": None, "url": article["url"]}
        try:
            entry["word_count"] = count_words(fetch(article["url"]))
            if entry["word_count"] is None:
                entry["word_count_note"] = "geen tekst gevonden in het artikel (de pagina bestaat waarschijnlijk alleen uit JavaScript)"
        except Exception as error:  # netwerk, time-out, HTTP-fout, vreemde codering
            entry["word_count_note"] = "kon het artikel niet ophalen: %s" % error
        result.append(entry)
    return result


def ssl_context():
    """Een SSL-context die rootcertificaten vertrouwt.

    Python van python.org op macOS heeft die standaard niet, en dan mislukt elke https-pagina met
    CERTIFICATE_VERIFY_FAILED. Het pakket certifi (staat in requirements.txt) heeft ze wel.
    """
    try:
        import certifi
    except ImportError:
        return ssl.create_default_context()
    return ssl.create_default_context(cafile=certifi.where())


def fetch_url(url):
    """Haalt een webpagina op en geeft de HTML als tekst. Alleen http en https."""
    if not url.lower().startswith(("http://", "https://")):
        raise ValueError("alleen http en https zijn toegestaan")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html"})
    with urllib.request.urlopen(request, timeout=FETCH_TIMEOUT_SECONDS, context=ssl_context()) as response:
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError("de pagina is groter dan %d MB" % (MAX_BYTES // 1_000_000))
        charset = response.headers.get_content_charset() or "utf-8"
    return raw.decode(charset, errors="replace")
