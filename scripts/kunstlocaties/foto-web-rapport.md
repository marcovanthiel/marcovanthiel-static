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

Dit rapport wordt met de hand bijgehouden; `fetch-webfotos.js` schrijft zijn
runverslag sinds 31-8-2026 naar `foto-web-rapport.laatste-run.md` (genegeerd
in git) en laat dit bestand met rust. De uitzonderingenlijst staat ook in
`static/kunstlocaties/AGENTS.md`.
