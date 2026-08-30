---
description: Push en controleer dat de deploy echt live staat
---

Breng de laatste commits live en controleer het op de echte URL.

## Doe dit

1. `git status` — werkboom schoon? Zo niet, eerst afmaken of stashen.
2. `git push origin main`
3. Wacht, en controleer dan of Cloudflare Pages de commit heeft opgepakt:
   ```
   npx wrangler pages deployment list --project-name=marcovanthiel
   ```
   Staat de commit-hash er niet bij, dan heeft Pages de push gemist. Remedie:
   `git commit --allow-empty -m "trigger deploy"` en opnieuw pushen. Nooit met
   de hand uploaden — GitHub blijft de bron.
4. Verifieer op de **live URL**, niet op een groen vinkje:
   ```
   curl -sI https://marcovanthiel.nl/kunstlocaties/ | head -3
   curl -s https://marcovanthiel.nl/kunstlocaties/assets/fotos.js | head -c 200
   ```
   En kijk er ook echt naar in een browser: kaart, foto's, filters.
5. Is er een `?v=` gewijzigd, controleer dan dat de nieuwe URL geserveerd wordt
   en niet de oude uit de cache.

In een Cowork-sandbox lukt stap 2 tot 5 niet: die komt niet bij github.com of
marcovanthiel.nl. Zeg dat dan, en geef de commando's door in plaats van te doen
alsof het gelukt is.
