#!/usr/bin/env python3
"""Rebuild Chechen game lexicon from DikDosham lookups (short glosses only)."""
from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path("/tmp/wordram_dikdosham_cache.json")
REPORT = ROOT / "scripts" / "ce-lexicon-rebuild-report.json"
URL = "https://dikdosham.ru/backend/get_translate.php"
MULTI = ["АЬ", "ОЬ", "УЬ", "БӀ", "ГӀ", "ДӀ", "ЖӀ", "КХ", "КЪ", "КӀ", "МӀ", "ПӀ", "ТӀ", "ХЬ", "ХӀ", "ЦӀ", "ЧӀ"]
CYR = set("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯӀ")
COMBINE = dict.fromkeys(map(ord, "́̀̃̂̈̄"), None)

PREFERRED = (
    "ismailov_ce_ru",
    "maciev_ce_ru",
    "baisultanov_ce_ru",
)

FORCED_LEMMA = {
    "СИНО": "СА",
}


def normalize_lemma(s: str) -> str:
    s = (s or "").strip()
    s = s.translate(COMBINE)
    s = s.upper().replace("I", "Ӏ").replace("І", "Ӏ").replace("|", "Ӏ").replace("ӏ", "Ӏ")
    s = re.sub("[\u04cf]", "Ӏ", s)
    s = s.replace("Ъ", "Ъ").replace("Ь", "Ь")
    return s


def tokenize(word: str) -> list[str]:
    w = normalize_lemma(word)
    tiles = []
    i = 0
    while i < len(w):
        if i + 2 <= len(w) and w[i : i + 2] in MULTI:
            tiles.append(w[i : i + 2])
            i += 2
        elif w[i] in CYR:
            tiles.append(w[i])
            i += 1
        else:
            if w[i] not in " -":
                tiles.append(w[i])
            i += 1
    return tiles


def plain(tr: str) -> str:
    text = re.sub(r"<[^>]+>", " ", tr or "")
    text = html.unescape(text)
    text = text.translate(COMBINE)
    return re.sub(r"\s+", " ", text).strip()


def looks_russian(chunk: str) -> bool:
    if re.search(r"[Ӏ]", chunk):
        return False
    return bool(re.search(r"[А-Яа-яЁё]", chunk))


CHE_LEAK = re.compile(r"[Ӏ]|аь|оь|уь|юь|яь|ёь|кх|къ|гӀ|хь|пхь|цӀ|чӀ|тӀ|кӀ|◊", re.I)
CHE_VERBS = {
    "яккха", "дан", "дала", "даха", "ян", "хила", "хилар", "баккха",
    "диллина", "дешна", "йолу", "йоцуш", "яла", "деша", "лела", "дахь",
}
SHORT_GLOSS = {"в", "во", "на", "за", "из", "от", "до", "по", "у", "о", "я", "ты", "мы", "вы", "он", "да", "нет"}


def clean_sense(chunk: str) -> str:
    chunk = re.sub(r"\([^)]*\)", "", chunk)
    chunk = re.sub(r"\d+\)", "", chunk)
    previous = None
    while previous != chunk:
        previous = chunk
        chunk = re.sub(
            r"^(?:мест|союз|нареч|част|глаг|межд|предл|числ|прил|сущ)\.?\s+",
            "",
            chunk.strip(),
            flags=re.I,
        )
        chunk = re.sub(
            r"^(?:в\s+разн\.\s*знач\.|послелог|полит\.|лит\.|юр\.|мат\.|лингв\.|филос\.|прост\.|уст\.|мед\.|иск\.)\s*",
            "",
            chunk.strip(),
            flags=re.I,
        )
        chunk = re.sub(r"^[абвг]\s*\)\s*", "", chunk.strip(), flags=re.I)
    chunk = chunk.strip(" ;,.-–—«»:")
    chunk = re.sub(r"\s+", " ", chunk)
    if chunk.lower() in SHORT_GLOSS:
        return chunk[:1].upper() + chunk[1:]
    chunk = re.sub(r"^(?:с\.\s*-\s*х\.)\s*", "", chunk, flags=re.I)
    chunk = re.sub(r"\s+-\s+л\.?$", "-л.", chunk, flags=re.I)
    if len(chunk) < 2 or len(chunk) > 42:
        return ""
    if not looks_russian(chunk) or CHE_LEAK.search(chunk):
        return ""
    tokens = re.findall(r"[А-Яа-яЁёӀ]+", chunk)
    if any(token.lower() in CHE_VERBS for token in tokens):
        return ""
    if re.fullmatch(r"см\.?", chunk, re.I):
        return ""
    return chunk[:1].upper() + chunk[1:]


