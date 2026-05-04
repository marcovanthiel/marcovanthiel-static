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

<form id="contact-form" class="contact-form" action="mailto:marco@marcovanthiel.nl" method="post" enctype="text/plain">
  <label>
    <span>Name</span>
    <input type="text" name="name" autocomplete="name" required>
  </label>
  <label>
    <span>E-Mail-Adresse</span>
    <input type="email" name="email" autocomplete="email" required>
  </label>
  <label>
    <span>Betreff</span>
    <input type="text" name="subject" required>
  </label>
  <label>
    <span>Nachricht</span>
    <textarea name="message" rows="6" required></textarea>
  </label>
  <button type="submit" class="btn btn-primary">Nachricht senden →</button>
  <p class="contact-form-note">Das Formular öffnet Ihr E-Mail-Programm mit voreingetragenem Text; der Versand erfolgt über Ihr eigenes E-Mail-Konto. Lieber direkt mailen? Nutzen Sie die Adresse oben.</p>
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
    var subject = encodeURIComponent(String(fd.get('subject') || 'Nachricht über Website'));
    var body = encodeURIComponent(
      'Name: ' + (fd.get('name') || '') + '\n' +
      'E-Mail: ' + (fd.get('email') || '') + '\n\n' +
      (fd.get('message') || '')
    );
    window.location.href = 'mailto:marco@marcovanthiel.nl?subject=' + subject + '&body=' + body;
  });
})();
</script>
