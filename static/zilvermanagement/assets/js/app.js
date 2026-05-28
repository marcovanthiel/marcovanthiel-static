// =====================================================
// Zilver Interim-Management & Advies — Jaya Boland
// Tab-schakelaar met URL-hash sync.
// =====================================================
(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var TABS = $$('[role="tab"]');
  var PANELS = $$('.tab-panel');
  var TAB_BY_KEY = {};
  var PANEL_BY_KEY = {};

  TABS.forEach(function (t) { TAB_BY_KEY[t.getAttribute('data-tab')] = t; });
  PANELS.forEach(function (p) {
    var key = p.id.replace(/^panel-/, '');
    PANEL_BY_KEY[key] = p;
  });

  function activate(key, opts) {
    opts = opts || {};
    if (!TAB_BY_KEY[key] || !PANEL_BY_KEY[key]) return;

    TABS.forEach(function (t) {
      var isMe = t.getAttribute('data-tab') === key;
      t.classList.toggle('is-active', isMe);
      t.setAttribute('aria-selected', isMe ? 'true' : 'false');
      t.setAttribute('tabindex', isMe ? '0' : '-1');
    });
    PANELS.forEach(function (p) {
      var isMe = p.id === 'panel-' + key;
      p.classList.toggle('is-active', isMe);
      if (isMe) {
        p.removeAttribute('hidden');
      } else {
        p.setAttribute('hidden', '');
      }
    });

    // Update URL-hash zonder dat de pagina naar boven scrollt
    if (!opts.silent && history && history.replaceState) {
      history.replaceState(null, '', '#' + key);
    }

    // Scroll naar de top van de tab-balk zodat de hele panel-content
    // zichtbaar is, maar alleen als de gebruiker eronder zat.
    if (!opts.skipScroll) {
      var tabs = document.querySelector('.tabs');
      if (tabs) {
        var rect = tabs.getBoundingClientRect();
        if (rect.top < 0) {
          var top = window.pageYOffset + rect.top;
          if (prefersReducedMotion()) {
            window.scrollTo(0, top);
          } else {
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        }
      }
    }
  }

  function initialKey() {
    var hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
    if (hash && TAB_BY_KEY[hash]) return hash;
    return 'profiel';
  }

  // Knop-klik
  TABS.forEach(function (t) {
    t.addEventListener('click', function () {
      activate(t.getAttribute('data-tab'));
    });
  });

  // Pijltoetsen — links/rechts/home/end voor toetsenbord-gebruikers
  document.addEventListener('keydown', function (e) {
    if (!document.activeElement || document.activeElement.getAttribute('role') !== 'tab') return;
    var keys = TABS.map(function (t) { return t.getAttribute('data-tab'); });
    var idx = keys.indexOf(document.activeElement.getAttribute('data-tab'));
    var next = null;
    if (e.key === 'ArrowRight') next = keys[(idx + 1) % keys.length];
    else if (e.key === 'ArrowLeft') next = keys[(idx - 1 + keys.length) % keys.length];
    else if (e.key === 'Home') next = keys[0];
    else if (e.key === 'End') next = keys[keys.length - 1];
    if (next) {
      e.preventDefault();
      activate(next);
      TAB_BY_KEY[next].focus();
    }
  });

  // Footer-links die naar een tab verwijzen
  $$('[data-foot-tab]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      activate(a.getAttribute('data-foot-tab'));
    });
  });

  // Hash veranderingen (browser back/forward)
  window.addEventListener('hashchange', function () {
    var hash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
    if (hash && TAB_BY_KEY[hash]) activate(hash, { silent: true });
  });

  // Initial activation
  activate(initialKey(), { silent: true, skipScroll: true });
})();
