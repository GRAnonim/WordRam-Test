#!/usr/bin/env python3
"""Compare each Chechen card with a short DikDosham gloss. Writes a mismatch report."""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from rebuild_ce_from_dikdosham import CACHE, fetch_one, pick_article_gloss, plain

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "scripts" / "ce-gloss-audit.json"

# Cards already checked by hand. Listed in the report, not treated as new finds.
CHECKED = {
    "ДА", "КЪОНАХ", "ШУРА", "МЕГА", "БАЖА", "ЕТТ", "ИЗА", "ГЕРГАРА", "ДАА",
    "ДОХАЛЛА", "ЛАЬХЬА", "ДОЗАЛЛА", "КОГ", "ДОШ", "СИХАЛЛА", "СЕРЛО", "СА", "СО",
    "ЗЕН", "КХЕТА",
}


def norm_parts(text: str) -> list[str]:
    text = (text or "").lower().replace("ё", "е")
    text = re.sub(r"\bперен\.?\s*", "", text)
    text = re.sub(r"[^а-я0-9 /+-]", " ", text)
    parts = []
    for chunk in re.split(r"\s*/\s*", text):
        chunk = re.sub(r"\s+", " ", chunk).strip(" -")
        if chunk:
            parts.append(chunk)
    return parts


def stems(parts: list[str]) -> set[str]:
    out = set()
    for part in parts:
        for word in part.split():
            if len(word) >= 4:
                out.add(word[:5])
    return out


def judge(card: str, gloss: str) -> str:
    if not gloss:
        return "no-dict"
    card_parts = norm_parts(card)
    dict_parts = norm_parts(gloss)
    if card_parts == dict_parts:
        return "same"
    if set(card_parts) <= set(dict_parts) or set(dict_parts) <= set(card_parts):
        return "covered"
    if stems(card_parts) & stems(dict_parts):
        return "overlap"
    return "mismatch"


def load_cache() -> dict:
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}


def save_cache(cache: dict) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))


def fetch_retry(word: str) -> dict:
    last = None
    for attempt in range(4):
        try:
            return fetch_one(word)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            last = exc
            time.sleep(0.6 * (attempt + 1))
    return {"error": str(last), "data": [], "suggestedWords": []}


def main() -> None:
    items = json.loads((ROOT / "chechen.json").read_text())
    cache = load_cache()
    missing = []
    for item in items:
        key = item["word"].lower()
        cached = cache.get(key) or cache.get(item["word"])
        if not cached or cached.get("error"):
            missing.append(item["word"])
    print("cards", len(items), "to_fetch", len(missing), flush=True)
    if missing:
        with ThreadPoolExecutor(max_workers=4) as pool:
            futs = {pool.submit(fetch_retry, w): w for w in missing}
            done = 0
            for fut in as_completed(futs):
                word = futs[fut]
                cache[word.lower()] = fut.result()
                done += 1
                if done % 40 == 0:
                    save_cache(cache)
                    print("fetched", done, "/", len(missing), flush=True)
        save_cache(cache)

    rows = []
    for item in items:
        key = item["word"].lower()
        payload = cache.get(key) or cache.get(item["word"]) or {}
        gloss, table = pick_article_gloss(payload, item["word"])
        status = judge(item.get("translation") or "", gloss)
        if status in {"same", "covered"} and item["word"] not in CHECKED:
            continue
        if status in {"same", "covered"}:
            continue
        raw_see = ""
        for block in payload.get("data") or []:
            if block.get("dictTableName") != "maciev_ce_ru":
                continue
            for art in block.get("words") or []:
                head = (art.get("word1") or art.get("word") or "").strip().lower()
                if head.rstrip("0123456789") == key:
                    raw_see = plain(art.get("translate") or "")[:180]
                    break
        rows.append({
            "word": item["word"],
            "level": item.get("languageLevel"),
            "card": item.get("translation"),
            "dict": gloss,
            "table": table,
            "status": status,
            "checked": item["word"] in CHECKED,
            "maciev": raw_see,
        })
    REPORT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n")
    counts = {}
    for row in rows:
        if row["checked"]:
            continue
        counts[row["status"]] = counts.get(row["status"], 0) + 1
    print("report", len(rows), "new", counts, flush=True)
    print("AUDIT_DONE", flush=True)


if __name__ == "__main__":
    main()
