// Tests voor het schakelen tussen Nederlands (standaard) en Engels.
// De keuze staat in localStorage onder de naam "lang" ("nl" of "en").
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openPage, text, choose } = require('./helpers/load-page');

const PAGES = ['index', 'about', 'articles', 'contact'];
// Werken met een venster (hele pagina) of met een element (bijvoorbeeld één artikelkaartje).
const scope = function (where) { return where.document || where; };
const q = function (where, sel) { return scope(where).querySelector(sel); };
const qa = function (where, sel) { return [].slice.call(scope(where).querySelectorAll(sel)); };
const meta = function (w) { return q(w, 'meta[name="description"]').getAttribute('content'); };

test('elke pagina laadt i18n.js', function () {
  PAGES.forEach(function (page) {
    const html = fs.readFileSync(path.join(__dirname, '..', page + '.html'), 'utf8');
    assert.match(html, /<script\b[^>]*\bsrc="i18n\.js"/, page + '.html laadt i18n.js niet');
  });
});

test('de HTML zelf blijft Nederlands, ook zonder JavaScript', function () {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /<html lang="nl">/);
  assert.match(html, /<h2[^>]*>Wat we doen<\/h2>/);
});

test('zonder eerdere keuze staat de homepage in het Nederlands', async function () {
  const w = await openPage('index');
  assert.equal(w.document.documentElement.lang, 'nl');
  assert.equal(q(w, 'select').value, 'nl');
  assert.equal(text(q(w, 'main h2')), 'Wat we doen');
  assert.equal(text(q(w, 'label[for="' + q(w, 'select').id + '"]')), 'Taal');
});

test('English kiezen zet de homepage in het Engels', async function () {
  const w = await openPage('index');
  choose(w, 'en');
  assert.equal(w.document.documentElement.lang, 'en');
  assert.equal(q(w, 'select').value, 'en');
  assert.equal(text(q(w, '.tagline')), 'Software testing you can count on.');
  assert.equal(text(q(w, 'main h2')), 'What we do');
  assert.equal(text(q(w, '.button')), 'Tell us about your project');
  assert.deepEqual(qa(w, 'nav ul a').map(text), ['About', 'Articles', 'Contact']);
  assert.equal(text(q(w, 'label[for="' + q(w, 'select').id + '"]')), 'Language');
  assert.equal(meta(w), '4-testing helps you find bugs early, before your users do. Test advice and testing by Milo van der Kruis.');
  assert.deepEqual(qa(w, '.services li').map(text), [
    'Test advice. We help you decide what to test, when to test it, and how, so your time goes where it matters.',
    'Testing. We test your software and report what we find.'
  ]);
});

test('terug naar Nederlands herstelt de Nederlandse tekst, ook de vetgedrukte begrippen', async function () {
  const w = await openPage('index');
  choose(w, 'en');
  choose(w, 'nl');
  assert.equal(w.document.documentElement.lang, 'nl');
  assert.equal(text(q(w, '.tagline')), 'Softwaretesten waar je op kunt bouwen.');
  assert.equal(text(q(w, '.button')), 'Vertel ons over je project');
  assert.deepEqual(qa(w, 'nav ul a').map(text), ['Over ons', 'Artikelen', 'Contact']);
  assert.equal(q(w, '.services li strong').textContent, 'Testadvies.');
});

test('de keuze wordt onthouden in localStorage onder "lang"', async function () {
  const w = await openPage('index');
  choose(w, 'en');
  assert.equal(w.localStorage.getItem('lang'), 'en');
  choose(w, 'nl');
  assert.equal(w.localStorage.getItem('lang'), 'nl');
});

test('een eerder gekozen English geldt ook bij het opnieuw openen van de homepage', async function () {
  const w = await openPage('index', 'en');
  assert.equal(w.document.documentElement.lang, 'en');
  assert.equal(q(w, 'select').value, 'en');
  assert.equal(text(q(w, 'main h2')), 'What we do');
});

test('een ongeldige opgeslagen waarde valt terug op Nederlands', async function () {
  const w = await openPage('index', 'xx');
  assert.equal(w.document.documentElement.lang, 'nl');
  assert.equal(q(w, 'select').value, 'nl');
  assert.equal(text(q(w, 'main h2')), 'Wat we doen');
});

