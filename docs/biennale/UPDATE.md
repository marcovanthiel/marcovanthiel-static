# Handmatige update — bulletin item toevoegen

Voor noodgevallen, primeurs of redactionele aanpassingen waar je niet op
de cron wilt wachten.

## 1. Open het bestand

```
static/biennalevenetie2026/index.html
```

Zoek het blok `<!-- ============== DAILY UPDATES ============== -->`.
Daarbinnen staat `<div class="updates"> … </div>`.

## 2. Voeg een nieuwe entry direct na `</header>` toe

Template (newest-first → bovenaan):

```html
<article class="update-entry">
  <time>2026-05-07 · 09:30 CET</time>
  <h4>
    <span lang="nl" data-active>NL kop hier</span>
    <span lang="en">EN headline here</span>
    <span lang="it">IT titolo qui</span>
    <span lang="de">DE Überschrift hier</span>
    <span lang="zh">中文标题</span>
  </h4>
  <p>
    <span lang="nl" data-active>NL alinea hier — eindig met <a href="..." target="_blank" rel="noopener">artikel ↗</a>.</span>
    <span lang="en">EN paragraph here — ending with <a href="..." target="_blank" rel="noopener">article ↗</a>.</span>
    <span lang="it">IT paragrafo qui — concludendo con <a href="..." target="_blank" rel="noopener">articolo ↗</a>.</span>
    <span lang="de">DE Absatz hier — endend mit <a href="..." target="_blank" rel="noopener">Artikel ↗</a>.</span>
    <span lang="zh">中文段落，末尾附 <a href="..." target="_blank" rel="noopener">文章 ↗</a>。</span>
  </p>
</article>
```

Regels:
- Het `data-active`-attribuut hoort alléén op de `<span lang="nl">` (NL is default).
- Datum format: `YYYY-MM-DD · HH:MM CET`.
- Vertaal alle vijf talen — als één taal nog ontbreekt, kopieer voorlopig de NL-tekst zodat de pagina niet breekt.

## 3. Commit & push

```bash
git add static/biennalevenetie2026/index.html
git commit -m "biennale: handmatige update — <korte beschrijving>"
git push
```

Cloudflare Pages rebuildt binnen 1–2 minuten. Volg de status op
`https://dash.cloudflare.com/?to=/:account/pages` of via de
deploy-notificaties in je mailbox.

## 4. Primaire bronnen — wat dagelijks bekijken?

**Tier 1**

- **The Art Newspaper · keyword Venice Biennale 2026** → https://www.theartnewspaper.com/keywords/venice-biennale-2026
  *Marco's expliciete regel: "alles wat hier wordt gepubliceerd kan potentieel belangrijk zijn."*

**Tier 2**

| Bron | URL |
|---|---|
| ArtReview | https://artreview.com/keyword/venice-biennale-2026/ |
| Artnet News | https://news.artnet.com |
| ARTnews | https://www.artnews.com (zoek "Venice Biennale") |
| Il Giornale dell'Arte | https://www.ilgiornaledellarte.com |
| designboom | https://www.designboom.com/tag/venice-art-biennale-2026/ |
| Wallpaper* | https://www.wallpaper.com/art |
| Hyperallergic | https://hyperallergic.com |
| CNN Style | https://www.cnn.com/style |
| Mondriaan Fonds | https://www.mondriaanfonds.nl (NL paviljoen) |
| Museumtijdschrift, NRC, de Volkskrant | NL pers |

## 5. Tips

- Houd 1× per week een **archief-back-up** als snapshot:
  `cp static/biennalevenetie2026/index.html docs/biennale/archief/index-YYYY-MM-DD.html`
- Foto's: vervang stapsgewijs de SVG-illustraties in
  `static/biennalevenetie2026/assets/img/pavilions/` door echte persfoto's.
  Bestandsnamen ongewijzigd laten = geen HTML-aanpassing nodig.

## 6. Korte vertaalhulp

| NL | EN | IT | DE | 中文 |
|---|---|---|---|---|
| Vandaag | Today | Oggi | Heute | 今日 |
| Persopening | Press opening | Apertura stampa | Presseeröffnung | 媒体开幕 |
| Paviljoen | Pavilion | Padiglione | Pavillon | 国家馆 |
| Curator | Curator | Curatore | Kurator:in | 策展人 |
| Recensie | Review | Recensione | Rezension | 评论 |
| Performance | Performance | Performance | Performance | 表演 |
| Tentoonstelling | Exhibition | Mostra | Ausstellung | 展览 |
| Opening (publiek) | Public opening | Apertura al pubblico | Publikumseröffnung | 公众开幕 |
| Bron | Source | Fonte | Quelle | 来源 |
