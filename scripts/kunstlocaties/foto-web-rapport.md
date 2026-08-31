# Foto-web-rapport

Gedraaid: 28-8-2026 (meerdere rondes: script, browser-ronde, handmatige keuze,
zoekagents); herkansing 31-8-2026 (IT-19 opgelost, server was weer bereikbaar).

**212 van de 217 locaties heeft een foto van de eigen website.**

## Zonder foto (5, met reden)

- ES-06 Museo Vostell Malpartida: site weigert verkeer per regio (403)
- IT-26 Fondazione Bonotto: Cloudflare-challenge blokkeert ook hotlinks
- IT-27 La Marrana: eigen site heeft alleen afbeeldingen tot ~300 px
- IT-44 Casa Dipinta: geen eigen website
- IT-64 Castello Incantato: geen betrouwbare eigen website (beheerders-site gekaapt)

Oplossing voor deze vijf: eigen foto als `foto-bron/<id>.jpg` neerzetten en
`node fetch-webfotos.js --only=<id>` draaien.

Dit rapport wordt met de hand bijgehouden; `fetch-webfotos.js` schrijft zijn
runverslag sinds 31-8-2026 naar `foto-web-rapport.laatste-run.md` (genegeerd
in git) en laat dit bestand met rust. De uitzonderingenlijst staat ook in
`static/kunstlocaties/AGENTS.md`.
