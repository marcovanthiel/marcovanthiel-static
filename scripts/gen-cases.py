#!/usr/bin/env python3
"""
Genereer per kunde-/project-data-record een Hugo content-bestand onder
content/<lang>/cases/<slug>.md.

Bron: data/projects/<lang>.json (zelfde lijst in elke taal,
verschillend qua tekst).

Doel: ELKE case krijgt een eigen permalink (`/cases/<slug>/`) zodat
zoekmachines de uitgebreide beschrijving kunnen indexeren en de
gebruiker een deelbare URL heeft per opdrachtgever.

Run vanuit repo-root:
    python3 scripts/gen-cases.py
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from datetime import date

REPO = Path(__file__).resolve().parent.parent
DATA_DIR = REPO / "data" / "projects"
CONTENT = REPO / "content"

LANGS = ["nl", "en", "de", "it", "cn"]


def slugify(text: str) -> str:
    """Maak een URL-veilige slug van de project-titel."""
    s = text.lower()
    # Houd letters/cijfers/spaties/koppeltekens; vervang rest door spatie
    s = re.sub(r"[^a-z0-9à-ÿ\s-]", " ", s)
    # Diakritieken: klein subset voor onze data; anders gebruiken we unidecode
    repls = {
        "à": "a", "á": "a", "â": "a", "ä": "a", "ã": "a",
        "è": "e", "é": "e", "ê": "e", "ë": "e",
        "ì": "i", "í": "i", "î": "i", "ï": "i",
        "ò": "o", "ó": "o", "ô": "o", "ö": "o", "õ": "o",
        "ù": "u", "ú": "u", "û": "u", "ü": "u",
        "ç": "c", "ñ": "n",
    }
    for k, v in repls.items():
        s = s.replace(k, v)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s


def load_lang(lang: str) -> list[dict]:
    path = DATA_DIR / f"{lang}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def to_yaml_string(s: str) -> str:
    """Veilige YAML-front-matter-string: dubbele aanhalingstekens, escape \\
    en " backslash-escapen."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def main() -> None:
    # Slugs zijn afgeleid uit de NL-titels — projects matchen we per
    # LIST-INDEX (zelfde index = zelfde project, ook al is de
    # vertaling anders). Zo hebben alle talen identieke URL-paden,
    # en produceert het Chinese alfabet geen leeg-slug-probleem.
    nl_projects = load_lang("nl")
    nl_slugs = [slugify(p["title"]) for p in nl_projects]

    for lang in LANGS:
        cases_dir = CONTENT / lang / "cases"
        # Verwijder oude generatie zodat verwijderde projecten ook echt weg zijn
        if cases_dir.exists():
            shutil.rmtree(cases_dir)
        cases_dir.mkdir(parents=True, exist_ok=True)

        # _index.md voor de cases-listing per taal
        list_titles = {
            "nl": "Cases",
            "en": "Cases",
            "de": "Fallstudien",
            "it": "Casi studio",
            "cn": "案例",
        }
        list_descriptions = {
            "nl": "Uitgebreide beschrijvingen van geselecteerde opdrachtgevers en programma's.",
            "en": "Detailed descriptions of selected clients and programmes.",
            "de": "Ausführliche Beschreibungen ausgewählter Auftraggeber und Programme.",
            "it": "Descrizioni dettagliate di clienti e programmi selezionati.",
            "cn": "精选客户与项目的详细介绍。",
        }
        index_md = (
            "---\n"
            f'title: "{to_yaml_string(list_titles.get(lang, "Cases"))}"\n'
            f'description: "{to_yaml_string(list_descriptions.get(lang, ""))}"\n'
            f"date: {date.today().isoformat()}\n"
            "---\n"
        )
        (cases_dir / "_index.md").write_text(index_md, encoding="utf-8")

        projects = load_lang(lang)
        # Wanneer een taal een ander aantal projects heeft (sommige
        # vertalingen kunnen achterlopen), pak alleen wat we hebben.
        for idx, project in enumerate(projects):
            title = project.get("title", "").strip()
            if not title:
                continue
            # Slug uit de NL-bronset op dezelfde index — dat geeft alle
            # talen identieke URL-paden + werkt ook voor CJK-titels.
            slug = nl_slugs[idx] if idx < len(nl_slugs) else slugify(title)
            if not slug:
                continue
            description = project.get("description", "").strip()
            details = project.get("details", "").strip()
            image = project.get("image", "").strip()
            url = project.get("url", "").strip()

            front = [
                "---",
                f'title: "{to_yaml_string(title)}"',
                f'description: "{to_yaml_string(description)}"',
                f"date: {date.today().isoformat()}",
                f'translationKey: "case-{slug}"',
                f'slug: "{slug}"',
            ]
            if image:
                front.append(f'image: "{to_yaml_string(image)}"')
            if url and url != "#":
                front.append(f'externalUrl: "{to_yaml_string(url)}"')
            front.append("---")
            front_str = "\n".join(front) + "\n\n"

            # Body: details als markdown — \n\n wordt al markdown-paragraaf
            body = details + ("\n" if not details.endswith("\n") else "")

            (cases_dir / f"{slug}.md").write_text(
                front_str + body, encoding="utf-8"
            )

        print(f"[gen-cases] {lang}: {len(projects)} cases gegenereerd")


if __name__ == "__main__":
    main()
