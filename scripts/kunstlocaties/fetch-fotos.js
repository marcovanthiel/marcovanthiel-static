#!/usr/bin/env node
/* Zoekt per locatie één vrij te gebruiken foto op Wikipedia / Wikimedia Commons,
   verkleint hem en schrijft de credits weg.

   DRAAIEN OP JE EIGEN MAC, niet in een sandbox:
     cd scripts/kunstlocaties && npm install && node fetch-fotos.js
   Opties:  --only=IT-34,FR-01   alleen deze catalogusnummers
            --force              ook opnieuw ophalen wat er al staat
            --dry                niets downloaden, alleen rapporteren

   Uitvoer:
     static/kunstlocaties/foto/<id>.webp     de foto's (760 px breed)
     static/kunstlocaties/assets/fotos.js    window.KUNSTFOTOS met de credits
     scripts/kunstlocaties/foto-rapport.md   wat gevonden is en wat niet

   Eigen foto's gaan vóór: zet een bestand als foto-bron/<id>.jpg (of .png/.heic)
   neer en het script gebruikt die, met jou als maker.

   Voorzichtig met wat er binnenkomt: alleen vrije licenties worden aanvaard, en
   een treffer telt alleen als de naam van de locatie ook echt in de titel van de
   pagina of het bestand voorkomt. Liever geen foto dan de verkeerde. */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(ROOT, 'static/kunstlocaties/assets/data.js');
const FOTO_DIR = path.join(ROOT, 'static/kunstlocaties/foto');
const FOTO_JS = path.join(ROOT, 'static/kunstlocaties/assets/fotos.js');
const RAPPORT = path.join(__dirname, 'foto-rapport.md');
const EIGEN = path.join(__dirname, 'foto-bron');

const UA = 'kunstlocaties/1.0 (https://marcovanthiel.nl/kunstlocaties/; marco@marcovanthiel.nl)';
const BREEDTE = 760, KWALITEIT = 74;

const args = process.argv.slice(2);
const alleen = (args.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const force = args.includes('--force');
const dry = args.includes('--dry');

const TAAL = { 'Italië': 'it', 'Frankrijk': 'fr', 'Spanje': 'es', 'Portugal': 'pt',
  'Zwitserland': 'de', 'Liechtenstein': 'de', 'Oostenrijk': 'de', 'Duitsland': 'de',
  'België': 'nl', 'Luxemburg': 'fr', 'Tsjechië': 'cs' };

/* Alleen deze licenties. Alles wat hier niet in staat wordt geweigerd, ook als
   het er vrij uitziet — "no known copyright restrictions" is geen licentie. */
const VRIJ = [/^cc0/i, /^public domain/i, /^pd/i, /^cc[- ]by(-sa)?([- ]\d)?/i,
              /^attribution/i, /^gfdl/i, /^fal$/i];

const slaap = ms => new Promise(r => setTimeout(r, ms));

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return r.json();
}

