
if (typeof require !== "undefined") {
  if (typeof WordRamDataCE === "undefined") {
    try {
      const ce = require("./data-ce.js");
      if (ce.WordRamTokenizer) global.WordRamTokenizer = ce.WordRamTokenizer;
      if (ce.WordRamDataCE) global.WordRamDataCE = ce.WordRamDataCE;
    } catch (e) {}
  }
  if (typeof WordRamDataEN === "undefined") {
    try {
      const en = require("./data-en.js");
      if (en.WordRamDataEN) global.WordRamDataEN = en.WordRamDataEN;
    } catch (e) {}
  }
}

/**
 * WordRam - Unified Data Engine Facade (v51)
 * Bridges WordRamDataEN and WordRamDataCE cleanly based on active language.
 */

const WordRamData = {
  monstersStages: [
    {
      id: 1,
      name: "Морская губка",
      icon: "🧽",
      startLevel: 1,
      endLevel: 20,
      milestones: [
        { level: 5, label: "5 ур.", icon: "🎁", title: "Сундук монет" },
        { level: 10, label: "10 ур.", icon: "📖", title: "Книга слов" },
        { level: 20, label: "20 ур.", icon: "🪼", title: "Медуза" }
      ]
    },
    {
      id: 2,
      name: "Медуза",
      icon: "🪼",
      startLevel: 21,
      endLevel: 45,
      milestones: [
        { level: 25, label: "25 ур.", icon: "🎁", title: "Сундук монет" },
        { level: 35, label: "35 ур.", icon: "📖", title: "Книга слов" },
        { level: 45, label: "45 ур.", icon: "🐌", title: "Улитка" }
      ]
    },
    {
      id: 3,
      name: "Улитка",
      icon: "🐌",
      startLevel: 46,
      endLevel: 70,
      milestones: [
        { level: 50, label: "50 ур.", icon: "🎁", title: "Сундук монет" },
        { level: 60, label: "60 ур.", icon: "📖", title: "Книга слов" },
        { level: 70, label: "70 ур.", icon: "🦉", title: "Сова" }
      ]
    },
    {
      id: 4,
      name: "Мудрая Сова",
      icon: "🦉",
      startLevel: 71,
      endLevel: 95,
      milestones: [
        { level: 75, label: "75 ур.", icon: "🎁", title: "Сундук монет" },
        { level: 85, label: "85 ур.", icon: "📖", title: "Книга слов" },
        { level: 95, label: "95 ур.", icon: "🦊", title: "Лисенок" }
      ]
    },
    {
      id: 5,
      name: "Лисенок-полиглот",
      icon: "🦊",
      startLevel: 96,
      endLevel: 125,
      milestones: [
        { level: 100, label: "100 ур.", icon: "🎁", title: "Сундук мастера" },
        { level: 115, label: "115 ур.", icon: "📖", title: "Книга слов" },
        { level: 125, label: "125 ур.", icon: "👑", title: "Корона мастера" }
      ]
    }
  ],

  xpRanks: [
    { code: "A1", title: "Начальный (A1)", badge: "A1 — Elementary", minXp: 0, nextXp: 400 },
    { code: "A2", title: "Базовый (A2)", badge: "A2 — Pre-Intermediate", minXp: 400, nextXp: 1000 },
    { code: "B1", title: "Средний (B1)", badge: "B1 — Intermediate", minXp: 1000, nextXp: 2200 },
    { code: "B2", title: "Выше среднего (B2)", badge: "B2 — Upper-Intermediate", minXp: 2200, nextXp: 4000 },
    { code: "C1", title: "Продвинутый (C1)", badge: "C1 — Advanced", minXp: 4000, nextXp: 7000 }
  ],

  leagues: [
    { id: 1, name: "Бронзовая лига", icon: "🥉", color: "#cd7f32", minXpWeek: 0, rewardCoins: 50 },
    { id: 2, name: "Серебряная лига", icon: "🥈", color: "#94a3b8", minXpWeek: 200, rewardCoins: 100 },
    { id: 3, name: "Золотая лига", icon: "🥇", color: "#f59e0b", minXpWeek: 500, rewardCoins: 180 },
    { id: 4, name: "Алмазная лига", icon: "💎", color: "#06b6d4", minXpWeek: 1000, rewardCoins: 300 },
    { id: 5, name: "Лига Мастеров", icon: "👑", color: "#a855f7", minXpWeek: 2000, rewardCoins: 500 }
  ],

  dailyQuestsTemplates: [
    { id: "find_words", title: "Сыщик слов", desc: "Найдите 8 любых слов на игровом поле", target: 8, rewardCoins: 20, rewardXp: 40 },
    { id: "no_hints", title: "Чистый разум", desc: "Пройдите 2 уровня без использования подсказок", target: 2, rewardCoins: 25, rewardXp: 50 },
    { id: "vocab_review", title: "Любознательность", desc: "Откройте и изучите 3 карточки в словаре", target: 3, rewardCoins: 15, rewardXp: 30 }
  ],

  achievements: [
    { id: "first_words", icon: "🐣", title: "Первые шаги", desc: "Собрать первые 10 слов в словаре", target: 10, type: "words", rewardCoins: 25 },
    { id: "bookworm", icon: "📚", title: "Книжный червь", desc: "Собрать 50 слов в личный словарь", target: 50, type: "words", rewardCoins: 50 },
    { id: "linguist", icon: "🎓", title: "Лингвист", desc: "Собрать 150 слов в словаре", target: 150, type: "words", rewardCoins: 100 },
    { id: "polyglot", icon: "👑", title: "Полиглот", desc: "Собрать 500 слов в словаре", target: 500, type: "words", rewardCoins: 250 },
    { id: "streak_3", icon: "🔥", title: "Ударный режим", desc: "Играть 3 дня подряд", target: 3, type: "streak", rewardCoins: 35 },
    { id: "streak_7", icon: "⚡", title: "Неделя без пропусков", desc: "Играть 7 дней подряд", target: 7, type: "streak", rewardCoins: 100 },
    { id: "no_hints", icon: "💡", title: "Острый ум", desc: "Пройти 5 уровней без подсказок", target: 5, type: "no_hints", rewardCoins: 50 },
    { id: "blitz_master", icon: "🎯", title: "Мастер блица", desc: "Дать 15 правильных ответов в Блиц-повторении", target: 15, type: "blitz", rewardCoins: 60 },
    { id: "bonus_hunter", icon: "🌟", title: "Эрудит", desc: "Найти 10 бонусных скрытых слов", target: 10, type: "bonus_words", rewardCoins: 50 },
    { id: "explorer", icon: "🗺️", title: "Исследователь", desc: "Пройти уровень на сетке 6x6 или больше", target: 1, type: "big_grid", rewardCoins: 40 },
    { id: "grandmaster", icon: "🏆", title: "Гроссмейстер", desc: "Пройти уровень на сетке 8x8 или 9x9", target: 1, type: "huge_grid", rewardCoins: 80 }
  ],

  dailyStreakRewards: [
    { day: 1, coins: 15, hints: 0, label: "День 1" },
    { day: 2, coins: 25, hints: 0, label: "День 2" },
    { day: 3, coins: 40, hints: 1, label: "Сундук 3 дн. 🎁" },
    { day: 4, coins: 30, hints: 0, label: "День 4" },
    { day: 5, coins: 45, hints: 0, label: "День 5" },
    { day: 6, coins: 50, hints: 1, label: "День 6" },
    { day: 7, coins: 120, hints: 2, label: "Мега-Сундук 👑" }
  ],

  placementTestWords: [
    { word: "FAMILY", level: "A1" },
    { word: "BREAD", level: "A1" },
    { word: "HAPPY", level: "A1" },
    { word: "ISLAND", level: "A2" },
    { word: "WEATHER", level: "A2" },
    { word: "JOURNEY", level: "A2" },
    { word: "BREEZE", level: "B1" },
    { word: "CASCADE", level: "B1" },
    { word: "COMPASS", level: "B1" },
    { word: "GENUINE", level: "B2" },
    { word: "HABITAT", level: "B2" },
    { word: "HERITAGE", level: "B2" },
    { word: "ENTROPY", level: "C1" },
    { word: "EPITOME", level: "C1" },
    { word: "CATALYST", level: "C1" }
  ],


  get cefrDictionary() {
    return (typeof WordRamDataEN !== "undefined") ? WordRamDataEN.cefrDictionary : {};
  },

  get wordDefinitions() {
    return (typeof WordRamDataEN !== "undefined") ? WordRamDataEN.wordDefinitions : {};
  },

  get themes() {
    return (typeof WordRamDataEN !== "undefined") ? WordRamDataEN.themes : {};
  },

  get placementTestWords() {
    return (typeof WordRamDataEN !== "undefined") ? WordRamDataEN.placementTestWords : [];
  },

  get chechenDictionary() {
    return (typeof WordRamDataCE !== "undefined") ? WordRamDataCE.dictionary : {};
  },

  get chechenDefinitions() {
    return (typeof WordRamDataCE !== "undefined") ? WordRamDataCE.definitions : {};
  },

  get chechenWordsList() {
    return (typeof WordRamDataCE !== "undefined") ? WordRamDataCE.wordsList : [];
  },

  get chechenThemes() {
    return (typeof WordRamDataCE !== "undefined") ? WordRamDataCE.themes : {};
  },

  get chechenPlacementTestWords() {
    return (typeof WordRamDataCE !== "undefined") ? WordRamDataCE.placementTestWords : [];
  },

  getWordMastery(wordsCount, lang = "english") {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined") {
      const ranks = WordRamDataCE.masteryRanks;
      let currentRank = ranks[0];
      for (const r of ranks) {
        if (wordsCount >= r.threshold) currentRank = r;
        else break;
      }
      return currentRank;
    }
    const ranks = (typeof WordRamDataEN !== "undefined") ? WordRamDataEN.masteryRanks : [];
    let currentRank = ranks[0] || { threshold: 0, title: "Новичок", desc: "Начало пути" };
    for (const r of ranks) {
      if (wordsCount >= r.threshold) currentRank = r;
      else break;
    }
    return currentRank;
  },



  getLevelPackingConfig(levelNumber, userCefr = "A2") {
    let gridSize = 5;
    let wordLengths = [5, 5, 5, 5, 5];

    if (levelNumber <= 5) {
      gridSize = 4;
      const templates4 = [
        [4, 4, 4, 4],
        [3, 4, 4, 5],
        [5, 5, 6]
      ];
      wordLengths = templates4[(levelNumber - 1) % templates4.length];
    } else if (levelNumber <= 25) {
      gridSize = 5;
      const templates5 = [
        [5, 5, 5, 5, 5],
        [4, 5, 5, 5, 6],
        [4, 4, 5, 6, 6],
        [3, 4, 5, 6, 7]
      ];
      wordLengths = templates5[(levelNumber - 6) % templates5.length];
    } else if (levelNumber <= 50) {
      gridSize = 6;
      const templates6 = [
        [6, 6, 6, 6, 6, 6],
        [5, 5, 6, 6, 7, 7],
        [4, 5, 6, 7, 7, 7],
        [5, 5, 5, 6, 7, 8]
      ];
      wordLengths = templates6[(levelNumber - 26) % templates6.length];
    } else if (levelNumber <= 75) {
      gridSize = 7;
      const templates7 = [
        [7, 7, 7, 7, 7, 7, 7],
        [6, 6, 7, 7, 7, 8, 8],
        [5, 6, 7, 7, 8, 8, 8]
      ];
      wordLengths = templates7[(levelNumber - 51) % templates7.length];
    } else if (levelNumber <= 100) {
      gridSize = 8;
      const templates8 = [
        [8, 8, 8, 8, 8, 8, 8, 8],
        [7, 7, 8, 8, 8, 8, 9, 9],
        [6, 7, 7, 8, 8, 9, 9, 10]
      ];
      wordLengths = templates8[(levelNumber - 76) % templates8.length];
    } else {
      gridSize = 9;
      const templates9 = [
        [6, 7, 7, 8, 8, 9, 9, 9, 9, 9],
        [7, 7, 7, 8, 8, 8, 9, 9, 9, 9]
      ];
      wordLengths = templates9[(levelNumber - 101) % templates9.length];
    }

    const themeKeys = ["food", "nature", "family", "body", "animals", "city", "work", "culture", "education", "society"];
    const themeKey = themeKeys[(levelNumber - 1) % themeKeys.length];

    return {
      level: levelNumber,
      gridSize: gridSize,
      wordLengths: wordLengths,
      themeKey: themeKey,
      rewardCoins: 15 + Math.floor(levelNumber / 10) * 5
    };
  },

  getWordDetails(word, lang = null) {
    if (!word) return null;
    const rawStr = String(word).trim().toUpperCase();

    const isChechenMode = (lang === "chechen");
    const hasCyrillic = /[А-ЯЁӀ]/i.test(rawStr);

    if (typeof WordRamDataCE !== "undefined" && (isChechenMode || hasCyrillic)) {
      const normCe = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.normalizeChechen(rawStr) : rawStr;
      if (WordRamDataCE.definitions && WordRamDataCE.definitions[normCe]) {
        const def = WordRamDataCE.definitions[normCe];
        const rawTr = def.tr || normCe;
        const trCap = rawTr.charAt(0).toUpperCase() + rawTr.slice(1);
        return {
          word: normCe,
          tr: trCap,
          def: "Чеченский язык (Уровень " + def.level + ", сложность: " + def.difficulty + "/5)",
          pos: def.pos,
          level: def.level,
          difficulty: def.difficulty,
          tiles: def.tiles,
          tileCount: def.tileCount,
          ph: "",
          ex: "",
          collocations: []
        };
      }
      return {
        word: normCe,
        tr: normCe.charAt(0).toUpperCase() + normCe.slice(1).toLowerCase(),
        def: "Чеченский язык",
        pos: null,
        level: "A1",
        difficulty: 1,
        tiles: (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.tokenize(normCe, "chechen") : normCe.split(""),
        tileCount: (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(normCe, "chechen") : normCe.length,
        ph: "",
        ex: "",
        collocations: []
      };
    }

    if (typeof WordRamDataEN !== "undefined" && WordRamDataEN.wordDefinitions && WordRamDataEN.wordDefinitions[rawStr]) {
      return {
        word: rawStr,
        ...WordRamDataEN.wordDefinitions[rawStr]
      };
    }

    return {
      word: rawStr,
      tr: rawStr.charAt(0).toUpperCase() + rawStr.slice(1).toLowerCase(),
      def: "Слово словаря английского языка.",
      ph: "",
      ex: "",
      collocations: []
    };
  },

  evaluatePlacementTest(answers, lang = "english") {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined") {
      return WordRamDataCE.evaluatePlacementTest(answers);
    }
    if (typeof WordRamDataEN !== "undefined") {
      return WordRamDataEN.evaluatePlacementTest(answers);
    }
    return { code: "A1", badge: "A1", title: "A1", desc: "", startingXp: 0 };
  },

  evaluateChechenPlacementTest(answers) {
    return this.evaluatePlacementTest(answers, "chechen");
  },

  getWordForCefrAndLength(cefrLevel, targetLen, exclude = [], themeKey = null, lang = "english") {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined") {
      const rankOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
      const userRankIdx = Math.max(0, rankOrder.indexOf(cefrLevel));
      const strLen = String(targetLen);

      // 1. Theme words
      if (themeKey && WordRamDataCE.themes && WordRamDataCE.themes[themeKey]) {
        const themeWords = WordRamDataCE.themes[themeKey].words;
        const themedAvailable = themeWords.filter(w => {
          if (exclude.includes(w)) return false;
          const tCount = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(w, "chechen") : w.length;
          return tCount === targetLen;
        });
        if (themedAvailable.length > 0) {
          return themedAvailable[Math.floor(Math.random() * themedAvailable.length)];
        }
      }

      // 2. Current level
      if (WordRamDataCE.dictionary[cefrLevel] && WordRamDataCE.dictionary[cefrLevel][strLen]) {
        const available = WordRamDataCE.dictionary[cefrLevel][strLen].filter(w => !exclude.includes(w));
        if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
      }

      // 3. Lower levels
      for (let i = userRankIdx - 1; i >= 0; i--) {
        const lowerLvl = rankOrder[i];
        if (WordRamDataCE.dictionary[lowerLvl] && WordRamDataCE.dictionary[lowerLvl][strLen]) {
          const available = WordRamDataCE.dictionary[lowerLvl][strLen].filter(w => !exclude.includes(w));
          if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
        }
      }

      // 4. Higher levels
      for (let i = userRankIdx + 1; i < rankOrder.length; i++) {
        const higherLvl = rankOrder[i];
        if (WordRamDataCE.dictionary[higherLvl] && WordRamDataCE.dictionary[higherLvl][strLen]) {
          const available = WordRamDataCE.dictionary[higherLvl][strLen].filter(w => !exclude.includes(w));
          if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
        }
      }

      // 5. Any level
      for (const lvl of rankOrder) {
        if (WordRamDataCE.dictionary[lvl] && WordRamDataCE.dictionary[lvl][strLen]) {
          const words = WordRamDataCE.dictionary[lvl][strLen];
          if (words.length > 0) return words[Math.floor(Math.random() * words.length)];
        }
      }

      // Fallback for Chechen if exact length is not found
      for (const lvl of ["C2", "C1", "B2", "B1", "A2", "A1"]) {
        if (WordRamDataCE.dictionary[lvl]) {
          for (const k in WordRamDataCE.dictionary[lvl]) {
            const list = WordRamDataCE.dictionary[lvl][k];
            if (list && list.length > 0) {
              for (const w of list) {
                const tCount = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(w, "chechen") : w.length;
                if (tCount === targetLen && !exclude.includes(w)) return w;
              }
            }
          }
        }
      }
      return "ДАХАР".padEnd(targetLen, "А").slice(0, targetLen);
    }

    // English logic
    if (typeof WordRamDataEN === "undefined") return "WORD".padEnd(targetLen, "S").slice(0, targetLen);
    const rankOrder = ["A1", "A2", "B1", "B2", "C1"];
    const userRankIdx = Math.max(0, rankOrder.indexOf(cefrLevel));

    // 1. Theme words
    if (themeKey && WordRamDataEN.themes[themeKey] && WordRamDataEN.cefrDictionary[cefrLevel] && WordRamDataEN.cefrDictionary[cefrLevel][targetLen]) {
      const themeWords = WordRamDataEN.themes[themeKey].words;
      const themedAvailable = WordRamDataEN.cefrDictionary[cefrLevel][targetLen].filter(
        w => themeWords.includes(w) && !exclude.includes(w) && w.length === targetLen
      );
      if (themedAvailable.length > 0) {
        return themedAvailable[Math.floor(Math.random() * themedAvailable.length)];
      }
    }

    // 2. Current level
    if (WordRamDataEN.cefrDictionary[cefrLevel] && WordRamDataEN.cefrDictionary[cefrLevel][targetLen]) {
      const available = WordRamDataEN.cefrDictionary[cefrLevel][targetLen].filter(
        w => !exclude.includes(w) && w.length === targetLen
      );
      if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    }

    // 3. Lower levels
    for (let i = userRankIdx - 1; i >= 0; i--) {
      const lowerLvl = rankOrder[i];
      if (WordRamDataEN.cefrDictionary[lowerLvl] && WordRamDataEN.cefrDictionary[lowerLvl][targetLen]) {
        const available = WordRamDataEN.cefrDictionary[lowerLvl][targetLen].filter(
          w => !exclude.includes(w) && w.length === targetLen
        );
        if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
      }
    }

    // 4. Any level with targetLen ignoring exclude if exhausted
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
      if (WordRamDataEN.cefrDictionary[lvl] && WordRamDataEN.cefrDictionary[lvl][targetLen]) {
        const available = WordRamDataEN.cefrDictionary[lvl][targetLen].filter(w => !exclude.includes(w) && w.length === targetLen);
        if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
      }
    }
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
      if (WordRamDataEN.cefrDictionary[lvl] && WordRamDataEN.cefrDictionary[lvl][targetLen] && WordRamDataEN.cefrDictionary[lvl][targetLen].length > 0) {
        const list = WordRamDataEN.cefrDictionary[lvl][targetLen];
        return list[Math.floor(Math.random() * list.length)];
      }
    }

    for (const lvl of ["C1", "B2", "B1", "A2", "A1"]) {
      if (WordRamDataEN.cefrDictionary[lvl]) {
        for (const k in WordRamDataEN.cefrDictionary[lvl]) {
          const list = WordRamDataEN.cefrDictionary[lvl][k];
          if (list && list.length > 0) {
            for (const w of list) {
              if (w.length === targetLen && !exclude.includes(w)) return w;
            }
          }
        }
      }
    }
    return "DICTIONARY".slice(0, targetLen).padEnd(targetLen, "S");
  },

  isValidWord(word, lang = null) {
    if (!word) return false;
    const rawStr = String(word).trim().toUpperCase();
    const isChechenMode = (lang === "chechen");
    const hasCyrillic = /[А-ЯЁӀ]/i.test(rawStr);

    if (isChechenMode || (hasCyrillic && lang !== "english")) {
      if (typeof WordRamDataCE === "undefined") return false;
      const norm = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.normalizeChechen(rawStr) : rawStr;
      if (WordRamDataCE.definitions && WordRamDataCE.definitions[norm]) return true;
      const tileCount = String((typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(norm, "chechen") : norm.length);
      for (const lvl of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
        if (WordRamDataCE.dictionary && WordRamDataCE.dictionary[lvl] && WordRamDataCE.dictionary[lvl][tileCount] && WordRamDataCE.dictionary[lvl][tileCount].includes(norm)) {
          return true;
        }
      }
      return false;
    }

    if (typeof WordRamDataEN === "undefined" || rawStr.length < 3) return false;
    const len = rawStr.length;
    for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
      if (WordRamDataEN.cefrDictionary[lvl] && WordRamDataEN.cefrDictionary[lvl][len] && WordRamDataEN.cefrDictionary[lvl][len].includes(rawStr)) {
        return true;
      }
    }
    return false;
  }
};

WordRamData.WordRamTokenizer = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer : null;
WordRamData.WordRamData = WordRamData;

if (typeof window !== "undefined") {
  window.WordRamData = WordRamData;
}
if (typeof globalThis !== "undefined") {
  globalThis.WordRamData = WordRamData;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamData;
}
