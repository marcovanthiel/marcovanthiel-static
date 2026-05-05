---
type: "contact"
title: "Contact"
date: 2026-05-04
draft: false
description: "Neem contact op met Marco van Thiel — interim CIO en programmamanager uit Nijmegen."
---

# Contact

Heb je een vraagstuk rond programmamanagement, een interim-rol of toezichthoudende positie? Stuur een bericht — ik reageer doorgaans binnen één werkdag.

<div class="contact-grid">

<div class="contact-details">

## Direct contact

**E-mail**
<a href="mailto:marco@marcovanthiel.nl">marco@marcovanthiel.nl</a>

**Telefoon**
<a href="tel:+31654211659">+31 (0)6 54 211 659</a>

**LinkedIn**
<a href="https://www.linkedin.com/in/marcovanthiel/" target="_blank" rel="noopener noreferrer">linkedin.com/in/marcovanthiel</a>

**Locatie**
Nijmegen, Nederland

</div>

<div class="contact-form-wrap">

## Stuur een bericht

<p class="contact-form-disabled">Het contactformulier is tijdelijk uit de lucht. Mail rechtstreeks via het adres hierboven — ik reageer doorgaans binnen één werkdag.</p>

<!-- Contactformulier tijdelijk uitgeschakeld — verzending
     werkt nog niet betrouwbaar. Verwijder de comment-tags
     en de <p class="contact-form-disabled"> hierboven om het
     formulier weer te activeren.

<form id="contact-form" class="contact-form" data-lang="nl" novalidate>
  <label>
    <span>Naam</span>
    <input type="text" name="name" autocomplete="name" required maxlength="200">
  </label>
  <label>
    <span>E-mailadres</span>
    <input type="email" name="email" autocomplete="email" required maxlength="320">
  </label>
  <label>
    <span>Onderwerp</span>
    <input type="text" name="subject" required maxlength="300">
  </label>
  <label>
    <span>Bericht</span>
    <textarea name="message" rows="6" required maxlength="10000"></textarea>
  </label>
  <label class="hp-field" aria-hidden="true">
    <span>Website</span>
    <input type="text" name="website" tabindex="-1" autocomplete="off">
  </label>
  <button type="submit" class="btn btn-primary">Verstuur bericht →</button>
  <p class="contact-form-note">Het bericht komt direct in mijn mailbox terecht. Liever zelf mailen? Gebruik het adres hierboven.</p>
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
    sending: 'Bezig met verzenden…',
    success: 'Bedankt — je bericht is verstuurd. Ik reageer doorgaans binnen één werkdag.',
    error: 'Er ging iets mis. Probeer het opnieuw of mail direct.',
    network: 'Geen verbinding. Probeer het later opnieuw.'
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
      lang: form.getAttribute('data-lang') || 'nl'
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

