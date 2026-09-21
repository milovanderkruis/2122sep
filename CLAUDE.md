# 4-testing website

Static website (HTML/CSS) for 4-testing, the company of Milo van der Kruis. Hosted on GitHub Pages: https://milovanderkruis.github.io/2122sep/

## Writing style

All text on the site is in English (`lang="en"`), fairly informal and simple. Apply this style to every new or changed text.

- Talk to the reader as "you". The company speaks as "we", not "I".
- Short sentences, everyday words, no corporate jargon or buzzwords.
- Friendly and direct, but still credible for a testing company. No slang, exclamation marks or emoji.
- Buttons and labels are short, common words ("Let's talk", "Send it", "Name", "Email", "Message").
- Rewrite existing text if it does not fit this style.
- Never invent facts, references, clients or milestones. Ask Milo.

Examples that fit the style:

- "We help you find bugs early, before your users do."
- "Good testing is more than hunting for bugs."
- "Got a question or a project in mind? Send us a message and we'll get back to you soon."

## Structure

- Pages: `index.html` (home), `about.html` (About), `history.html` (History), `contact.html` (Contact).
- One `style.css`: dark theme with a cyan accent. Each page has its own background via `body.page-home/about/history/contact`.
- The logo is an inline SVG symbol (`<symbol id="logo">`) reused on every page with `<use>`.
- All pages share the same nav bar and footer. If you change one, change it on all four pages.
- New articles are added with the `/nieuw-artikel` skill (`.claude/skills/nieuw-artikel/`). It creates `articles.html` on first use and adds a card per article.
- The contact form currently uses `mailto:`. It will be replaced by a form service once Milo has a form URL.
