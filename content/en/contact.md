---
type: "contact"
title: "Contact"
date: 2026-05-04
draft: false
description: "Get in touch with Marco van Thiel — interim CIO and program manager based in Nijmegen."
---

# Contact

Got a question about program management, an interim role, or a supervisory position? Send a message — I usually reply within one business day.

<div class="contact-grid">

<div class="contact-details">

## Direct contact

**Email**
<a href="mailto:marco@marcovanthiel.nl">marco@marcovanthiel.nl</a>

**Phone**
<a href="tel:+31654211659">+31 (0)6 54 211 659</a>

**LinkedIn**
<a href="https://www.linkedin.com/in/marcovanthiel/" target="_blank" rel="noopener noreferrer">linkedin.com/in/marcovanthiel</a>

**Location**
Nijmegen, the Netherlands

</div>

<div class="contact-form-wrap">

## Send a message

<form id="contact-form" class="contact-form" data-lang="en" novalidate>
  <label>
    <span>Name</span>
    <input type="text" name="name" autocomplete="name" required maxlength="200">
  </label>
  <label>
    <span>Email address</span>
    <input type="email" name="email" autocomplete="email" required maxlength="320">
  </label>
  <label>
    <span>Subject</span>
    <input type="text" name="subject" required maxlength="300">
  </label>
  <label>
    <span>Message</span>
    <textarea name="message" rows="6" required maxlength="10000"></textarea>
  </label>
  <label class="hp-field" aria-hidden="true">
    <span>Website</span>
    <input type="text" name="website" tabindex="-1" autocomplete="off">
  </label>
  <button type="submit" class="btn btn-primary">Send message →</button>
  <p class="contact-form-note">The message goes straight to my inbox. Prefer to email yourself? Use the address above.</p>
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
    sending: 'Sending…',
    success: 'Thanks — your message has been sent. I usually reply within one business day.',
    error: 'Something went wrong. Please try again or email directly.',
    network: 'No connection. Please try again later.'
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
      lang: form.getAttribute('data-lang') || 'en'
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
