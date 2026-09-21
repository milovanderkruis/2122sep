// Tests voor de taalkeuze (dropdown) op de homepage.
// Draaien: `npm test` of `node --test tests/`. Er zijn geen extra pakketten nodig.
//
// Ze lezen index.html als tekst. De dropdown moet dus een gewone <select> in de HTML
// zijn, zodat hij ook werkt voordat JavaScript geladen is.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// PAGE kan naar een ander bestand wijzen, handig om de test zelf te controleren.
const file = process.env.PAGE || path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(file, 'utf8');

function getSelect() {
  const match = html.match(/<select\b([^>]*)>([\s\S]*?)<\/select>/i);
  assert.ok(match, 'Verwacht een <select> (dropdown) op de homepage, maar er staat er geen in index.html');
  return { attrs: match[1], body: match[2] };
}

function getOptions(select) {
  return [...select.body.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map(function (m) {
    var value = m[1].match(/\bvalue\s*=\s*["']([^"']*)["']/i);
    return {
      value: value ? value[1] : null,
      text: m[2].replace(/<[^>]*>/g, '').trim(),
      selected: /\bselected\b/i.test(m[1])
    };
  });
}

test('de homepage heeft een taalkeuze (dropdown)', function () {
  getSelect();
});

test('de dropdown heeft een naam voor schermlezers (label of aria-label)', function () {
  var select = getSelect();
  var id = select.attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
  var hasAriaLabel = /\baria-label\s*=\s*["'][^"']+["']/i.test(select.attrs);
  var hasLabelFor = !!id && new RegExp('<label\\b[^>]*\\bfor\\s*=\\s*["\']' + id[1] + '["\']', 'i').test(html);
  assert.ok(hasAriaLabel || hasLabelFor, 'Geef de dropdown een <label for="..."> of een aria-label');
});

test('de dropdown biedt precies Nederlands en Engels aan', function () {
  var options = getOptions(getSelect());
  assert.deepEqual(
    options.map(function (o) { return [o.value, o.text]; }),
    [['nl', 'Nederlands'], ['en', 'English']]
  );
});

test('Nederlands is de standaardwaarde', function () {
  var options = getOptions(getSelect());
  var selected = options.filter(function (o) { return o.selected; });
  var chosen = selected.length ? selected : options.slice(0, 1);
  assert.equal(chosen.length, 1, 'Er moet precies één standaardkeuze zijn');
  assert.equal(chosen[0].value, 'nl');
});
