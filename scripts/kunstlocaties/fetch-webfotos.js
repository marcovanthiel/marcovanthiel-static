/* Haalt per locatie een promobeeld van de EIGEN website (veld u in data.js).
   Aanpak: het og:image van de site — dat is de foto die de locatie zelf als
   visitekaartje kiest. Terugvalvolgorde: og:image(:secure_url) → twitter:image
   → link rel=image_src → grootste <img> op de pagina die echt beeld is.

   Uitvoer (zelfde structuur als fetch-fotos.js):
     static/kunstlocaties/foto/<id>.webp        760 px breed
     static/kunstlocaties/assets/fotos.js       window.KUNSTFOTOS met credits
     scripts/kunstlocaties/foto-web-rapport.laatste-run.md  wat deze run vond
   (het gecureerde foto-web-rapport.md wordt met de hand bijgehouden en door
   dit script met rust gelaten)

   Credits: maker = domein van de site, licentie = "website van de locatie",
   bron = de pagina waar het beeld vandaan komt (conform de beeldregel:
   promobeeld van een aanbevolen partij mag, met credit en link).

   Eigen foto's in foto-bron/<id>.jpg gaan altijd vóór (zelfde regel als
   fetch-fotos.js); bestaande entries blijven staan tenzij --force.

   Draaien:  node fetch-webfotos.js [--only=IT-01,FR-02] [--force] [--dry]  */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const HIER = __dirname;
const SITE = path.join(HIER, '..', '..', 'static', 'kunstlocaties');
const FOTO_DIR = path.join(SITE, 'foto');
const FOTOS_JS = path.join(SITE, 'assets', 'fotos.js');
const DATA_JS = path.join(SITE, 'assets', 'data.js');
const BRON_DIR = path.join(HIER, 'foto-bron');
const RAPPORT = path.join(HIER, 'foto-web-rapport.laatste-run.md');
const BREEDTE = 760;
const KWALITEIT = 78;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const PARALLEL = 8;

const args = process.argv.slice(2);
const force = args.includes('--force');
const dry = args.includes('--dry');
const alleen = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '')
  .split(',').filter(Boolean);

function leesData() {
  const src = fs.readFileSync(DATA_JS, 'utf8');
  const window = {};
  new Function('window', src)(window);
  return window.KUNSTLOCATIES;
}
function leesFotos() {
  if (!fs.existsSync(FOTOS_JS)) return {};
  const window = {};
  new Function('window', fs.readFileSync(FOTOS_JS, 'utf8'))(window);
  return window.KUNSTFOTOS || {};
}

async function haal(url, asBuffer, redirects = 5) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, {
      signal: ctl.signal, redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept': asBuffer ? 'image/*' : 'text/html,*/*;q=.8', 'Accept-Language': 'en,nl;q=.8' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return asBuffer
      ? { buf: Buffer.from(await r.arrayBuffer()), url: r.url, type: r.headers.get('content-type') || '' }
      : { tekst: await r.text(), url: r.url };
  } finally { clearTimeout(t); }
}

