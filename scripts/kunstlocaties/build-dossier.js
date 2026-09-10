/* Bouwt het reisdossier `reizen/kunstlocaties-midden-en-zuid-europa.md` uit
   data.js, zodat dossier en site niet uit elkaar lopen. De vaste teksten staan
   hieronder in KOP en STAART; alles daartussen komt uit de dataset.

   Draaien:  node build-dossier.js        (schrijft docs/kunstlocaties-dossier.md)
   Daarna het resultaat in het Claude-project Reizen zetten onder
   reizen/kunstlocaties-midden-en-zuid-europa.md. */

const fs = require('fs'), path = require('path');
const SITE = path.join(__dirname, '..', '..', 'static', 'kunstlocaties');
global.window = {};
eval(fs.readFileSync(path.join(SITE, 'assets', 'data.js'), 'utf8'));
const D = window.KUNSTLOCATIES;

const SEI = { 'jaarrond': 'Jaarrond', 'seizoen': 'Seizoensgebonden',
              'afspraak': 'Alleen op afspraak', 'let op': 'Let op' };
const HO = { 'ja': 'honden welkom', 'nee': 'geen honden', '?': 'honden onbekend' };
const LO = { werk: 'Slapen ín het werk', kunsthotel: 'Kunsthotel',
             terrein: 'Verblijf op het terrein', architectuur: 'Slapen in de architectuur' };

const n = D.length, landen = [...new Set(D.map(e => e.land))];
const kern = D.filter(e => e.kern), logies = D.filter(e => e.lo), arch = D.filter(e => e.arch);
const u = [];

u.push(`# Kunstparken en bijzondere kunstlocaties in Midden- en Zuid-Europa`, '',
`Een verlanglijst van ${n} plekken waar de kunst en de plek niet van elkaar te scheiden zijn: beeldenparken, land art, kunstenaarstuinen en Gesamtkunstwerken, privéverzamelingen in buitengewone gebouwen, kunst in industrieel erfgoed, architectuur die zelf het werk is — en ${logies.length} adressen waar je kunt blijven slapen. Vertrekpunt was het park van Tinguely en Niki de Saint Phalle — dat leidt zowel naar Le Cyclop in Milly-la-Forêt als naar de Giardino dei Tarocchi in Capalbio, en van daaruit naar de hele familie van plekken die er omheen ligt.`, '',
`Gewone stadsmusea staan er niet in, tenzij de locatie zelf uitzonderlijk is. Opgesteld op 28 augustus 2026 in elf landen: Italië, Frankrijk, Spanje, Portugal, Zwitserland, Liechtenstein, Oostenrijk, Duitsland, België, Luxemburg en Tsjechië. Op 10 september 2026 uitgebreid van 217 naar ${n} met logeeradressen en spraakmakende architectuur.`, '',
'Dit bestand wordt gegenereerd uit `static/kunstlocaties/assets/data.js` door `scripts/kunstlocaties/build-dossier.js`. Wijzig de dataset, niet dit bestand.', '', '---', '',
'## Hoe deze lijst te lezen', '',
'Bij elke plek staat wie of wat het is, waarom het bijzonder is, en wat er praktisch aan vastzit. Steeds apart aangegeven:', '',
'- **Seizoen** — jaarrond, seizoensgebonden, alleen op afspraak, of *let op* (status onzeker of momenteel gesloten)',
'- **Honden** — alleen waar het zwart op wit op de officiële site stond; `onbekend` betekent echt onbekend, niet nee',
'- **Logeren** — waar je kunt blijven slapen, in vier categorieën; de volledige uitwerking staat in `kunstlocaties-logeren.md`',
'- **Spraakmakende architectuur** — waar het gebouw zelf de reden is om te gaan, ook als de collectie of het park de hoofdzaak is',
'- **Bron** — de officiële site', '',
'Openingstijden zijn die van 2026 en veranderen; bel bij twijfel, zeker bij de kleine adressen die door één familie worden gerund.', '', '---', '',
'## De kern', '',
`Als de lijst te lang wordt: dit zijn de ${kern.length} die eruit springen.`, '',
'| Plek | Waar | Waarom deze |', '|---|---|---|');
kern.forEach(e => u.push(`| **${e.n}** | ${e.p}, ${e.land} | ${e.x.split('. ')[0].replace(/\.$/, '')} |`));
u.push('', '---', '', '## De volledige lijst', '');

