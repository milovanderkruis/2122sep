"""Test van de MCP-server zelf: starten, tools opvragen, de tool aanroepen.

De server wordt echt gestart en spreekt MCP via stdio. De artikelen worden opgehaald van een
tijdelijk webservertje op 127.0.0.1, dus de test heeft geen internet nodig en raakt de echte
site niet aan. Vraagt het pakket `mcp` (in mcp/.venv, zie mcp/README.md); anders wordt de test overgeslagen.
"""
import asyncio
import os
import pathlib
import sys
import tempfile
import threading
import unittest
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

try:
    from mcp.client import Client
    from mcp.client.stdio import StdioServerParameters
except ImportError:  # geen mcp-pakket in deze Python
    Client = None

HERE = pathlib.Path(__file__).resolve().parent


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@unittest.skipIf(Client is None, "het mcp-pakket ontbreekt: maak mcp/.venv aan (zie mcp/README.md)")
class ServerOverStdio(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = pathlib.Path(self.tmp.name)
        (root / "een.html").write_text("<html><body><nav>menu</nav><article>een twee drie vier</article></body></html>")
        (root / "twee.html").write_text("<html><body><main>vijf zes</main></body></html>")

        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(root)))
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        base = "http://127.0.0.1:%d" % self.httpd.server_address[1]

        (root / "articles.html").write_text(
            '<ul class="articles">'
            '<li class="article-card"><h2><a href="%s/een.html">Eerste</a></h2></li>'
            '<li class="article-card"><h2><a href="%s/twee.html">Tweede &amp; laatste</a></h2></li>'
            '<li class="article-card"><h2><a href="%s/bestaat-niet.html">Derde</a></h2></li>'
            '</ul>' % (base, base, base)
        )
        self.base = base
        self.params = StdioServerParameters(
            command=sys.executable,
            args=[str(HERE / "server.py")],
            env={**os.environ, "SITE_DIR": str(root)},
        )

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.tmp.cleanup()

    def run_client(self, action):
        async def go():
            async with Client(self.params) as client:
                return await action(client)
        return asyncio.run(asyncio.wait_for(go(), timeout=60))

    def test_biedt_precies_een_tool_aan(self):
        async def action(client):
            return await client.list_tools()
        tools = self.run_client(action).tools
        self.assertEqual([t.name for t in tools], ["list_articles"])
        self.assertTrue(tools[0].description, "de tool heeft een beschrijving nodig")

    def test_tool_geeft_titel_aantal_woorden_en_url(self):
        async def action(client):
            return await client.call_tool("list_articles", {})
        result = self.run_client(action)
        self.assertFalse(result.is_error)
        # De bibliotheek verpakt een lijst als {"result": [...]} in structured_content.
        rows = result.structured_content["result"]

        self.assertEqual([(r["title"], r["word_count"], r["url"]) for r in rows[:2]], [
            ("Eerste", 4, self.base + "/een.html"),
            ("Tweede & laatste", 2, self.base + "/twee.html"),
        ])
        # Een artikel dat niet te lezen is krijgt geen verzonnen getal, maar een uitleg.
        self.assertIsNone(rows[2]["word_count"])
        self.assertIn("kon het artikel niet ophalen", rows[2]["word_count_note"])


if __name__ == "__main__":
    unittest.main()
