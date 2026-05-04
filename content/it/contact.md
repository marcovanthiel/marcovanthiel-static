---
type: "contact"
title: "Contatto"
date: 2026-05-04
draft: false
description: "Contatta Marco van Thiel — CIO interim e program manager con sede a Nijmegen."
---

# Contatto

Hai una domanda su program management, un incarico interim o un ruolo di vigilanza? Invia un messaggio — di solito rispondo entro un giorno lavorativo.

<div class="contact-grid">

<div class="contact-details">

## Contatto diretto

**Email**
<a href="mailto:marco@marcovanthiel.nl">marco@marcovanthiel.nl</a>

**Telefono**
<a href="tel:+31654211659">+31 (0)6 54 211 659</a>

**LinkedIn**
<a href="https://www.linkedin.com/in/marcovanthiel/" target="_blank" rel="noopener noreferrer">linkedin.com/in/marcovanthiel</a>

**Sede**
Nijmegen, Paesi Bassi

</div>

<div class="contact-form-wrap">

## Invia un messaggio

<form id="contact-form" class="contact-form" data-lang="it" novalidate>
  <label>
    <span>Nome</span>
    <input type="text" name="name" autocomplete="name" required maxlength="200">
  </label>
  <label>
    <span>Indirizzo email</span>
    <input type="email" name="email" autocomplete="email" required maxlength="320">
  </label>
  <label>
    <span>Oggetto</span>
    <input type="text" name="subject" required maxlength="300">
  </label>
  <label>
    <span>Messaggio</span>
    <textarea name="message" rows="6" required maxlength="10000"></textarea>
  </label>
  <label class="hp-field" aria-hidden="true">
    <span>Website</span>
    <input type="text" name="website" tabindex="-1" autocomplete="off">
  </label>
  <button type="submit" class="btn btn-primary">Invia messaggio →</button>
  <p class="contact-form-note">Il messaggio arriva direttamente nella mia casella. Preferisci scrivere tu stesso? Usa l'indirizzo sopra.</p>
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
    sending: 'Invio in corso…',
    success: 'Grazie — il tuo messaggio è stato inviato. Di solito rispondo entro un giorno lavorativo.',
    error: 'Qualcosa è andato storto. Riprova o scrivi direttamente.',
    network: 'Nessuna connessione. Riprova più tardi.'
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
      lang: form.getAttribute('data-lang') || 'it'
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
