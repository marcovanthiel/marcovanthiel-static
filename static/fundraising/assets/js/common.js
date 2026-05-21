// =====================================================
// Rotary Nijmegen Stad en Land — fundraising · common.js
// Gedeeld over hub + 3 subsites. Geen frameworks, geen build.
//
// 1. Scroll-reveal via IntersectionObserver — markeert elementen
//    met data-reveal als .is-visible zodra ze in beeld komen.
// 2. Count-up — animeert elementen met data-counter naar hun
//    eind­getal zodra ze in beeld komen.
// 3. Veiligheids­timer — Samsung Internet vuurt IO soms niet
//    voor reeds-zichtbare elementen; na 1,2 s wordt alles dat
//    nog niet onthuld is alsnog geforceerd.
// =====================================================
(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function revealAll(els) {
    for (var i = 0; i < els.length; i++) els[i].classList.add('is-visible');
  }

  function animateCounter(el) {
    if (el.dataset.counterDone === '1') return;
    el.dataset.counterDone = '1';
    var target = parseFloat(el.getAttribute('data-counter')) || 0;
    var duration = parseInt(el.getAttribute('data-counter-duration'), 10) || 1500;
    var prefix = el.getAttribute('data-counter-prefix') || '';
    var suffix = el.getAttribute('data-counter-suffix') || '';
    var decimals = parseInt(el.getAttribute('data-counter-decimals'), 10) || 0;
    if (prefersReducedMotion()) {
      el.textContent = prefix + target.toFixed(decimals) + suffix;
      return;
    }
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      var v = (target * eased).toFixed(decimals);
      el.textContent = prefix + v + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var reveals = document.querySelectorAll('[data-reveal]');
    var counters = document.querySelectorAll('[data-counter]');

    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      revealAll(reveals);
      for (var i = 0; i < counters.length; i++) animateCounter(counters[i]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        if (e.target.hasAttribute('data-counter')) animateCounter(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    for (var j = 0; j < reveals.length; j++)  io.observe(reveals[j]);
    for (var k = 0; k < counters.length; k++) io.observe(counters[k]);

    // Safety net — sommige mobiele browsers (Samsung Internet) triggeren
    // IO niet voor reeds-zichtbare elementen. Na 1,2 s geforceerd onthullen.
    setTimeout(function () {
      revealAll(reveals);
      for (var m = 0; m < counters.length; m++) animateCounter(counters[m]);
    }, 1200);
  });
})();
