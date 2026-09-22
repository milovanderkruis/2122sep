# MCP-server voor de 4-testing site

Een kleine MCP-server in Python met één tool, `list_articles`. Hij geeft alle artikelen op de
artikelpagina van de site (`articles.html`), elk met:

- `title`: de titel zoals hij op de site staat
- `word_count`: het aantal woorden van het artikel zelf. De server haalt het artikel op bij de bron en telt de tekst
  in `<article>`, anders in `<main>`, anders op de hele pagina (zonder menu, scripts en voettekst).
  Lukt het ophalen of tellen niet, dan is dit `null` en staat de reden in `word_count_note`. Er wordt nooit een getal verzonnen.
- `url`: de link naar het artikel

Het aantal woorden is een goede schatting en geen exacte telling: bijschriften en "lees ook"-blokken binnen het artikel tellen mee.

## Bestanden

| Bestand | Wat |
|---|---|
| `server.py` | de MCP-server (stdio), dunne laag om `articles.py` |
| `articles.py` | artikelen uit de pagina halen, woorden tellen, artikelen ophalen (alleen standaardbibliotheek, plus `certifi` voor https) |
| `test_articles.py`, `test_server.py` | de tests. `test_server.py` start de echte server en gebruikt een tijdelijk lokaal webservertje, dus geen internet nodig |
| `run-tests.sh` | draait de tests, met `.venv` als die er is. `npm test` doet dit ook |
| `requirements.txt` | de pakketten (`mcp` 2.x en `certifi`) |

## Installeren (eenmalig)

```sh
cd mcp
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## Toevoegen aan Claude Code

```sh
claude mcp add --scope local 4-testing-articles -- "$PWD/.venv/bin/python" "$PWD/server.py"
```

`--scope local` betekent: alleen voor jou, alleen in dit project. Wil je de server in al je projecten,
gebruik dan `--scope user`. Controleer met `claude mcp list` (er moet "Connected" bij staan).
Verwijderen kan met `claude mcp remove 4-testing-articles -s local`.

## Herladen

Claude Code leest MCP-servers bij het starten van een sessie. Na het toevoegen, of na een wijziging in `server.py` of `articles.py`:

1. Sluit de sessie af met `/exit` (of Ctrl+C twee keer).
2. Start hem opnieuw in de projectmap met `claude --continue`. Dan gaat je gesprek door.
3. Typ `/mcp` en kijk of `4-testing-articles` op "connected" staat.
4. Vraag bijvoorbeeld: "Roep de tool list_articles aan en toon de lijst."

Alleen de server opnieuw verbinden (bijvoorbeeld als hij is vastgelopen) kan in `/mcp`: kies de server en
kies opnieuw verbinden.

## Tests draaien

```sh
npm test                 # alles: de site-tests én deze Python-tests
sh mcp/run-tests.sh      # alleen de Python-tests
```
