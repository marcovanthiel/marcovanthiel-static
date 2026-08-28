# Foto-web-rapport

Gedraaid: 28-8-2026 (meerdere rondes: script, browser-ronde, handmatige keuze, zoekagents)

**211 van de 217 locaties heeft een foto van de eigen website.**

## Zonder foto (6, met reden)

- ES-06 Museo Vostell Malpartida: site weigert verkeer per regio (403)
- IT-19 Fondazione Dalle Nogare: server hangt structureel (og:image bekend: /images/La_casa.webp?w=2000)
- IT-26 Fondazione Bonotto: Cloudflare-challenge blokkeert ook hotlinks
- IT-27 La Marrana: eigen site heeft alleen afbeeldingen tot ~300 px
- IT-44 Casa Dipinta: geen eigen website
- IT-64 Castello Incantato: geen betrouwbare eigen website (beheerders-site gekaapt)

Oplossing voor deze zes: eigen foto als `foto-bron/<id>.jpg` neerzetten en
`node fetch-webfotos.js --only=<id>` draaien.

Let op: `fetch-webfotos.js` herschrijft dit rapport bij elke run (ook `--dry`);
deze uitzonderingenlijst staat daarom ook in `static/kunstlocaties/AGENTS.md`.
