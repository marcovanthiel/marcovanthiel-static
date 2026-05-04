// =====================================================
// Biennale di Venezia 2026 — magazine subpage
// Marco van Thiel · marcovanthiel.nl/biennalevenetie2026
// =====================================================
(function () {
  'use strict';

  var SUPPORTED = ['nl', 'en', 'it', 'de', 'zh'];

  // ----- Date stamps -----
  var months = {
    nl: ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    it: ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'],
    de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
    zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
  };
  var labels = {
    nl: ['Vandaag', 'Laatst bijgewerkt'],
    en: ['Today', 'Last updated'],
    it: ['Oggi', 'Ultimo aggiornamento'],
    de: ['Heute', 'Zuletzt aktualisiert'],
    zh: ['今日', '最后更新']
  };

  function formatDate(lang) {
    var d = new Date();
    if (lang === 'zh') {
      return d.getFullYear() + '年' + months.zh[d.getMonth()] + d.getDate() + '日';
    }
    return d.getDate() + ' ' + months[lang][d.getMonth()] + ' ' + d.getFullYear();
  }

  function updateDates(lang) {
    var t = document.getElementById('today-stamp');
    if (t) t.textContent = labels[lang][0] + ' · ' + formatDate(lang);
    var u = document.getElementById('last-updated');
    if (u) u.textContent = labels[lang][1] + ': ' + formatDate(lang);
  }

  // ----- Language switcher -----
  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = 'nl';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);

    // Toggle visible variants
    var nodes = document.querySelectorAll('[data-i18n] [lang]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.getAttribute('lang') === lang) {
        el.setAttribute('data-active', '');
      } else {
        el.removeAttribute('data-active');
      }
    }

    // Buttons
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var j = 0; j < buttons.length; j++) {
      var b = buttons[j];
      b.setAttribute('aria-pressed', b.getAttribute('data-set') === lang ? 'true' : 'false');
    }

    updateDates(lang);

    try { localStorage.setItem('mvt-biennale-lang', lang); } catch (e) {}
  }

  // ----- Init -----
  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (ev) {
        setLang(ev.currentTarget.getAttribute('data-set'));
      });
    }

    // Restore previous selection or detect from browser
    var saved = null;
    try { saved = localStorage.getItem('mvt-biennale-lang'); } catch (e) {}
    if (saved && SUPPORTED.indexOf(saved) !== -1) {
      setLang(saved);
    } else {
      // Check browser language preference
      var nav = (navigator.language || 'nl').toLowerCase().slice(0, 2);
      var detected = SUPPORTED.indexOf(nav) !== -1 ? nav : 'nl';
      setLang(detected);
    }
  });
})();
