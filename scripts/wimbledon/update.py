#!/usr/bin/env python3
"""Genereert static/wimbledon/data.json uit publieke feeds.

Bronnen:
- ESPN scoreboard (open API): enkelspel heren/dames + dubbels/mixed
  (uitslagen, live stand, speeltijden, banen, landvlaggen).
- wimbledon.com draw-feeds (open voor MD/LD/MX/BS/GS): loting-volgorde
  en uitslagen voor dubbels en junioren. De enkelspel-feeds (MS/LS) zijn
  door Akamai afgeschermd; daarvoor is de loting-volgorde van de laatste 32
  hieronder als seed vastgelegd en vullen ESPN-uitslagen het bracket.

Draait elk uur via .github/workflows/wimbledon-hourly.yml; commit alleen
bij wijzigingen. Na EINDDATUM doet het script niets meer.
"""
import json
import pathlib
import re
import sys
import unicodedata
import urllib.request
from datetime import datetime, date, timezone
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Amsterdam")
EINDDATUM = date(2026, 7, 14)
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard"
WIM_URL = "https://www.wimbledon.com/en_GB/scores/feeds/2026/draws/{}.json"
DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"]

DOEL = pathlib.Path(__file__).resolve().parents[2] / "static" / "wimbledon" / "data.json"

# IOC/ESPN-landcode -> ISO-3166 alpha-2 (voor emoji-vlaggen)
IOC = {
    "ARG": "AR", "AUS": "AU", "AUT": "AT", "BEL": "BE", "BIH": "BA", "BLR": "BY",
    "BOL": "BO", "BRA": "BR", "BUL": "BG", "CAN": "CA", "CHI": "CL", "CHN": "CN",
    "COL": "CO", "CRO": "HR", "CZE": "CZ", "DEN": "DK", "ECU": "EC", "EGY": "EG",
    "ESA": "SV", "ESP": "ES", "EST": "EE", "FIN": "FI", "FRA": "FR", "GBR": "GB",
    "GEO": "GE", "GER": "DE", "GRE": "GR", "HKG": "HK", "HUN": "HU", "INA": "ID",
    "IND": "IN", "IRL": "IE", "ISR": "IL", "ITA": "IT", "JPN": "JP", "KAZ": "KZ",
    "KOR": "KR", "LAT": "LV", "LIB": "LB", "LTU": "LT", "LUX": "LU", "MAR": "MA",
    "MDA": "MD", "MEX": "MX", "MKD": "MK", "MON": "MC", "NED": "NL", "NOR": "NO",
    "NZL": "NZ", "PER": "PE", "PHI": "PH", "POL": "PL", "POR": "PT", "PUR": "PR",
    "ROU": "RO", "RSA": "ZA", "RUS": "RU", "SLO": "SI", "SRB": "RS", "SUI": "CH",
    "SVK": "SK", "SWE": "SE", "THA": "TH", "TPE": "TW", "TUN": "TN", "TUR": "TR",
    "UKR": "UA", "URU": "UY", "USA": "US", "UZB": "UZ", "VEN": "VE", "VIE": "VN",
    "CYP": "CY", "PAR": "PY", "DOM": "DO", "JOR": "JO", "KUW": "KW", "QAT": "QA",
    "UAE": "AE", "SGP": "SG", "MAS": "MY", "SRI": "LK", "PAK": "PK", "NGR": "NG",
    "KEN": "KE", "ALG": "DZ", "AND": "AD", "ARM": "AM", "AZE": "AZ", "BAR": "BB",
    "BER": "BM", "CRC": "CR", "GUA": "GT", "HAI": "HT", "HON": "HN", "ISL": "IS",
    "JAM": "JM", "KGZ": "KG", "MLT": "MT", "MNE": "ME", "NCA": "NI", "PAN": "PA",
    "ZIM": "ZW",
}
# Spelers zonder vlag (bv. neutrale status) krijgen geen emoji.


