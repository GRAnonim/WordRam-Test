#!/usr/bin/env python3
"""Pull usage examples from DikDosham articles into Chechen cards."""
from __future__ import annotations

import html
import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from apply_ce_verified_fixes import write_data_ce

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/wordram_dikdosham_cache.json")
URL = "https://dikdosham.ru/backend/get_translate.php"
COMBINE = dict.fromkeys(map(ord, "́̀̃̂̈̄"), None)
PREFERRED = ("maciev_ce_ru", "baisultanov_ce_ru", "ismailov_ce_ru")


def norm(s: str) -> str:
    s = (s or "").translate(COMBINE).upper().replace("I", "Ӏ").replace("І", "Ӏ").replace("ӏ", "Ӏ")
    return re.sub(r"[^А-ЯЁӀ]", "", s)


def plain(chunk: str) -> str:
    text = re.sub(r"<i>.*?</i>", " ", chunk or "", flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text).translate(COMBINE)
    return re.sub(r"\s+", " ", text).strip(" .;,:")


def fetch_one(word: str) -> dict:
    data = urllib.parse.urlencode({"word": str(word).lower(), "lang": "ce"}).encode()
    req = urllib.request.Request(URL, data=data, headers={"User-Agent": "WordRamExamples/1.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def extract_from_html(raw_html: str, lemma: str) -> list[tuple[int, str]]:
    raw = re.sub(r"^\s*\[[^\]]*\]\s*", "", raw_html or "")
    parts = re.split(r"(<b>.*?</b>)", raw, flags=re.I | re.S)
    lemma_n = norm(lemma)
    out = []
    for i, part in enumerate(parts):
        m = re.match(r"<b>(.*?)</b>$", part, re.I | re.S)
        if not m:
            continue
        ce = plain(m.group(1))
        rest = parts[i + 1] if i + 1 < len(parts) else ""
        rest = re.split(r"<b>|\d\)", rest, 1)[0]
        ru = plain(rest.split(";", 1)[0])
        ru = re.sub(r"^\d+\)\s*", "", ru)
        if not ce or not ru or len(ce) < 4 or len(ru) < 3:
            continue
        ce_n = norm(ce)
        if not ce_n or ce_n == lemma_n:
            continue
        if len(ce_n) < len(lemma_n):
            continue
        if lemma_n not in ce_n:
            continue
        first = re.split(r"[\s,;—\-]+", ce)[0]
        if lemma_n not in norm(first):
            continue
        if re.search(r"(мн\.|д;|б;|прил)", ce, re.I):
            continue
        ru = re.sub(r"\(\s*\)", "", ru)
        ru = re.sub(r"^[А-Яа-яёA-Za-z]\)\s*", "", ru)
        ru = ru.strip(" .;,:–-")
        if " " not in ce or ";" in ce:
            continue
        if len(ce) > 90 or len(ru) > 90:
            continue
        if re.search(r"\s-\s[а-яё]\s*$", ru, re.I):
            continue
        if ru.startswith("–") or ru.startswith("-"):
            continue
        score = 10
        blob = (part + rest).lower()
        if "погов" in blob or "посл" in blob:
            score += 8
        score += min(len(ce.split()), 6)
        out.append((score, f"{ce[0].upper() + ce[1:]} — {ru[0].upper() + ru[1:]}"))
    out.sort(reverse=True)
    return out


def pick_example(payload: dict, lemma: str) -> str:
    blocks = payload.get("data") or []
    ranked = []
    order = {name: i for i, name in enumerate(PREFERRED)}
    for block in blocks:
        table = block.get("dictTableName") or ""
        if table not in PREFERRED:
            continue
        rank = order.get(table, 40)
        ranked.append((rank, block))
    ranked.sort(key=lambda x: x[0])
    lemma_n = norm(lemma)
    best = []
    for _, block in ranked:
        for item in block.get("words") or []:
            head = norm(item.get("word1") or item.get("word") or "")
            if head != lemma_n and not head.startswith(lemma_n):
                continue
            best.extend(extract_from_html(item.get("translate") or "", lemma))
        if best:
            break
    return best[0][1] if best else ""


def main() -> None:
    items = json.loads((ROOT / "chechen.json").read_text())
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    missing = [it["word"] for it in items if it["word"] not in cache]
    print("cache", len(cache), "fetch", len(missing), flush=True)
    if missing:
        n = 0
        with ThreadPoolExecutor(max_workers=5) as pool:
            futs = {pool.submit(fetch_one, w): w for w in missing}
            for fut in as_completed(futs):
                w = futs[fut]
                n += 1
                try:
                    cache[w] = fut.result()
                except Exception as e:
                    cache[w] = {"data": [], "error": str(e)}
                if n % 50 == 0:
                    CACHE.write_text(json.dumps(cache, ensure_ascii=False))
                    print("fetched", n, "/", len(missing), flush=True)
        CACHE.write_text(json.dumps(cache, ensure_ascii=False))

    filled = 0
    for item in items:
        payload = cache.get(item["word"]) or {}
        ex = pick_example(payload, item["word"])
        if ex:
            item["ex"] = ex
            filled += 1
        else:
            item.pop("ex", None)

    write_data_ce(items)
    sample = next((it for it in items if it["word"] == "ГӀИЛЛАКХ"), None)
    print("with_examples", filled, "of", len(items), flush=True)
    print("ГӀИЛЛАКХ", sample.get("ex") if sample else None, flush=True)


if __name__ == "__main__":
    main()