function normaliseer(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
/* Woorden die niets onderscheiden — die mogen een treffer niet dragen. */
const RUIS = new Set(('de het een en van der di del della museo museum fondazione fondation stiftung '
  + 'foundation collezione collection casa maison haus park parco jardin giardino garten garden '
  + 'centre center centro kunst arte art skulpturen sculpture chateau castello schloss villa palazzo '
  + 'en la le les il lo gli i el los las o a').split(' '));

function kernwoorden(naam) {
  return normaliseer(naam).split(' ').filter(w => w.length > 3 && !RUIS.has(w));
}
/* Een treffer telt alleen als minstens één kernwoord uit de naam terugkomt. */
function klopt(naam, titel) {
  const kern = kernwoorden(naam);
  if (!kern.length) return false;
  const t = normaliseer(titel);
  return kern.some(w => t.includes(w));
}

function vrijeLicentie(meta) {
  const l = (meta && meta.LicenseShortName && meta.LicenseShortName.value) || '';
  return VRIJ.some(re => re.test(l.trim())) ? l.trim() : null;
}
function schoon(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

async function viaWikipedia(taal, naam) {
  const u = `https://${taal}.wikipedia.org/w/api.php?action=query&format=json&formatversion=2`
    + `&generator=search&gsrsearch=${encodeURIComponent(naam)}&gsrlimit=3`
    + `&prop=pageimages|info&piprop=original&inprop=url`;
  const d = await json(u);
  const pages = (d.query && d.query.pages) || [];
  for (const p of pages) {
    if (!p.original || !klopt(naam, p.title)) continue;
    const bestand = decodeURIComponent(p.original.source.split('/').pop());
    return { bestand, bron: p.fullurl, via: taal + '.wikipedia' };
  }
  return null;
}

async function viaCommons(zoek, naam) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2'
    + `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(zoek)}&gsrlimit=8`
    + '&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=1400';
  const d = await json(u);
  const pages = (d.query && d.query.pages) || [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || '')) continue;
    if (!klopt(naam, p.title)) continue;
    const lic = vrijeLicentie(ii.extmetadata);
    if (!lic) continue;
    return {
      url: ii.thumburl || ii.url,
      licentie: lic,
      licentieUrl: (ii.extmetadata.LicenseUrl && ii.extmetadata.LicenseUrl.value) || '',
      maker: schoon(ii.extmetadata.Artist && ii.extmetadata.Artist.value) || 'onbekend',
      bron: ii.descriptionurl,
      via: 'commons'
    };
  }
  return null;
}

async function bestandsInfo(bestand) {
  const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2'
    + `&titles=${encodeURIComponent('File:' + bestand)}`
    + '&prop=imageinfo&iiprop=extmetadata|url|mime&iiurlwidth=1400';
  const d = await json(u);
  const p = ((d.query && d.query.pages) || [])[0];
  const ii = p && p.imageinfo && p.imageinfo[0];
  if (!ii) return null;
  const lic = vrijeLicentie(ii.extmetadata);
  if (!lic) return null;
  return {
    url: ii.thumburl || ii.url,
    licentie: lic,
    licentieUrl: (ii.extmetadata.LicenseUrl && ii.extmetadata.LicenseUrl.value) || '',
    maker: schoon(ii.extmetadata.Artist && ii.extmetadata.Artist.value) || 'onbekend',
    bron: ii.descriptionurl
  };
}