def gloss_from_plain(text: str) -> str:
    t = re.sub(r"\[[^\]]*\]", " ", text)
    t = re.sub(r"\s+", " ", t).strip()
    if re.search(r"[–—]", t):
        t = re.split(r"[–—]", t, 1)[-1].strip()
    parts = re.split(r"[;]|,(?=\s)", t)
    senses = []
    for part in parts:
        part = clean_sense(part)
        if part and part.lower() not in {s.lower() for s in senses}:
            senses.append(part)
        if len(senses) == 3:
            break
    return " / ".join(senses)


def senses_from_text(text: str) -> str:
    parts = re.split(r"[;]|,(?=\s)", re.sub(r"\s+", " ", text).strip())
    senses = []
    for part in parts:
        part = clean_sense(part)
        if part and part.lower() not in {item.lower() for item in senses}:
            senses.append(part)
        if len(senses) == 3:
            break
    return " / ".join(senses)


def head_before_examples(raw: str) -> str:
    """Keep the head Russian senses. Bold spans in Maciev are Chechen examples, not meanings."""
    text = (raw or "").split("◊")[0]
    text = re.sub(r"\[[^\]]*\]", " ", text)
    before_bold = re.split(r"<b\b", text, maxsplit=1)[0]
    before_plain = re.sub(r"\([^)]*\)", " ", plain(before_bold))
    before_plain = re.sub(
        r"^(?:прил\.\s*к|масд\.\s*(?:от)?|мн\.\s*от|послелог|в\s+разн\.\s*знач\.)\s*",
        "",
        before_plain.strip(),
        flags=re.I,
    )
    words = re.findall(r"[А-Яа-яЁё]+", before_plain)
    has_head = any(len(word) >= 3 or word.lower() in SHORT_GLOSS for word in words)
    if not has_head:
        match = re.search(r"</b>\s*([^;<]{2,80})", text, flags=re.I | re.S)
        head = match.group(1) if match else ""
        return senses_from_text(plain(head))
    cleaned = re.sub(r"<b\b[^>]*>.*?</b>\s*[^;]*", " ", text, flags=re.S | re.I)
    cleaned = re.split(r"<br\s*/?>", cleaned, maxsplit=1)[0]
    return senses_from_text(plain(cleaned))


def head_from_baisultanov(raw: str) -> str:
    text = re.split(r"<br\s*/?>", raw or "", maxsplit=1)[0].split("◊")[0]
    return senses_from_text(plain(text))


def gloss_leaks_chechen(gloss: str, lemma: str) -> bool:
    text = gloss or ""
    if CHE_LEAK.search(text) or "◊" in text:
        return True
    if re.search(r"[а-яё]\)$", text.strip(), re.I) and "(" not in text:
        return True
    senses = [part.strip() for part in text.split(" / ") if part.strip()]
    lemma_key = (lemma or "").lower()
    for sense in senses:
        if re.match(r"^(?:к\s+\S|послелог|в\s+разн)", sense, re.I):
            return True
        tokens = re.findall(r"[А-Яа-яЁёӀ]+", sense)
        if any(token.lower() in CHE_VERBS for token in tokens):
            return True
        if len(lemma_key) >= 3 and len(tokens) > 1:
            for token in tokens:
                token_key = token.lower()
                if token_key == lemma_key or token_key.startswith(lemma_key):
                    return True
        if re.match(r"^(?:с\.\s*-\s*х\.)", sense, re.I):
            return True
    if (
        len(lemma_key) >= 3
        and len(senses) >= 2
        and all(
            len(re.findall(r"[А-Яа-яЁёӀ]+", sense)) == 1
            and sense.lower().startswith(lemma_key)
            and sense.upper() != lemma
            for sense in senses
        )
    ):
        return True
    return False


def strip_plural_crumb(gloss: str) -> str:
    """Ismailov writes «седа, – рчий – звезда». The short piece is a plural ending, not the meaning."""
    text = (gloss or "").strip()
    match = re.match(r"^([А-Яа-яЁёӀ]{1,6})\s*[–—-]\s*(.+)$", text)
    if not match or " " in match.group(1):
        return text
    rest = match.group(2).strip()
    if not rest:
        return text
    return rest[:1].upper() + rest[1:]


