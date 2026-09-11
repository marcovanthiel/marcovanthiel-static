#!/usr/bin/env python3
"""Genereert static/europeanopen/data.json uit de ESPN-feed.

BNP Paribas Fortis European Open 2026 (ATP 250), Brussels Expo,
17 t/m 25 oktober 2026 (bron: brussels.be en visit.brussels, gecheckt
11-9-2026). Twee onderdelen: herenenkelspel (28-draw, vier byes) en
herendubbelspel (16 teams).

Bron: ESPN scoreboard-API (site.api.espn.com/.../tennis/atp/scoreboard),
open en CORS-vrij. Het toernooi verschijnt daar pas in de speelweek; tot
die tijd schrijft dit script het voorfase-kader (lege brackets + mededeling).
De ESPN-volgorde is NIET de loting-volgorde; zodra de loting bekend is
(rond vrijdag 16 oktober op europeanopen.be) moet die hieronder in SEEDS
worden ingevuld, in dit bestand ÉN in de JS-port in index.html.

Draait elk uur via .github/workflows/europeanopen-hourly.yml; commit alleen
bij wijzigingen. Na EINDDATUM doet het script niets meer.
"""
import json
import pathlib
import re
import sys
import unicodedata
import urllib.request
from datetime import datetime, date
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Amsterdam")
EINDDATUM = date(2026, 10, 26)
EVENT_NAAM = "european open"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard"
DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"]

DOEL = pathlib.Path(__file__).resolve().parents[2] / "static" / "europeanopen" / "data.json"

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


def vlag(code):
    iso = IOC.get((code or "").upper())
    if not iso:
        return ""
    return "".join(chr(0x1F1E6 + ord(c) - 65) for c in iso) + " "


# ----- Loting-volgorde (INVULLEN zodra de loting bekend is, ± vr 16 okt) -----
# MS: 32 regels, linkerhelft boven->onder dan rechterhelft; byes letterlijk
#     als "bye" tegenover de vier hoogste reekshoofden.
# MD: 16 regels (teams als "A. Achternaam / B. Achternaam [seed]").
# LET OP: ook in de JS-port in static/europeanopen/index.html invullen.
SEEDS = {
    "MS": [],
    "MD": [],
}

MEDEDELING = ("De loting is nog niet bekend; die wordt rond vrijdag 16 oktober "
              "verwacht. Dit schema vult zich daarna automatisch. Het toernooi "
              "duurt van 17 t/m 25 oktober 2026 (Brussels Expo).")

