#!/usr/bin/env python3
"""Apply verified DikDosham fixes to the rebuilt Chechen lexicon without wiping phonetics."""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MULTI = ["АЬ", "ОЬ", "УЬ", "БӀ", "ГӀ", "ДӀ", "ЖӀ", "КХ", "КЪ", "КӀ", "МӀ", "ПӀ", "ТӀ", "ХЬ", "ХӀ", "ЦӀ", "ЧӀ"]
CYR = set("АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯӀ")


def tokenize(word: str) -> list[str]:
    w = word.upper().replace("I", "Ӏ").replace("І", "Ӏ")
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


def entry(word, tr, level, pos, difficulty=1):
    tiles = tokenize(word)
    return {
        "word": word,
        "translation": tr,
        "languageLevel": level,
        "gameDifficulty": difficulty,
        "partOfSpeech": pos,
        "tiles": tiles,
        "tileCount": len(tiles),
    }


def write_data_ce(items: list[dict]) -> None:
    items = sorted(items, key=lambda x: (x["languageLevel"], x["tileCount"], x["word"]))
    dictionary = defaultdict(lambda: defaultdict(list))
    definitions = {}
    for item in items:
        dictionary[item["languageLevel"]][str(item["tileCount"])].append(item["word"])
        defn = {
            "tr": item["translation"],
            "pos": item["partOfSpeech"],
            "level": item["languageLevel"],
            "difficulty": item["gameDifficulty"],
            "tiles": item["tiles"],
            "tileCount": item["tileCount"],
        }
        if item.get("ex"):
            defn["ex"] = item["ex"]
        definitions[item["word"]] = defn
    dict_out = {}
    for lvl in ["A1", "A2", "B1", "B2", "C1", "C2"]:
        if lvl not in dictionary:
            continue
        dict_out[lvl] = {k: dictionary[lvl][k] for k in sorted(dictionary[lvl], key=lambda x: int(x))}

    ce_path = ROOT / "data-ce.js"
    src = ce_path.read_text()
    prefix = src.split("  dictionary:", 1)[0]
    theme_src = src[src.find("  themes: {") : src.find("  placementTestWords:")]
    place_src = src[src.find("  placementTestWords:") :]
    known = {i["word"] for i in items}

    def repl_list(match):
        inner = match.group(1)
        words_in = re.findall(r'"([^"]+)"', inner)
        mapped = [w for w in words_in if w in known]
        return "words: [" + ", ".join(f'"{x}"' for x in mapped) + "]"

    theme_src = re.sub(r"words: \[([^\]]*)\]", repl_list, theme_src)
    new_ce = (
        prefix
        + "  dictionary: "
        + json.dumps(dict_out, ensure_ascii=False, indent=2)
        + ",\n  definitions: "
        + json.dumps(definitions, ensure_ascii=False, indent=2)
        + ",\n  wordsList: "
        + json.dumps(items, ensure_ascii=False, indent=2)
        + ",\n"
        + theme_src
        + place_src
    )
    ce_path.write_text(new_ce)
    (ROOT / "chechen.json").write_text(json.dumps(items, ensure_ascii=False, indent=4) + "\n")


def main() -> None:
    items = json.loads((ROOT / "chechen.json").read_text())
    by = {w["word"]: w for w in items}

    # Confirmed in DikDosham: со = I; вон = bad; Ӏуьйре = morning.
    by["СО"]["translation"] = "Я"
    by["СО"]["partOfSpeech"] = "pronoun"

    add = [
        entry("ВОН", "Плохой / злой", "A1", "adjective"),
        entry("ӀУЬЙРЕ", "Утро", "A1", "noun"),
    ]
    # False friends from auto-suggest — not the original game words.
    drop = {"ХЬОВХ", "ХИНА", "МИНИСТР", "СПИНОР", "НЕКИЙ"}
    items = [w for w in by.values() if w["word"] not in drop]
    have = {w["word"] for w in items}
    for extra in add:
        if extra["word"] not in have:
            items.append(extra)
            have.add(extra["word"])

    write_data_ce(items)
    print("words", len(items), "phonetics", "ChechenPhonetics" in (ROOT / "data-ce.js").read_text())


if __name__ == "__main__":
    main()