def pick_article_gloss(payload: dict, query: str) -> tuple[str, str]:
    qn = normalize_lemma(query)
    blocks = payload.get("data") or []

    def iter_items():
        order = {name: i for i, name in enumerate(PREFERRED)}
        ranked = []
        for block in blocks:
            table = block.get("dictTableName") or ""
            rank = order.get(table, 50)
            if "math" in table or "anat" in table or "jurid" in table or "phys" in table:
                rank += 20
            ranked.append((rank, block))
        ranked.sort(key=lambda x: x[0])
        for _, block in ranked:
            for item in block.get("words") or []:
                yield block, item

    for block, item in iter_items():
        table = block.get("dictTableName") or ""
        if table not in PREFERRED:
            continue
        head = re.sub(r"\d+$", "", normalize_lemma(item.get("word1") or item.get("word") or ""))
        if head != qn:
            continue
        raw = item.get("translate") or ""
        low = plain(raw).lower()
        if qn == "СА" and ("милостын" in low or "подаяние" in low):
            continue
        if table == "baisultanov_ce_ru":
            gloss = head_from_baisultanov(raw)
        else:
            gloss = head_before_examples(raw)
        gloss = strip_plural_crumb(gloss)
        if gloss:
            return gloss, table
    return "", ""


def levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def suggestion_lemma(payload: dict, query: str) -> str:
    qn = normalize_lemma(query)
    best = ""
    best_d = 99
    for item in payload.get("suggestedWords") or []:
        cand = normalize_lemma(item.get("word1") or item.get("word") or "")
        if not cand or not re.search(r"[А-ЯЁӀ]", cand):
            continue
        if re.fullmatch(r"[А-ЯЁ]+", cand) and "Ӏ" not in cand and "Ь" not in cand and "Ъ" not in cand:
            if cand in {"ТРУБА", "ГАРАЖ", "САЛО", "ДУША", "МИНИСТР", "СПИНОР", "ХИНА"}:
                continue
        d = levenshtein(qn, cand)
        if d < best_d and 0 < d <= 2:
            if cand.startswith(qn) and len(cand) - len(qn) <= 2:
                continue
            best, best_d = cand, d
    return best


def fetch_one(word: str) -> dict:
    q = word.strip().lower()
    data = urllib.parse.urlencode({"word": q, "lang": "ce"}).encode()
    req = urllib.request.Request(
        URL,
        data=data,
        headers={"User-Agent": "WordRamLexiconRebuild/1.0"},
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def load_cache() -> dict:
    if CACHE.exists():
        return json.loads(CACHE.read_text())
    return {}


def save_cache(cache: dict) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False))


def fetch_all(lemmas: list[str], cache: dict) -> dict:
    missing = [w for w in lemmas if w not in cache]
    print("cache", len(cache), "to_fetch", len(missing), flush=True)
    if not missing:
        return cache
    n = 0
    with ThreadPoolExecutor(max_workers=5) as pool:
        futs = {pool.submit(fetch_one, w): w for w in missing}
        for fut in as_completed(futs):
            w = futs[fut]
            n += 1
            try:
                cache[w] = fut.result()
            except Exception as e:
                cache[w] = {"error": str(e), "data": [], "suggestedWords": []}
            if n % 50 == 0:
                save_cache(cache)
                print("fetched", n, "/", len(missing), flush=True)
    save_cache(cache)
    return cache


def rebuild_entry(item: dict, gloss: str, word: str) -> dict:
    tiles = tokenize(word)
    return {
        "word": word,
        "translation": gloss,
        "languageLevel": item.get("languageLevel") or "A1",
        "gameDifficulty": item.get("gameDifficulty") or 1,
        "partOfSpeech": item.get("partOfSpeech") or "noun",
        "tiles": tiles,
        "tileCount": len(tiles),
    }


