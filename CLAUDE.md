# 4-testing website

Static website (HTML/CSS) for 4-testing, the company of Milo van der Kruis. Hosted on GitHub Pages: https://milovanderkruis.github.io/2122sep/

## Writing style

All text on the site is in Dutch (`lang="nl"`), fairly informal and simple. Apply this style to every new or changed text. (The site was English for a while; Milo asked for Dutch again on 2026-09-21.)

- Address the reader as "je/jij", never "u". The company speaks as "we", not "ik".
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
- The contact form currently uses `mailto:`. It will be replaced by a form service once Milo has a form URL.
