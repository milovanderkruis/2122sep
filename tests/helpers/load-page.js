// Opent een pagina van de site in een nagebootste browser (jsdom), inclusief scripts.
// Bestanden komen van schijf. Alles buiten de site wordt niet geladen.
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');

const root = path.join(__dirname, '..', '..');
const origin = 'http://site.test';
const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html' };

// Serveert de site vanaf schijf. Een ontbrekend bestand geeft een 404 en een adres
// buiten de site wordt nooit opgehaald.
const localFiles = requestInterceptor(function (request) {
  const u = new URL(request.url);
  const file = path.join(root, decodeURIComponent(u.pathname));
  if (u.origin !== origin || !file.startsWith(root) || !fs.existsSync(file)) {
    return new Response('Niet gevonden', { status: 404 });
  }
  return new Response(fs.readFileSync(file), {
    headers: { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }
  });
});

// page: 'index' | 'about' | 'articles' | 'contact'
// storedLang: waarde die de bezoeker eerder in localStorage ('lang') heeft laten zetten, of undefined
async function openPage(page, storedLang) {
  const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: origin + '/' + page + '.html',
    runScripts: 'dangerously',
    resources: { interceptors: [localFiles] },
    virtualConsole: new VirtualConsole(), // scriptfouten worden niet in de testuitvoer gegooid
    beforeParse(window) {
      if (storedLang !== undefined) window.localStorage.setItem('lang', storedLang);
    }
  });
  await new Promise(function (resolve) {
    if (dom.window.document.readyState === 'complete') resolve();
    else dom.window.addEventListener('load', resolve);
  });
  return dom.window;
}

function text(el) {
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
}

function choose(window, value) {
  const select = window.document.querySelector('select');
  select.value = value;
  select.dispatchEvent(new window.Event('change', { bubbles: true }));
}

module.exports = { openPage, text, choose };
