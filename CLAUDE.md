# 4-testing website

Static website (HTML/CSS) for 4-testing, the company of Milo van der Kruis. Hosted on GitHub Pages: https://milovanderkruis.github.io/2122sep/

## Writing style

The site is bilingual. Dutch is the default and lives in the HTML (`lang="nl"`); English is the second language, chosen with the dropdown in the menu. Both languages are fairly informal and simple. Apply this style to every new or changed text, in both languages.

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
- Languages: the HTML holds the Dutch text. Every element with text gets its English version in a data attribute, handled by `i18n.js`: `data-en="..."` (text), `data-en-html="..."` (text with HTML such as `<strong>`), `data-en-<attribute>="..."` (for `alt`, `aria-label`, `content`, `action`). A new page or new text without English fails the tests. The visitor's choice lives in `localStorage` under `lang` and applies to all pages; the dropdown (`<select id="language">`) sits in the shared menu on every page, exactly once per page. Form messages in `contact.js` have their own nl/en table.
- Tests: `npm test` (Node's built-in runner plus jsdom, see `tests/`). Work test-first: write the failing test, show it, then build. See Verification below for when they must be run.
- The contact form currently uses `mailto:`. It will be replaced by a form service once Milo has a form URL.

## Verification (required)

The tests are the verification. A change is not done until `npm test` has been run and passes.

- Run `npm test` after your last edit and before you tell Milo that something works, before you commit, and before you push. An earlier run does not count once files have changed.
- Every report of finished work says that the tests ran and gives the result, for example "22 van 22 tests geslaagd". Never claim it from memory or say "should pass".
- If a test fails, say so with the failing test names. Do not commit or push until it is green.
- Never make a test pass by deleting it, skipping it, or weakening what it checks. Fix the code. If the test itself is wrong, say so and explain what you changed and why.
- Behaviour that no test covers yet gets a test first (red, then green). This includes new pages and new texts, which need their English version to pass.
- Tests do not replace looking at the result. For visual changes, also check the page in a browser at desktop and phone width.