let land = null, reg = null;
D.forEach(e => {
  if (e.land !== land) { land = e.land; reg = null; u.push(`## ${e.land}`, ''); }
  if (e.reg !== reg) { reg = e.reg; u.push(`### ${e.reg}`, ''); }
  const merk = [e.kern ? '⬥' : null, e.arch ? 'spraakmakende architectuur' : null,
                e.lo ? LO[e.lo].toLowerCase() : null].filter(Boolean);
  u.push(`**${e.n}** — ${e.p}${merk.length ? ' · ' + merk.join(' · ') : ''}  `,
         `${e.w}.  `, `${e.x}  `);
  if (e.lo) u.push(`*Logeren* — ${e.low}  `);
  u.push(`*${SEI[e.s]} · ${HO[e.h]}*${e.pr ? ' — ' + e.pr : ''}  `, `<${e.u}>`, '');
});

u.push('---', '', '## Wat je vooraf moet regelen', '',
'**Reservering verplicht** — hier kom je zonder afspraak niet binnen:', '');
D.filter(e => e.s === 'afspraak').forEach(e => u.push(`- ${e.n} (${e.p}, ${e.land})`));
u.push('', '**Alleen in het seizoen open** — bij deze plekken bepaalt de kalender de reis, niet andersom:', '',
  D.filter(e => e.s === 'seizoen').map(e => `${e.n} (${e.p})`).join(', ') + '.', '',
  '**Let op: status onzeker of gesloten** — voor vertrek bellen:', '');
D.filter(e => e.s === 'let op').forEach(e => u.push(`- **${e.n}** (${e.p}) — ${e.pr || 'status niet bevestigd.'}`));

u.push('', '## Logeren', '',
`Bij ${logies.length} van de ${n} plekken kun je blijven slapen. Per categorie: ` +
Object.keys(LO).map(k => `${LO[k].toLowerCase()} ${D.filter(e => e.lo === k).length}`).join(', ') +
`. De volledige uitwerking met zinnen, seizoenen en bronnen staat in \`kunstlocaties-logeren.md\`.`, '',
'## Spraakmakende architectuur', '',
`Bij ${arch.length} van de ${n} is het gebouw zelf de reden om te gaan. Dat staat los van de soortindeling: ook een privécollectie, een beeldenpark of een industriemonument kan de vlag hebben. Op de site is het een eigen filterknop.`, '',
'## Honden', '');
const hja = D.filter(e => e.h === 'ja'), hnee = D.filter(e => e.h === 'nee'), hon = D.filter(e => e.h === '?');
u.push(`Van de ${n} plekken staat bij **${hja.length}** zwart op wit dat honden aangelijnd welkom zijn, bij **${hnee.length}** dat het niet mag of dat het een binnenmuseum is, en bij **${hon.length}** was er niets over te vinden. Die laatste categorie is dus onbekend, niet verboden.`, '',
'Waar het expliciet bevestigd is dat honden mogen:', '', hja.map(e => e.n).join(', ') + '.', '',
'Waar het expliciet niet mag: ' + hnee.map(e => e.n).join(', ') + '.', '');

u.push('## Wat er in 2027 speelt', '',
'Drie dingen die dit jaar niet te zien zijn en volgend jaar wel. Ze vallen alle drie in hetzelfde seizoen, en de mei-reis naar China staat al voor 2027 gepland — dat is een keuze die je vroeg moet maken.', '',
'- **documenta 16** in Kassel', '- **Skulptur Projekte Münster**, de tienjaarlijkse editie',
'- **Bad RagARTz**, de tiende triënnale, 1 mei tot 31 oktober, Bad Ragaz en Vaduz',
'- **Schaulager** in Basel heropent in 2027 met Anri Sala; nu alleen depotrondleidingen', '',
'## Voorbehoud', '',
'Wat hier staat is samengesteld uit officiële sites, waar dat kon geverifieerd, in augustus en september 2026. Drie dingen zijn structureel onzeker: openingstijden van kleine, familiegerunde adressen, het hondenbeleid (dat vrijwel nergens gepubliceerd wordt), en de status van plekken die restaureren of tussen tentoonstellingen zitten. Waar iets niet te bevestigen was, staat dat er in plaats van een gok.', '',
'Onderweg gecorrigeerd: het Museu Coleção Berardo in Lissabon heet sinds 2023 MAC/CCB, het Essl Museum bij Wenen bestaat niet meer onder die naam (de collectie zit bij de Albertina), en de Sammlung Goetz in München is als museumgebouw permanent gesloten.', '');

const uitpad = path.join(__dirname, '..', '..', 'docs', 'kunstlocaties-dossier.md');
fs.writeFileSync(uitpad, u.join('\n'));
console.log('geschreven:', uitpad, '|', n, 'locaties |', (fs.statSync(uitpad).size / 1024).toFixed(0) + ' kB');
