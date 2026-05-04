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

<form id="contact-form" class="contact-form" action="mailto:marco@marcovanthiel.nl" method="post" enctype="text/plain">
  <label>
    <span>Naam</span>
    <input type="text" name="naam" autocomplete="name" required>
  </label>
  <label>
    <span>E-mailadres</span>
    <input type="email" name="email" autocomplete="email" required>
  </label>
  <label>
    <span>Onderwerp</span>
    <input type="text" name="onderwerp" required>
  </label>
  <label>
    <span>Bericht</span>
    <textarea name="bericht" rows="6" required></textarea>
  </label>
  <button type="submit" class="btn btn-primary">Verstuur bericht →</button>
  <p class="contact-form-note">Het formulier opent je e-mailprogramma met de tekst voor-ingevuld; verzending gaat via je eigen mailaccount. Liever direct mailen? Gebruik het adres hierboven.</p>
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
    var subject = encodeURIComponent(String(fd.get('onderwerp') || 'Bericht via website'));
    var body = encodeURIComponent(
      'Naam: ' + (fd.get('naam') || '') + '\n' +
      'E-mailadres: ' + (fd.get('email') || '') + '\n\n' +
      (fd.get('bericht') || '')
    );
    window.location.href = 'mailto:marco@marcovanthiel.nl?subject=' + subject + '&body=' + body;
  });
})();
</script>
