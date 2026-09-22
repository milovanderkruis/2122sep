// Tests voor het sommetje in het contactformulier: een simpele controle tegen spambots.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { openPage, text } = require('./helpers/load-page');

// Vult naam, e-mail en bericht in, zet het antwoord op de som en verstuurt.
function fillAndSubmit(w, answer) {
  w.document.getElementById('name').value = 'Milo';
  w.document.getElementById('email').value = 'milo@4-testing.nl';
  w.document.getElementById('message').value = 'Hoi, ik heb een vraag.';
  w.document.getElementById('sum').value = answer;
  w.document.getElementById('contact-form')
    .dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
}

function question(w) {
  return text(w.document.getElementById('sum-question'));
}

// Rekent de getoonde som uit, zodat de test het goede antwoord kan geven.
function correctAnswer(w) {
  const parts = question(w).split('+');
  return String(Number(parts[0].trim()) + Number(parts[1].trim()));
}

test('zonder JavaScript staat de som niet in de weg', function () {
  const html = fs.readFileSync(path.join(__dirname, '..', 'contact.html'), 'utf8');
  const doc = new JSDOM(html).window.document; // geen scripts: zo ziet een bezoeker zonder JS de pagina
  const field = doc.getElementById('sum-field');
  assert.ok(field, 'contact.html heeft geen element met id sum-field');
  assert.ok(field.hasAttribute('hidden'), 'het somveld is zichtbaar terwijl JavaScript het nog niet heeft ingevuld');
  const input = doc.getElementById('sum');
  assert.ok(input, 'contact.html heeft geen invoerveld met id sum');
  assert.ok(!input.hasAttribute('required'), 'het somveld is verplicht in de HTML, dan kan niemand zonder JavaScript versturen');
});

test('met JavaScript verschijnt er een som van twee getallen', async function () {
  const w = await openPage('contact');
  assert.ok(!w.document.getElementById('sum-field').hasAttribute('hidden'), 'het somveld blijft verborgen');
  assert.match(question(w), /^\d+ \+ \d+$/, 'er staat geen som in de vorm "getal + getal"');
});

test('een fout antwoord geeft een melding, een leeg veld en een nieuwe som', async function () {
  const w = await openPage('contact');
  const first = question(w);
  fillAndSubmit(w, String(Number(correctAnswer(w)) + 1));

  const error = w.document.getElementById('sum-error');
  assert.ok(!error.hidden, 'er komt geen melding bij een fout antwoord');
  assert.equal(text(error), 'Dat klopt niet helemaal. Probeer de nieuwe som.');
  assert.equal(w.document.getElementById('sum').value, '', 'het foute antwoord blijft staan');
  assert.notEqual(question(w), first, 'de som is niet vernieuwd');
  assert.equal(w.document.getElementById('message').value, 'Hoi, ik heb een vraag.', 'het bericht is kwijt');
});

test('een leeg antwoord vraagt om het sommetje', async function () {
  const w = await openPage('contact');
  fillAndSubmit(w, '');
  const error = w.document.getElementById('sum-error');
  assert.ok(!error.hidden, 'een leeg somveld geeft geen melding');
  assert.equal(text(error), 'Reken de som even uit, dan weten we dat je geen robot bent.');
});

test('het goede antwoord laat het bericht door', async function () {
  const w = await openPage('contact');
  fillAndSubmit(w, correctAnswer(w));
  assert.ok(w.document.getElementById('sum-error').hidden, 'het goede antwoord geeft toch een melding');
  assert.notEqual(text(w.document.getElementById('form-status')), 'Bijna klaar. Kijk even naar de velden hierboven.');
});

test('de meldingen bij de som zijn er ook in het Engels', async function () {
  const w = await openPage('contact', 'en');
  fillAndSubmit(w, String(Number(correctAnswer(w)) + 1));
  assert.equal(text(w.document.getElementById('sum-error')), "That's not quite right. Try the new sum.");

  const label = w.document.querySelector('label[for="sum"]');
  assert.match(text(label), /^Quick check: what is/, 'het label bij de som is niet vertaald');
});

test('zonder JavaScript blijft het somveld ook echt uit beeld', function () {
  // In een echte browser wint ".field { display: grid }" van het hidden-attribuut.
  // Zonder een eigen regel ziet een bezoeker zonder JavaScript een lege som staan.
  // jsdom rekent die cascade niet door, dus we lezen style.css zelf.
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  const rule = css.match(/\.field\[hidden\][^{]*\{([^}]*)\}/);
  assert.ok(rule, 'style.css heeft geen regel voor .field[hidden]');
  assert.match(rule[1], /display:\s*none/, '.field[hidden] wordt niet verborgen');
});
