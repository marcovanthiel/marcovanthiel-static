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

<form id="contact-form" class="contact-form" action="mailto:marco@marcovanthiel.nl" method="post" enctype="text/plain">
  <label>
    <span>Name</span>
    <input type="text" name="name" autocomplete="name" required>
  </label>
  <label>
    <span>Email address</span>
    <input type="email" name="email" autocomplete="email" required>
  </label>
  <label>
    <span>Subject</span>
    <input type="text" name="subject" required>
  </label>
  <label>
    <span>Message</span>
    <textarea name="message" rows="6" required></textarea>
  </label>
  <button type="submit" class="btn btn-primary">Send message →</button>
  <p class="contact-form-note">The form opens your email client with the text pre-filled; the message is sent from your own mail account. Prefer to email directly? Use the address above.</p>
</form>

</div>

</div>

<script>
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var subject = encodeURIComponent(String(fd.get('subject') || 'Message via website'));
    var body = encodeURIComponent(
      'Name: ' + (fd.get('name') || '') + '\n' +
      'Email: ' + (fd.get('email') || '') + '\n\n' +
      (fd.get('message') || '')
    );
    window.location.href = 'mailto:marco@marcovanthiel.nl?subject=' + subject + '&body=' + body;
  });
})();
</script>