def js_dump(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


def main() -> None:
    words = json.loads((ROOT / "chechen.json").read_text())
    lemmas = [w["word"] for w in words]
    cache = load_cache()
    cache = fetch_all(lemmas, cache)

    by_word = {w["word"]: w for w in words}
    used = set()
    rebuilt = []
    renamed = []
    dropped = []
    updated = []

    def accept(orig: dict, new_word: str, gloss: str, why: str):
        nw = normalize_lemma(new_word)
        if nw in used:
            dropped.append({"word": orig["word"], "reason": "duplicate:" + nw})
            return
        if not gloss:
            gloss = orig.get("translation") or nw
        used.add(nw)
        rebuilt.append(rebuild_entry(orig, gloss, nw))
        if nw != orig["word"]:
            renamed.append({"from": orig["word"], "to": nw, "gloss": gloss, "why": why})
        else:
            updated.append({"word": nw, "gloss": gloss, "why": why})

    plans = []
    extra_needed = []
    for orig in words:
        w0 = orig["word"]
        w = FORCED_LEMMA.get(w0, w0)
        payload = cache.get(w) or cache.get(w0) or {}
        gloss, src = pick_article_gloss(payload, w)
        if gloss:
            plans.append(("hit", orig, w, gloss, src or "hit"))
            continue
        sugg = suggestion_lemma(payload, w)
        if sugg and sugg != normalize_lemma(w):
            extra_needed.append(sugg)
            plans.append(("try-sugg", orig, sugg, "", "suggest"))
        else:
            plans.append(("drop", orig, w, "", "not-in-dikdosham"))

    extra_needed = [w for w in extra_needed if w not in cache]
    if extra_needed:
        print("extra lookups", len(extra_needed), flush=True)
        cache = fetch_all(extra_needed, cache)

    for kind, orig, w, gloss, why in plans:
        if kind == "drop":
            dropped.append({"word": orig["word"], "reason": why, "old": orig.get("translation")})
            continue
        if kind == "try-sugg":
            pay2 = cache.get(w) or {}
            gloss2, src2 = pick_article_gloss(pay2, w)
            if gloss2:
                accept(orig, w, gloss2, "suggest:" + (src2 or w))
            else:
                dropped.append({"word": orig["word"], "reason": "suggest-miss:" + w, "old": orig.get("translation")})
            continue
        accept(orig, w, gloss, why)

    rebuilt.sort(key=lambda x: (x["languageLevel"], x["tileCount"], x["word"]))

    dictionary = defaultdict(lambda: defaultdict(list))
    definitions = {}
    for item in rebuilt:
        lvl = item["languageLevel"]
        dictionary[lvl][str(item["tileCount"])].append(item["word"])
        definitions[item["word"]] = {
            "tr": item["translation"],
            "pos": item["partOfSpeech"],
            "level": item["languageLevel"],
            "difficulty": item["gameDifficulty"],
            "tiles": item["tiles"],
            "tileCount": item["tileCount"],
        }

    dict_out = {}
    for lvl in ["A1", "A2", "B1", "B2", "C1", "C2"]:
        if lvl not in dictionary:
            continue
        dict_out[lvl] = {k: dictionary[lvl][k] for k in sorted(dictionary[lvl], key=lambda x: int(x))}

    (ROOT / "chechen.json").write_text(json.dumps(rebuilt, ensure_ascii=False, indent=4) + "\n")

    ce_path = ROOT / "data-ce.js"
    src = ce_path.read_text()
    prefix = src.split("  dictionary:", 1)[0]

    rename = {r["from"]: r["to"] for r in renamed}

    def map_theme_word(w):
        w2 = rename.get(w, w)
        return w2 if w2 in definitions else None

    theme_block_match = re.search(r"  themes: \{.*?\n  placementTestWords:", src, re.S)
    if not theme_block_match:
        raise SystemExit("themes block not found")
    # Keep theme structure, remap words
    theme_src = src[src.find("  themes: {") : src.find("  placementTestWords:")]
    def repl_list(match):
        inner = match.group(1)
        words_in = re.findall(r'"([^"]+)"', inner)
        mapped = []
        for tw in words_in:
            mw = map_theme_word(tw)
            if mw and mw not in mapped:
                mapped.append(mw)
        return "words: [" + ", ".join(f'"{x}"' for x in mapped) + "]"

    theme_src = re.sub(r"words: \[([^\]]*)\]", repl_list, theme_src)

    place_src = src[src.find("  placementTestWords:") :]
    def map_place(m):
        w = m.group(1)
        nw = rename.get(w, w)
        if nw not in definitions:
            return m.group(0)
        return m.group(0).replace(f'"{w}"', f'"{nw}"', 1)

    place_src = re.sub(r'\{ word: "([^"]+)"', map_place, place_src)

    new_ce = (
        prefix
        + "  dictionary: "
        + js_dump(dict_out)
        + ",\n  definitions: "
        + js_dump(definitions)
        + ",\n  wordsList: "
        + js_dump(rebuilt)
        + ",\n"
        + theme_src
        + place_src
    )
    # theme_src already includes leading spaces and themes; prefix ended with WordRamDataCE = {\n
    # Fix double themes if any
    ce_path.write_text(new_ce)

    report = {
        "input": len(words),
        "kept": len(rebuilt),
        "updated": len(updated),
        "renamed": renamed,
        "dropped_n": len(dropped),
        "dropped_sample": dropped[:40],
        "levels": {lvl: sum(len(v) for v in dict_out.get(lvl, {}).values()) for lvl in dict_out},
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({k: report[k] for k in ["input", "kept", "updated", "dropped_n", "levels"]}, ensure_ascii=False, indent=2), flush=True)
    print("renamed", len(renamed), "report", REPORT, flush=True)


if __name__ == "__main__":
    main()
