/* ============================================================
   Klank admin — laadt reserveringen via /api/klank/admin/export
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'klank-admin-token';
  var ENDPOINT    = '/api/klank/admin/export';

  var loginSection = document.getElementById('login-section');
  var listSection  = document.getElementById('list-section');
  var loginForm    = document.getElementById('login-form');
  var tokenInput   = document.getElementById('token-input');
  var loginError   = document.getElementById('login-error');
  var summaryEl    = document.getElementById('summary');
  var tbody        = document.getElementById('reserveringen-body');
  var refreshBtn   = document.getElementById('refresh-btn');
  var logoutBtn    = document.getElementById('logout-btn');
  var csvLink      = document.getElementById('csv-link');

  function showLogin(errMsg) {
    listSection.hidden = true;
    loginSection.hidden = false;
    if (errMsg) {
      loginError.hidden = false;
      loginError.textContent = errMsg;
    } else {
      loginError.hidden = true;
      loginError.textContent = '';
    }
    setTimeout(function () { tokenInput.focus(); }, 0);
  }

  function showList() {
    loginSection.hidden = true;
    listSection.hidden = false;
  }

  function getToken() {
    try { return sessionStorage.getItem(STORAGE_KEY) || ''; }
    catch (_) { return ''; }
  }
  function setToken(t) {
    try { sessionStorage.setItem(STORAGE_KEY, t); } catch (_) {}
  }
  function clearToken() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function escapeText(s) {
    var div = document.createElement('div');
    div.textContent = String(s == null ? '' : s);
    return div.innerHTML;
  }

  function formatEuro(cent) {
    return '€ ' + (cent / 100).toFixed(2).replace('.', ',');
  }

  function formatTs(iso) {
    // D1 default geeft ISO-achtige string ("2026-06-15 14:32:11").
    // Toon als "15 jun · 16:32" (Amsterdam) — vermijd Date-parsing
    // bugs door simpel string-splitten.
    if (!iso) return '';
    var s = String(iso).replace('T', ' ').replace('Z', '');
    var parts = s.split(' ');
    var d = parts[0] || '';
    var t = (parts[1] || '').slice(0, 5);
    var months = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    var dm = d.split('-'); // [yyyy, mm, dd]
    if (dm.length !== 3) return s;
    var monthIdx = parseInt(dm[1], 10) - 1;
    var dayN = parseInt(dm[2], 10);
    var monthName = months[monthIdx] || dm[1];
    return dayN + ' ' + monthName + ' · ' + t;
  }

  function renderRows(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">Nog geen reserveringen.</td></tr>';
      return;
    }
    var html = rows.map(function (r, i) {
      return (
        '<tr>' +
          '<td class="num">' + (i + 1) + '</td>' +
          '<td>' + escapeText(r.naam) + '</td>' +
          '<td>' + escapeText(r.woonplaats) + '</td>' +
          '<td class="email"><a href="mailto:' + escapeText(r.email) + '" style="color:inherit;text-decoration:none">' + escapeText(r.email) + '</a></td>' +
          '<td class="num">' + escapeText(r.aantal) + '</td>' +
          '<td class="num">' + escapeText(formatEuro(r.bedrag_cent || 0)) + '</td>' +
          '<td class="ref">' + escapeText(r.ref) + '</td>' +
          '<td class="ts">' + escapeText(formatTs(r.created_at)) + '</td>' +
        '</tr>'
      );
    }).join('');
    tbody.innerHTML = html;
  }

  function renderSummary(count, kaarten, bedragCent) {
    summaryEl.innerHTML =
      '<span class="pill">' + count + ' reserveringen</span>' +
      '<span class="pill">' + kaarten + ' kaarten</span>' +
      '<span class="pill">' + formatEuro(bedragCent) + '</span>';
  }

  function updateCsvLink(token) {
    csvLink.href = ENDPOINT + '?token=' + encodeURIComponent(token);
  }

  function loadList() {
    var token = getToken();
    if (!token) {
      showLogin();
      return;
    }
    tbody.innerHTML = '<tr><td colspan="8" class="empty">Bezig met laden…</td></tr>';

    fetch(ENDPOINT + '?format=json', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (r) {
        if (r.status === 401) {
          clearToken();
          showLogin('Token klopt niet — probeer het opnieuw.');
          throw new Error('unauthorized');
        }
        if (!r.ok) {
          throw new Error('http ' + r.status);
        }
        return r.json();
      })
      .then(function (j) {
        var rows = (j && j.rows) || [];
        var kaarten   = rows.reduce(function (s, r) { return s + (r.aantal || 0); }, 0);
        var bedrag    = rows.reduce(function (s, r) { return s + (r.bedrag_cent || 0); }, 0);
        renderSummary(rows.length, kaarten, bedrag);
        renderRows(rows);
        updateCsvLink(token);
        showList();
      })
      .catch(function (e) {
        if (e.message === 'unauthorized') return;
        tbody.innerHTML =
          '<tr><td colspan="8" class="empty">Laden mislukt: ' + escapeText(e.message) + '</td></tr>';
      });
  }

  // ── Login submit ──────────────────────────────────────────────────
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = (tokenInput.value || '').trim();
    if (!t) return;
    setToken(t);
    tokenInput.value = '';
    loadList();
  });

  refreshBtn.addEventListener('click', loadList);

  logoutBtn.addEventListener('click', function () {
    clearToken();
    showLogin();
  });

  // ── Auto-load bij bestaande sessie ────────────────────────────────
  if (getToken()) {
    loadList();
  } else {
    showLogin();
  }
})();
