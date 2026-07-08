#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genereert static/italie2026/index.html uit route.json + template.html.

Gebruik:  python3 scripts/italie2026/build.py

- route.json is de enige bron van waarheid voor de etappes.
- Alle lopende tekst is TWEETALIG (Nederlands + 中文): tekstvelden zijn
  objecten {"nl": ..., "zh": ...}. Beide talen worden als <span class="lang
  lang-nl"> / <span class="lang lang-zh"> in de HTML gezet; app.js + CSS
  tonen de gekozen taal (schakelaar rechtsboven, keuze onthouden).
- De tijdlijn is statische HTML (offline leesbaar); dezelfde data gaat als
  inline JSON mee voor de Leaflet-kaart (popups zijn ook tweetalig).
- De GitHub Action italie2026-build.yml draait dit script bij wijziging.
"""
import html
import json
import pathlib
import sys

HIER = pathlib.Path(__file__).resolve().parent
SITE = HIER.parents[1] / "static" / "italie2026"

# Etappenummers van de twee ankers (visueel onderscheiden):
# 4 = Portico di Romagna (Al Vecchio Convento), 5 = Verona (opera)
ANKERS = {4, 5}
STATUS_CLASS = {"geboekt": "ok", "te bevestigen": "wait", "te boeken": "todo"}


def esc(s):
    return html.escape(str(s), quote=True)


def val(field, lang):
    """Haalt de taalwaarde uit een {nl,zh}-object of een platte string."""
    if isinstance(field, dict):
        return field.get(lang, field.get("nl", ""))
    return field if field is not None else ""


def bi(field):
    """Rendert beide talen als aparte spans; CSS toont de actieve taal.
    Voor platte strings (zelfde in beide talen) gewoon de geëscapete tekst."""
    if not isinstance(field, dict):
        return esc(field)
    nl = esc(field.get("nl", ""))
    zh = esc(field.get("zh", ""))
    return (f'<span class="lang lang-nl" lang="nl">{nl}</span>'
            f'<span class="lang lang-zh" lang="zh">{zh}</span>')


def status_info(hotel):
    ruw = hotel.get("status", "")
    ruw_nl = val(ruw, "nl")
    for sleutel, cls in STATUS_CLASS.items():
        if ruw_nl.lower().startswith(sleutel):
            return cls, ruw
    return "wait", ruw


def nachten_bi(n):
    if n == 0:
        return {"nl": "dagrit, thuis", "zh": "当日返程,到家"}
    if n == 1:
        return {"nl": "1 nacht", "zh": "1 晚"}
    return {"nl": f"{n} nachten", "zh": f"{n} 晚"}


def fotoblok(e):
    """Voorbeeldfoto (Wikimedia Commons, mét bronvermelding) of de placeholder
    voor eigen foto's na de reis."""
    vf = e.get("voorbeeldfoto")
    if not vf:
        return ('<div class="fotoplek" aria-hidden="true">'
                '<span class="lang lang-nl" lang="nl">foto volgt na de reis</span>'
                '<span class="lang lang-zh" lang="zh">照片将于旅行后补充</span></div>')
    return (
        '<figure class="voorbeeldfoto">'
        f'<img src="/italie2026/{esc(vf["bestand"])}" '
        f'width="{int(vf["breedte"])}" height="{int(vf["hoogte"])}" '
        f'loading="lazy" alt="{esc(val(vf["onderschrift"], "nl"))}">'
        f'<figcaption>{bi(vf["onderschrift"])} · '
        f'<a href="{esc(vf["creditUrl"])}" target="_blank" rel="noopener">{esc(vf["credit"])}</a>'
        '</figcaption></figure>')


