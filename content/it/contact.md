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

<form id="contact-form" class="contact-form" action="mailto:marco@marcovanthiel.nl" method="post" enctype="text/plain">
  <label>
    <span>Nome</span>
    <input type="text" name="name" autocomplete="name" required>
  </label>
  <label>
    <span>Indirizzo email</span>
    <input type="email" name="email" autocomplete="email" required>
  </label>
  <label>
    <span>Oggetto</span>
    <input type="text" name="subject" required>
  </label>
  <label>
    <span>Messaggio</span>
    <textarea name="message" rows="6" required></textarea>
  </label>
  <button type="submit" class="btn btn-primary">Invia messaggio →</button>
  <p class="contact-form-note">Il modulo apre il tuo client email con il testo pre-compilato; l'invio avviene dal tuo account email. Preferisci scrivere direttamente? Usa l'indirizzo sopra.</p>
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
    var subject = encodeURIComponent(String(fd.get('subject') || 'Messaggio dal sito'));
    var body = encodeURIComponent(
      'Nome: ' + (fd.get('name') || '') + '\n' +
      'Email: ' + (fd.get('email') || '') + '\n\n' +
      (fd.get('message') || '')
    );
    window.location.href = 'mailto:marco@marcovanthiel.nl?subject=' + subject + '&body=' + body;
  });
})();
</script>
