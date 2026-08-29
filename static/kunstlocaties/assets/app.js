/* Kunstlocaties — kaart, foto's en catalogus.
   Data: assets/data.js (window.KUNSTLOCATIES), assets/mapdata.js (window.KAARTDATA),
   assets/fotos.js (window.KUNSTFOTOS). Geen afhankelijkheden. */
(function () {
  "use strict";

  var DATA = window.KUNSTLOCATIES || [];
  var KAART = window.KAARTDATA || null;
  var FOTOS = window.KUNSTFOTOS || {};
  var SVGNS = "http://www.w3.org/2000/svg";
  var rustig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var LANDEN = [];
  DATA.forEach(function (e) { if (LANDEN.indexOf(e.land) === -1) LANDEN.push(e.land); });
  var TYPES = ["Beeldenpark", "Land art", "Gesamtkunstwerk", "Kunstenaarshuis",
               "Privécollectie", "Industrieel erfgoed", "Architectuur",
               "Kunst in de openbare ruimte"];
  var SEIZOEN = { "jaarrond": ["jaarrond", "m-jaarrond"], "seizoen": ["seizoen", "m-seizoen"],
                  "afspraak": ["op afspraak", "m-afspraak"], "let op": ["let op", "m-letop"] };
  var HOND = { "ja": ["honden welkom", "ja"], "nee": ["geen honden", "nee"], "?": ["honden onbekend", "onbekend"] };
  var NE = { "Italië": "Italy", "Frankrijk": "France", "Spanje": "Spain", "Portugal": "Portugal",
             "Zwitserland": "Switzerland", "Liechtenstein": "Liechtenstein", "Oostenrijk": "Austria",
             "Duitsland": "Germany", "België": "Belgium", "Luxemburg": "Luxembourg", "Tsjechië": "Czechia" };

  var state = { land: null, type: null, kern: false, hond: false, jaarrond: false, foto: false, q: "", sel: -1 };

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function host(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } }
  function svgEl(naam, attrs) {
    var el = document.createElementNS(SVGNS, naam);
    for (var k in attrs) if (attrs[k] != null) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* ------------------------------------------------------------ url ---- */
  function leesUrl() {
    var p = new URLSearchParams(location.search);
    if (p.get("land") && LANDEN.indexOf(p.get("land")) > -1) state.land = p.get("land");
    if (p.get("soort") && TYPES.indexOf(p.get("soort")) > -1) state.type = p.get("soort");
    ["kern", "hond", "jaarrond", "foto"].forEach(function (f) { if (p.get(f) === "1") state[f] = true; });
    if (p.get("q")) state.q = p.get("q").toLowerCase();
  }
  function schrijfUrl() {
    var p = new URLSearchParams();
    if (state.land) p.set("land", state.land);
    if (state.type) p.set("soort", state.type);
    ["kern", "hond", "jaarrond", "foto"].forEach(function (f) { if (state[f]) p.set(f, "1"); });
    if (state.q) p.set("q", state.q);
    var qs = p.toString();
    history.replaceState(null, "", qs ? location.pathname + "?" + qs : location.pathname);
  }

  /* -------------------------------------------------------- filteren ---- */
  function past(e) {
    if (state.land && e.land !== state.land) return false;
    if (state.type && e.t !== state.type) return false;
    if (state.kern && !e.kern) return false;
    if (state.hond && e.h !== "ja") return false;
    if (state.jaarrond && e.s !== "jaarrond") return false;
    if (state.foto && !FOTOS[e.id]) return false;
    if (state.q) {
      var hooi = (e.id + " " + e.n + " " + e.p + " " + e.reg + " " + e.land + " " +
                  e.w + " " + e.x + " " + e.t).toLowerCase();
      if (hooi.indexOf(state.q) === -1) return false;
    }
    return true;
  }

  function chip(label, ingedrukt, sleutel, waarde) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = label;
    b.setAttribute("aria-pressed", ingedrukt ? "true" : "false");
    b.dataset[sleutel] = waarde;
    return b;
  }

  function bouwFilters() {
    var fl = $("f-land");
    fl.appendChild(chip("alles", !state.land, "land", ""));
    LANDEN.forEach(function (l) { fl.appendChild(chip(l, state.land === l, "land", l)); });
    var ft = $("f-type");
    ft.appendChild(chip("alles", !state.type, "type", ""));
    TYPES.forEach(function (t) {
      if (DATA.some(function (e) { return e.t === t; }))
        ft.appendChild(chip(t.toLowerCase(), state.type === t, "type", t));
    });

    function groep(sel, prop, na) {
      var els = document.querySelectorAll(sel);
      Array.prototype.forEach.call(els, function (b) {
        b.addEventListener("click", function () {
          state[prop] = b.dataset[prop] || null;
          Array.prototype.forEach.call(els, function (x) {
            x.setAttribute("aria-pressed", x === b ? "true" : "false");
          });
          teken(); if (na) na();
        });
      });
    }
    groep("[data-land]", "land", function () { if (kaart) kaart.naarLand(state.land); });
    groep("[data-type]", "type", null);

    Array.prototype.forEach.call(document.querySelectorAll("[data-flag]"), function (b) {
      var f = b.dataset.flag;
      b.setAttribute("aria-pressed", state[f] ? "true" : "false");
      b.addEventListener("click", function () {
        state[f] = !state[f];
        b.setAttribute("aria-pressed", state[f] ? "true" : "false");
        teken();
      });
    });
    var q = $("q");
    q.value = state.q;
    q.addEventListener("input", function (ev) { state.q = ev.target.value.toLowerCase(); teken(); });
  }

  function bouwPillen() {
    var metFoto = DATA.filter(function (e) { return FOTOS[e.id]; }).length;
    var rijen = [
      [DATA.length, "locaties", false],
      [DATA.filter(function (e) { return e.kern; }).length, "in de kern", false],
      [LANDEN.length, "landen", false],
      [metFoto, "met foto", metFoto > 0]
    ];
    $("pillen").innerHTML = rijen.map(function (r) {
      return '<div class="pil' + (r[2] ? " aan" : "") + '"><b>' + r[0] + "</b><span>" + r[1] + "</span></div>";
    }).join("");
    $("eyebrow-n").textContent = DATA.length + " locaties · " + LANDEN.length + " landen";
    $("foto-stand").textContent = metFoto === 0
      ? "De foto's staan er nog niet op: het ophaalscript moet nog draaien."
      : metFoto + " van de " + DATA.length + " locaties heeft een foto.";
  }

  /* ------------------------------------------------------- catalogus ---- */
  function beeldVoor(e) {
    var f = FOTOS[e.id];
    if (f && f.f) {
      var credit = f.licentie === "eigen foto"
        ? "Foto: Marco van Thiel"
        : "Foto: " + esc(f.maker || "onbekend") + " · " +
          (f.bron ? '<a href="' + esc(f.bron) + '" target="_blank" rel="noopener">' + esc(f.licentie) + "</a>"
                  : esc(f.licentie));
      return '<div><div class="beeld"><img src="foto/' + esc(f.f) + '" alt="' + esc(e.n) +
             '" loading="lazy" decoding="async" width="760" height="570"></div>' +
             '<p class="credit">' + credit + "</p></div>";
    }
    var v = "v" + (e.nr % 4);
    return '<div><div class="beeld leeg ' + v + '"><div class="geen"><span>nog geen vrije foto</span></div></div></div>';
  }

  function tekenLijst(zichtbaar) {
    var wortel = $("lijst");
    if (!zichtbaar.length) {
      wortel.innerHTML = '<p class="leeg">Niets gevonden. Zet een filter uit of zoek op iets anders.</p>';
      return;
    }
    var html = "", land = null, reg = null;
    zichtbaar.forEach(function (e) {
      if (e.land !== land) {
        land = e.land; reg = null;
        var n = zichtbaar.filter(function (x) { return x.land === land; }).length;
        html += '<div class="landkop"><h2>' + esc(land) + '</h2><span class="telling-land">' +
                n + " " + (n === 1 ? "locatie" : "locaties") + "</span></div>";
      }
      if (e.reg !== reg) { reg = e.reg; html += '<p class="regiokop">' + esc(reg) + "</p>"; }
      var se = SEIZOEN[e.s] || SEIZOEN.jaarrond, ho = HOND[e.h] || HOND["?"];
      html += '<article class="plek' + (e.kern ? " kern" : "") + '" id="plek-' + e.id + '">' +
        beeldVoor(e) +
        '<div class="plek-body">' +
          "<h3>" + esc(e.n) + "</h3>" +
          '<p class="wie">' + esc(e.w) + "</p>" +
          '<p class="waarom">' + esc(e.x) + "</p>" +
          (e.pr ? '<p class="praktisch">' + esc(e.pr) + "</p>" : "") +
          '<p class="plek-acties">' +
            '<a href="' + esc(e.u) + '" target="_blank" rel="noopener">' + esc(host(e.u)) + " ↗</a>" +
            '<button type="button" data-toon="' + e.nr + '">toon op de kaart</button>' +
          "</p>" +
        "</div>" +
        '<div class="meta">' +
          '<span class="nr">' + e.id + (e.kern ? " ◆" : "") + "</span>" +
          '<span class="plaats">' + esc(e.p) + "</span>" +
          '<span class="merk ' + se[1] + '">' + se[0] + "</span>" +
          '<span class="hond ' + ho[1] + '">' + ho[0] + "</span>" +
        "</div></article>";
    });
    wortel.innerHTML = html;
    Array.prototype.forEach.call(wortel.querySelectorAll("[data-toon]"), function (b) {
      b.addEventListener("click", function () {
        var i = +b.dataset.toon;
        if (kaart) kaart.naarPunt(i);
        selecteer(i, false);
      });
    });
  }

  function teken() {
    schrijfUrl();
    var zicht = DATA.filter(past);
    $("count").textContent = zicht.length === DATA.length
      ? DATA.length + " locaties" : zicht.length + " van " + DATA.length;
    tekenLijst(zicht);
    if (kaart) kaart.zetZichtbaar(zicht);
    if (state.sel > -1 && !past(DATA[state.sel])) selecteer(-1);
  }

  function selecteer(i, scroll) {
    state.sel = i;
    Array.prototype.forEach.call(document.querySelectorAll(".plek.gemarkeerd"),
      function (el) { el.classList.remove("gemarkeerd"); });
    if (kaart) kaart.markeer(i);
    var kk = $("kaartkaart");
    if (i < 0) { kk.hidden = true; return; }
    var e = DATA[i];
    kk.hidden = false;
    kk.innerHTML = '<span class="kk-nr">' + e.id + " · " + esc(e.p) + "</span>" +
      "<h4>" + esc(e.n) + "</h4><p>" + esc(e.w) + "</p>" +
      '<a class="kk-link" href="' + esc(e.u) + '" target="_blank" rel="noopener">' + esc(host(e.u)) + " ↗</a>";
    var rij = $("plek-" + e.id);
    if (rij) {
      rij.classList.add("gemarkeerd");
      if (scroll !== false) rij.scrollIntoView({ behavior: rustig ? "auto" : "smooth", block: "center" });
    }
  }

  /* ------------------------------------------------------------ kaart -- */
  var kaart = null;
  function bouwKaart() {
    if (!KAART) return null;
    var svg = $("kaart"), houder = $("kaart-houder");
    var stipEls = [], landEls = {}, labelEls = [];
    var k = 1, tx = 0, ty = 0, k0 = 1, cw = 0, ch = 0;
    var dataBox = (function () {
      var xs = KAART.pts.map(function (p) { return p[0]; }), ys = KAART.pts.map(function (p) { return p[1]; });
      return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
    })();

    /* Geen vulpatroon: de landen zijn vlak, de tekening zit in de lijn.
       De liniaal langs het kader staat buiten de scene en blijft dus staan. */
    var scene = svgEl("g", { id: "scene" });
    svg.appendChild(scene);
    scene.appendChild(svgEl("path", { class: "graticule", d: KAART.graticule }));

    var gLand = svgEl("g");
    scene.appendChild(gLand);
    KAART.countries.slice().sort(function (a, b) { return a.s - b.s; }).forEach(function (c) {
      var p = svgEl("path", { class: "land" + (c.s ? " scope" : ""), d: c.d });
      gLand.appendChild(p);
      if (c.s) landEls[c.n] = p;
    });

    var gLabels = svgEl("g");
    scene.appendChild(gLabels);
    KAART.labels.forEach(function (l) {
      var t = svgEl("text", { class: "landlabel" + (l.s ? "" : " buiten"), x: l.x, y: l.y });
      t.textContent = l.t;
      gLabels.appendChild(t); labelEls.push(t);
    });

    var gStip = svgEl("g");
    scene.appendChild(gStip);
    var overlay = svgEl("g");
    var liniaal = svgEl("g");
    overlay.appendChild(liniaal);
    function liniaalBij() {
      while (liniaal.firstChild) liniaal.removeChild(liniaal.firstChild);
      for (var x = 0; x <= cw; x += 40)
        liniaal.appendChild(svgEl("line", { class: "liniaal", x1: x, y1: 0, x2: x, y2: (x % 200 ? 5 : 10) }));
      for (var y = 0; y <= ch; y += 40)
        liniaal.appendChild(svgEl("line", { class: "liniaal", x1: 0, y1: y, x2: (y % 200 ? 5 : 10), y2: y }));
    }
    var kruis = svgEl("g", { class: "kruis-groep" });
    kruis.appendChild(svgEl("rect", { class: "kruis", x: -11, y: -11, width: 22, height: 22 }));
    [[0, -22, 0, -14], [0, 14, 0, 22], [-22, 0, -14, 0], [14, 0, 22, 0]].forEach(function (c) {
      kruis.appendChild(svgEl("line", { class: "kruis", x1: c[0], y1: c[1], x2: c[2], y2: c[3] }));
    });
    kruis.style.display = "none";
    overlay.appendChild(kruis); svg.appendChild(overlay);

    DATA.forEach(function (e, i) {
      var p = KAART.pts[i];
      var g = svgEl("g", { class: "stip" + (e.kern ? " kern" : ""), "data-i": i,
                           transform: "translate(" + p[0] + "," + p[1] + ")" });
      var binnen = svgEl("g");
      if (e.kern) binnen.appendChild(svgEl("rect", { class: "blok", x: -3.6, y: -3.6, width: 7.2, height: 7.2 }));
      else binnen.appendChild(svgEl("rect", { class: "blok", x: -2.6, y: -2.6, width: 5.2, height: 5.2 }));
      var t = svgEl("text", { class: "naam", x: 9, y: 3.4 });
      t.textContent = e.n.length > 34 ? e.n.slice(0, 33) + "…" : e.n;
      binnen.appendChild(t);
      g.appendChild(binnen);
      if (!rustig) { g.classList.add("inkten"); binnen.style.animationDelay = (i * 3.4).toFixed(0) + "ms"; }
      gStip.appendChild(g); stipEls.push(g);
      g.addEventListener("click", function (ev) { ev.stopPropagation(); selecteer(i); });
    });

    function pasToe() {
      scene.setAttribute("transform", "translate(" + tx.toFixed(2) + "," + ty.toFixed(2) + ") scale(" + k.toFixed(4) + ")");
      var inv = 1 / k;
      for (var i = 0; i < stipEls.length; i++) {
        var p = KAART.pts[i];
        stipEls[i].setAttribute("transform", "translate(" + p[0] + "," + p[1] + ") scale(" + inv.toFixed(4) + ")");
      }
      var ver = k / k0;
      labelEls.forEach(function (t) { t.style.opacity = ver > 2.4 ? 0 : (ver > 1.6 ? 0.35 : 1); });
      svg.classList.toggle("detail", ver >= 3.2);
      if (state.sel > -1) {
        var ps = KAART.pts[state.sel];
        kruis.setAttribute("transform", "translate(" + (ps[0] * k + tx).toFixed(1) + "," + (ps[1] * k + ty).toFixed(1) + ")");
        kruis.style.display = "";
      } else kruis.style.display = "none";
      schaalBij();
      plan();
    }

    var planTimer;
    function plan() { clearTimeout(planTimer); planTimer = setTimeout(labelsBij, 110); }
    var volgorde = null;
    function labelsBij() {
      if (!volgorde) volgorde = DATA.map(function (e, i) { return i; })
        .sort(function (a, b) { return (DATA[b].kern ? 1 : 0) - (DATA[a].kern ? 1 : 0); });
      if (!svg.classList.contains("detail")) {
        for (var i = 0; i < stipEls.length; i++) stipEls[i].classList.remove("toon");
        return;
      }
      var vakken = [];
      for (var j = 0; j < volgorde.length; j++) {
        var i2 = volgorde[j], el = stipEls[i2];
        if (el.classList.contains("uit")) { el.classList.remove("toon"); continue; }
        var p = KAART.pts[i2], sx = p[0] * k + tx, sy = p[1] * k + ty;
        if (sx < -40 || sx > cw + 40 || sy < -20 || sy > ch + 20) { el.classList.remove("toon"); continue; }
        var breed = Math.min(DATA[i2].n.length, 34) * 5.4 + 14;
        var vak = [sx + 7, sy - 7, sx + 7 + breed, sy + 7], vrij = true;
        for (var v = 0; v < vakken.length; v++) {
          var q = vakken[v];
          if (vak[0] < q[2] && vak[2] > q[0] && vak[1] < q[3] && vak[3] > q[1]) { vrij = false; break; }
        }
        el.classList.toggle("toon", vrij);
        if (vrij) vakken.push(vak);
      }
    }

    function schaalBij() {
      var kmPerPx = KAART.kmPerUnit / k;
      var netjes = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
      var beste = netjes[0], px = 0;
      for (var i = 0; i < netjes.length; i++) {
        var b = netjes[i] / kmPerPx;
        if (b >= 55 && b <= 130) { beste = netjes[i]; px = b; break; }
        if (b < 130) { beste = netjes[i]; px = b; }
      }
      $("schaalbalk").style.width = Math.round(px) + "px";
      $("schaaltekst").textContent = beste + " km";
    }

    function klem() {
      var bx = dataBox[0] * k + tx, by = dataBox[1] * k + ty;
      var bw = (dataBox[2] - dataBox[0]) * k, bh = (dataBox[3] - dataBox[1]) * k, m = 0.35;
      if (bx > cw * (1 - m)) tx -= bx - cw * (1 - m);
      if (bx + bw < cw * m) tx += cw * m - (bx + bw);
      if (by > ch * (1 - m)) ty -= by - ch * (1 - m);
      if (by + bh < ch * m) ty += ch * m - (by + bh);
    }

    var bezig = null;
    function animeer(dk, dx, dy) {
      if (bezig) cancelAnimationFrame(bezig);
      var k1 = k, x1 = tx, y1 = ty, t0 = performance.now(), duur = 520;
      (function stap(nu) {
        var t = Math.min(1, (nu - t0) / duur);
        var e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        k = k1 + (dk - k1) * e; tx = x1 + (dx - x1) * e; ty = y1 + (dy - y1) * e;
        pasToe();
        if (t < 1) bezig = requestAnimationFrame(stap); else { bezig = null; klem(); pasToe(); }
      })(t0);
    }
    function naarBox(box, padding, direct) {
      var p = padding == null ? 28 : padding;
      var bw = Math.max(box[2] - box[0], 8), bh = Math.max(box[3] - box[1], 8);
      var doelK = Math.min((cw - 2 * p) / bw, (ch - 2 * p) / bh);
      doelK = Math.max(k0 * 0.9, Math.min(doelK, k0 * 18));
      var dx = cw / 2 - doelK * (box[0] + bw / 2), dy = ch / 2 - doelK * (box[1] + bh / 2);
      if (direct || rustig) { k = doelK; tx = dx; ty = dy; klem(); pasToe(); return; }
      animeer(doelK, dx, dy);
    }
    function meet() {
      cw = houder.clientWidth; ch = houder.clientHeight;
      svg.setAttribute("viewBox", "0 0 " + cw + " " + ch);
      liniaalBij();
      k0 = Math.min((cw - 56) / (dataBox[2] - dataBox[0]), (ch - 56) / (dataBox[3] - dataBox[1]));
    }
    function zoomOm(sx, sy, factor) {
      var nk = Math.max(k0 * 0.85, Math.min(k * factor, k0 * 18));
      if (nk === k) return;
      var mx = (sx - tx) / k, my = (sy - ty) / k;
      k = nk; tx = sx - mx * k; ty = sy - my * k;
      klem(); pasToe();
    }

    function opBediening(el) {
      while (el && el !== houder) {
        if (el.classList && (el.classList.contains("kaart-knoppen") ||
            el.classList.contains("cartouche") || el.classList.contains("kaartkaart"))) return true;
        el = el.parentNode;
      }
      return false;
    }
    var pointers = {}, laatsteAfstand = 0, sleep = null, verplaatst = 0;
    houder.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var r = houder.getBoundingClientRect();
      var f = Math.pow(0.9988, ev.deltaY * (ev.deltaMode === 1 ? 16 : 1));
      zoomOm(ev.clientX - r.left, ev.clientY - r.top, Math.max(0.55, Math.min(f, 1.8)));
    }, { passive: false });
    houder.addEventListener("pointerdown", function (ev) {
      if (opBediening(ev.target)) return;
      houder.setPointerCapture(ev.pointerId);
      pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (Object.keys(pointers).length === 1) {
        sleep = { x: ev.clientX, y: ev.clientY }; verplaatst = 0;
        houder.classList.add("sleept");
      }
    });
    houder.addEventListener("pointermove", function (ev) {
      if (!pointers[ev.pointerId]) return;
      var ids = Object.keys(pointers);
      if (ids.length >= 2) {
        pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (laatsteAfstand) {
          var r = houder.getBoundingClientRect();
          zoomOm((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / laatsteAfstand);
        }
        laatsteAfstand = d;
        return;
      }
      if (!sleep) return;
      var dx = ev.clientX - sleep.x, dy = ev.clientY - sleep.y;
      verplaatst += Math.abs(dx) + Math.abs(dy);
      tx += dx; ty += dy; sleep = { x: ev.clientX, y: ev.clientY };
      klem(); pasToe();
    });
    function stopPointer(ev) {
      delete pointers[ev.pointerId];
      if (Object.keys(pointers).length < 2) laatsteAfstand = 0;
      if (!Object.keys(pointers).length) { sleep = null; houder.classList.remove("sleept"); }
    }
    houder.addEventListener("pointerup", stopPointer);
    houder.addEventListener("pointercancel", stopPointer);
    houder.addEventListener("click", function () { if (verplaatst < 5) selecteer(-1); });
    houder.addEventListener("dblclick", function (ev) {
      var r = houder.getBoundingClientRect();
      zoomOm(ev.clientX - r.left, ev.clientY - r.top, 1.9);
    });
    $("zoom-in").addEventListener("click", function () { zoomOm(cw / 2, ch / 2, 1.6); });
    $("zoom-uit").addEventListener("click", function () { zoomOm(cw / 2, ch / 2, 1 / 1.6); });
    $("zoom-reset").addEventListener("click", function () { naarBox(dataBox, 28); selecteer(-1); });

    var hertekenTimer;
    window.addEventListener("resize", function () {
      clearTimeout(hertekenTimer);
      hertekenTimer = setTimeout(function () { meet(); naarBox(dataBox, 28, true); }, 150);
    });
    meet(); naarBox(dataBox, 28, true);

    return {
      zetZichtbaar: function (zicht) {
        var aan = {};
        zicht.forEach(function (e) { aan[e.nr] = 1; });
        for (var i = 0; i < stipEls.length; i++) stipEls[i].classList.toggle("uit", !aan[i]);
        Object.keys(landEls).forEach(function (n) {
          landEls[n].classList.toggle("aan", state.land ? NE[state.land] === n : false);
        });
        plan();
      },
      markeer: function (i) {
        for (var j = 0; j < stipEls.length; j++) stipEls[j].classList.toggle("actief", j === i);
        pasToe();
      },
      naarPunt: function (i) {
        var p = KAART.pts[i];
        naarBox([p[0] - 26, p[1] - 26, p[0] + 26, p[1] + 26], 40);
      },
      naarLand: function (land) {
        if (!land) { naarBox(dataBox, 28); return; }
        var b = KAART.boxes[land];
        if (b) naarBox([b[0] - 12, b[1] - 12, b[2] + 12, b[3] + 12], 44);
      }
    };
  }

  /* Het millimeterpapier achter de pagina — één keer tekenen, verder niets. */
  function bouwRaster() {
    var g = document.getElementById("raster");
    if (!g) return;
    for (var x = 0; x <= 1280; x += 40) g.appendChild(svgEl("line", { x1: x, y1: 0, x2: x, y2: 800 }));
    for (var y = 0; y <= 800; y += 40) g.appendChild(svgEl("line", { x1: 0, y1: y, x2: 1280, y2: y }));
  }

  /* ------------------------------------------------------------ start -- */
  DATA.forEach(function (e, i) { e.nr = i; });
  leesUrl();
  bouwRaster();
  bouwFilters();
  bouwPillen();
  kaart = bouwKaart();
  teken();
})();
