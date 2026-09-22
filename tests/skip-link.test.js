// Tests voor de skip-link: elke pagina laat je met het toetsenbord het menu overslaan (WCAG 2.4.1).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openPage, text } = require('./helpers/load-page');

const PAGES = ['index', 'about', 'articles', 'contact'];

test('elke pagina begint met een skip-link naar de inhoud', async function () {
  for (const page of PAGES) {
    const w = await openPage(page);
    const doc = w.document;
    const link = doc.querySelector('body a');
    assert.ok(link, page + ': geen enkele link op de pagina');
    assert.ok(link.classList.contains('skip-link'), page + ': de eerste link is geen skip-link');
    assert.equal(link.getAttribute('href'), '#main-content', page + ': de skip-link wijst niet naar #main-content');
    const target = doc.getElementById('main-content');
    assert.ok(target, page + ': er is geen element met id main-content');
    assert.equal(target.tagName, 'MAIN', page + ': #main-content is geen <main>');
    assert.ok(!link.compareDocumentPosition(doc.querySelector('nav')) || link.compareDocumentPosition(doc.querySelector('nav')) & 4,
      page + ': de skip-link staat niet vóór het menu');
  }
});

test('de skip-link heeft een Nederlandse en een Engelse tekst', async function () {
  for (const page of PAGES) {
    const nl = await openPage(page);
    assert.equal(text(nl.document.querySelector('.skip-link')), 'Naar de inhoud', page);
    const en = await openPage(page, 'en');
    assert.equal(text(en.document.querySelector('.skip-link')), 'Skip to content', page);
  }
});

test('de skip-link is verborgen tot hij focus krijgt', function () {
  // jsdom rekent geen :focus door, dus we controleren de regels in style.css zelf.
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  const rule = function (selector) {
    const m = css.match(new RegExp('\\' + selector.replace('.', '.') + '\\s*\\{([^}]*)\\}'));
    return m ? m[1] : null;
  };
  const base = rule('.skip-link');
  const focus = rule('.skip-link:focus');
  assert.ok(base, 'style.css heeft geen regel voor .skip-link');
  assert.ok(focus, 'style.css heeft geen regel voor .skip-link:focus');
  assert.match(base, /transform:\s*translateY\(-/, 'de skip-link wordt niet uit beeld geschoven');
  assert.match(focus, /transform:\s*translateY\(0/, 'de skip-link komt bij focus niet in beeld');
});
