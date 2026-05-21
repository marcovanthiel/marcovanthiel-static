// =====================================================
// Liquid-Glass interactie · fundraising
// - Cursor-volgende specular op .glass / .glass-strong
// - 3D-tilt op .tilt-kaarten
// - Sticky masthead → .is-scrolled class
// - Scroll-progress balk bovenaan
// - Floating CTA-pill verschijnt na scrollen
// - Parallax-translatie op .parallax-y elementen
// =====================================================
(function () {
  'use strict';

  var reduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Cursor-volgende specular + tilt ----------
  // Eén pointermove-listener met rAF-throttle. Update --mx/--my voor
  // specular en --rx/--ry voor tilt. Schoner dan listeners per kaart.
  var rafId = null;
  var lastEvent = null;

  function handlePointer() {
    rafId = null;
    var e = lastEvent;
    if (!e) return;

    // Specular: target hoeft niet glass te zijn — ancestors checken
    var el = e.target;
    while (el && el.nodeType === 1) {
      if (el.classList && (el.classList.contains('glass') ||
                           el.classList.contains('glass-strong'))) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width)  * 100;
        var y = ((e.clientY - r.top)  / r.height) * 100;
        el.style.setProperty('--mx', x.toFixed(1) + '%');
        el.style.setProperty('--my', y.toFixed(1) + '%');
        break;
      }
      el = el.parentNode;
    }

    // Tilt: aparte tree-walk, want tilt kan op een ander niveau zitten
    if (!reduced) {
      var t = e.target;
      while (t && t.nodeType === 1) {
        if (t.classList && t.classList.contains('tilt')) {
          var tr = t.getBoundingClientRect();
          var nx = ((e.clientX - tr.left) / tr.width  - 0.5) * 2; // -1..1
          var ny = ((e.clientY - tr.top)  / tr.height - 0.5) * 2;
          var maxTilt = parseFloat(t.getAttribute('data-tilt-max')) || 6;
          // rotateX volgt verticale beweging (invert), rotateY horizontale
          t.style.setProperty('--ry', (nx *  maxTilt).toFixed(2) + 'deg');
          t.style.setProperty('--rx', (-ny * maxTilt).toFixed(2) + 'deg');
          break;
        }
        t = t.parentNode;
      }
    }
  }

  document.addEventListener('pointermove', function (e) {
    lastEvent = e;
    if (!rafId) rafId = requestAnimationFrame(handlePointer);
  }, { passive: true });

  // Reset tilt bij pointerleave
  document.addEventListener('pointerout', function (e) {
    var t = e.target;
    while (t && t.nodeType === 1) {
      if (t.classList && t.classList.contains('tilt')) {
        // Alleen resetten als pointer écht uit de tilt-zone gaat
        if (!t.contains(e.relatedTarget)) {
          t.style.setProperty('--rx', '0deg');
          t.style.setProperty('--ry', '0deg');
        }
        return;
      }
      t = t.parentNode;
    }
  }, { passive: true });

  // ---------- 2. Sticky-masthead is-scrolled state ----------
  var masthead = document.querySelector('.rotary-masthead');
  var progressBar = null;
  var floatCta = null;

  function ensureChrome() {
    // Scroll-progress automatisch injecteren als de pagina 'm niet zelf heeft
    if (!document.querySelector('.scroll-progress')) {
      var sp = document.createElement('div');
      sp.className = 'scroll-progress';
      sp.innerHTML = '<span></span>';
      document.body.appendChild(sp);
    }
    progressBar = document.querySelector('.scroll-progress > span');
    floatCta = document.querySelector('.float-cta');
  }
  ensureChrome();

  // ---------- 3. Scroll-handler — alles in één rAF ----------
  var scrollRaf = null;
  function onScroll() {
    scrollRaf = null;
    var y   = window.scrollY || window.pageYOffset || 0;
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var p   = Math.min(1, y / max);

    if (masthead) masthead.classList.toggle('is-scrolled', y > 80);
    if (progressBar) progressBar.style.width = (p * 100).toFixed(2) + '%';
    if (floatCta) floatCta.classList.toggle('is-visible', y > 600);

    // Parallax — elementen met data-parallax="speed", waar speed
    // tussen 0 (stilstaand met scroll) en bv -0.4 (langzamer dan
    // scroll → omhoog drijven). Werkt het beste op SVG / hero-illustraties.
    if (!reduced) {
      var px = document.querySelectorAll('[data-parallax]');
      for (var i = 0; i < px.length; i++) {
        var el = px[i];
        var speed = parseFloat(el.getAttribute('data-parallax')) || -0.3;
        // Bereken ten opzichte van het midden van het viewport
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2;
        var off = (center - window.innerHeight / 2) * speed;
        el.style.transform = 'translate3d(0, ' + off.toFixed(1) + 'px, 0)';
      }
    }
  }
  window.addEventListener('scroll', function () {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll(); // initial

  // ---------- 4. Easter egg: klik op Rotary-wiel → spin ----------
  var rotaryLogo = document.querySelector('.rotary-logo, .rotary-mark img');
  if (rotaryLogo) {
    rotaryLogo.style.transition = 'transform 1.4s cubic-bezier(.16,1.2,.3,1)';
    rotaryLogo.addEventListener('click', function (e) {
      // Niet alle navigatie afbreken — alleen visueel
      var current = rotaryLogo.dataset.spins ? parseInt(rotaryLogo.dataset.spins, 10) : 0;
      current += 1;
      rotaryLogo.dataset.spins = current;
      rotaryLogo.style.transform = 'rotate(' + (current * 360) + 'deg)';
    });
  }

  // ---------- 5. Onthul .is-hot ook bij scroll-in (mobiel hover-loos) ----------
  if ('IntersectionObserver' in window) {
    var hot = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-hot');
          // Hot-stage duurt kort — fade-out na 1,2 s
          setTimeout(function () { e.target.classList.remove('is-hot'); }, 1200);
          hot.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0.3 });
    document.querySelectorAll('.glass-sweep').forEach(function (el) { hot.observe(el); });
  }
})();
