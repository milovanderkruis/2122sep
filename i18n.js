// Taalkeuze: Nederlands (standaard) en Engels.
//
// De HTML is Nederlands. Een element krijgt een Engelse vertaling met een data-attribuut:
//   data-en="..."          vervangt de tekst van het element
//   data-en-html="..."     vervangt de inhoud, met HTML erin (bijvoorbeeld <strong>)
//   data-en-<attribuut>="..."  vervangt dat attribuut (alt, aria-label, content, action)
// Zonder JavaScript blijft alles gewoon Nederlands.
//
// De keuze staat in localStorage onder "lang" en geldt op alle pagina's. De dropdown
// (<select id="language">) staat alleen op de homepage.
(function () {
  var LANGS = ['nl', 'en'];
  var root = document.documentElement;

  function savedLanguage() {
    try {
      var value = localStorage.getItem('lang');
      return LANGS.indexOf(value) >= 0 ? value : 'nl';
    } catch (e) {
      return 'nl'; // opslag geblokkeerd (bijvoorbeeld privévenster): gewoon Nederlands
    }
  }

  function saveLanguage(lang) {
    try { localStorage.setItem('lang', lang); } catch (e) { /* de keuze geldt dan alleen voor deze pagina */ }
  }

  // Alle vertaalbare elementen, met hun Nederlandse originelen om naar terug te kunnen.
  var items = [];
  [].slice.call(document.getElementsByTagName('*')).forEach(function (el) {
    var attrs = {};
    var item = { el: el, attrs: attrs };
    var found = false;
    [].slice.call(el.attributes).forEach(function (a) {
      if (a.name.indexOf('data-en') !== 0) return;
      found = true;
      if (a.name === 'data-en') item.text = el.textContent;
      else if (a.name === 'data-en-html') item.html = el.innerHTML;
      else attrs[a.name.slice('data-en-'.length)] = el.getAttribute(a.name.slice('data-en-'.length));
    });
    if (found) items.push(item);
  });

  function apply(lang) {
    var english = lang === 'en';
    items.forEach(function (item) {
      var el = item.el;
      if ('text' in item) el.textContent = english ? el.getAttribute('data-en') : item.text;
      if ('html' in item) el.innerHTML = english ? el.getAttribute('data-en-html') : item.html;
      Object.keys(item.attrs).forEach(function (name) {
        var original = item.attrs[name];
        var value = english ? el.getAttribute('data-en-' + name) : original;
        if (value === null) el.removeAttribute(name);
        else el.setAttribute(name, value);
      });
    });
    root.lang = lang;
    var select = document.getElementById('language');
    if (select) select.value = lang;
  }

  root.classList.add('js'); // laat stijlen weten dat de taalkeuze werkt
  apply(savedLanguage());

  var select = document.getElementById('language');
  if (select) {
    select.addEventListener('change', function () {
      var lang = LANGS.indexOf(select.value) >= 0 ? select.value : 'nl';
      apply(lang);
      saveLanguage(lang);
    });
  }
})();
