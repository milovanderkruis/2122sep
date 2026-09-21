// Contact form. Works without JavaScript too: the form's mailto action is the fallback.
//
// With JavaScript it checks the fields, shows what went wrong next to the field,
// and sends in one of two ways:
//   1. data-endpoint on the form is set (for example a Formspree URL): send it in
//      the background, show success or failure, and keep the text on failure.
//   2. no endpoint: open the visitor's mail app with the message filled in, and
//      tell them what to do if nothing opens.
//
// Messages come in Dutch and English. The language is the one i18n.js put on <html lang>.
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var MAIL = 'milo@4-testing.nl';
  var MAILTO_LIMIT = 1800; // long mailto links get cut off by some mail apps
  var TIMEOUT_MS = 15000;

  var TEXT = {
    nl: {
      subject: 'Bericht via 4-testing.nl',
      bodyName: 'Naam',
      bodyEmail: 'E-mail',
      send: 'Versturen',
      sending: 'Bezig met versturen…',
      sendingStatus: 'Je bericht wordt verstuurd…',
      thanks: 'Bedankt, we hebben je bericht ontvangen. We nemen snel contact met je op.',
      offline: 'Je lijkt offline te zijn. Je bericht staat er nog. Probeer het opnieuw als je weer online bent, of mail ons op',
      failed: 'Er ging iets mis en je bericht is niet verstuurd. Het staat er nog, dus je kunt het opnieuw proberen. Of mail ons op',
      tooLong: 'Je bericht is te lang voor de e-maillink. Kort het wat in, of mail ons op',
      mailApp: 'Je e-mailprogramma zou moeten openen met je bericht klaar. Gebeurt er niets? Mail ons dan op',
      fix: 'Bijna klaar. Kijk even naar de velden hierboven.',
      name: 'Vul je naam in, dan weten we wie we moeten antwoorden.',
      emailMissing: 'We hebben je e-mailadres nodig om te kunnen antwoorden.',
      emailWrong: 'Dit e-mailadres lijkt niet te kloppen. Zit er een typfout in?',
      message: 'Schrijf eerst een bericht.'
    },
    en: {
      subject: 'Message via 4-testing.nl',
      bodyName: 'Name',
      bodyEmail: 'Email',
      send: 'Send it',
      sending: 'Sending…',
      sendingStatus: 'Sending your message…',
      thanks: "Thanks, we got your message. We'll get back to you soon.",
      offline: "You seem to be offline. Your message is still here. Try again when you're back online, or email us at",
      failed: "Something went wrong and your message wasn't sent. It's still here, so you can try again. Or email us at",
      tooLong: 'Your message is too long for the email link. Shorten it a bit, or email us at',
      mailApp: 'Your email app should open with your message ready. Nothing happened? Email us at',
      fix: 'Almost there. Check the fields above.',
      name: 'Tell us your name, so we know who to reply to.',
      emailMissing: 'We need your email address to reply.',
      emailWrong: "That email address doesn't look right. Is there a typo?",
      message: 'Write us a message first.'
    }
  };

  function t(key) {
    return TEXT[document.documentElement.lang === 'en' ? 'en' : 'nl'][key];
  }

  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var fields = ['name', 'email', 'message'].map(function (id) { return document.getElementById(id); });
  var sending = false;

  form.noValidate = true; // we show our own messages, but only when JS is running

  function check(field) {
    var value = field.value.trim();
    if (field.id === 'name' && !value) return t('name');
    if (field.id === 'message' && !value) return t('message');
    if (field.id === 'email') {
      if (!value) return t('emailMissing');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('emailWrong');
    }
    return '';
  }

  function showFieldError(field, text) {
    var box = document.getElementById(field.id + '-error');
    box.textContent = text;
    box.hidden = !text;
    if (text) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function showStatus(state, text, withMail) {
    status.textContent = text;
    if (withMail) {
      status.appendChild(document.createTextNode(' '));
      var link = document.createElement('a');
      link.href = 'mailto:' + MAIL;
      link.textContent = MAIL;
      status.appendChild(link);
      status.appendChild(document.createTextNode('.'));
    }
    status.setAttribute('data-state', state);
    status.hidden = false;
  }

  function clearStatus() {
    status.hidden = true;
    status.textContent = '';
    status.removeAttribute('data-state');
  }

  function setBusy(busy) {
    sending = busy;
    button.disabled = busy;
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
    button.textContent = busy ? t('sending') : t('send');
  }

  // Clear a field's message as soon as the visitor starts fixing it.
  fields.forEach(function (field) {
    field.addEventListener('input', function () {
      if (!field.hasAttribute('aria-invalid')) return;
      if (!check(field)) showFieldError(field, '');
    });
  });

  function sendInBackground(data) {
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, TIMEOUT_MS) : null;

    setBusy(true);
    showStatus('info', t('sendingStatus'));

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        form.reset();
        showStatus('success', t('thanks'));
      })
      .catch(function () {
        // The text stays in the fields, so nothing the visitor typed is lost.
        showStatus('error', navigator.onLine === false ? t('offline') : t('failed'), true);
      })
      .then(function () {
        if (timer) clearTimeout(timer);
        setBusy(false);
      });
  }

  function openMailApp(data) {
    var body = t('bodyName') + ': ' + data.name + '\n' + t('bodyEmail') + ': ' + data.email + '\n\n' + data.message;
    var url = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(t('subject')) + '&body=' + encodeURIComponent(body);

    if (url.length > MAILTO_LIMIT) {
      showStatus('error', t('tooLong'), true);
      return;
    }
    window.location.href = url;
    showStatus('info', t('mailApp'), true);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (sending) return;
    clearStatus();

    var firstProblem = null;
    fields.forEach(function (field) {
      var text = check(field);
      showFieldError(field, text);
      if (text && !firstProblem) firstProblem = field;
    });
    if (firstProblem) {
      showStatus('error', t('fix'));
      firstProblem.focus();
      return;
    }

    // A real visitor never sees the hidden field. If it is filled in, a bot did it.
    if (form.elements._gotcha && form.elements._gotcha.value) {
      showStatus('success', t('thanks'));
      return;
    }

    var data = {
      name: fields[0].value.trim(),
      email: fields[1].value.trim(),
      message: fields[2].value.trim()
    };
    if (endpoint) sendInBackground(data);
    else openMailApp(data);
  });
})();
