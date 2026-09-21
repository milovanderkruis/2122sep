# 4-testing website

Static website (HTML/CSS) for 4-testing, the company of Milo van der Kruis. Hosted on GitHub Pages: https://milovanderkruis.github.io/2122sep/

## Writing style

The site is bilingual. Dutch is the default and lives in the HTML (`lang="nl"`); English is the second language, chosen with the dropdown on the homepage. Both languages are fairly informal and simple. Apply this style to every new or changed text, in both languages.

- Dutch: address the reader as "je/jij", never "u". English: "you". The company speaks as "we" (Dutch and English), not "ik" or "I".
- Short sentences, everyday words, no corporate jargon and no long compound words.
- Friendly and direct, but still credible for a testing company. No slang, exclamation marks or emoji.
- Buttons and labels are short, common Dutch words ("Vertel ons over je project", "Versturen", "Naam", "E-mail", "Bericht").
- Rewrite existing text if it does not fit this style.
- Never invent facts, references, clients or milestones. Ask Milo.

Examples that fit the style (keep these in Dutch, they are site copy):

- "We helpen je om bugs vroeg te vinden, voordat je gebruikers ze tegenkomen."
- "Goed testen is meer dan bugs opsporen."
- "Heb je een vraag of een project in gedachten? Stuur ons een bericht, dan nemen we snel contact met je op."

## Structure

- Pages: `index.html` (home), `about.html` (Over ons), `articles.html` (Artikelen), `contact.html` (Contact). A History page existed but was removed until Milo has real milestones; do not bring it back with placeholders.
- One `style.css`: dark theme with a cyan accent. Each page has its own background via `body.page-home/about/articles/contact`.
- The logo is an inline SVG symbol (`<symbol id="logo">`) reused on every page with `<use>`.
- All pages share the same nav bar and footer. If you change one, change it on all four pages.
- New articles are added with the `/nieuw-artikel` skill (`.claude/skills/nieuw-artikel/`). It creates `articles.html` on first use and adds a card per article.
- Languages: the HTML holds the Dutch text. Every element with text gets its English version in a data attribute, handled by `i18n.js`: `data-en="..."` (text), `data-en-html="..."` (text with HTML such as `<strong>`), `data-en-<attribute>="..."` (for `alt`, `aria-label`, `content`, `action`). A new page or new text without English fails the tests. The visitor's choice lives in `localStorage` under `lang` and applies to all pages; the dropdown (`<select id="language">`) exists only on the homepage. Form messages in `contact.js` have their own nl/en table.
- Tests: `npm test` (Node's built-in runner plus jsdom, see `tests/`). Work test-first: write the failing test, show it, then build. Run the tests before every commit.
- The contact form currently uses `mailto:`. It will be replaced by a form service once Milo has a form URL.
