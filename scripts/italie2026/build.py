#!/usr/bin/env python3
"""Genereert static/italie2026/index.html uit route.json + template.html.

Gebruik:  python3 scripts/italie2026/build.py

- route.json is de enige bron van waarheid voor de etappes.
- De tijdlijn wordt als statische HTML gegenereerd (offline leesbaar);
  dezelfde data gaat als inline JSON mee voor de Leaflet-kaart.
- De GitHub Action italie2026-build.yml draait dit script automatisch
  wanneer route.json wijzigt (dus onderweg bijwerken via github.com kan).
"""
import html
import json
import pathlib
import sys

HIER = pathlib.Path(__file__).resolve().parent
SITE = HIER.parents[1] / "static" / "italie2026"

# Etappenummers van de twee ankers (visueel onderscheiden)
ANKERS = {5, 8}
STATUS_CLASS = {"geboekt": "ok", "te bevestigen": "wait", "te boeken": "todo"}


def esc(s):
    return html.escape(str(s), quote=True)


def status_info(hotel):
    if not hotel:
        return None
    ruw = hotel.get("status", "")
    for sleutel, cls in STATUS_CLASS.items():
        if ruw.lower().startswith(sleutel):
            return cls, ruw
    return "wait", ruw  # onbekende tekst = behandel als 'te bevestigen'


def etappe_html(e):
    anker = e["nr"] in ANKERS
    losse_dag = e["nachten"] == 0
    kop = f'{esc(e["van"])} → {esc(e["naar"])}'
    nachten = ("dagrit, thuis" if losse_dag
               else f'{e["nachten"]} nacht{"en" if e["nachten"] > 1 else ""}')

    hotelblok = ""
    if e.get("hotel"):
        cls, ruw = status_info(e["hotel"])
        hotelblok = (
            f'<p class="hotel"><span class="hotellabel">Hotel</span> {esc(e["hotel"]["naam"])} '
            f'<span class="status {cls}">{esc(ruw)}</span></p>'
        )

    hl = "".join(f"<li>{esc(h)}</li>" for h in e["highlights"])

    opera = ""
    if e["nr"] == 5:
        opera = """
      <aside class="opera" aria-label="Opera in de Arena di Verona">
        <h4>Arena di Verona</h4>
        <ul>
          <li><strong>do 30 juli</strong> · Aida (Zeffirelli) · aanvang 21:15</li>
          <li><strong>vr 31 juli</strong> · La Traviata · aanvang 21:15</li>
        </ul>
        <p class="waarschuwing">Let op: de honden blijven tijdens de opera in het hotel.
        Het hondenbeleid van het hotel is dáárom de kritieke reservering van de reis —
        schriftelijk laten bevestigen.</p>
      </aside>"""

    return f"""
    <article class="etappe{' anker' if anker else ''}" id="etappe-{e["nr"]}">
      <div class="knoop" aria-hidden="true"><span>{e["nr"]}</span></div>
      <div class="kaartje">
        <p class="datum">{esc(e["datum"])} · {nachten}</p>
        <h3>{kop}</h3>
        <p class="rijtijd">🚗 {esc(e["rijtijd"])}</p>
        {hotelblok}
        <ul class="highlights">{hl}</ul>
        <p class="honden">🐾 {esc(e["honden"])}</p>{opera}
        <div class="fotoplek" aria-hidden="true"><span>foto volgt na de reis</span></div>
      </div>
    </article>"""


def main():
    route = json.loads((SITE / "route.json").read_text())
    template = (HIER / "template.html").read_text()

    tijdlijn = "".join(etappe_html(e) for e in route["etappes"])
    uit = (template
           .replace("<!--TITEL-->", esc(route["titel"]))
           .replace("<!--PERIODE-->", esc(route["periode"]))
           .replace("<!--REIZIGERS-->", esc(route["reizigers"]))
           .replace("<!--TIJDLIJN-->", tijdlijn)
           .replace("/*ROUTEDATA*/", json.dumps(route, ensure_ascii=False)))

    (SITE / "index.html").write_text(uit)
    print(f"index.html gegenereerd ({len(route['etappes'])} etappes).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
