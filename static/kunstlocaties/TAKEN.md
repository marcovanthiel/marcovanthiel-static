# Openstaande punten — /kunstlocaties

Stand 10 september 2026. Afgeronde punten weghalen, niet afvinken; dit is een
werklijst, geen logboek. Het besluitenspoor staat in `AGENTS.md` en `CLAUDE.md`.

## 1. Foto's voor de 86 nieuwe locaties

De uitbreiding met logeeradressen bracht 86 nieuwe records (IT-70…IT-90,
FR-31…FR-53, ES-15…ES-25, PT-09…PT-17, CH-22…CH-27, AT-11…AT-17, DE-43…DE-45,
BE-12, BE-13, LU-03, CZ-10…CZ-12). Die hebben nog geen beeld: de sandbox heeft
geen netwerk naar buiten, dus dit moet op de eigen Mac:

    cd scripts/kunstlocaties && node fetch-webfotos.js

Daarna `contactvel.js` draaien en het contactvel doorkijken — hotelsites zetten
vaker dan musea een gelikte suite of een bord eten als og:image, en dat is niet
waar het om gaat. Waar het beeld niets zegt: eigen foto in `foto-bron/<id>.jpg`,
of de entry uit `fotos.js` halen en de arcering laten staan.

## 2. Schouwen van alle foto's

Nog niet gedaan voor de bestaande 217. `node contactvel.js` bouwt het overzicht.

## 3. Hondenbeleid

Bij ruim de helft van de 303 is het hondenbeleid onbekend, bij de nieuwe
logeeradressen bijna overal — hotelsites vermelden het zelden op de eigen site.
`onbekend` betekent onbekend, niet nee. Navragen loont alleen bij de plekken die
op een reisroute staan; niet als bulkklus doen.

## 4. Openingstijden van de "let op"-adressen

Die staan als onzeker in `data.js`. Voor vertrek naar een streek de betreffende
adressen bellen en `pr` bijwerken. Ook hier: per reis, niet in bulk.

## 5. Te controleren bij de logeeradressen

- **IT-40 ArtHotel PortaValdera** — het hotel staat in Peccioli en toont werk uit
  de kring van de Fondazione Peccioliper, maar wordt niet door de stichting zelf
  gerund. Grensgeval; blijft staan tot iemand ter plaatse iets anders zegt.
- **IT-58 MuSaBa** — de foresteria heeft geen boekingspagina meer. Bellen.
- **FR-05 Ronchamp** — het klooster van Piano neemt gasten aan voor bezinning,
  niet als hotel. Zo ook opgeschreven.
- **FR-51 Villa Le Rêve** — formeel kunstenaarsresidentie; verblijf loopt vooral
  via schilderstages. Per mail navragen wat los te boeken is.
- **BE-04 Woning Van Wassenhove** — was jarenlang als verblijf te boeken via het
  MDD, nu staan er alleen bezoekdagen en residenties op de site. Navragen bij
  wvw@museumdd.be; als het weer kan, is dit het beste Belgische adres van de
  categorie.
- **CZ-08 Egon Schiele Art Centrum** — verhuurt Apartment X en een studio, maar
  de tekst richt zich op kunstenaars. Onduidelijk of een gewone bezoeker kan
  boeken.
- **ES-20 Parador Santiago** — de eigen site meldt een sluitingsperiode in 2028.

## 6. Leads zonder eigen site of niet te verifiëren

Niet opgenomen, wel de moeite waard:

- **Talponia**, Ivrea — het halfrond ondergrondse Olivetti-woongebouw van
  Gabetti & Isola (1971) in het UNESCO-gebied; losse appartementen worden via
  boekingsplatforms verhuurd, maar er is geen eigen site.
- **Hôtel Furkablick**, Furkapas — OMA-verbouwing, locatie van Furkart met
  Holzer, Buren, Merz en Long. De site meldt "in hibernation".
- **Les Cols Pavellons** (RCR, Olot), **Hotel Aire de Bardenas** (Tudela),
  **Hotel Consolación** (Monroyo), **Palácio Belmonte** (Lissabon) en **Casa do
  Conto** (Porto) — sites waren tijdens het onderzoek niet te bereiken.
