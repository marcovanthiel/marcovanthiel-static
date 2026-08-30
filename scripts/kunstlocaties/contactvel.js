#!/usr/bin/env node
/* Bouwt een contactvel van alle foto's van /kunstlocaties, zodat je in één blik
   kunt zien of elke foto bij zijn locatie hoort.

   Draaien:  node contactvel.js
   Uitvoer:  scripts/kunstlocaties/contactvel.html  (open in een browser)

   Geen afhankelijkheden, geen netwerk — werkt dus ook in een sandbox. */

const fs = require('fs');
const path = require('path');

const HIER = __dirname;
const SITE = path.join(HIER, '..', '..', 'static', 'kunstlocaties');
const UIT = path.join(HIER, 'contactvel.html');

function lees(bestand, sleutel) {
  const t = fs.readFileSync(bestand, 'utf8');
  const s = t.indexOf(sleutel);
  const open = sleutel.endsWith('KUNSTFOTOS') ? '{' : '[';
  const dicht = open === '{' ? '}' : ']';
  return JSON.parse(t.slice(t.indexOf(open, s), t.lastIndexOf(dicht) + 1));
}

const data = lees(path.join(SITE, 'assets', 'data.js'), 'window.KUNSTLOCATIES');
const fotos = lees(path.join(SITE, 'assets', 'fotos.js'), 'window.KUNSTFOTOS');

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const perLand = {};
data.forEach(e => (perLand[e.land] = perLand[e.land] || []).push(e));

let met = 0, zonder = [];
const secties = Object.keys(perLand).map(land => {
  const kaartjes = perLand[land].map(e => {
    const f = fotos[e.id];
    if (f) met++; else zonder.push(e.id + '  ' + e.n);
    const beeld = f
      ? `<img src="../../static/kunstlocaties/foto/${esc(f.f)}" alt="${esc(e.n)}" loading="lazy">`
      : `<div class="leeg">geen foto</div>`;
    const bron = f ? esc(f.maker || '') : '';
    return `<figure${f ? '' : ' class="mist"'}>
      ${beeld}
      <figcaption><b>${esc(e.id)}</b> ${esc(e.n)}<br><span>${esc(e.p)}${bron ? ' · ' + bron : ''}</span></figcaption>
    </figure>`;
  }).join('\n');
  return `<h2>${esc(land)} <em>${perLand[land].length}</em></h2>\n<div class="vel">${kaartjes}</div>`;
}).join('\n');

fs.writeFileSync(UIT, `<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<title>Contactvel — kunstlocaties</title>
<style>
 body{margin:0;background:#0E0E0D;color:#D8D5CC;font:14px/1.5 ui-monospace,Menlo,monospace;padding:24px}
 h1{font-size:20px;color:#F0F0EA;margin:0 0 4px;letter-spacing:.04em}
 .stand{color:#D63B12;margin:0 0 24px;font-size:12px}
 h2{font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:#D63B12;
    border-bottom:1px solid #3A3730;padding-bottom:5px;margin:34px 0 14px}
 h2 em{float:right;font-style:normal;color:#7A776E;letter-spacing:.1em}
 .vel{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
 figure{margin:0}
 figure img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;border:1px solid #3A3730;background:#080807}
 figure.mist img,.leeg{border:1px dashed #D63B12}
 .leeg{width:100%;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;
       color:#7A776E;font-size:11px;letter-spacing:.16em;text-transform:uppercase}
 figcaption{font-size:11px;line-height:1.45;margin-top:6px;color:#A8A49A}
 figcaption b{color:#D63B12;letter-spacing:.1em}
 figcaption span{color:#7A776E}
</style></head><body>
<h1>Contactvel — kunstlocaties</h1>
<p class="stand">${met} van de ${data.length} met foto · ${data.length - met} zonder · gemaakt ${new Date().toISOString().slice(0, 16).replace('T', ' ')}</p>
${secties}
</body></html>
`);

console.log(`contactvel.html geschreven — ${met} van de ${data.length} met foto`);
if (zonder.length) console.log('zonder foto:\n  ' + zonder.join('\n  '));