def vlag(code):
    iso = IOC.get((code or "").upper())
    if not iso:
        return ""
    return "".join(chr(0x1F1E6 + ord(c) - 65) for c in iso) + " "


# ----- Loting-volgorde laatste 32 enkelspel (bron: officiële loting, stand 4 juli) -----
# Volgorde: linkerhelft boven->onder, dan rechterhelft boven->onder.
SEED_R32 = {
    "MS": [
        "J. Sinner [1]", "J. Brooksby", "R. Jodar [23]", "S. Mochizuki",
        "H. Hurkacz", "T. Paul [21]", "J.-L. Struff", "D. Medvedev [8]",
        "F. Auger-Aliassime [3]", "M. Zheng", "A. Davidovich Fokina [22]", "M. Fucsovics",
        "R. Safiullin", "J. Fonseca [24]", "A. Rinderknech [25]", "N. Djokovic [7]",
        "A. de Minaur [5]", "Z. Svajda", "K. Khachanov [19]", "F. Cobolli [9]",
        "G. Dimitrov", "M. Berrettini", "Z. Bergs", "A. Fery",
        "T. Fritz [6]", "L. Sonego", "F. Tiafoe [17]", "A. Bublik [10]",
        "J. Lehecka [13]", "J. Munar", "M. Giron", "A. Zverev [2]",
    ],
    "LS": [
        "A. Sabalenka [1]", "J. Ostapenko", "D. Kasatkina", "N. Osaka [14]",
        "K. Muchova [10]", "M. Sawangkaew", "N. Bartunkova", "B. Krejcikova",
        "J. Pegula [4]", "J. Bouzas Maneiro", "E. Alexandrova [18]", "I. Jovic [16]",
        "B. Bencic [11]", "A. Kalinskaya [19]", "C. Liu", "C. Gauff [7]",
        "D. Snigur", "A. Krueger", "E. Navarro [23]", "M. Kostyuk [12]",
        "J. Paolini [13]", "M. Sakkari", "A. Eala [29]", "I. Swiatek [3]",
        "A. Anisimova [6]", "M. Keys [26]", "S. Cirstea [17]", "L. Noskova [9]",
        "L. Samsonova", "M. Bouzkova [21]", "E. Mertens [25]", "E. Rybakina [2]",
    ],
}

