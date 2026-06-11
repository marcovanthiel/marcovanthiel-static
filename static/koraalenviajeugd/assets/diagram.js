/* ============================================================
 *  Gedeelde OCAI-diagram-renderer
 *  Gebruikt door /resultaat/, /admin/totaal/ en (later) andere
 *  pagina's. Tekent het 4-kwadranten-veld + ellips(en) op basis
 *  van OCAI-scores en optioneel pijlen tussen "nu" en "gewenst".
 *
 *  Schaal: scores zijn percentages 0..100 die per ronde op 100
 *  uitkomen over A/B/C/D. De positie op het veld berekenen we als:
 *      x = (B + C - A - D) / 100   →  -1 (intern)  .. +1 (extern)
 *      y = (A + B - C - D) / 100   →  -1 (beheers) .. +1 (flexibel)
 *  Bij gelijke verdeling (25/25/25/25) eindig je op (0,0) = midden.
 *  ============================================================ */

(function (global) {
  'use strict';

  // Letter-mapping: A=Familie (TL), B=Adhocratie (TR), C=Markt (BR), D=Hierarchie (BL)
  function position(profile) {
    if (!profile) return null;
    const x = (profile.B + profile.C - profile.A - profile.D) / 100;
    const y = (profile.A + profile.B - profile.C - profile.D) / 100;
    return { x, y };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /**
   * Render één OCAI-diagram in `containerEl`.
   *
   * @param {HTMLElement} container
   * @param {Object} opts
   * @param {Array<{label,naam,kleur,nu,gewenst}>} opts.profielen
   *        - label: korte tekst in de ellips ("K", "VJ")
   *        - naam: volledige naam ("Koraal", "Via Jeugd")
   *        - kleur: hex string ("#0F4C97")
   *        - nu / gewenst: { A,B,C,D } scores. Als gewenst aanwezig is
   *          tekenen we ook die ellips + pijl van nu → gewenst.
   * @param {number} [opts.width=820]
   */
  function renderOcaiDiagram(container, opts) {
    const W = opts.width || 820;
    const H = Math.round(W * 0.62);   // 8:5 verhouding zoals voorbeeld
    const pad = { l: 90, r: 64, t: 36, b: 60 };
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const cx = pad.l + innerW / 2;
    const cy = pad.t + innerH / 2;

    const toX = (x) => pad.l + (1 + clamp(x, -1, 1)) / 2 * innerW;
    const toY = (y) => pad.t + (1 - clamp(y, -1, 1)) / 2 * innerH;

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('class', 'ocai-svg');
    svg.setAttribute('role', 'img');

    function el(tag, attrs, parent) {
      const e = document.createElementNS(NS, tag);
      for (const k in attrs) {
        if (attrs[k] != null) e.setAttribute(k, String(attrs[k]));
      }
      (parent || svg).appendChild(e);
      return e;
    }

    // ---- 4 kwadranten ----
    const corners = [
      // [x0,y0, breedte, hoogte, kleur, naam, ondertitel]
      [pad.l,             pad.t,             innerW/2, innerH/2, '#D9E7F3', 'FAMILIE',    'mensgericht · informeel'],
      [pad.l + innerW/2,  pad.t,             innerW/2, innerH/2, '#D5E2EF', 'ADHOCRATIE', 'ondernemend · snel'],
      [pad.l,             pad.t + innerH/2,  innerW/2, innerH/2, '#E3ECF6', 'HIËRARCHIE', 'procedureel · geborgd'],
      [pad.l + innerW/2,  pad.t + innerH/2,  innerW/2, innerH/2, '#DDE7F2', 'MARKT',      'resultaat · prestatie'],
    ];
    for (const [x,y,w,h,col,nm,sub] of corners) {
      el('rect', { x:x+4, y:y+4, width:w-8, height:h-8, rx:8, ry:8, fill: col, stroke:'none' });
      el('text', { x:x+w/2, y:y+34, 'text-anchor':'middle', 'font-weight':'700', 'font-size':22, fill:'#15407A', class:'ocai-quad-title' }).textContent = nm;
      el('text', { x:x+w/2, y:y+62, 'text-anchor':'middle', 'font-size':14, fill:'#5A7691', class:'ocai-quad-sub' }).textContent = sub;
    }

    // ---- assen + as-labels ----
    el('line', { x1: pad.l, y1: cy, x2: pad.l + innerW, y2: cy, stroke: '#9DB1C7', 'stroke-width': 1 });
    el('line', { x1: cx, y1: pad.t, x2: cx, y2: pad.t + innerH, stroke: '#9DB1C7', 'stroke-width': 1 });
    // FLEXIBEL boven
    el('text', { x: cx, y: pad.t - 12, 'text-anchor':'middle', 'font-size':14, 'font-weight':'700', 'letter-spacing':2, fill:'#5A7691' }).textContent = 'FLEXIBEL';
    // BEHEERSBAAR onder
    el('text', { x: cx, y: H - 20, 'text-anchor':'middle', 'font-size':14, 'font-weight':'700', 'letter-spacing':2, fill:'#5A7691' }).textContent = 'BEHEERSBAAR';
    // INTERN GERICHT links (verticaal)
    const tl = el('text', { x: 26, y: cy, 'text-anchor':'middle', 'font-size':13, 'font-weight':'700', 'letter-spacing':1.5, fill:'#5A7691', transform: `rotate(-90 26 ${cy})` });
    tl.textContent = 'INTERN GERICHT';
    // EXTERN GERICHT rechts (verticaal)
    const tr = el('text', { x: W - 26, y: cy, 'text-anchor':'middle', 'font-size':13, 'font-weight':'700', 'letter-spacing':1.5, fill:'#5A7691', transform: `rotate(90 ${W-26} ${cy})` });
    tr.textContent = 'EXTERN GERICHT';

    // ---- defs voor pijlpunten per kleur ----
    const defs = el('defs', {});
    const arrowIds = {};
    for (const pr of opts.profielen) {
      const id = 'arr-' + pr.label.toLowerCase().replace(/[^a-z]/g,'') + '-' + pr.kleur.replace('#','');
      arrowIds[pr.label] = id;
      const m = el('marker', {
        id, viewBox: '0 0 12 12', refX: 9, refY: 6, markerWidth: 9, markerHeight: 9,
        orient: 'auto-start-reverse',
      }, defs);
      el('path', { d: 'M 0 0 L 12 6 L 0 12 z', fill: pr.kleur }, m);
    }

    // ---- ellipsen + pijlen per organisatie ----
    const Rx = 32, Ry = 22;
    for (const pr of opts.profielen) {
      const nuPos = position(pr.nu);
      const wensPos = position(pr.gewenst);
      const nuPt  = nuPos  ? { x: toX(nuPos.x),  y: toY(nuPos.y)  } : null;
      const wenPt = wensPos ? { x: toX(wensPos.x), y: toY(wensPos.y) } : null;

      // Pijl van nu → gewenst (eerst, zodat ellipsen er overheen liggen)
      if (nuPt && wenPt) {
        // Verschuif start/eind iets in pijl-richting om niet binnen ellipsen te beginnen
        const dx = wenPt.x - nuPt.x;
        const dy = wenPt.y - nuPt.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const sx = nuPt.x  + ux * (Rx + 2);
        const sy = nuPt.y  + uy * (Ry + 2);
        const ex = wenPt.x - ux * (Rx + 6);
        const ey = wenPt.y - uy * (Ry + 6);
        el('line', {
          x1: sx, y1: sy, x2: ex, y2: ey,
          stroke: pr.kleur, 'stroke-width': 2.2,
          'marker-end': `url(#${arrowIds[pr.label]})`,
        });
      }

      // "Nu"-ellips (gevuld)
      if (nuPt) {
        el('ellipse', {
          cx: nuPt.x, cy: nuPt.y, rx: Rx, ry: Ry,
          fill: pr.kleur, stroke: '#FFF', 'stroke-width': 2,
        });
        const t = el('text', {
          x: nuPt.x, y: nuPt.y + 6, 'text-anchor':'middle',
          'font-size': 16, 'font-weight':'700', fill:'#FFF',
        });
        t.textContent = pr.label;

        // Naam-label links of rechts van de ellips
        const labelLeft = nuPt.x > pad.l + innerW * 0.55;
        const labelX = labelLeft ? nuPt.x - Rx - 8 : nuPt.x + Rx + 8;
        const t2 = el('text', {
          x: labelX, y: nuPt.y + 5, 'text-anchor': labelLeft ? 'end' : 'start',
          'font-size': 14, 'font-weight':'700', fill: pr.kleur,
        });
        t2.textContent = pr.naam;
      }

      // "Gewenst"-ellips (witte vulling, gekleurd randje, label "gewenst")
      if (wenPt) {
        el('ellipse', {
          cx: wenPt.x, cy: wenPt.y, rx: Rx, ry: Ry,
          fill: '#FFFFFF', stroke: pr.kleur, 'stroke-width': 2.5,
        });
        const t = el('text', {
          x: wenPt.x, y: wenPt.y + 6, 'text-anchor':'middle',
          'font-size': 13, 'font-weight':'700', fill: pr.kleur,
        });
        t.textContent = pr.label;

        // "gewenst"-mini-label boven de ellips
        const t2 = el('text', {
          x: wenPt.x, y: wenPt.y - Ry - 6, 'text-anchor': 'middle',
          'font-size': 11, 'font-style': 'italic', fill: pr.kleur,
        });
        t2.textContent = 'gewenst';
      }
    }

    container.innerHTML = '';
    container.appendChild(svg);
  }

  global.OcaiDiagram = { render: renderOcaiDiagram, position: position };
})(window);
