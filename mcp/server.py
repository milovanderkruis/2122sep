"""MCP-server voor de 4-testing site.

Eén tool, `list_articles`: alle artikelen op de artikelpagina van de site, met titel,
aantal woorden van het artikel zelf en url. Praat MCP via stdio, dus Claude Code start
hem zelf. Zie mcp/README.md voor installeren en herladen.

De site staat een map hoger. Met de omgevingsvariabele SITE_DIR wijs je naar een andere map.
"""
import os
import pathlib

from mcp.server.mcpserver import MCPServer

import articles

SITE_DIR = pathlib.Path(os.environ.get("SITE_DIR") or pathlib.Path(__file__).resolve().parent.parent)

server = MCPServer(
    "4-testing-articles",
    instructions="Geeft de artikelen op de website van 4-testing: titel, aantal woorden en url.",
)


@server.tool()
def list_articles() -> list[dict]:
    """Lijst alle artikelen die op de website van 4-testing staan (articles.html).

    Elk artikel heeft een titel, het aantal woorden van het artikel zelf (opgehaald bij de bron)
    en de url. Kan een artikel niet gelezen worden, dan is word_count null en legt
    word_count_note uit waarom.
    """
    html = (SITE_DIR / "articles.html").read_text(encoding="utf-8")
    return articles.list_articles(html, fetch=articles.fetch_url)


if __name__ == "__main__":
    server.run(transport="stdio")