async function schrijfFoto(bron, doel) {
  let buf;
  if (Buffer.isBuffer(bron)) buf = bron;
  else {
    const r = await fetch(bron, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('download ' + r.status);
    buf = Buffer.from(await r.arrayBuffer());
  }
  await sharp(buf).rotate().resize({ width: BREEDTE, withoutEnlargement: true })
    .webp({ quality: KWALITEIT }).toFile(doel);
  return fs.statSync(doel).size;
}

(async () => {
  const raw = fs.readFileSync(DATA, 'utf8');
  const start = raw.indexOf('window.KUNSTLOCATIES');
  const data = JSON.parse(raw.slice(raw.indexOf('[', start), raw.lastIndexOf(']') + 1));
  fs.mkdirSync(FOTO_DIR, { recursive: true });

  const bestaand = fs.existsSync(FOTO_JS)
    ? JSON.parse(fs.readFileSync(FOTO_JS, 'utf8').replace(/^[\s\S]*?=\s*/, '').replace(/;\s*$/, ''))
    : {};
  const uit = force ? {} : Object.assign({}, bestaand);
  const gevonden = [], gemist = [], eigen = [];

  for (const e of data) {
    if (alleen.length && !alleen.includes(e.id)) continue;
    if (uit[e.id] && !force) continue;

    // 1. eigen foto gaat voor
    const eigenBestand = ['jpg', 'jpeg', 'png', 'heic', 'webp']
      .map(ext => path.join(EIGEN, e.id + '.' + ext)).find(p => fs.existsSync(p));
    if (eigenBestand) {
      if (!dry) {
        const kb = await schrijfFoto(fs.readFileSync(eigenBestand), path.join(FOTO_DIR, e.id + '.webp'));
        uit[e.id] = { f: e.id + '.webp', maker: 'Marco van Thiel', licentie: 'eigen foto', bron: '' };
        eigen.push(`${e.id}  ${e.n}  (${Math.round(kb / 1024)} kB)`);
      }
      continue;
    }

    // 2. Wikipedia in de taal van het land, dan Nederlands, dan Engels
    const talen = [TAAL[e.land], 'nl', 'en'].filter((v, i, a) => v && a.indexOf(v) === i);
    let info = null, herkomst = '';
    for (const taal of talen) {
      try {
        const t = await viaWikipedia(taal, e.n);
        await slaap(220);
        if (t) { const i = await bestandsInfo(t.bestand); await slaap(220);
                 if (i) { info = i; herkomst = t.via; break; } }
      } catch (err) { /* volgende taal */ }
    }
    // 3. Commons, eerst op naam, dan op naam + plaats
    if (!info) {
      for (const q of [e.n, e.n + ' ' + e.p]) {
        try { const c = await viaCommons(q, e.n); await slaap(220);
              if (c) { info = c; herkomst = 'commons'; break; } }
        catch (err) { /* volgende poging */ }
      }
    }

    if (!info) { gemist.push(`${e.id}  ${e.n}  (${e.p}, ${e.land})`); continue; }

    if (dry) { gevonden.push(`${e.id}  ${e.n}  ← ${herkomst}  ${info.licentie}`); continue; }
    try {
      const kb = await schrijfFoto(info.url, path.join(FOTO_DIR, e.id + '.webp'));
      uit[e.id] = { f: e.id + '.webp', maker: info.maker, licentie: info.licentie,
                    licentieUrl: info.licentieUrl, bron: info.bron };
      gevonden.push(`${e.id}  ${e.n}  ← ${herkomst}  ${info.licentie}  (${Math.round(kb / 1024)} kB)`);
    } catch (err) { gemist.push(`${e.id}  ${e.n}  — download mislukt: ${err.message}`); }
    process.stdout.write(`\r${gevonden.length + eigen.length} gevonden, ${gemist.length} niet   `);
  }

  if (!dry) {
    fs.writeFileSync(FOTO_JS,
      '/* Gegenereerd door scripts/kunstlocaties/fetch-fotos.js — niet met de hand bewerken.\n'
      + '   Per catalogusnummer: bestand, maker, licentie en bronpagina. */\n'
      + 'window.KUNSTFOTOS = ' + JSON.stringify(uit, null, 0) + ';\n');
  }
  const totaal = data.filter(e => !alleen.length || alleen.includes(e.id)).length;
  const dekking = Object.keys(uit).length;
  fs.writeFileSync(RAPPORT,
    `# Fotorapport\n\nGedraaid: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}\n\n`
    + `**${dekking} van de ${data.length} locaties heeft een foto.**\n\n`
    + (eigen.length ? `## Eigen foto's (${eigen.length})\n\n${eigen.map(s => '- ' + s).join('\n')}\n\n` : '')
    + `## Deze ronde gevonden (${gevonden.length})\n\n${gevonden.map(s => '- ' + s).join('\n') || '- geen'}\n\n`
    + `## Nog zonder foto (${gemist.length})\n\n`
    + `Zet er zelf een neer als \`scripts/kunstlocaties/foto-bron/<nummer>.jpg\` en draai het script opnieuw.\n\n`
    + `${gemist.map(s => '- ' + s).join('\n') || '- geen'}\n`);

  console.log(`\n\n${dekking} van de ${data.length} locaties heeft nu een foto.`);
  console.log(`Deze ronde: ${gevonden.length + eigen.length} gevonden, ${gemist.length} niet gevonden.`);
  console.log(`Rapport: scripts/kunstlocaties/foto-rapport.md`);
  if (dry) console.log('(--dry: er is niets geschreven behalve het rapport)');
})().catch(err => { console.error('\nAfgebroken:', err.message); process.exit(1); });
