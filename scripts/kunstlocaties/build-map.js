/* Bouwt static/kunstlocaties/assets/mapdata.js uit Natural Earth (world-atlas)
   en de coördinaten in assets/data.js.

   Draaien:  cd scripts/kunstlocaties && npm install && node build-map.js
   Uitvoer:  landsgrenzen als SVG-pad, graticule, geprojecteerde stippen,
             landlabels, zoomkaders per land en de schaal in km per eenheid.
   Projectie: Mercator, venster -11,5..19,5 lengte en 34,8..54,2 breedte,
             uitgerekend naar 1000 eenheden breed. */

const fs = require('fs');
const path = require('path');
const topo = require('world-atlas/countries-50m.json');
const tc = require('topojson-client');
const d3 = require('d3-geo');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'static/kunstlocaties/assets/data.js');
const DST = path.join(ROOT, 'static/kunstlocaties/assets/mapdata.js');

const raw = fs.readFileSync(SRC, 'utf8');
const start = raw.indexOf('window.KUNSTLOCATIES');
const data = JSON.parse(raw.slice(raw.indexOf('[', start), raw.lastIndexOf(']') + 1));

const geo = tc.feature(topo, topo.objects.countries);
const VIEW = { lon: [-11.5, 19.5], lat: [34.8, 54.2] };
const KEEP = { lon: [-14, 24], lat: [32, 58] };
const W = 1000;

const grid = [];
for (let lo = VIEW.lon[0]; lo <= VIEW.lon[1]; lo += 0.5)
  for (let la = VIEW.lat[0]; la <= VIEW.lat[1]; la += 0.5) grid.push([lo, la]);
const mp = { type: 'MultiPoint', coordinates: grid };
let P = d3.geoMercator().fitWidth(W, mp);
const H = Math.round(P([0, VIEW.lat[0]])[1] - P([0, VIEW.lat[1]])[1]);
P = d3.geoMercator().fitExtent([[0, 0], [W, H]], mp);

function inKeep(f) {
  let hit = false;
  d3.geoStream(f, { point(x, y) {
    if (x >= KEEP.lon[0] && x <= KEEP.lon[1] && y >= KEEP.lat[0] && y <= KEEP.lat[1]) hit = true;
  }, lineStart(){}, lineEnd(){}, polygonStart(){}, polygonEnd(){} });
  return hit;
}
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (Math.sqrt(maxD) > tol) return dp(pts.slice(0, idx + 1), tol).slice(0, -1).concat(dp(pts.slice(idx), tol));
  return [pts[0], pts[pts.length - 1]];
}
const area = p => { let a = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j][0]*p[i][1] - p[i][0]*p[j][1]; return Math.abs(a / 2); };

function pathFor(f, tol, minArea) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const out = [];
  polys.forEach(poly => poly.forEach(ring => {
    let pts = ring.map(c => P(c)).filter(p => p && isFinite(p[0]) && isFinite(p[1]));
    if (pts.length < 4) return;
    pts = dp(pts, tol);
    if (pts.length < 4 || area(pts) < minArea) return;
    out.push('M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z');
  }));
  return out.join('');
}

const SCOPE = ['Italy','France','Spain','Portugal','Switzerland','Liechtenstein',
               'Austria','Germany','Belgium','Luxembourg','Czechia'];
const isScope = n => SCOPE.indexOf(n) > -1;

const countries = geo.features.filter(inKeep).map(f => ({
  n: f.properties.name,
  s: isScope(f.properties.name) ? 1 : 0,
  d: pathFor(f, isScope(f.properties.name) ? 0.45 : 0.9, isScope(f.properties.name) ? 1.2 : 6)
})).filter(f => f.d);

const graticule = d3.geoPath(P)(
  d3.geoGraticule().step([5, 5]).extent([[KEEP.lon[0], KEEP.lat[0]], [KEEP.lon[1], KEEP.lat[1]]])()
).replace(/(-?\d+\.\d+)/g, m => (+m).toFixed(1));

const pts = data.map(e => { const p = P(e.ll); return [+p[0].toFixed(1), +p[1].toFixed(1)]; });

/* Labels op de hand gezet: de zwaartepunten van Natural Earth kloppen niet
   voor landen met overzeese gebieden (Frankrijk, Spanje, Portugal). */
const LABELS = [
  ['Portugal',    -8.20, 39.60, 1], ['Spanje',       -3.90, 40.30, 1],
  ['Frankrijk',    2.30, 47.30, 1], ['België',        4.15, 50.58, 1],
  ['Luxemburg',    6.15, 49.72, 1], ['Duitsland',    10.40, 51.45, 1],
  ['Tsjechië',    15.40, 49.90, 1], ['Oostenrijk',   14.30, 47.55, 1],
  ['Zwitserland',  7.35, 46.55, 1], ['Italië',       14.05, 41.95, 1],
  ['Nederland',    5.65, 52.60, 0], ['Polen',        19.20, 52.00, 0],
  ['Slowakije',   19.50, 48.75, 0], ['Hongarije',    19.30, 46.95, 0],
  ['Slovenië',    14.95, 46.05, 0], ['Kroatië',      16.40, 45.20, 0],
  ['Marokko',     -6.00, 33.40, 0], ['Algerije',      2.00, 34.40, 0],
  ['Tunesië',      9.60, 35.40, 0], ['Ierland',      -8.00, 53.30, 0],
  ['Verenigd Koninkrijk', -2.40, 52.80, 0]
];
const labels = LABELS.map(function (l) {
  const p = P([l[1], l[2]]);
  return { t: l[0], x: +p[0].toFixed(1), y: +p[1].toFixed(1), s: l[3] };
}).filter(function (l) { return l.x > -60 && l.x < W + 60 && l.y > -60 && l.y < H + 60; });

// Zoomkader per land: op de eigen locaties, niet op de landsgrens — dat zoomt
// strakker in op waar het om gaat.
const boxes = {};
data.forEach((e, i) => {
  const b = boxes[e.land] || (boxes[e.land] = [1e9, 1e9, -1e9, -1e9]);
  b[0] = Math.min(b[0], pts[i][0]); b[1] = Math.min(b[1], pts[i][1]);
  b[2] = Math.max(b[2], pts[i][0]); b[3] = Math.max(b[3], pts[i][1]);
});

const midLat = (VIEW.lat[0] + VIEW.lat[1]) / 2;
const a = P([0, midLat]), b = P([1, midLat]);
const kmPerUnit = +((111.32 * Math.cos(midLat * Math.PI / 180)) / (b[0] - a[0])).toFixed(4);

const out = { W, H, kmPerUnit, countries, graticule, pts, labels, boxes };
fs.writeFileSync(DST,
  '/* Gegenereerd door scripts/kunstlocaties/build-map.js — niet met de hand bewerken. */\n' +
  'window.KAARTDATA = ' + JSON.stringify(out) + ';\n');
console.log('mapdata.js geschreven:', (fs.statSync(DST).size / 1024).toFixed(0) + ' kB',
            '|', countries.length, 'landen |', pts.length, 'stippen |', W + '×' + H);
