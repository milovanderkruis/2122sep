// Tests voor de taalkeuze in het menu: één dropdown, in het menu van elke pagina.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openPage, text, choose } = require('./helpers/load-page');

const PAGES = ['index', 'about', 'articles', 'contact'];
const H1 = { index: null, about: ['Over ons', 'About'], articles: ['Artikelen', 'Articles'], contact: ['Contact', 'Contact'] };

test('elke pagina heeft precies één taalkeuze, en die staat in het menu', function () {
  PAGES.forEach(function (page) {
    const html = fs.readFileSync(path.join(__dirname, '..', page + '.html'), 'utf8');
    assert.equal((html.match(/<select\b/gi) || []).length, 1, page + '.html moet precies één <select> hebben');
    const nav = html.match(/<nav\b[\s\S]*?<\/nav>/i);
    assert.ok(nav, page + '.html heeft geen <nav>');
    assert.match(nav[0], /<select\b/i, 'De taalkeuze van ' + page + '.html staat niet in het menu');
  });
});

test('de taalkeuze in het menu heeft op elke pagina een label voor schermlezers', async function () {
  for (const page of PAGES) {
    const nl = await openPage(page);
    const select = nl.document.querySelector('nav select');
    assert.ok(select, page + ': geen dropdown in het menu');
    assert.equal(text(nl.document.querySelector('label[for="' + select.id + '"]')), 'Taal');
    const en = await openPage(page, 'en');
    assert.equal(text(en.document.querySelector('label[for="' + select.id + '"]')), 'Language');
  }
});

test('op elke pagina kun je van taal wisselen en de keuze wordt onthouden', async function () {
  for (const page of ['about', 'articles', 'contact']) {
    const w = await openPage(page);
    assert.equal(w.document.documentElement.lang, 'nl', page + ' start in het Nederlands');
    choose(w, 'en');
    assert.equal(w.document.documentElement.lang, 'en', page + ' schakelt niet naar Engels');
    assert.equal(text(w.document.querySelector('h1')), H1[page][1]);
    assert.equal(w.localStorage.getItem('lang'), 'en');
    choose(w, 'nl');
    assert.equal(w.document.documentElement.lang, 'nl', page + ' schakelt niet terug');
    assert.equal(text(w.document.querySelector('h1')), H1[page][0]);
    assert.equal(w.localStorage.getItem('lang'), 'nl');
  }
});

test('de dropdown in het menu toont op elke pagina de opgeslagen taal', async function () {
  for (const page of PAGES) {
    const en = await openPage(page, 'en');
    assert.equal(en.document.querySelector('nav select').value, 'en', page);
    const nl = await openPage(page);
    assert.equal(nl.document.querySelector('nav select').value, 'nl', page);
  }
});

test('de taalkeuze werkt ook op de contactpagina voor de formuliermeldingen', async function () {
  const w = await openPage('contact');
  choose(w, 'en');
  w.document.getElementById('contact-form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  assert.equal(text(w.document.getElementById('name-error')), 'Tell us your name, so we know who to reply to.');
});