EVENTS = {
    # 28-draw enkelspel: Round 1 (met vier byes) -> Round 2 (laatste 16) -> QF -> SF -> F.
    # ESPN-rondenamen bevestigd 11-9-2026: "Round 1", "Round 2", "Quarterfinal",
    # "Semifinal", "Final" (aliassen voor de zekerheid meegenomen).
    "MS": {"tab": "Heren", "badge": "HERENENKELSPEL", "espn": "mens-singles",
           "finale": "Finale: zondag 25 oktober", "pair": False, "basis": 0,
           "kolom": {"Round 1": 0, "Round of 32": 0, "1st Round": 0,
                      "Round 2": 1, "Round of 16": 1, "2nd Round": 1,
                      "Quarterfinal": 2, "Quarterfinals": 2, "Semifinal": 3, "Semifinals": 3,
                      "Final": 4},
           "rondes": ["1e ronde", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
    # 16-teams dubbelspel: Round 1 (laatste 16) -> QF -> SF -> F.
    "MD": {"tab": "Heren dubbel", "badge": "HERENDUBBELSPEL", "espn": "mens-doubles",
           "finale": "Finale: zondag 25 oktober", "pair": True, "basis": 1,
           "kolom": {"Round 1": 1, "Round of 16": 1, "1st Round": 1,
                      "Quarterfinal": 2, "Quarterfinals": 2, "Semifinal": 3, "Semifinals": 3,
                      "Final": 4},
           "rondes": ["", "Laatste 16", "Kwartfinale", "Halve finale", "Finalist"]},
}

COUNTS = [16, 8, 4, 2, 1]  # slots per kant per kolom
RONDE_NAAM = ["1e ronde", "Laatste 16", "Kwartfinale", "Halve finale", "Finale"]


def haal(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def norm(naam):
    """Normaliseer een (team)naam voor matching: achternamen, kleine letters, geen accenten."""
    if not naam:
        return ""
    s = unicodedata.normalize("NFKD", naam).encode("ascii", "ignore").decode()
    s = re.sub(r"\[.*?\]", "", s)
    s = s.replace("-", " ").replace("/", " ").lower().strip()
    delen = [d for d in s.split() if not d.endswith(".")]
    return " ".join(delen)


def zelfde(slottekst, kortnorm):
    s = norm(slottekst)
    return s == kortnorm or s.endswith(" " + kortnorm) or (kortnorm and kortnorm in s)


def nl_tijd(dt_utc):
    lokaal = dt_utc.astimezone(TZ)
    return DAGEN[lokaal.weekday()], lokaal.strftime("%H:%M"), lokaal.date()


def espn_namen(t):
    """Naam van een competitor: enkelspeler of dubbelteam (roster)."""
    roster = t.get("roster") or []
    if roster:
        return " / ".join((a.get("athlete") or a).get("shortName")
                          or (a.get("athlete") or a).get("displayName") or "" for a in roster)
    a = t.get("athlete") or {}
    return a.get("shortName") or a.get("displayName") or t.get("displayName") or ""


def espn_vlag(t):
    a = t.get("athlete") or {}
    href = (a.get("flag") or {}).get("href", "")
    m = re.search(r"/([a-z]{3})\.png", href)
    return vlag(m.group(1).upper()) if m else ""


def live_detail(status):
    return re.sub(r"(\d)(?:st|nd|rd|th)\s+Set", r"\1e set", status.get("detail", "") or "")


def score_espn(comp):
    try:
        t1, t2 = comp["competitors"][0], comp["competitors"][1]
        a = [int(s.get("value", 0)) for s in t1.get("linescores", [])]
        b = [int(s.get("value", 0)) for s in t2.get("linescores", [])]
        return " ".join(f"{x}-{y}" for x, y in zip(a, b))
    except (KeyError, IndexError):
        return ""


def leeg_event(code):
    ev = EVENTS[code]
    return {"tab": ev["tab"], "badge": ev["badge"], "rondes": ev["rondes"],
            "finale": ev["finale"], "pair": ev["pair"], "basis": ev["basis"], "slots": {},
            "labels": {"L": [[""] * 8, [""] * 4, [""] * 2, [""] * 1],
                        "R": [[""] * 8, [""] * 4, [""] * 2, [""] * 1]},
            "champ": "", "vandaag": [], "mededeling": MEDEDELING}


def bouw(code, comps, vandaag):
    """Bracket + daglijst voor een onderdeel uit de ESPN-competitions."""
    ev = EVENTS[code]
    basis = ev["basis"]

    slots = {}
    vlaggen, vollen = {}, {}
    for c in comps:
        for t in c.get("competitors", []):
            n = norm(espn_namen(t))
            if not n:
                continue
            vlaggen.setdefault(n, espn_vlag(t) if not ev["pair"] else "")
            volle = (t.get("athlete") or {}).get("fullName")
            if volle and n not in vollen:
                vollen[n] = volle

    def toon(naam_met_seed):
        n = norm(naam_met_seed)
        m = re.search(r"\s*(\[\d+\])", naam_met_seed)
        seed = f" {m.group(1)}" if m else ""
        basisnaam = vollen.get(n) or re.sub(r"\s*\[\d+\]", "", naam_met_seed)
        return vlaggen.get(n, "") + basisnaam + seed

    positie = [{} for _ in range(5)]
    seeds = SEEDS.get(code) or []
    per_kant = COUNTS[basis]
    for i, naam in enumerate(seeds):
        kant, idx = ("L", i) if i < per_kant else ("R", i - per_kant)
        slots[f"{kant}-{basis}-{idx}"] = "bye" if naam.lower() == "bye" else toon(naam)
        if naam.lower() != "bye":
            positie[basis][norm(naam)] = (kant, idx)
    # byes meteen doorschuiven naar de volgende kolom
    if seeds:
        for kant in ("L", "R"):
            for paar in range(COUNTS[basis] // 2):
                a = slots.get(f"{kant}-{basis}-{paar*2}", "")
                b = slots.get(f"{kant}-{basis}-{paar*2+1}", "")
                door = a if b.lower() == "bye" else (b if a.lower() == "bye" else "")
                if door:
                    slots[f"{kant}-{basis+1}-{paar}"] = door
                    positie[basis + 1][norm(door)] = (kant, paar)

    labels = {"L": [[""] * 8, [""] * 4, [""] * 2, [""] * 1],
              "R": [[""] * 8, [""] * 4, [""] * 2, [""] * 1]}
    vandaag_lijst = []
    champ = ""

    per_kolom = {}
    for c in comps:
        k = ev["kolom"].get((c.get("round") or {}).get("displayName", ""))
        if k is not None:
            per_kolom.setdefault(k, []).append(c)

    for k in range(basis, 5):
        for c in per_kolom.get(k, []):
            namen = [espn_namen(t) for t in c.get("competitors", [])]
            status = c["status"]["type"]
            dt = datetime.fromisoformat(c["date"].replace("Z", "+00:00"))
            dag, tijd, datum = nl_tijd(dt)
            court = (c.get("venue") or {}).get("court") or ""
            tv = "Ziggo Sport"

            # daglijst: onafhankelijk van de loting-matching
            if datum == vandaag:
                vandaag_lijst.append({
                    "start": int(dt.timestamp()),
                    "tijd": tijd, "court": court or "baan volgt",
                    "ronde": RONDE_NAAM[k] if k < len(RONDE_NAAM) else "",
                    "partij": " – ".join(toon(n) for n in namen if n),
                    "status": ("gespeeld · " + score_espn(c)) if status["completed"]
                              else ((f"LIVE · {live_detail(status)}"
                                     + (f" · {score_espn(c)}" if score_espn(c).strip("- ") else ""))
                                    if status["state"] == "in" else "gepland"),
                    "tv": tv,
                })

            # bracketpositie vergt de loting
            pos = [positie[k].get(norm(n)) for n in namen]
            pos = [p for p in pos if p]
            if not pos:
                continue
            kant, idx = min(pos, key=lambda p: p[1])
            paar = idx // 2

            if k <= 3:
                score = score_espn(c)
                bovenste = slots.get(f"{kant}-{k}-{paar*2}", "")
                if namen and not zelfde(bovenste, norm(namen[0])):
                    score = " ".join("-".join(reversed(p.split("-"))) for p in score.split())
                if status["completed"]:
                    labels[kant][k][paar] = f"{dag} {datum.day} okt · {score}"
                elif status["state"] == "in":
                    stand = f" · {score}" if score.strip("- ") else ""
                    labels[kant][k][paar] = f"LIVE · {live_detail(status)}{stand} · {tv}"
                elif c.get("timeValid", True):
                    labels[kant][k][paar] = f"{dag} {tijd} · {court or 'baan volgt'} · {tv}"
                else:
                    labels[kant][k][paar] = f"{dag} {datum.day} okt · tijd volgt · {tv}"

            if status["completed"]:
                w = next((t for t in c["competitors"] if t.get("winner")), None)
                if w is not None:
                    wnorm = norm(espn_namen(w))
                    bron = next((slots[f"{kant}-{k}-{j}"] for j in (idx, idx + 1 if idx % 2 == 0 else idx - 1)
                                 if zelfde(slots.get(f"{kant}-{k}-{j}", ""), wnorm)), None)
                    if bron is None:
                        bron = toon(espn_namen(w))
                    if k < 4:
                        slots[f"{kant}-{k+1}-{paar}"] = bron
                        positie[k + 1][wnorm] = (kant, paar)
                    else:
                        champ = bron
            else:
                for n in namen:
                    p = positie[k].get(norm(n))
                    if p:
                        slots.setdefault(f"{p[0]}-{k}-{p[1]}", toon(n))

    vandaag_lijst.sort(key=lambda x: x["tijd"])
    uit = {"tab": ev["tab"], "badge": ev["badge"], "rondes": ev["rondes"], "finale": ev["finale"],
           "pair": ev["pair"], "basis": basis, "slots": slots, "labels": labels, "champ": champ,
           "vandaag": vandaag_lijst}
    if not seeds:
        uit["mededeling"] = ("De loting is bekend zodra hij hier is ingevoerd; de daglijst "
                             "hieronder toont de partijen al wel. Zie scripts/europeanopen/update.py.")
    return uit


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
    events_uit = {code: leeg_event(code) for code in ("MS", "MD")}
    for code, ev in (oud.get("events") or {}).items():
        if code in events_uit and ev.get("slots"):
            events_uit[code] = ev  # oude stand behouden als de feed hapert
    fouten = []

    try:
        # Met ?dates=<vandaag> geeft ESPN de volledige toernooiboom van de events
        # die die dag actief zijn (betrouwbaarder dan het kale scorebord, dat soms
        # maar één uitgelicht toernooi toont).
        espn = haal(ESPN_URL + "?dates=" + nu.strftime("%Y%m%d"))
        toernooi = next((e for e in espn.get("events", [])
                         if EVENT_NAAM in (e.get("name") or "").lower()), None)
        if toernooi is None:
            print("European Open nog/niet in de ESPN-feed; voorfase-kader.")
        else:
            for code in ("MS", "MD"):
                groep = next((g for g in toernooi.get("groupings", [])
                              if (g.get("grouping") or {}).get("slug") == EVENTS[code]["espn"]), None)
                if groep is None:
                    fouten.append(f"{code}: grouping ontbreekt")
                    continue
                try:
                    events_uit[code] = bouw(code, groep.get("competitions", []), vandaag)
                except Exception as e:  # noqa: BLE001
                    fouten.append(f"{code}: {e}")
    except Exception as e:  # noqa: BLE001
        fouten.append(f"ESPN: {e}")

    uit = {
        "bijgewerkt": nu.strftime("%-d %B %Y, %H:%M")
            .replace("September", "september").replace("October", "oktober"),
        "bijgewerkt_iso": nu.isoformat(timespec="minutes"),
        "volgorde": ["MS", "MD"],
        "events": events_uit,
    }

    def kern(d):
        return json.dumps(d.get("events"), sort_keys=True, ensure_ascii=False)

    if DOEL.exists() and kern(oud) == kern(uit):
        print("Geen wijzigingen.")
        return 0

    DOEL.write_text(json.dumps(uit, ensure_ascii=False, indent=1))
    print(f"data.json bijgewerkt ({len(events_uit)} onderdelen).")
    for f in fouten:
        print("waarschuwing:", f, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
