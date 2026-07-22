#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Schrijft static/italie2026/weer.json: de verwachte gemiddelde temperatuur
per etappeplaats voor de verblijfsdagen, op basis van Open-Meteo (gratis,
geen key, stdlib only).

Gebruik:  python3 scripts/italie2026/weer.py   (daarna build.py draaien)

- Verblijfsdata worden afgeleid uit START + de `nachten` per etappe in
  route.json (schuiven de etappes, dan schuift het weer automatisch mee).
- Binnen de voorspellingshorizon (16 dagen) telt de echte weersvoorspelling;
  daarbuiten het klimaatgemiddelde 2016-2025 voor dezelfde data (eenmalig
  opgehaald en gecachet in weer.json, bron "klimaat"). Zodra de voorspelling
  een verblijf (deels) dekt, vervangt die het klimaatgemiddelde.
- De GitHub Action italie2026-weer.yml draait dit dagelijks; na EINDE doet
  het script niets meer (workflow daarna verwijderen).
"""
import json
import pathlib
import sys
import urllib.parse
import urllib.request
from datetime import date, timedelta

HIER = pathlib.Path(__file__).resolve().parent
SITE = HIER.parents[1] / "static" / "italie2026"

START = date(2026, 8, 1)      # inchecken etappe 1 (za 1 aug)
EINDE = date(2026, 8, 15)     # thuiskomst
KLIMAATJAREN = range(2016, 2026)


def haal(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def daily_url(basis, lat, lon, extra):
    q = {"latitude": lat, "longitude": lon,
         "daily": "temperature_2m_max,temperature_2m_min",
         "timezone": "Europe/Berlin"}
    q.update(extra)
    return f"{basis}?{urllib.parse.urlencode(q)}"


def per_datum(daily):
    """{'2026-08-01': (tmax, tmin), ...} — dagen met ontbrekende waarden overslaan."""
    uit = {}
    for d, tmax, tmin in zip(daily["time"], daily["temperature_2m_max"],
                             daily["temperature_2m_min"]):
        if tmax is not None and tmin is not None:
            uit[d] = (tmax, tmin)
    return uit


def gemiddelden(paren):
    """(gemiddelde dagtemperatuur, gemiddeld dagmaximum), afgerond op hele graden."""
    gem = sum((tmax + tmin) / 2 for tmax, tmin in paren) / len(paren)
    maxgem = sum(tmax for tmax, _ in paren) / len(paren)
    return round(gem), round(maxgem)


def klimaat(lat, lon, dagen):
    """Klimaatgemiddelde: dezelfde kalenderdagen in KLIMAATJAREN (archief-API)."""
    paren = []
    for jaar in KLIMAATJAREN:
        d0 = dagen[0].replace(year=jaar)
        d1 = dagen[-1].replace(year=jaar)
        data = haal(daily_url("https://archive-api.open-meteo.com/v1/archive",
                              lat, lon, {"start_date": d0.isoformat(),
                                         "end_date": d1.isoformat()}))
        paren.extend(per_datum(data["daily"]).values())
    if not paren:
        return None
    gem, maxgem = gemiddelden(paren)
    return {"gem": gem, "maxgem": maxgem, "bron": "klimaat"}


def main():
    vandaag = date.today()
    if vandaag > EINDE:
        print("Reis voorbij (EINDE gepasseerd); weer.json blijft zoals hij is.")
        return 0

    route = json.loads((SITE / "route.json").read_text(encoding="utf-8"))
    pad = SITE / "weer.json"
    weer = json.loads(pad.read_text(encoding="utf-8")) if pad.exists() else {}
    weer.setdefault("etappes", {})

    cursor = START
    for e in route["etappes"]:
        nachten = e.get("nachten") or 0
        checkin, checkout = cursor, cursor + timedelta(days=nachten)
        cursor = checkout
        if not nachten or not e.get("coord"):
            continue
        lat, lon = e["coord"]
        dagen = [checkin + timedelta(days=i) for i in range(nachten)]
        key = str(e["nr"])
        entry = weer["etappes"].get(key, {})

        # 1) Echte voorspelling voor de (resterende) verblijfsdagen.
        try:
            data = haal(daily_url("https://api.open-meteo.com/v1/forecast",
                                  lat, lon, {"forecast_days": 16}))
            beschikbaar = per_datum(data["daily"])
            paren = [beschikbaar[d.isoformat()] for d in dagen
                     if d.isoformat() in beschikbaar]
            if paren:
                gem, maxgem = gemiddelden(paren)
                entry = {"gem": gem, "maxgem": maxgem, "bron": "voorspelling",
                         "dagen_gedekt": len(paren), "dagen_totaal": nachten}
        except Exception as ex:  # netwerkfout: oude waarde laten staan
            print(f"  etappe {key}: voorspelling mislukt ({ex}); oude waarde blijft")

        # 2) Buiten de horizon: eenmalig het klimaatgemiddelde als basis.
        if "gem" not in entry:
            try:
                entry = klimaat(lat, lon, dagen) or entry
            except Exception as ex:
                print(f"  etappe {key}: klimaat mislukt ({ex})")

        if entry:
            weer["etappes"][key] = entry
            print(f"  etappe {key} {e['naar']}: Ø {entry['gem']} °C, "
                  f"max {entry['maxgem']} °C ({entry['bron']})")

    weer["bijgewerkt"] = vandaag.isoformat()
    pad.write_text(json.dumps(weer, ensure_ascii=False, indent=1) + "\n",
                   encoding="utf-8")
    print(f"weer.json geschreven ({len(weer['etappes'])} etappes).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
