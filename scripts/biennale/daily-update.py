#!/usr/bin/env python3
"""
daily-update.py
================
Calls Anthropic's Claude API (with built-in web_search tool) to find the
day's most relevant Venice Biennale 2026 news from Tier-1 sources, generates
a new <article class="update-entry"> in five languages (NL, EN, IT, DE, ZH),
and inserts it at the top of the live-bulletin section in index.html.

If nothing material has been published today, the script exits 0 without
modifying any files.

Required environment variables:
    ANTHROPIC_API_KEY   API key with web_search tool access
    ANTHROPIC_MODEL     (optional) model name, defaults to claude-sonnet-4-6
"""
from __future__ import annotations

import os
import re
import sys
import json
import datetime as dt
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent.parent.parent  # → marcovanthiel-static repo root
INDEX_HTML = ROOT / "static" / "biennalevenetie2026" / "index.html"
INSTRUCTIONS_FILE = ROOT / "scripts" / "biennale" / "daily-update.prompt.md"

NO_UPDATE_TOKEN = "NO_UPDATE"
UPDATES_HEADER_RE = re.compile(
    r'(<div class="updates">\s*<header>.*?</header>\s*)',
    re.DOTALL,
)
UPDATE_ENTRY_RE = re.compile(
    r'<article class="update-entry">.*?</article>',
    re.DOTALL,
)


def load_existing_entries(html: str, limit: int = 8) -> list[str]:
    """Return the most recent N existing update-entries (NL text only)."""
    entries = UPDATE_ENTRY_RE.findall(html)
    summaries: list[str] = []
    for entry in entries[:limit]:
        # extract <time> + first lang="nl" headline + first lang="nl" paragraph
        time_match = re.search(r'<time>([^<]+)</time>', entry)
        nl_h4 = re.search(r'<h4>.*?<span lang="nl"[^>]*>([^<]+)</span>', entry, re.DOTALL)
        nl_p = re.search(r'<p>.*?<span lang="nl"[^>]*>(.*?)</span>', entry, re.DOTALL)
        summaries.append(
            f"- {time_match.group(1) if time_match else '?'} :: "
            f"{nl_h4.group(1).strip() if nl_h4 else '?'}"
        )
    return summaries


def build_prompt(existing: list[str]) -> str:
    instructions = INSTRUCTIONS_FILE.read_text(encoding="utf-8")
    today = dt.datetime.utcnow().strftime("%Y-%m-%d")
    return f"""{instructions}

==================================================================
TODAY IS: {today} (UTC)
==================================================================

ALREADY-PUBLISHED UPDATE ENTRIES (most recent first, do NOT duplicate any of these stories):
{chr(10).join(existing) if existing else '(none)'}

==================================================================
YOUR TASK
==================================================================

1. Use the web_search tool to find new Venice Biennale 2026 news published in the last 24 hours.
   Start with the Tier-1 source: https://www.theartnewspaper.com/keywords/venice-biennale-2026
   Then cross-check the Tier-2 sources listed in the instructions above.
2. Pick AT MOST ONE story that is genuinely new (not in the duplicate list above) and material
   enough to warrant a daily-bulletin entry.
3. Output exactly ONE <article class="update-entry"> block in the format below — nothing else,
   no commentary, no markdown fences, no preamble.

If no material new story exists, output exactly the single token:
{NO_UPDATE_TOKEN}

==================================================================
EXACT OUTPUT FORMAT (copy this template and fill it in)
==================================================================

<article class="update-entry">
  <time>{today} · HH:MM CET</time>
  <h4>
    <span lang="nl" data-active>...NL kop...</span>
    <span lang="en">...EN headline...</span>
    <span lang="it">...IT titolo...</span>
    <span lang="de">...DE Überschrift...</span>
    <span lang="zh">...中文标题...</span>
  </h4>
  <p>
    <span lang="nl" data-active>...NL alinea van 1–3 zinnen, met aan het eind een klikbare bron-link in de vorm: <a href="..." target="_blank" rel="noopener">artikel ↗</a>...</span>
    <span lang="en">...EN paragraph 1–3 sentences, ending in a clickable source link: <a href="..." target="_blank" rel="noopener">article ↗</a>...</span>
    <span lang="it">...IT paragrafo 1–3 frasi, con link finale: <a href="..." target="_blank" rel="noopener">articolo ↗</a>...</span>
    <span lang="de">...DE Absatz 1–3 Sätze, mit Link am Ende: <a href="..." target="_blank" rel="noopener">Artikel ↗</a>...</span>
    <span lang="zh">...中文段落 1–3 句，末尾附链接：<a href="..." target="_blank" rel="noopener">文章 ↗</a>...</span>
  </p>
</article>
"""


def call_claude(prompt: str) -> str:
    api_key = os.environ["ANTHROPIC_API_KEY"]
    model = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")

    client = anthropic.Anthropic(api_key=api_key)
    print(f"→ calling {model} with web_search …", flush=True)

    response = client.messages.create(
        model=model,
        max_tokens=4096,
        tools=[{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 6,
        }],
        messages=[{"role": "user", "content": prompt}],
    )

    # Concatenate all text blocks from the final assistant message
    out_parts: list[str] = []
    for block in response.content:
        if getattr(block, "type", "") == "text":
            out_parts.append(block.text)
    return "".join(out_parts).strip()


def insert_entry(html: str, new_entry: str) -> str:
    if not UPDATES_HEADER_RE.search(html):
        raise SystemExit("ERROR: could not find <div class=\"updates\"><header>…</header> in index.html")
    return UPDATES_HEADER_RE.sub(
        lambda m: m.group(1) + "\n    " + new_entry.strip() + "\n",
        html,
        count=1,
    )


def main() -> int:
    if not INDEX_HTML.exists():
        print(f"ERROR: {INDEX_HTML} not found", file=sys.stderr)
        return 1
    if not INSTRUCTIONS_FILE.exists():
        print(f"ERROR: {INSTRUCTIONS_FILE} not found", file=sys.stderr)
        return 1

    html = INDEX_HTML.read_text(encoding="utf-8")
    existing = load_existing_entries(html)
    prompt = build_prompt(existing)

    print(f"→ {len(existing)} existing entries seen as context")

    response_text = call_claude(prompt)
    print(f"→ Claude returned {len(response_text)} chars")
    print("---- response preview ----")
    print(response_text[:600])
    print("--------------------------")

    if NO_UPDATE_TOKEN in response_text[:60]:
        print("✓ No material update today — exiting cleanly.")
        return 0

    # Sanity: response should start with <article class="update-entry">
    if not response_text.lstrip().startswith('<article class="update-entry">'):
        # try to extract the article block if Claude wrapped it in fences/explanations
        m = re.search(
            r'<article class="update-entry">.*?</article>',
            response_text,
            re.DOTALL,
        )
        if not m:
            print("ERROR: Claude response did not contain a parseable update-entry.")
            return 2
        response_text = m.group(0)

    new_html = insert_entry(html, response_text)
    INDEX_HTML.write_text(new_html, encoding="utf-8")
    print(f"✓ Inserted new update-entry. index.html is now {len(new_html)} bytes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