def videoblok(e):
    """Sfeervideo van de omgeving als 'klik-om-af-te-spelen'-facade: de
    (zelf-gehoste) YouTube-thumbnail toont eerst; pas bij klik laadt app.js
    de youtube-nocookie-iframe (snel + privacyvriendelijk). Zie CSP frame-src
    in static/_headers."""
    v = e.get("video")
    if not v:
        return ""
    vid = esc(v["id"])
    titel = v.get("titel", {"nl": "Sfeervideo", "zh": "风光短片"})
    alt = esc(val(titel, "nl"))
    return (
        '<div class="videoblok">'
        f'<button type="button" class="video-facade" data-yt="{vid}" aria-label="{alt}">'
        f'<img src="/italie2026/foto/video/{vid}.jpg" width="1280" height="720" loading="lazy" alt="{alt}">'
        '<span class="video-play" aria-hidden="true"></span>'
        '<span class="video-badge">'
        '<span class="lang lang-nl" lang="nl">Sfeervideo</span>'
        '<span class="lang lang-zh" lang="zh">风光短片</span></span>'
        '</button>'
        f'<p class="videobijschrift">{bi(titel)}<span class="videobron"> · YouTube</span></p>'
        '</div>'
    )


def statbalk_html(overzicht):
    """Overzichts-statbalk (reis in cijfers). app.js telt de waarden op bij
    binnenkomst (count-up); de getoonde eindwaarde staat er meteen (JS-loos ok)."""
    if not overzicht:
        return ""
    items = ""
    for s in overzicht:
        pre = esc(s.get("prefix", ""))
        suf = esc(s.get("suffix", ""))
        w = s["waarde"]
        toon = f"{w:,}".replace(",", ".") if isinstance(w, int) and w >= 1000 else esc(w)
        items += (
            '<div class="stat">'
            f'<span class="statwaarde" data-telop="{esc(w)}" data-prefix="{pre}" data-suffix="{suf}">{pre}{toon}{suf}</span>'
            f'<span class="statlabel">{bi(s["label"])}</span></div>'
        )
    return f'<section class="statbalk" aria-label="Reis in cijfers / 数字概览">{items}</section>'


