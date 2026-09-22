"""Tests voor articles.py: de artikelen van de site opsommen en hun woorden tellen.

Draaien: `npm test` of `python3 -m unittest discover -s mcp`. Er zijn geen extra pakketten nodig.
"""
import pathlib
import unittest

import articles

SITE = pathlib.Path(__file__).resolve().parent.parent

CARDS = """
<ul class="articles">
  <li class="article-card">
    <div class="body">
      <h2><a href="https://example.test/een" target="_blank" rel="noopener noreferrer">Eerste artikel</a></h2>
      <p>Samenvatting.</p>
    </div>
  </li>
  <li class="article-card">
    <img src="x.jpg" alt="foto">
    <div class="body">
      <h2><a href="https://example.test/twee">Beginner&#39;s Guide &amp; meer</a></h2>
    </div>
  </li>
</ul>
"""

ARTICLE_PAGE = """
<html><head><title>Titel van de pagina</title><style>.x { color: red }</style>
<script>var zeven = "een twee drie vier vijf zes zeven";</script></head>
<body>
<nav>Home Over ons Contact</nav>
<header>Kop van de site</header>
<article><h1>Wat is testen?</h1><p>Testen is <b>belangrijk</b> voor je gebruikers.</p>
<p>Ook déze woorden tellen, met accenten en 2 cijfers.</p></article>
<aside>Gerelateerde artikelen</aside>
<footer>Copyright bedrijf</footer>
</body></html>
"""


class ParseArticles(unittest.TestCase):
    def test_geeft_titel_en_url_in_volgorde_van_de_pagina(self):
        result = articles.parse_articles(CARDS)
        self.assertEqual(result, [
            {"title": "Eerste artikel", "url": "https://example.test/een"},
            {"title": "Beginner's Guide & meer", "url": "https://example.test/twee"},
        ])

    def test_pagina_zonder_artikelen_geeft_een_lege_lijst(self):
        self.assertEqual(articles.parse_articles("<main><p>Niets hier</p></main>"), [])

    def test_de_echte_artikelpagina_bevat_de_bekende_artikelen(self):
        html = (SITE / "articles.html").read_text(encoding="utf-8")
        found = articles.parse_articles(html)
        urls = [a["url"] for a in found]
        self.assertIn("https://workingtalent.nl/wat-is-software-testen", urls)
        self.assertIn("https://www.splunk.com/en_us/blog/learn/software-testing.html", urls)
        self.assertEqual(len(urls), len(set(urls)), "elk artikel hoort maar één keer in de lijst")
        for a in found:
            self.assertTrue(a["title"].strip(), "een artikel zonder titel: " + a["url"])


class CountWords(unittest.TestCase):
    def test_telt_de_woorden_van_het_artikel_zelf(self):
        # "Wat is testen?" (3) + "Testen is belangrijk voor je gebruikers." (6)
        # + "Ook déze woorden tellen, met accenten en 2 cijfers." (9) = 18
        self.assertEqual(articles.count_words(ARTICLE_PAGE), 18)

    def test_negeert_scripts_stijlen_menu_kop_en_voettekst(self):
        text_only_outside_article = "<nav>a b c</nav><header>d e</header><footer>f g</footer><script>h i j</script>"
        self.assertEqual(articles.count_words("<article>een twee</article>" + text_only_outside_article), 2)

    def test_valt_terug_op_main_en_dan_op_body_als_er_geen_article_is(self):
        self.assertEqual(articles.count_words("<nav>x y</nav><main>een twee drie</main><footer>z</footer>"), 3)
        self.assertEqual(articles.count_words("<body><p>een twee</p></body>"), 2)

    def test_pagina_zonder_zichtbare_tekst_geeft_none_en_niet_nul(self):
        # Een pagina die alleen met JavaScript wordt opgebouwd: 0 woorden zou misleiden.
        self.assertIsNone(articles.count_words("<html><body><div id='root'></div><script>x()</script></body></html>"))


class FetchUrl(unittest.TestCase):
    def test_vertrouwt_rootcertificaten_zodat_https_werkt(self):
        # Python van python.org op macOS heeft standaard geen rootcertificaten, en dan
        # mislukt elke https-pagina met CERTIFICATE_VERIFY_FAILED. articles.py gebruikt daarom
        # de certificaten van het pakket certifi.
        context = articles.ssl_context()
        self.assertGreater(context.cert_store_stats()["x509_ca"], 0)

    def test_weigert_andere_adressen_dan_http_en_https(self):
        with self.assertRaises(ValueError):
            articles.fetch_url("file:///etc/passwd")


class ListArticles(unittest.TestCase):
    def test_geeft_titel_aantal_woorden_en_url(self):
        pages = {"https://example.test/een": ARTICLE_PAGE, "https://example.test/twee": "<article>een twee drie</article>"}
        result = articles.list_articles(CARDS, fetch=lambda url: pages[url])
        self.assertEqual(result, [
            {"title": "Eerste artikel", "word_count": 18, "url": "https://example.test/een"},
            {"title": "Beginner's Guide & meer", "word_count": 3, "url": "https://example.test/twee"},
        ])

    def test_lukt_ophalen_niet_dan_staat_er_geen_verzonnen_getal(self):
        def fetch(url):
            if url.endswith("/een"):
                raise OSError("geen verbinding")
            return "<article>een twee</article>"
        result = articles.list_articles(CARDS, fetch=fetch)
        self.assertIsNone(result[0]["word_count"])
        self.assertIn("geen verbinding", result[0]["word_count_note"])
        self.assertEqual(result[1]["word_count"], 2)
        self.assertNotIn("word_count_note", result[1])

    def test_een_pagina_zonder_tekst_krijgt_een_uitleg(self):
        result = articles.list_articles(CARDS, fetch=lambda url: "<div id='root'></div>")
        self.assertIsNone(result[0]["word_count"])
        self.assertIn("geen tekst", result[0]["word_count_note"])


if __name__ == "__main__":
    unittest.main()
