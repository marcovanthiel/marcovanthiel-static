// =====================================================
// Zilver Interim-Management & Advies — Jaya Boland
// Scroll-reveal via IntersectionObserver + Samsung-fallback.
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

  document.addEventListener('DOMContentLoaded', function () {
    var reveals = document.querySelectorAll('[data-reveal]');
    if (!reveals.length) return;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      revealAll(reveals);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    for (var j = 0; j < reveals.length; j++) io.observe(reveals[j]);

    // Safety net — Samsung Internet vuurt IO soms niet voor reeds-zichtbare
    // elementen. Na 1,2 s alles dat nog niet is onthuld, alsnog forceren.
    setTimeout(function () { revealAll(reveals); }, 1200);
  });
})();