def etappe_html(e):
    anker = e["nr"] in ANKERS
    kop = f'{esc(e["van"])} → {esc(e["naar"])}'
    lint = f'<span class="lint">{bi(e["lint"])}</span>' if e.get("lint") else ""

    afstand = ""
    if e.get("afstand"):
        afstand = f'<span class="afstand">{bi(e["afstand"])}</span>'

    hotelblok = ""
    if e.get("hotel"):
        cls, ruw = status_info(e["hotel"])
        hotelblok = (
            '<p class="hotel">'
            '<span class="hotellabel lang lang-nl" lang="nl">Hotel</span>'
            '<span class="hotellabel lang lang-zh" lang="zh">酒店</span> '
            f'{esc(val(e["hotel"]["naam"], "nl"))} '
            f'<span class="status {cls}">{bi(ruw)}</span></p>'
        )

    sug = e.get("hotelsuggestie")
    sugblok = ""
    if sug:
        sugblok = (
            '<p class="aanrader">'
            '<span class="hotellabel lang lang-nl" lang="nl">Aanrader</span>'
            '<span class="hotellabel lang lang-zh" lang="zh">推荐酒店</span> '
            f'<a href="{esc(sug["url"])}" target="_blank" rel="noopener">{esc(sug["naam"])} ↗</a> '
            f'<span class="sugtekst">{bi(sug["beschrijving"])}</span>'
            + (f'<span class="sugprijs">{bi(sug["prijs"])}</span>' if sug.get("prijs") else "")
            + '</p>'
        )
        hf = sug.get("foto")
        if hf:
            sugblok += (
                '<figure class="voorbeeldfoto hotelfoto">'
                f'<img src="/italie2026/{esc(hf["bestand"])}" '
                f'width="{int(hf["breedte"])}" height="{int(hf["hoogte"])}" '
                f'loading="lazy" alt="{esc(val(hf["onderschrift"], "nl"))}">'
                f'<figcaption>{bi(hf["onderschrift"])} · '
                f'<a href="{esc(hf["creditUrl"])}" target="_blank" rel="noopener">{esc(hf["credit"])}</a>'
                '</figcaption></figure>')

    hl = "".join(f"<li>{bi(h)}</li>" for h in e["highlights"])

    toerisme = f'<p class="toerisme">{bi(e["toerisme"])}</p>' if e.get("toerisme") else ""
    info = ""
    if e.get("info"):
        info = ('<p class="info">'
                '<span class="infolabel lang lang-nl" lang="nl">Goed om te weten</span>'
                '<span class="infolabel lang lang-zh" lang="zh">实用提示</span> '
                f'{bi(e["info"])}</p>')

    opera = ""
    if e["nr"] == 5:
        opera = """
      <aside class="opera" aria-label="Opera in de Arena di Verona">
        <h4><span class="lang lang-nl" lang="nl">Arena di Verona</span><span class="lang lang-zh" lang="zh">维罗纳圆形剧场</span></h4>
        <ul>
          <li><strong>vr 7 aug</strong> · Turandot · <span class="lang lang-nl" lang="nl">aanvang</span><span class="lang lang-zh" lang="zh">开演</span> 21:00</li>
          <li><strong>zo 9 aug</strong> · Aida (Zeffirelli) · <span class="lang lang-nl" lang="nl">aanvang</span><span class="lang lang-zh" lang="zh">开演</span> 21:00</li>
        </ul>
        <p class="waarschuwing"><span class="lang lang-nl" lang="nl">Let op: tijdens de opera blijven de honden met een hondenoppas in het relais. Tickets en oppas zijn samen de vooraf te regelen spil van de reis.</span><span class="lang lang-zh" lang="zh">注意:歌剧期间狗狗由狗保姆陪伴留在庄园。门票与狗保姆是此行需提前安排的关键。</span></p>
      </aside>"""

    return f"""
    <article class="etappe{' anker' if anker else ''}" id="etappe-{e["nr"]}">
      <div class="knoop" aria-hidden="true"><span>{e["nr"]}</span></div>
      <div class="kaartje">{lint}
        <p class="datum">{bi(e["datum"])} · {bi(nachten_bi(e["nachten"]))}</p>
        <h3>{kop}</h3>
        <p class="rijtijd">{bi(e["rijtijd"])} {afstand}</p>
        {toerisme}
        {videoblok(e)}
        <ul class="highlights">{hl}</ul>
        {info}
        {hotelblok}
        {sugblok}
        <p class="honden">{bi(e["honden"])}</p>{opera}
        {fotoblok(e)}
      </div>
    </article>"""


def main():
    route = json.loads((SITE / "route.json").read_text(encoding="utf-8"))
    template = (HIER / "template.html").read_text(encoding="utf-8")

    tijdlijn = "".join(etappe_html(e) for e in route["etappes"])

    hero = route.get("hero") or {}
    hero_style = f"background-image:url('/italie2026/{esc(hero['bestand'])}')" if hero else ""
    hero_credit = ""
    if hero:
        hero_credit = (
            f'{bi(hero["onderschrift"])} · '
            f'<a href="{esc(hero["creditUrl"])}" target="_blank" rel="noopener">{esc(hero["credit"])}</a>'
        )

    uit = (template
           .replace("<!--TITEL_PLAIN-->", esc(val(route["titel"], "nl")))
           .replace("<!--PERIODE_PLAIN-->", esc(val(route["periode"], "nl")))
           .replace("/*HERO_STYLE*/", hero_style)
           .replace("<!--HERO_CREDIT-->", hero_credit)
           .replace("<!--STATBALK-->", statbalk_html(route.get("overzicht")))
           .replace("<!--TITEL-->", bi(route["titel"]))
           .replace("<!--PERIODE-->", bi(route["periode"]))
           .replace("<!--REIZIGERS-->", bi(route["reizigers"]))
           .replace("<!--TIJDLIJN-->", tijdlijn)
           .replace("/*ROUTEDATA*/", json.dumps(route, ensure_ascii=False)))

    (SITE / "index.html").write_text(uit, encoding="utf-8")
    print(f"index.html gegenereerd ({len(route['etappes'])} etappes, tweetalig).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
