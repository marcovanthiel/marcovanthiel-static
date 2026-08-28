/* Kunstlocaties — filteren, zoeken en renderen van de lijst.
   Data staat in assets/data.js (window.KUNSTLOCATIES). Geen afhankelijkheden. */
(function () {
  "use strict";

  var DATA = window.KUNSTLOCATIES || [];
  var LANDEN = [];
  var TYPES = ["Beeldenpark", "Land art", "Gesamtkunstwerk", "Kunstenaarshuis",
               "Privécollectie", "Industrieel erfgoed", "Architectuur",
               "Kunst in de openbare ruimte"];
  DATA.forEach(function (e) { if (LANDEN.indexOf(e.land) === -1) LANDEN.push(e.land); });

  var SEIZOEN = {
    "jaarrond": ["jaarrond", "t-jaarrond"],
    "seizoen": ["seizoen", "t-seizoen"],
    "afspraak": ["op afspraak", "t-afspraak"],
    "let op": ["let op", "t-letop"]
  };
  var HOND = { "ja": ["honden welkom", "ja"], "nee": ["geen honden", "nee"], "?": ["honden onbekend", "onbekend"] };

  var state = { land: null, type: null, kern: false, hond: false, jaarrond: false, q: "" };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function host(u) {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; }
  }

  /* ---------- deelbare URL ---------- */
  function readUrl() {
    var p = new URLSearchParams(location.search);
    if (p.get("land") && LANDEN.indexOf(p.get("land")) > -1) state.land = p.get("land");
    if (p.get("soort") && TYPES.indexOf(p.get("soort")) > -1) state.type = p.get("soort");
    ["kern", "hond", "jaarrond"].forEach(function (f) { if (p.get(f) === "1") state[f] = true; });
    if (p.get("q")) state.q = p.get("q").toLowerCase();
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (state.land) p.set("land", state.land);
    if (state.type) p.set("soort", state.type);
    ["kern", "hond", "jaarrond"].forEach(function (f) { if (state[f]) p.set(f, "1"); });
    if (state.q) p.set("q", state.q);
    var qs = p.toString();
    history.replaceState(null, "", qs ? location.pathname + "?" + qs : location.pathname);
  }

  /* ---------- filterknoppen ---------- */
  function chip(label, pressed, key, value) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = label;
    b.setAttribute("aria-pressed", pressed ? "true" : "false");
    b.dataset[key] = value;
    return b;
  }

  function buildFilters() {
    var fl = document.getElementById("f-land");
    fl.appendChild(chip("alles", !state.land, "land", ""));
    LANDEN.forEach(function (l) { fl.appendChild(chip(l, state.land === l, "land", l)); });

    var ft = document.getElementById("f-type");
    ft.appendChild(chip("alles", !state.type, "type", ""));
    TYPES.forEach(function (t) {
      if (DATA.some(function (e) { return e.t === t; })) {
        ft.appendChild(chip(t.toLowerCase(), state.type === t, "type", t));
      }
    });

    function group(sel, prop) {
      var els = document.querySelectorAll(sel);
      Array.prototype.forEach.call(els, function (b) {
        b.addEventListener("click", function () {
          state[prop] = b.dataset[prop] || null;
          Array.prototype.forEach.call(els, function (x) {
            x.setAttribute("aria-pressed", x === b ? "true" : "false");
          });
          render();
        });
      });
    }
    group("[data-land]", "land");
    group("[data-type]", "type");

    Array.prototype.forEach.call(document.querySelectorAll("[data-flag]"), function (b) {
      var f = b.dataset.flag;
      b.setAttribute("aria-pressed", state[f] ? "true" : "false");
      b.addEventListener("click", function () {
        state[f] = !state[f];
        b.setAttribute("aria-pressed", state[f] ? "true" : "false");
        render();
      });
    });

    var q = document.getElementById("q");
    q.value = state.q;
    q.addEventListener("input", function (e) { state.q = e.target.value.toLowerCase(); render(); });
  }

  function buildStats() {
    function n(fn) { return DATA.filter(fn).length; }
    var rows = [
      [DATA.length, "plekken"],
      [n(function (e) { return e.kern; }), "in de kern"],
      [n(function (e) { return e.h === "ja"; }), "honden welkom"],
      [n(function (e) { return e.s === "afspraak"; }), "op afspraak"],
      [n(function (e) { return e.s === "seizoen"; }), "seizoen"],
      [LANDEN.length, "landen"]
    ];
    document.getElementById("stats").innerHTML = rows.map(function (r) {
      return '<div class="stat"><b>' + r[0] + "</b><span>" + r[1] + "</span></div>";
    }).join("");
    document.getElementById("eyebrow-n").textContent = DATA.length + " plekken · " + LANDEN.length + " landen";
  }

  function match(e) {
    if (state.land && e.land !== state.land) return false;
    if (state.type && e.t !== state.type) return false;
    if (state.kern && !e.kern) return false;
    if (state.hond && e.h !== "ja") return false;
    if (state.jaarrond && e.s !== "jaarrond") return false;
    if (state.q) {
      var hay = (e.n + " " + e.p + " " + e.reg + " " + e.land + " " + e.w + " " + e.x + " " + e.t).toLowerCase();
      if (hay.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function render() {
    writeUrl();
    var vis = DATA.filter(match);
    document.getElementById("count").textContent =
      vis.length === DATA.length ? DATA.length + " plekken" : vis.length + " van " + DATA.length;

    var root = document.getElementById("lijst");
    if (!vis.length) {
      root.innerHTML = '<p class="leeg">Niets gevonden. Zet een filter uit of zoek op iets anders.</p>';
      return;
    }
    var html = "", land = null, reg = null;
    vis.forEach(function (e) {
      if (e.land !== land) {
        land = e.land; reg = null;
        var aantal = vis.filter(function (x) { return x.land === land; }).length;
        html += '<div class="landkop"><h2>' + esc(land) + "</h2><span>" +
                aantal + " " + (aantal === 1 ? "plek" : "plekken") + "</span></div>";
      }
      if (e.reg !== reg) { reg = e.reg; html += '<p class="regiokop">' + esc(reg) + "</p>"; }
      var se = SEIZOEN[e.s] || SEIZOEN["jaarrond"];
      var ho = HOND[e.h] || HOND["?"];
      html += '<article class="plek' + (e.kern ? " kern" : "") + '">' +
        '<div class="meta">' +
          (e.kern ? '<span class="kernmark">⬥ kern</span>' : "") +
          '<span class="plaats">' + esc(e.p) + "</span>" +
          '<span class="tag ' + se[1] + '">' + se[0] + "</span>" +
          '<span class="hond ' + ho[1] + '">' + ho[0] + "</span>" +
        "</div>" +
        '<div class="plek-body">' +
          "<h3>" + esc(e.n) + "</h3>" +
          '<p class="wie">' + esc(e.w) + "</p>" +
          '<p class="waarom">' + esc(e.x) + "</p>" +
          (e.pr ? '<p class="praktisch">' + esc(e.pr) + "</p>" : "") +
          '<a href="' + esc(e.u) + '" target="_blank" rel="noopener">' + esc(host(e.u)) + " ↗</a>" +
        "</div></article>";
    });
    root.innerHTML = html;
  }

  readUrl();
  buildFilters();
  buildStats();
  render();
})();