EVENTS = {
    "MS": {"tab": "Heren", "badge": "HERENENKELSPEL", "espn": "mens-singles",
           "finale": "Finale: zondag 12 juli", "pair": False, "bron": "espn",
           "rondes": ["Laatste 32 · 3–4 jul", "Laatste 16 · 5–6 jul", "Kwartfinale · 7–8 jul",
                       "Halve finale · 10 jul", "Finalist"]},
    "LS": {"tab": "Dames", "badge": "DAMESENKELSPEL", "espn": "womens-singles",
           "finale": "Finale: zaterdag 11 juli", "pair": False, "bron": "espn",
           "rondes": ["Laatste 32 · 3–4 jul", "Laatste 16 · 5–6 jul", "Kwartfinale · 7–8 jul",
                       "Halve finale · 9 jul", "Finalist"]},
    "MD": {"tab": "Heren dubbel", "badge": "HERENDUBBELSPEL", "espn": "mens-doubles",
           "finale": "Finale: zaterdag 11 juli", "pair": True, "bron": "wim",
           "rondes": ["Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
    "LD": {"tab": "Dames dubbel", "badge": "DAMESDUBBELSPEL", "espn": "womens-doubles",
           "finale": "Finale: zondag 12 juli", "pair": True, "bron": "wim",
           "rondes": ["Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
    "MX": {"tab": "Mixed", "badge": "GEMENGD DUBBELSPEL", "espn": "mixed-doubles",
           "finale": "Finale: donderdag 9 juli", "pair": True, "bron": "wim",
           "rondes": ["Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
    "BS": {"tab": "Jongens", "badge": "JONGENSENKELSPEL", "espn": None,
           "finale": "Finale: zondag 12 juli", "pair": False, "bron": "wim",
           "rondes": ["Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
    "GS": {"tab": "Meisjes", "badge": "MEISJESENKELSPEL", "espn": None,
           "finale": "Finale: zaterdag 11 juli", "pair": False, "bron": "wim",
           "rondes": ["Laatste 32", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
}

# ESPN-rondenamen -> bracketkolom (kolom 0 = laatste 32) voor 128-draws
ESPN_KOLOM = {"Round 3": 0, "Round 4": 1, "Quarterfinal": 2, "Semifinal": 3, "Final": 4}


def haal(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def norm(naam):
    """Normaliseer een spelersnaam voor matching: achternaam, kleine letters, geen accenten."""
    if not naam:
        return ""
    s = unicodedata.normalize("NFKD", naam).encode("ascii", "ignore").decode()
    s = re.sub(r"\[.*?\]", "", s)  # seed weg
    s = s.replace("-", " ").lower().strip()
    delen = [d for d in s.split() if not d.endswith(".")]  # initialen weg
    return " ".join(delen)


def nl_tijd(dt_utc):
    lokaal = dt_utc.astimezone(TZ)
    return DAGEN[lokaal.weekday()], lokaal.strftime("%H:%M"), lokaal.date()


def tv_kanaal(court, kolom):
    """Nederlandse uitzender per baan/ronde (bron: WBD-persbericht Wimbledon 2026).

    HBO Max streamt alle 18 banen; Eurosport 1/2 lineair; Court No.1 is t/m de
    achtste finales exclusief bij Ziggo Sport. Vanaf de halve finales mag alles overal.
    """
    c = (court or "").lower()
    if kolom is not None and kolom >= 3:
        return "Eurosport · HBO Max · Ziggo Sport"
    if re.search(r"no\.?\s*1\s+court|^court 1$", c):
        if kolom is not None and kolom >= 2:  # kwartfinale
            return "Eurosport · HBO Max"
        return "Ziggo Sport"
    if "centre" in c:
        return "Eurosport 1 · HBO Max"
    return "HBO Max"


def espn_naam(t):
    a = t.get("athlete") or {}
    return a.get("shortName") or a.get("displayName") or ""


def espn_vlagcode(t):
    a = t.get("athlete") or {}
    href = (a.get("flag") or {}).get("href", "")
    m = re.search(r"/([a-z]{3})\.png", href)
    return m.group(1).upper() if m else ""


def score_espn(comp):
    """Setstanden in de volgorde waarin de spelers getoond worden."""
    try:
        t1, t2 = comp["competitors"][0], comp["competitors"][1]
        a = [int(s.get("value", 0)) for s in t1.get("linescores", [])]
        b = [int(s.get("value", 0)) for s in t2.get("linescores", [])]
        return " ".join(f"{x}-{y}" for x, y in zip(a, b))
    except (KeyError, IndexError):
        return ""


def score_wim(m):
    """Setstanden in team1-team2-volgorde (zoals de partij getoond wordt)."""
    try:
        uit = []
        for st in m["scores"]["sets"]:
            if len(st) < 2 or st[0].get("score") is None or st[1].get("score") is None:
                continue
            uit.append(f"{st[0]['score']}-{st[1]['score']}")
        return " ".join(uit)
    except (KeyError, TypeError):
        return ""


def wim_team_naam(team, pair):
    if not team or not team.get("displayNameA"):
        return ""
    naam = vlag(team.get("nationA")) + team["displayNameA"]
    if pair and team.get("displayNameB"):
        naam += " / " + vlag(team.get("nationB")) + team["displayNameB"]
    if team.get("seed"):
        naam += f" [{team['seed']}]"
    return naam


def bouw_singles(code, espn_data, vandaag):
    """Bracket voor MS/LS: seed-volgorde laatste 32 + ESPN-uitslagen."""
    ev = EVENTS[code]
    groep = next((g for g in espn_data if g["grouping"]["slug"] == ev["espn"]), None)
    comps = groep["competitions"] if groep else []

    slots = {}
    vlaggen = {}  # norm-naam -> vlag-emoji
    for c in comps:
        for t in c.get("competitors", []):
            n = norm(espn_naam(t))
            if n and n not in vlaggen:
                vlaggen[n] = vlag(espn_vlagcode(t))

    def toon(naam_met_seed):
        return vlaggen.get(norm(naam_met_seed), "") + naam_met_seed

    # kolom 0 uit de seed-lijst
    seeds = SEED_R32[code]
    for i, naam in enumerate(seeds):
        kant, idx = ("L", i) if i < 16 else ("R", i - 16)
        slots[f"{kant}-0-{idx}"] = toon(naam)

    # positie-index: genormaliseerde naam -> (kant, index) in kolom 0..4
    positie = [{} for _ in range(5)]
    for i, naam in enumerate(seeds):
        kant, idx = ("L", i) if i < 16 else ("R", i - 16)
        positie[0][norm(naam)] = (kant, idx)

    labels = {"L": [""] * 8, "R": [""] * 8}
    vandaag_lijst = []
    champ = ""

    per_kolom = {}
    for c in comps:
        k = ESPN_KOLOM.get(c["round"]["displayName"])
        if k is not None:
            per_kolom.setdefault(k, []).append(c)

    for k in range(0, 5):
        for c in per_kolom.get(k, []):
            namen = [espn_naam(t) for t in c.get("competitors", [])]
            pos = [positie[k].get(norm(n)) for n in namen]
            pos = [p for p in pos if p]
            if not pos:
                continue
            kant, idx = min(pos, key=lambda p: p[1])
            paar = idx // 2

            status = c["status"]["type"]
            dt = datetime.fromisoformat(c["date"].replace("Z", "+00:00"))
            dag, tijd, datum = nl_tijd(dt)
            court = (c.get("venue") or {}).get("court") or ""
            tv = tv_kanaal(court, k)

            # label bij het paar in kolom 0 (score in de volgorde van de bracket-slots)
            if k == 0:
                score = score_espn(c)
                bovenste = slots.get(f"{kant}-0-{paar*2}", "")
                if namen and norm(namen[0]) != norm(bovenste):
                    score = " ".join("-".join(reversed(p.split("-"))) for p in score.split())
                if status["completed"]:
                    labels[kant][paar] = f"{dag} {datum.day} jul · {score}"
                elif status["state"] == "in":
                    labels[kant][paar] = f"LIVE · {status.get('detail','')} · {tv}"
                else:
                    labels[kant][paar] = f"{dag} {tijd} · {court or 'baan volgt'} · {tv}"

            # winnaar doorzetten naar volgende kolom
            if status["completed"]:
                w = next((t for t in c["competitors"] if t.get("winner")), None)
                if w is not None:
                    wnorm = norm(espn_naam(w))
                    # volledige naam met seed opzoeken in huidige kolomtekst
                    huidig = slots.get(f"{kant}-{k}-", "")
                    bron = next((slots[f"{kant}-{k}-{j}"] for j in (idx, idx + 1 if idx % 2 == 0 else idx - 1)
                                 if norm(slots.get(f"{kant}-{k}-{j}", "")) == wnorm), None)
                    if bron is None:
                        bron = toon(espn_naam(w))
                    if k < 4:
                        slots[f"{kant}-{k+1}-{paar}"] = bron
                        positie[k + 1][wnorm] = (kant, paar)
                    else:
                        champ = bron
            else:
                # deelnemers van deze ronde in de kolom zetten (bekend uit ESPN)
                for n in namen:
                    p = positie[k].get(norm(n))
                    if p and k < 5:
                        slots.setdefault(f"{p[0]}-{k}-{p[1]}", toon(n))

            if datum == vandaag:
                vandaag_lijst.append({
                    "tijd": tijd, "court": court or "baan volgt",
                    "ronde": ev["rondes"][k].split(" ·")[0] if k < len(ev["rondes"]) else "",
                    "partij": " – ".join(toon(n) for n in namen if n),
                    "status": ("gespeeld · " + score_espn(c)) if status["completed"]
                              else (f"LIVE · {status.get('detail','')}" if status["state"] == "in" else "gepland"),
                    "tv": tv,
                })

    # posities van kolom k+1 vullen voor nog niet gespeelde rondes (uit bestaande slots)
    for k in range(1, 5):
        for kant in ("L", "R"):
            for idx in range(16 >> k if k < 4 else 1):
                naam = slots.get(f"{kant}-{k}-{idx}")
                if naam:
                    positie[k][norm(naam)] = (kant, idx)

    vandaag_lijst.sort(key=lambda x: x["tijd"])
    return {"tab": ev["tab"], "badge": ev["badge"], "rondes": ev["rondes"], "finale": ev["finale"],
            "pair": ev["pair"], "slots": slots, "labels": labels, "champ": champ, "vandaag": vandaag_lijst}


def bouw_wim(code, vandaag):
    """Bracket voor MD/LD/MX/BS/GS uit de wimbledon.com-feed (loting-volgorde via match_id)."""
    ev = EVENTS[code]
    data = haal(WIM_URL.format(code))
    matches = sorted(data.get("matches", []), key=lambda m: int(m["match_id"]))
    per_ronde = {}
    for m in matches:
        per_ronde.setdefault(m["roundCode"], []).append(m)

    drawsize = int(data.get("drawSize") or 64)
    # kolom 0 = laatste 32: bij 64-draw ronde '2', bij 32-draw ronde '1'
    ronde_volgorde = ["1", "2", "3", "Q", "S", "F"] if drawsize >= 64 else ["1", "2", "Q", "S", "F"]
    start = 1 if drawsize >= 64 else 0
    kolommen = ronde_volgorde[start:start + 5]

    slots, labels, champ = {}, {"L": [""] * 8, "R": [""] * 8}, ""
    vandaag_lijst = []

    for k, rc in enumerate(kolommen):
        rondematches = per_ronde.get(rc, [])
        helft = len(rondematches) // 2
        for i, m in enumerate(rondematches):
            kant = "L" if i < helft else "R"
            paar = i if i < helft else i - helft
            t1 = wim_team_naam(m.get("team1"), ev["pair"])
            t2 = wim_team_naam(m.get("team2"), ev["pair"])
            if t1:
                slots[f"{kant}-{k}-{paar*2}"] = t1
            if t2:
                slots[f"{kant}-{k}-{paar*2+1}"] = t2

            klaar = (m.get("status") == "Completed") or m.get("winner") in (1, 2)
            if klaar and m.get("winner") in (1, 2):
                winnaar = t1 if m["winner"] == 1 else t2
                if winnaar:
                    if k < 4:
                        slots[f"{kant}-{k+1}-{paar}"] = winnaar
                    elif rc == "F":
                        champ = winnaar

            epoch = m.get("epoch")
            datum = None
            tijd = ""
            if epoch:
                dt = datetime.fromtimestamp(epoch / 1000, tz=timezone.utc)
                _, tijd, datum = nl_tijd(dt)
            court = m.get("courtName") or ""
            tv = tv_kanaal(court, k)

            if k == 0:
                if klaar:
                    wanneer = f"{DAGEN[datum.weekday()]} {datum.day} jul · " if datum else ""
                    labels[kant][paar] = f"{wanneer}{score_wim(m)}"
                elif m.get("status"):
                    labels[kant][paar] = f"LIVE · {tv}"
                elif court:
                    labels[kant][paar] = f"{tijd or 'vandaag'} · {court} · {tv}"

            speelt_vandaag = (datum == vandaag) or (not klaar and court and not epoch)
            if speelt_vandaag and t1 and t2:
                vandaag_lijst.append({
                    "tijd": tijd or "–",
                    "court": court or "baan volgt",
                    "ronde": {"1": "1e ronde", "2": "2e ronde", "3": "3e ronde",
                              "Q": "Kwartfinale", "S": "Halve finale", "F": "Finale"}.get(rc, rc),
                    "partij": f"{t1} – {t2}",
                    "status": (f"gespeeld · {score_wim(m)}") if klaar
                              else ("LIVE" if m.get("status") else "gepland"),
                    "tv": tv,
                })

    # 1e ronde van een 64-draw (valt buiten het bracket) ook in de daglijst
    if start == 1:
        for m in per_ronde.get("1", []):
            klaar = (m.get("status") == "Completed") or m.get("winner") in (1, 2)
            epoch = m.get("epoch")
            datum, tijd = None, ""
            if epoch:
                dt = datetime.fromtimestamp(epoch / 1000, tz=timezone.utc)
                _, tijd, datum = nl_tijd(dt)
            court = m.get("courtName") or ""
            if (datum == vandaag) or (court and not klaar and not epoch) or (klaar and datum == vandaag):
                t1 = wim_team_naam(m.get("team1"), ev["pair"])
                t2 = wim_team_naam(m.get("team2"), ev["pair"])
                if t1 and t2:
                    vandaag_lijst.append({
                        "tijd": tijd or "–", "court": court or "baan volgt", "ronde": "1e ronde",
                        "partij": f"{t1} – {t2}",
                        "status": (f"gespeeld · {score_wim(m)}") if klaar
                                  else ("LIVE" if m.get("status") else "gepland"),
                        "tv": tv_kanaal(court, None),
                    })

    vandaag_lijst.sort(key=lambda x: (x["tijd"] == "–", x["tijd"]))
    return {"tab": ev["tab"], "badge": ev["badge"], "rondes": ev["rondes"], "finale": ev["finale"],
            "pair": ev["pair"], "slots": slots, "labels": labels, "champ": champ, "vandaag": vandaag_lijst}


def main():
    nu = datetime.now(TZ)
    if nu.date() > EINDDATUM:
        print("Toernooi voorbij; niets te doen.")
        return 0

    oud = {}
    if DOEL.exists():
        try:
            oud = json.loads(DOEL.read_text())
        except json.JSONDecodeError:
            oud = {}

    vandaag = nu.date()
    events_uit = dict(oud.get("events", {}))
    fouten = []

    espn_groepen = []
    try:
        espn = haal(ESPN_URL)
        ev0 = (espn.get("events") or [{}])[0]
        espn_groepen = ev0.get("groupings", [])
    except Exception as e:  # noqa: BLE001 - feed kan haperen; oude data behouden
        fouten.append(f"ESPN: {e}")

    if espn_groepen:
        for code in ("MS", "LS"):
            try:
                events_uit[code] = bouw_singles(code, espn_groepen, vandaag)
            except Exception as e:  # noqa: BLE001
                fouten.append(f"{code}: {e}")

    for code in ("MD", "LD", "MX", "BS", "GS"):
        try:
            events_uit[code] = bouw_wim(code, vandaag)
        except Exception as e:  # noqa: BLE001
            fouten.append(f"{code}: {e}")

    if not events_uit:
        print("Geen enkele feed gelukt; data.json onaangeroerd.", file=sys.stderr)
        return 1

    uit = {
        "bijgewerkt": nu.strftime("%-d %B %Y, %H:%M").replace("July", "juli"),
        "bijgewerkt_iso": nu.isoformat(timespec="minutes"),
        "volgorde": ["MS", "LS", "MD", "LD", "MX", "BS", "GS"],
        "events": events_uit,
    }

    # alleen schrijven bij echte wijziging (timestamp niet meegerekend)
    def kern(d):
        return json.dumps(d.get("events"), sort_keys=True, ensure_ascii=False)

    if kern(oud) == kern(uit):
        print("Geen wijzigingen.")
        return 0

    DOEL.write_text(json.dumps(uit, ensure_ascii=False, indent=1))
    print(f"data.json bijgewerkt ({len(events_uit)} onderdelen).")
    for f in fouten:
        print("waarschuwing:", f, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
