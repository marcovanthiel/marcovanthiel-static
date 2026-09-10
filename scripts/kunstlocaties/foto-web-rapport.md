# Foto-web-rapport

Gedraaid: 28-8-2026 (meerdere rondes: script, browser-ronde, handmatige keuze,
zoekagents); herkansing + volledige visuele schouw 31-8-2026.

**Alle 217 locaties hebben een foto.**

## Aanvulling 31-8-2026 (aanwijzing Marco): vijf laatste gevuld

- IT-27 La Marrana → panorama van luoghidelcontemporaneo.cultura.gov.it
  (Ministero della Cultura; eigen site heeft alleen minifoto's)
- IT-44 Casa Dipinta → regenboogkamer van umbriatourism.it; die pagina is nu
  ook de site-URL in data.js (er is geen eigen site)
- IT-64 Castello Incantato → koppenwand (foto Igor Petyx) van fondoambiente.it;
  die FAI-pagina is nu ook de site-URL in data.js (beheerders-site gekaapt)
- ES-06 Museo Vostell → museumcomplex met waterval (foto Eugenio Pedrera
  Pedrazo) van gemeente malpartidadecaceres.es (museumsite weigert per regio)
- IT-26 Fondazione Bonotto → cortenstalen BONOTTO-entree, schermafdruk van
  fondazionebonotto.org door Marco (de site blokkeert hotlinks met een
  Cloudflare-challenge; haal-url.js accepteert daarom ook een lokaal bestand)

## Schouw 31-8-2026 (alle 212 foto's op het contactvel nagelopen)

16 og:image-keuzes bleken fout en zijn vervangen door een handgekozen beeld van
de eigen site (via `haal-url.js`):

- FR-02 expositieposter dorpsvereniging → kapel + kruidentuin (bron nu de eigen
  kapelsite chapelle-saint-blaise.org; ook `u` in data.js daarheen omgezet)
- FR-23 leeg wit bestand → kasteel vanaf zee
- FR-29 Champs-Élysées-kerstverlichting (bedrijfs-og) → entree kunstcentrum Bonnieux
- IT-24 portret Emilio Vedova → Magazzino del Sale-interieur (Renzo Piano)
- IT-53 tentoonstellingsaffiche → gevel Palazzo Caracciolo d'Avellino
- ES-02 straatje in Hondarribia (naamsverwarring) → Isla de Santa Clara met vuurtoren
- CH-12 generiek bergweide-toerismebeeld → luchtfoto Zumthor-kapel
- CH-17 tentoonstellingsaffiche → paviljoen in avondlicht
- AT-05 abstract campagnebeeld → de glazen Zumthor-hal
- LI-01 campagnefoto fototentoonstelling → beide museumkubussen aan het plein
- DE-07 foto met "Willkommen"-tekstoverlay → schoon beeld Corbusier-dubbelhuis
- DE-20 foto uit fototentoonstelling (LA) → Gehry-daklandschap
- DE-29 luchtfoto kanaal → Halde Rheinelbe met Himmelstreppe
- DE-37 portret Niki de Saint Phalle → Grotte-interieur (spiegelmozaïek)
- DE-38 plaatsnaambord "documenta-Stadt" → Fridericianum met Beuys-eiken
- PT-01 beeld met logo-overlay → Casa de Serralves; PT-02 idem → CIAJG-gebouw

Bewust laten staan (grensgevallen, wel van de eigen site en wel de locatie):
IT-36 (getekende parkkaart van Celle), IT-37 (duotoon-parkfoto), IT-50
(kapelkunstwerk), CH-14 (Segantini-schilderij), DE-24 (kapel klein in beeld),
DE-30 (halde op achtergrond), DE-31 (luchtfoto route), CH-11 (Bregaglia-dal),
IT-45 (Tuoro vanuit de lucht), IT-62 (Presti bij eigen werk), IT-65
(palazzo met campagnebanier), LU-02, DE-13, DE-14, BE-06, CZ-03.

## Fotoronde 10-9-2026: de 86 nieuwe logeeradressen

**302 van de 303 locaties hebben een foto.** Werkwijze als op 28/31-8:
eerst `fetch-webfotos.js` (65 in één run), daarna een Playwright-browserronde
voor botmuren en JS-sites (12), en na de schouw van het contactvel 20
handgekozen vervangingen via `haal-url.js` — hotelsites kiezen als og:image
opvallend vaak een logo, een suite of een bord eten. Bijzonderheden:

- Schermafdruk-patroon (precedent IT-26) gebruikt voor IT-90 Su Gologone,
  FR-38 Fontevraud, ES-20 Parador Santiago, ES-21 Abadía Retuerta en ES-24
  Paradisus Salinas: cookiebanner wegklikken, hero uitsnijden, `haal-url.js`
  met lokaal pad.
- Dode of verhuisde site-URL's gerepareerd in data.js: CH-24 Hotel Castell →
  castellzuoz.com (site meldt: gesloten voor renovatie, s = "let op"), DE-45
  Arte Luise → homaris.com (oude domein verwijst naar hun boekingssite),
  ES-22 → puertamericahotel.com (naam Silken vervallen, record hernoemd).
- **FR-51 Villa Le Rêve heeft geen foto**: de gemeentepagina van Vence (de
  enige officiële bron) bevat geen bruikbaar beeld. Arcering blijft staan.
- Grensgevallen bewust laten staan: FR-35 (aquarel van het hotel, hun eigen
  promobeeld), FR-45 (zwart-witfoto Collioure van de hotelsite), CH-24
  (zwart-wit-archiefbeeld, het enige beeld op de renovatiepagina), IT-90
  (hero met welkomstknop in beeld), AT-15 (enige grote beeld op de site).

Dit rapport wordt met de hand bijgehouden; `fetch-webfotos.js` schrijft zijn
runverslag sinds 31-8-2026 naar `foto-web-rapport.laatste-run.md` (genegeerd
in git) en laat dit bestand met rust. De uitzonderingenlijst staat ook in
`static/kunstlocaties/AGENTS.md`.
