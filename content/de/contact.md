---
type: "contact"
title: "Kontakt"
date: 2026-05-04
draft: false
description: "Kontakt aufnehmen mit Marco van Thiel — Interim-CIO und Programmmanager aus Nijmegen."
---

# Kontakt

Haben Sie eine Anfrage zu Programmmanagement, einer Interim-Rolle oder einer Aufsichtsfunktion? Senden Sie eine Nachricht — ich antworte in der Regel innerhalb eines Werktags.

<div class="contact-grid">

<div class="contact-details">

## Direkter Kontakt

**E-Mail**
<a href="mailto:marco@marcovanthiel.nl">marco@marcovanthiel.nl</a>

**Telefon**
<a href="tel:+31654211659">+31 (0)6 54 211 659</a>

**LinkedIn**
<a href="https://www.linkedin.com/in/marcovanthiel/" target="_blank" rel="noopener noreferrer">linkedin.com/in/marcovanthiel</a>

**Standort**
Nijmegen, Niederlande

</div>

<div class="contact-form-wrap">

## Nachricht senden

<p class="contact-form-disabled">Das Kontaktformular ist vorübergehend deaktiviert. Bitte schreiben Sie direkt an die obige Adresse — ich antworte in der Regel innerhalb eines Werktags.</p>

<!-- Contactformulier tijdelijk uitgeschakeld — verzending
     werkt nog niet betrouwbaar. Verwijder de comment-tags
     en de <p class="contact-form-disabled"> hierboven om het
     formulier weer te activeren.

<form id="contact-form" class="contact-form" data-lang="de" novalidate>
  <label>
    <span>Name</span>
    <input type="text" name="name" autocomplete="name" required maxlength="200">
  </label>
  <label>
    <span>E-Mail-Adresse</span>
    <input type="email" name="email" autocomplete="email" required maxlength="320">
  </label>
  <label>
    <span>Betreff</span>
    <input type="text" name="subject" required maxlength="300">
  </label>
  <label>
    <span>Nachricht</span>
    <textarea name="message" rows="6" required maxlength="10000"></textarea>
  </label>
  <label class="hp-field" aria-hidden="true">
    <span>Website</span>
    <input type="text" name="website" tabindex="-1" autocomplete="off">
  </label>
  <button type="submit" class="btn btn-primary">Nachricht senden →</button>
  <p class="contact-form-note">Die Nachricht landet direkt in meinem Postfach. Lieber selbst mailen? Nutzen Sie die Adresse oben.</p>
  <div class="contact-form-status" role="status" aria-live="polite" hidden></div>
</form>

</div>

</div>

<script>
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var status = form.querySelector('.contact-form-status');
  var btn = form.querySelector('button[type="submit"]');
  var t = {
    sending: 'Wird gesendet…',
    success: 'Danke — Ihre Nachricht wurde gesendet. Ich antworte in der Regel innerhalb eines Werktags.',
    error: 'Etwas ist schiefgelaufen. Bitte erneut versuchen oder direkt mailen.',
    network: 'Keine Verbindung. Bitte später erneut versuchen.'
  };
  function setStatus(kind, msg) {
    status.hidden = false;
    status.className = 'contact-form-status contact-form-status--' + kind;
    status.textContent = msg;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var fd = new FormData(form);
    var payload = {
      name: fd.get('name'),
      email: fd.get('email'),
      subject: fd.get('subject'),
      message: fd.get('message'),
      website: fd.get('website') || '',
      lang: form.getAttribute('data-lang') || 'de'
    };
    btn.disabled = true;
    setStatus('pending', t.sending);
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok && j.ok, body: j }; });
    }).then(function (res) {
      if (res.ok) {
        setStatus('success', t.success);
        form.reset();
      } else {
        setStatus('error', (res.body && res.body.error) || t.error);
        btn.disabled = false;
      }
    }).catch(function () {
      setStatus('error', t.network);
      btn.disabled = false;
    });
  });
})();
</script>
-->

