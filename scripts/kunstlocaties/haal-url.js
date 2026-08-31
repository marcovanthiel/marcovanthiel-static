#!/usr/bin/env node
/* Haalt één specifieke beeld-URL op voor een locatie en schrijft foto + credit,
   voor de gevallen waarin de og:image-strategie het verkeerde beeld kiest en je
   na visuele schouw zelf een beeld van de eigen website hebt aangewezen.

   Draaien:  node haal-url.js <id> <beeld-url-of-lokaal-pad> <bronpagina>
   Voorbeeld: node haal-url.js FR-29 https://…/gebouw.jpg https://fondationblachere.org/le-lieu
   Een lokaal pad in plaats van een URL mag ook (bv. een schermafdruk van een
   site die hotlinks blokkeert); de bronpagina bepaalt dan nog steeds de credit.

   Zelfde uitvoerregels als fetch-webfotos.js: 760 px webp in
   static/kunstlocaties/foto/, credit (maker = domein van de bronpagina,
   licentie = "website van de locatie") in assets/fotos.js. */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const HIER = __dirname;
const SITE = path.join(HIER, '..', '..', 'static', 'kunstlocaties');
const FOTO_DIR = path.join(SITE, 'foto');
const FOTOS_JS = path.join(SITE, 'assets', 'fotos.js');
const DATA_JS = path.join(SITE, 'assets', 'data.js');
const BREEDTE = 760;
const KWALITEIT = 78;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const [id, beeldUrl, bronPagina] = process.argv.slice(2);
if (!id || !beeldUrl || !bronPagina) {
  console.error('gebruik: node haal-url.js <id> <beeld-url> <bronpagina>');
  process.exit(1);
}

function lees(bestand) {
  const window = {};
  new Function('window', fs.readFileSync(bestand, 'utf8'))(window);
  return window;
}

(async () => {
  const data = lees(DATA_JS).KUNSTLOCATIES;
  if (!data.some(e => e.id === id)) throw new Error('onbekend catalogusnummer: ' + id);
  const fotos = lees(FOTOS_JS).KUNSTFOTOS || {};

  let buf;
  if (/^https?:\/\//.test(beeldUrl)) {
    const r = await fetch(beeldUrl, { headers: { 'User-Agent': UA, 'Accept': 'image/*', 'Referer': bronPagina } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    buf = fs.readFileSync(beeldUrl);
  }
  const meta = await sharp(buf).metadata();
  if (!meta.width || meta.width < 480) throw new Error('te klein (' + meta.width + 'px)');

  await sharp(buf).resize({ width: BREEDTE, withoutEnlargement: true })
    .webp({ quality: KWALITEIT }).toFile(path.join(FOTO_DIR, id + '.webp'));

  fotos[id] = {
    f: id + '.webp',
    maker: new URL(bronPagina).hostname.replace(/^www\./, ''),
    licentie: 'website van de locatie',
    bron: bronPagina,
  };
  fs.writeFileSync(FOTOS_JS,
    '/* Gegenereerd door scripts/kunstlocaties/fetch-webfotos.js (promobeeld van de\n'
    + '   eigen website per locatie) — niet met de hand bewerken.\n'
    + '   Per catalogusnummer: bestand, maker, licentie en bronpagina. */\n'
    + 'window.KUNSTFOTOS = ' + JSON.stringify(fotos, null, 0) + ';\n');
  console.log(`${id}: ${meta.width}×${meta.height} → foto/${id}.webp (bron ${fotos[id].maker})`);
})().catch(e => { console.error(id + ': ' + e.message); process.exit(1); });
