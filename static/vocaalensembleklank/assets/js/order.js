/* ============================================================
   Vocaal Ensemble KLANK · reserveringsformulier
   ============================================================ */

(function () {
  'use strict';

  var PRIJS_CENT = 1700; // € 17,00 per kaart

  var form    = document.getElementById('reserve-form');
  if (!form) return;
  var status  = document.getElementById('reserve-status');
  var btn     = form.querySelector('button[type="submit"]');
  var aantal  = form.querySelector('input[name="aantal"]');
  var totaal  = document.getElementById('totaal-bedrag');

  function formatEuro(cent) {
    var euro = (cent / 100).toFixed(2).replace('.', ',');
    return '€ ' + euro;
  }

  function recomputeTotaal() {
    var n = parseInt(aantal.value, 10);
    if (!Number.isFinite(n) || n < 1) n = 0;
    totaal.textContent = formatEuro(n * PRIJS_CENT);
  }
  aantal.addEventListener('input', recomputeTotaal);
  recomputeTotaal();

  function setStatus(kind, html) {
    status.hidden = false;
    status.className = 'reserve-status reserve-status--' + kind;
    status.innerHTML = html;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var fd = new FormData(form);
    var payload = {
      naam:       (fd.get('naam') || '').toString().trim(),
      woonplaats: (fd.get('woonplaats') || '').toString().trim(),
      email:      (fd.get('email') || '').toString().trim(),
      aantal:     parseInt(fd.get('aantal') || '0', 10),
      website:    (fd.get('website') || '').toString() // honeypot
    };

    btn.disabled = true;
    setStatus('pending', 'Bezig met versturen…');

    fetch('/api/klank/reserve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok && j.ok, body: j };
        });
      })
      .then(function (res) {
        if (res.ok) {
          var ref = (res.body && res.body.ref) ? res.body.ref : '';
          setStatus(
            'success',
            '<strong>Bedankt — je reservering is binnen.</strong><br>' +
            'Je krijgt direct een bevestigingsmail op <em>' +
              escapeText(payload.email) +
            '</em>.<br>' +
            'Print die mail of toon hem digitaal aan de deur ' +
            '— dat is je toegangsbewijs.' +
            (ref ? '<br><span style="opacity:.7;font-size:.85em">Referentie: ' + escapeText(ref) + '</span>' : '')
          );
          form.reset();
          recomputeTotaal();
          btn.disabled = true; // voorkom dubbele inzending
        } else {
          var msg = (res.body && res.body.error) || 'Er ging iets mis. Probeer het opnieuw.';
          setStatus('error', escapeText(msg));
          btn.disabled = false;
        }
      })
      .catch(function () {
        setStatus('error', 'Geen verbinding. Probeer het later opnieuw of mail klank@marcovanthiel.nl.');
        btn.disabled = false;
      });
  });

  function escapeText(s) {
    var div = document.createElement('div');
    div.textContent = String(s == null ? '' : s);
    return div.innerHTML;
  }
})();