test('de andere pagina\'s volgen de gekozen taal', async function () {
  const about = await openPage('about', 'en');
  assert.equal(about.document.documentElement.lang, 'en');
  assert.equal(text(q(about, 'h1')), 'About');
  assert.equal(about.document.title, 'About - 4-testing');

  const articles = await openPage('articles', 'en');
  assert.equal(text(q(articles, 'h1')), 'Articles');
  assert.equal(articles.document.title, 'Articles - 4-testing');

  const contact = await openPage('contact', 'en');
  assert.equal(text(q(contact, 'h1')), 'Contact');
  assert.equal(contact.document.title, 'Contact - 4-testing');
  assert.equal(meta(contact), 'Got a question or a project in mind? Send 4-testing a message.');
});

test('de artikelpagina vertaalt kaartjes, alt-teksten en linknamen', async function () {
  const w = await openPage('articles', 'en');
  // Kaartjes zoek ik op via hun link, zodat nieuwe artikelen de test niet breken.
  const card = function (href) {
    return qa(w, '.article-card').filter(function (c) { return q(c, 'h2 a').getAttribute('href') === href; })[0];
  };
  const workingTalent = card('https://workingtalent.nl/wat-is-software-testen');
  const splunk = card('https://www.splunk.com/en_us/blog/learn/software-testing.html');
  assert.ok(workingTalent && splunk, 'De twee bestaande artikelkaartjes ontbreken');

  assert.equal(text(q(w, 'main > p')), 'Articles we found interesting.');
  assert.match(q(workingTalent, 'img').getAttribute('alt'), /^Page from the 1947 Harvard Mark II logbook/);
  assert.equal(text(q(workingTalent, '.article-meta')), 'Working Talent · in Dutch');
  assert.equal(text(q(workingTalent, '.photo-credit')), 'Photo: the first computer bug, 1947 (U.S. Naval Historical Center, public domain)');
  assert.equal(text(q(splunk, '.article-meta')), 'Splunk · June 3, 2025');

  // Elk kaartje, ook een nieuw: Engelse linktekst en linknaam.
  qa(w, '.article-card').forEach(function (c) {
    const link = qa(c, 'a')[1];
    assert.equal(text(link), 'Read the article');
    assert.match(link.getAttribute('aria-label'), /^Read the article: /);
  });
  // De titels van de artikelen zelf blijven zoals ze gepubliceerd zijn.
  assert.equal(text(q(workingTalent, 'h2')), 'Wat is software testen?');
});

test('het contactformulier heeft Engelse labels en Engelse foutmeldingen', async function () {
  const w = await openPage('contact', 'en');
  const labels = qa(w, '.field label').map(text);
  assert.deepEqual(labels.slice(0, 3), ['Name', 'Email', 'Message']);
  assert.equal(labels.length, 4, 'het formulier heeft een ander aantal velden dan verwacht');
  assert.match(labels[3], /^Quick check: what is \d+ \+ \d+\?$/); // de getallen wisselen per bezoek
  assert.equal(text(q(w, 'button[type="submit"]')), 'Send it');
  assert.match(text(q(w, 'main')), /Prefer email\? Write to milo@4-testing\.nl/);

  q(w, '#contact-form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  assert.equal(text(q(w, '#name-error')), 'Tell us your name, so we know who to reply to.');
  assert.equal(text(q(w, '#email-error')), 'We need your email address to reply.');
  assert.equal(text(q(w, '#message-error')), 'Write us a message first.');
  assert.equal(text(q(w, '#form-status')), 'Almost there. Check the fields above.');
});

test('het contactformulier blijft in het Nederlands zonder keuze', async function () {
  const w = await openPage('contact');
  q(w, '#contact-form').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  assert.equal(text(q(w, '#name-error')), 'Vul je naam in, dan weten we wie we moeten antwoorden.');
  assert.equal(text(q(w, '#form-status')), 'Bijna klaar. Kijk even naar de velden hierboven.');
});

test('in Engelse modus staat er nergens Nederlandse interface-tekst meer', async function () {
  const dutch = [
    'Wat we doen', 'Vertel ons', 'Over ons', 'Artikelen', 'Lees het artikel', 'Liever mailen',
    'Versturen', 'Naam', 'Bericht', 'Softwaretesten waar', 'We helpen je', 'Taal',
    'Heb je een vraag', 'Foto:', 'Laat dit leeg', 'in het Engels', 'Even checken'
  ];
  for (const page of PAGES) {
    const w = await openPage(page, 'en');
    const visible = text(w.document.body);
    dutch.forEach(function (phrase) {
      assert.ok(!visible.includes(phrase), page + '.html toont in het Engels nog Nederlands: "' + phrase + '"');
    });
  }
});
