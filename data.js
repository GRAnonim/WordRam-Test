
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
      story: "Губка только учится словам. Пройди уровни по одному — и она доплывёт до берега.",
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
      story: "Медуза зовёт дальше. Каждое найденное слово — шаг сквозь воду.",
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
      story: "Улитка не спешит. Играй каждый день — так слова остаются в памяти.",
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
      story: "Сова любит точные слова. Чем дальше глава, тем интереснее находки.",
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
      story: "Лисёнок собирает языки. Твой словарь — его сокровище.",
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

  wordOfTheDayPools: {
    english: [
      { word: "COURAGE", ph: "[ˈkʌrɪdʒ]", tr: "Мужество / Смелость / Отвага", ex: "Have the courage to speak — Иметь смелость заговорить." },
      { word: "PERSEVERE", ph: "[ˌpɜːsɪˈvɪə]", tr: "Упорствовать / Стойко продолжать", ex: "Persevere through difficulties — Преодолевать трудности." },
      { word: "GENEROSITY", ph: "[ˌdʒenəˈrɒsɪti]", tr: "Щедрость / Великодушие", ex: "Show true generosity — Проявлять искреннее великодушие." },
      { word: "KNOWLEDGE", ph: "[ˈnɒlɪdʒ]", tr: "Знание / Познание", ex: "Knowledge is power — Знание — сила." },
      { word: "DISCOVERY", ph: "[dɪˈskʌvəri]", tr: "Открытие / Находка", ex: "Make a great discovery — Сделать великое открытие." }
    ],
    chechen: [
      { word: "КЪОНАХ", tr: "Благородный муж / Рыцарь чести", ex: "Къонахчун дош — тешаме. — Слово къонаха надежно." },
      { word: "ОЬЗДАНГАЛЛА", tr: "Благородство / Вежливость / Такт", ex: "Оьздангалла — адамаллин коьрта билгало. — Благородство — главный признак человечности." },
      { word: "НОХЧАЛЛА", tr: "Чеченский кодекс чести и достоинства", ex: "Нохчалла ларъяр — коьрта декхар. — Соблюдение нохчалла — главный долг." },
      { word: "ХЬОШАЛЛА", tr: "Гостеприимство и радушие", ex: "Хьаша варе сатийсар — Ожидание гостя — прекрасный обычай." },
      { word: "СОБАР", tr: "Терпение и выдержка", ex: "Собар — толаман некъ. — Терпение — путь к победе." }
    ]
  },

  _wodPoolCache: {},

  hashString(str) {
    let h = 2166136261;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  },

  getWordOfTheDayPool(lang = "english") {
    const key = lang === "chechen" ? "chechen" : "english";
    if (this._wodPoolCache[key] && this._wodPoolCache[key].length) return this._wodPoolCache[key];
    const words = [];
    if (key === "chechen") {
      const dict = this.chechenDictionary || {};
      ["A1", "A2", "B1", "B2"].forEach((level) => {
        const byLen = dict[level] || {};
        Object.keys(byLen).forEach((lenStr) => {
          const n = parseInt(lenStr, 10);
          if (n < 3 || n > 8) return;
          (byLen[lenStr] || []).forEach((w) => { if (w) words.push(w); });
        });
      });
    } else {
      const dict = this.cefrDictionary || {};
      ["A1", "A2", "B1", "B2"].forEach((level) => {
        const byLen = dict[level] || {};
        Object.keys(byLen).forEach((lenStr) => {
          const n = parseInt(lenStr, 10);
          if (n < 4 || n > 9) return;
          (byLen[lenStr] || []).forEach((w) => { if (w) words.push(w); });
        });
      });
    }
    const fallback = (key === "chechen" ? this.wordOfTheDayPools.chechen : this.wordOfTheDayPools.english)
      .map((item) => item.word);
    this._wodPoolCache[key] = words.length ? words : fallback;
    return this._wodPoolCache[key];
  },

  formatWordOfTheDay(word, lang = "english") {
    const details = this.getWordDetails(word, lang) || {};
    const fallbackPool = lang === "chechen" ? this.wordOfTheDayPools.chechen : this.wordOfTheDayPools.english;
    const fallback = fallbackPool.find((item) => item.word === word) || {};
    return {
      word: details.word || word,
      ph: details.ph || fallback.ph || "",
      tr: details.tr || fallback.tr || "",
      ex: details.ex || fallback.ex || ""
    };
  },

  getWordOfTheDay(lang = "english", dateStr, excludeWords = []) {
    const pool = this.getWordOfTheDayPool(lang);
    const exclude = new Set((excludeWords || []).map((w) => String(w).toUpperCase()));
    let filtered = pool.filter((w) => !exclude.has(String(w).toUpperCase()));
    if (!filtered.length) filtered = pool.slice();
    const seed = `${dateStr || ""}|${lang === "chechen" ? "chechen" : "english"}`;
    const idx = this.hashString(seed) % filtered.length;
    return this.formatWordOfTheDay(filtered[idx], lang);
  },

  applyWordEase(levelCode, ease = "normal", lang = "english") {
    const bands = lang === "chechen"
      ? ["A1", "A2", "B1", "B2", "C1", "C2"]
      : ["A1", "A2", "B1", "B2", "C1"];
    let idx = bands.indexOf(levelCode);
    if (idx < 0) idx = 0;
    if (ease === "easier") idx = Math.max(0, idx - 1);
    if (ease === "harder") idx = Math.min(bands.length - 1, idx + 1);
    return bands[idx];
  },

  leagues: [
    { id: 1, name: "Бронзовая лига", icon: "🥉", color: "#cd7f32", minXpWeek: 0, rewardCoins: 50 },
    { id: 2, name: "Серебряная лига", icon: "🥈", color: "#94a3b8", minXpWeek: 200, rewardCoins: 100 },
    { id: 3, name: "Золотая лига", icon: "🥇", color: "#f59e0b", minXpWeek: 500, rewardCoins: 180 },
    { id: 4, name: "Алмазная лига", icon: "💎", color: "#06b6d4", minXpWeek: 1000, rewardCoins: 300 },
    { id: 5, name: "Лига Мастеров", icon: "👑", color: "#a855f7", minXpWeek: 2000, rewardCoins: 500 }
  ],

  dailyQuestsTemplates: [
    { id: "find_words", title: "Сыщик слов", desc: "Найдите 8 слов на поле", target: 8, rewardCoins: 20, rewardXp: 40 },
    { id: "no_hints", title: "Чистый разум", desc: "2 уровня без подсказок", target: 2, rewardCoins: 25, rewardXp: 50 },
    { id: "vocab_review", title: "Любознательность", desc: "3 карточки в словаре", target: 3, rewardCoins: 15, rewardXp: 30 }
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
    { day: 1, coins: 15, hints: 0, label: "1" },
    { day: 2, coins: 25, hints: 0, label: "2" },
    { day: 3, coins: 40, hints: 1, label: "3" },
    { day: 4, coins: 30, hints: 0, label: "4" },
    { day: 5, coins: 45, hints: 0, label: "5" },
    { day: 6, coins: 50, hints: 1, label: "6" },
    { day: 7, coins: 120, hints: 2, label: "7" }
  ],

  luckyWheelSectors: [
    { label: "+20 🪙", type: "coins", value: 20 },
    { label: "+40 🪙", type: "coins", value: 40 },
    { label: "+1 💡", type: "hints", value: 1 },
    { label: "+50 XP", type: "xp", value: 50 },
    { label: "❄️ Заморозка", type: "freeze", value: 1 },
    { label: "+80 🪙", type: "coins", value: 80 }
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



  getStages(lang = "english") {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined" && WordRamDataCE.stages) {
      return WordRamDataCE.stages;
    }
    return this.monstersStages;
  },

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

  getPlayableDictionary(lang = "english") {
    if (lang === "chechen") return this.chechenDictionary || {};
    return this.cefrDictionary || {};
  },

  getCefrTotals(lang = "english") {
    const dict = this.getPlayableDictionary(lang);
    const totals = {};
    Object.keys(dict).forEach((lvl) => {
      const buckets = dict[lvl] || {};
      let count = 0;
      Object.keys(buckets).forEach((len) => {
        count += (buckets[len] || []).length;
      });
      totals[lvl] = count;
    });
    return totals;
  },

  getLexiconSize(lang = "english") {
    const totals = this.getCefrTotals(lang);
    return Object.values(totals).reduce((sum, n) => sum + n, 0);
  },

  getWordMastery(wordsCount, lang = "english") {
    const size = this.getLexiconSize(lang);
    const source = lang === "chechen" && typeof WordRamDataCE !== "undefined"
      ? WordRamDataCE.masteryRanks
      : ((typeof WordRamDataEN !== "undefined") ? WordRamDataEN.masteryRanks : []);
    const ranks = this.fitMasteryRanks(source, size);
    let currentRank = ranks[0] || { threshold: 0, title: "Новичок", desc: "Начало пути" };
    for (const r of ranks) {
      if (wordsCount >= r.threshold) currentRank = r;
      else break;
    }
    return currentRank;
  },

  fitMasteryRanks(ranks, size) {
    const list = Array.isArray(ranks) ? ranks : [];
    if (!list.length || !size) return list;
    const below = list.filter((r) => r.threshold < size);
    const top = list[list.length - 1];
    below.push({ ...top, threshold: size });
    return below;
  },




  getStages(lang = "english") {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined" && WordRamDataCE.stages) {
      return WordRamDataCE.stages;
    }
    return this.monstersStages;
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
        const extra = (typeof ChechenPhonetics !== "undefined")
          ? ChechenPhonetics.enrich(normCe, def)
          : { ph: "", speakText: normCe, def: "Чеченский язык (Уровень " + def.level + ")", ex: trCap };
        return {
          word: normCe,
          tr: trCap,
          def: extra.def,
          pos: def.pos,
          level: def.level,
          difficulty: def.difficulty,
          tiles: def.tiles,
          tileCount: def.tileCount,
          ph: extra.ph,
          ex: extra.ex,
          speakText: extra.speakText,
          collocations: []
        };
      }
      const tiles = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.tokenize(normCe, "chechen") : normCe.split("");
      const fallbackDef = { tr: normCe, pos: "noun", level: "A1" };
      const extra = (typeof ChechenPhonetics !== "undefined")
        ? ChechenPhonetics.enrich(normCe, fallbackDef)
        : { ph: "", speakText: normCe, def: "Чеченский язык", ex: "" };
      return {
        word: normCe,
        tr: normCe.charAt(0).toUpperCase() + normCe.slice(1).toLowerCase(),
        def: extra.def,
        pos: null,
        level: "A1",
        difficulty: 1,
        tiles: tiles,
        tileCount: tiles.length,
        ph: extra.ph,
        ex: extra.ex,
        speakText: extra.speakText,
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

  evaluatePlacementTest(answers, lang = "english", questions) {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined") {
      return WordRamDataCE.evaluatePlacementTest(answers, questions);
    }
    if (typeof WordRamDataEN !== "undefined") {
      return WordRamDataEN.evaluatePlacementTest(answers, questions);
    }
    return { code: "A1", badge: "A1", title: "A1", desc: "", startingXp: 0 };
  },

  evaluateChechenPlacementTest(answers, questions) {
    return this.evaluatePlacementTest(answers, "chechen", questions);
  },

  _shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  },

  _placementPoolForLevel(lang, level) {
    const out = [];
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined" && WordRamDataCE.dictionary && WordRamDataCE.dictionary[level]) {
      Object.keys(WordRamDataCE.dictionary[level]).forEach((len) => {
        const n = Number(len);
        if (n < 3 || n > 10) return;
        (WordRamDataCE.dictionary[level][len] || []).forEach((word) => {
          out.push({ word, level });
        });
      });
      return out;
    }
    if (typeof WordRamDataEN !== "undefined" && WordRamDataEN.cefrDictionary && WordRamDataEN.cefrDictionary[level]) {
      Object.keys(WordRamDataEN.cefrDictionary[level]).forEach((len) => {
        const n = Number(len);
        if (n < 4 || n > 12) return;
        (WordRamDataEN.cefrDictionary[level][len] || []).forEach((word) => {
          out.push({ word, level });
        });
      });
      return out;
    }
    const fallback = lang === "chechen" ? this.chechenPlacementTestWords : this.placementTestWords;
    return (fallback || []).filter((item) => item.level === level);
  },

  buildPlacementQuiz(lang = "english") {
    const bands = lang === "chechen" ? ["A1", "A2", "B1", "B2", "C1", "C2"] : ["A1", "A2", "B1", "B2", "C1"];
    const picked = [];
    const used = {};
    bands.forEach((level) => {
      const pool = this._placementPoolForLevel(lang, level).filter((item) => !used[item.word]);
      this._shuffleInPlace(pool);
      const take = pool.slice(0, 2);
      if (take.length < 2) {
        const fb = (lang === "chechen" ? this.chechenPlacementTestWords : this.placementTestWords) || [];
        fb.filter((item) => item.level === level && !used[item.word]).forEach((item) => {
          if (take.length < 2) take.push(item);
        });
      }
      take.forEach((item) => {
        used[item.word] = true;
        picked.push(item);
      });
    });
    return picked.length ? picked : (lang === "chechen" ? this.chechenPlacementTestWords : this.placementTestWords);
  },

  getWordForCefrAndLength(cefrLevel, targetLen, exclude = [], themeKey = null, lang = "english") {
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined") {
      const strLen = String(targetLen);

      // 1. Приоритет 1: СТРОГО слова заявленной ТЕМЫ точной длины targetLen
      if (themeKey && WordRamDataCE.themes && WordRamDataCE.themes[themeKey]) {
        const themeWords = WordRamDataCE.themes[themeKey].words;
        const themedExact = themeWords.filter(w => {
          if (exclude.includes(w)) return false;
          const tCount = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(w, "chechen") : w.length;
          return tCount === targetLen;
        });
        if (themedExact.length > 0) {
          return themedExact[Math.floor(Math.random() * themedExact.length)];
        }
      }

      // 2. Текущий уровень словаря точной длины targetLen
      if (WordRamDataCE.dictionary[cefrLevel] && WordRamDataCE.dictionary[cefrLevel][strLen]) {
        const available = WordRamDataCE.dictionary[cefrLevel][strLen].filter(w => !exclude.includes(w));
        if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
      }

      // 3. Любой уровень словаря точной длины targetLen (без повторений)
      for (const lvl of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
        if (WordRamDataCE.dictionary[lvl] && WordRamDataCE.dictionary[lvl][strLen]) {
          const available = WordRamDataCE.dictionary[lvl][strLen].filter(w => !exclude.includes(w));
          if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
        }
      }

      // 4. Любой уровень словаря точной длины targetLen (с повторением)
      for (const lvl of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
        if (WordRamDataCE.dictionary[lvl] && WordRamDataCE.dictionary[lvl][strLen]) {
          const list = WordRamDataCE.dictionary[lvl][strLen];
          if (list && list.length > 0) return list[Math.floor(Math.random() * list.length)];
        }
      }

      // 5. Поиск по полному списку 1500 слов ближайшей длины
      if (WordRamDataCE.wordsList) {
        const matching = WordRamDataCE.wordsList.filter(item => {
          const tCount = item.tileCount || ((typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(item.word, "chechen") : item.word.length);
          return tCount === targetLen && !exclude.includes(item.word);
        });
        if (matching.length > 0) {
          return matching[Math.floor(Math.random() * matching.length)].word;
        }
        const nearest = [...WordRamDataCE.wordsList]
          .filter(item => item.word && !exclude.includes(item.word))
          .sort((a, b) => {
            const ca = a.tileCount || a.word.length;
            const cb = b.tileCount || b.word.length;
            return Math.abs(ca - targetLen) - Math.abs(cb - targetLen);
          });
        if (nearest.length > 0) return nearest[0].word;
      }

      return "ДАХАР";
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

    // 4. Any level
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

    return "WORD".padEnd(targetLen, "S").slice(0, targetLen);
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