function attr(tag, naam) {
  const m = tag.match(new RegExp(naam + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
  return m ? (m[2] ?? m[3]) : null;
}

/* kandidaat-afbeeldings-URL's uit de HTML, in volgorde van vertrouwen */
function kandidaten(html, basis) {
  const uit = [];
  const metas = html.match(/<meta[^>]+>/gi) || [];
  for (const naam of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) {
    for (const m of metas) {
      const p = attr(m, 'property') || attr(m, 'name');
      if (p && p.toLowerCase() === naam) {
        const c = attr(m, 'content');
        if (c) uit.push(c);
      }
    }
  }
  for (const l of html.match(/<link[^>]+>/gi) || []) {
    if ((attr(l, 'rel') || '').toLowerCase() === 'image_src') {
      const h = attr(l, 'href');
      if (h) uit.push(h);
    }
  }
  // laatste redmiddel: img-tags, grofweg de eerste flinke niet-logo
  for (const img of (html.match(/<img[^>]+>/gi) || []).slice(0, 60)) {
    const src = attr(img, 'src') || attr(img, 'data-src');
    if (!src || /logo|icon|sprite|avatar|\.svg(\?|$)|data:/i.test(src)) continue;
    uit.push(src);
  }
  const abs = [];
  for (const u of uit) {
    try { abs.push(new URL(u, basis).href); } catch { /* kapotte url */ }
  }
  return [...new Set(abs)];
}

async function probeerBeeld(url) {
  const { buf, type } = await haal(url, true);
  if (!/image\/(jpe?g|png|webp|avif|gif)/i.test(type) && !/\.(jpe?g|png|webp)(\?|$)/i.test(url)) {
    throw new Error('geen beeld (' + type + ')');
  }
  const meta = await sharp(buf).metadata();
  if (!meta.width || meta.width < 480) throw new Error('te klein (' + meta.width + 'px)');
  const ratio = meta.width / meta.height;
  if (ratio > 4 || ratio < 0.35) throw new Error('bannerformaat (' + ratio.toFixed(1) + ')');
  return buf;
}

async function verwerk(e, uit, log) {
  if (uit[e.id] && !force) { log.al.push(e.id); return; }
  // eigen foto gaat voor
  for (const ext of ['jpg', 'jpeg', 'png', 'heic', 'webp']) {
    const eigen = path.join(BRON_DIR, e.id + '.' + ext);
    if (fs.existsSync(eigen)) {
      if (!dry) {
        await sharp(fs.readFileSync(eigen)).rotate().resize({ width: BREEDTE, withoutEnlargement: true })
          .webp({ quality: KWALITEIT }).toFile(path.join(FOTO_DIR, e.id + '.webp'));
        uit[e.id] = { f: e.id + '.webp', maker: 'Marco van Thiel', licentie: 'eigen foto', bron: '' };
      }
      log.eigen.push(e.id);
      return;
    }
  }
  if (!e.u) { log.mis.push(`${e.id} ${e.n} — geen website in data.js`); return; }
  let html, basis;
  try {
    const r = await haal(e.u, false);
    html = r.tekst; basis = r.url;
  } catch (err) {
    log.mis.push(`${e.id} ${e.n} — site onbereikbaar: ${err.message} (${e.u})`);
    return;
  }
  const lijst = kandidaten(html, basis);
  for (const kand of lijst.slice(0, 8)) {
    try {
      const buf = await probeerBeeld(kand);
      if (!dry) {
        await sharp(buf).rotate().resize({ width: BREEDTE, withoutEnlargement: true })
          .webp({ quality: KWALITEIT }).toFile(path.join(FOTO_DIR, e.id + '.webp'));
        uit[e.id] = {
          f: e.id + '.webp',
          maker: new URL(basis).hostname.replace(/^www\./, ''),
          licentie: 'website van de locatie',
          bron: basis,
        };
      }
      log.ok.push(`${e.id} ${e.n} — ${kand}`);
      return;
    } catch { /* volgende kandidaat */ }
  }
  log.mis.push(`${e.id} ${e.n} — geen bruikbaar beeld op ${basis} (${lijst.length} kandidaten)`);
}

(async () => {
  const data = leesData().filter(e => !alleen.length || alleen.includes(e.id));
  const uit = leesFotos();
  const log = { ok: [], mis: [], eigen: [], al: [] };
  fs.mkdirSync(FOTO_DIR, { recursive: true });
  let i = 0;
  async function werker() {
    while (i < data.length) {
      const e = data[i++];
      try { await verwerk(e, uit, log); }
      catch (err) { log.mis.push(`${e.id} ${e.n} — onverwacht: ${err.message}`); }
      process.stdout.write(`\r${i}/${data.length}  (ok ${log.ok.length}, mis ${log.mis.length})   `);
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, werker));
  console.log();
  if (!dry) {
    fs.writeFileSync(FOTOS_JS,
      '/* Gegenereerd door scripts/kunstlocaties/fetch-webfotos.js (promobeeld van de\n'
      + '   eigen website per locatie) — niet met de hand bewerken.\n'
      + '   Per catalogusnummer: bestand, maker, licentie en bronpagina. */\n'
      + 'window.KUNSTFOTOS = ' + JSON.stringify(uit, null, 0) + ';\n');
  }
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  fs.writeFileSync(RAPPORT,
    `# Foto-web-rapport — laatste run\n\nGedraaid: ${stamp}\n\n`
    + `**${Object.keys(uit).length} van de ${leesData().length} locaties heeft een foto.**\n\n`
    + (log.eigen.length ? `## Eigen foto's (${log.eigen.length})\n\n${log.eigen.map(s => '- ' + s).join('\n')}\n\n` : '')
    + `## Deze ronde van de eigen website (${log.ok.length})\n\n${log.ok.map(s => '- ' + s).join('\n') || '- geen'}\n\n`
    + `## Nog zonder foto (${log.mis.length})\n\n${log.mis.map(s => '- ' + s).join('\n') || '- geen'}\n`);
  console.log(`Klaar: ${log.ok.length} opgehaald, ${log.al.length} stonden er al, ${log.mis.length} mislukt. Zie foto-web-rapport.laatste-run.md`);
})();
