/**
 * WordRam - LocalStorage & Gamification State Engine (v41)
 * Multilingual Progress: Independent English & Chechen level progressions,
 * Ultra-reliable Android / iOS persistent save engine with multi-key migration.
 */

class WordRamStorage {
  constructor() {
    this.STORAGE_KEY = "wordram_persistent_save_v1";
    this.LEGACY_KEYS = [
      "wordram_persistent_save_v1",
      "wordram_v28_save",
      "wordram_v21_save",
      "wordram_v19_save",
      "wordram_save",
      "wordram_user_state"
    ];
    this.state = this.load();
    this.bindAutoSaveListeners();
  }

  bindAutoSaveListeners() {
    if (typeof window === "undefined") return;
    try {
      window.addEventListener("beforeunload", () => this.save());
      window.addEventListener("pagehide", () => this.save());
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          this.save();
        }
      });
    } catch (e) {}
  }

  getDefaultProgress(lang = "english") {
    return {
      currentLevel: 1,
      unlockedLevel: 1,
      languageLevel: "A1",
      xp: 0,
      levelStars: {},
      levelHighScores: {},
      collectedWords: {}
    };
  }

  getDefaultState() {
    return {
      language: "english", // "english" | "chechen"
      progress: {
        english: this.getDefaultProgress("english"),
        chechen: this.getDefaultProgress("chechen")
      },
      // Global profile & currencies
      xp: 0,
      weeklyXp: 0,
      hasCompletedPlacementTest: false,
      hasCompletedChechenPlacementTest: false,
      hasChosenLanguage: false,
      unlockedAchievements: [],
      claimedDailyRewards: {},
      coins: 60,
      hintsRemaining: 3,
      hintCost: 15,
      streakFreezes: 0,
      lastWheelSpinDate: null,
      currentLeagueId: 1,
      leagueWeekKey: null,
      claimedMilestones: {},
      soundEnabled: true,
      voiceSpeechEnabled: true,
      vibrationEnabled: true,
      wordEase: "normal",
      weekAlbum: {
        weekKey: null,
        daysPlayed: [],
        stampClaimed: false,
        stamps: []
      },
      weeklyReview: {
        weekKey: null,
        claimed: false,
        wordsByLang: {}
      },
      daily: {
        lastPlayedDate: null,
        streak: 0,
        completed: false,
        lastWodClaimDate: null,
        lastWodClaimByLang: {}
      },
      wodAssign: {
        english: { date: null, word: "", recent: [] },
        chechen: { date: null, word: "", recent: [] }
      },
      dailyQuests: {
        date: null,
        quests: {},
        allClaimed: false
      },
      stats: {
        totalWordsFound: 0,
        bonusWordsFound: 0,
        levelsCompleted: 0,
        hintsUsed: 0,
        noHintLevels: 0,
        blitzCorrectTotal: 0,
        maxGridCompleted: 4
      },
      activeSavedGame: null
    };
  }

  load() {
    try {
      if (typeof localStorage !== "undefined") {
        let rawData = null;
        // Search across all possible keys
        for (const key of this.LEGACY_KEYS) {
          const item = localStorage.getItem(key);
          if (item) {
            rawData = item;
            break;
          }
        }

        if (rawData) {
          const parsed = JSON.parse(rawData);
          const def = this.getDefaultState();
          const state = { ...def, ...parsed };

          if (!state.progress) {
            state.progress = {
              english: {
                currentLevel: parsed.currentLevel || 1,
                unlockedLevel: parsed.unlockedLevel || 1,
                languageLevel: parsed.englishLevel || "A2",
                levelStars: parsed.levelStars || {},
                levelHighScores: parsed.levelHighScores || {},
                collectedWords: parsed.collectedWords || {}
              },
              chechen: this.getDefaultProgress("chechen")
            };
          } else {
            if (!state.progress.english) state.progress.english = this.getDefaultProgress("english");
            if (!state.progress.chechen) state.progress.chechen = this.getDefaultProgress("chechen");
          }

          if (!state.language) state.language = "english";
          if (!state.daily) state.daily = def.daily;
          if (!state.daily.lastWodClaimByLang) state.daily.lastWodClaimByLang = {};
          if (!state.wodAssign) state.wodAssign = def.wodAssign;
          if (!state.wodAssign.english) state.wodAssign.english = { date: null, word: "", recent: [] };
          if (!state.wodAssign.chechen) state.wodAssign.chechen = { date: null, word: "", recent: [] };
          if (!state.wordEase) state.wordEase = "normal";
          if (!state.weekAlbum) state.weekAlbum = def.weekAlbum;
          if (!state.weekAlbum.daysPlayed) state.weekAlbum.daysPlayed = [];
          if (!state.weekAlbum.stamps) state.weekAlbum.stamps = [];
          if (!state.weeklyReview) state.weeklyReview = def.weeklyReview;
          if (!state.claimedMilestones) state.claimedMilestones = {};
          if (!state.claimedDailyRewards) state.claimedDailyRewards = {};
          if (state.progress.english && state.progress.english.xp == null) {
            state.progress.english.xp = state.xp || 0;
          }
          if (state.progress.chechen && state.progress.chechen.xp == null) {
            state.progress.chechen.xp = 0;
          }
          if (!Object.prototype.hasOwnProperty.call(parsed, "hasChosenLanguage")) {
            const en = state.progress.english || {};
            const ce = state.progress.chechen || {};
            const enWords = Object.keys(en.collectedWords || {}).length;
            const ceWords = Object.keys(ce.collectedWords || {}).length;
            state.hasChosenLanguage = !!(
              parsed.hasCompletedPlacementTest ||
              parsed.hasCompletedChechenPlacementTest ||
              (en.unlockedLevel && en.unlockedLevel > 1) ||
              (ce.unlockedLevel && ce.unlockedLevel > 1) ||
              enWords > 0 ||
              ceWords > 0 ||
              (state.stats && state.stats.levelsCompleted > 0)
            );
          }
          return state;
        }
      }
    } catch (e) {
      console.warn("Ошибка чтения LocalStorage", e);
    }
    return this.getDefaultState();
  }

  save() {
    try {
      if (typeof localStorage !== "undefined") {
        const payload = JSON.stringify(this.state);
        localStorage.setItem(this.STORAGE_KEY, payload);
        // Mirror save to legacy key for cross-version safety
        localStorage.setItem("wordram_v28_save", payload);
      }
    } catch (e) {
      console.error("Ошибка сохранения в LocalStorage", e);
    }
  }

  exportCode() {
    return JSON.stringify(this.state);
  }

  importCode(raw) {
    const parsed = JSON.parse(String(raw || "").trim());
    if (!parsed || typeof parsed !== "object" || !parsed.progress) {
      throw new Error("bad-save");
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed));
    }
    this.state = this.load();
    this.save();
  }

  // ----------------------------------------------------
  // Language Management & Independent Progress
  // ----------------------------------------------------
  getLanguage() {
    return this.state.language === "chechen" ? "chechen" : "english";
  }

  setLanguage(lang) {
    this.state.language = lang === "chechen" ? "chechen" : "english";
    this.save();
  }

  getLanguageProgress(lang = this.getLanguage()) {
    if (!this.state.progress) {
      this.state.progress = {
        english: this.getDefaultProgress("english"),
        chechen: this.getDefaultProgress("chechen")
      };
    }
    if (!this.state.progress[lang]) {
      this.state.progress[lang] = this.getDefaultProgress(lang);
    }
    return this.state.progress[lang];
  }

  getCurrentLevel(lang = this.getLanguage()) {
    return this.getLanguageProgress(lang).currentLevel || 1;
  }

  setCurrentLevel(lvl, lang = this.getLanguage()) {
    this.getLanguageProgress(lang).currentLevel = lvl;
    this.save();
  }

  getUnlockedLevel(lang = this.getLanguage()) {
    return this.getLanguageProgress(lang).unlockedLevel || 1;
  }

  setUnlockedLevel(lvl, lang = this.getLanguage()) {
    this.getLanguageProgress(lang).unlockedLevel = lvl;
    this.save();
  }

  getLanguageLevel(lang = this.getLanguage()) {
    return this.getLanguageProgress(lang).languageLevel || "A1";
  }

  setLanguageLevel(levelCode, lang = this.getLanguage()) {
    const prog = this.getLanguageProgress(lang);
    prog.languageLevel = levelCode;
    const rank = (typeof WordRamData !== "undefined" && WordRamData.xpRanks)
      ? WordRamData.xpRanks.find(r => r.code === levelCode)
      : null;
    if (rank && (prog.xp || 0) < rank.minXp) {
      prog.xp = rank.minXp;
    }
    if (lang === "english") {
      this.state.hasCompletedPlacementTest = true;
    } else if (lang === "chechen") {
      this.state.hasCompletedChechenPlacementTest = true;
    }
    this.save();
  }

  getEnglishLevel() {
    return this.getLanguageLevel("english");
  }

  setEnglishLevel(levelCode) {
    this.setLanguageLevel(levelCode, "english");
  }

  getXp(lang = this.getLanguage()) {
    return this.getLanguageProgress(lang).xp || 0;
  }

  getXpProgress(lang = this.getLanguage()) {
    const currentCode = this.getLanguageLevel(lang);
    const ranks = (typeof WordRamData !== "undefined" && WordRamData.xpRanks) ? WordRamData.xpRanks : [];
    const currentRankIdx = ranks.findIndex(r => r.code === currentCode);
    const rank = ranks[currentRankIdx] || ranks[0] || { minXp: 0, nextXp: 500, title: "A1", badge: "A1" };
    const isMax = currentRankIdx === ranks.length - 1;

    const currentXp = this.getLanguageProgress(lang).xp || 0;
    const minXp = rank.minXp || 0;
    const nextXp = rank.nextXp || 500;

    const progress = isMax ? 1.0 : Math.min(1.0, Math.max(0, (currentXp - minXp) / (nextXp - minXp)));

    return {
      currentXp: currentXp,
      minXp: minXp,
      nextXp: nextXp,
      progressRatio: progress,
      percent: Math.round(progress * 100),
      rank: rank,
      isMax: isMax
    };
  }

  addXp(amount, lang = this.getLanguage()) {
    const prog = this.getLanguageProgress(lang);
    const oldLevel = this.getLanguageLevel(lang);
    prog.xp = (prog.xp || 0) + amount;
    this.state.weeklyXp = (this.state.weeklyXp || 0) + amount;
    this.state.xp = (this.getLanguageProgress("english").xp || 0) + (this.getLanguageProgress("chechen").xp || 0);

    const ranks = (typeof WordRamData !== "undefined" && WordRamData.xpRanks) ? WordRamData.xpRanks : [];
    let newLevel = oldLevel;
    for (let i = ranks.length - 1; i >= 0; i--) {
      const r = ranks[i];
      if (prog.xp >= r.minXp) {
        newLevel = r.code;
        break;
      }
    }

    let leveledUp = false;
    if (newLevel !== oldLevel) {
      prog.languageLevel = newLevel;
      leveledUp = true;
    }

    this.save();
    return {
      leveledUp: leveledUp,
      oldLevel: oldLevel,
      newLevel: newLevel,
      xpAdded: amount,
      totalXp: prog.xp
    };
  }

  // ----------------------------------------------------
  // Коллекция словаря и Интервальное повторение
  // ----------------------------------------------------
  recordWordToVocabulary(word, lang = this.getLanguage()) {
    const prog = this.getLanguageProgress(lang);
    const upper = (lang === "chechen" && typeof WordRamTokenizer !== "undefined")
      ? WordRamTokenizer.normalizeChechen(word)
      : word.toUpperCase();

    if (!prog.collectedWords[upper]) {
      prog.collectedWords[upper] = {
        count: 1,
        firstSeen: new Date().toISOString().slice(0, 10),
        mastery: 1,
        language: lang
      };
      this.state.stats.totalWordsFound++;
        this.addXp(10, lang);
    } else {
      prog.collectedWords[upper].count++;
      this.state.stats.totalWordsFound++;
      this.addXp(3, lang);
    }

    this.updateDailyQuestProgress("find_words", 1);
    this.save();
    return this.checkAchievements();
  }

  getCollectedWords(lang = this.getLanguage()) {
    return this.getLanguageProgress(lang).collectedWords || {};
  }

  getCollectedWordsCount(lang = this.getLanguage()) {
    return Object.keys(this.getCollectedWords(lang)).length;
  }

  recordBlitzAnswer(word, isCorrect, lang = this.getLanguage()) {
    const prog = this.getLanguageProgress(lang);
    const upper = (lang === "chechen" && typeof WordRamTokenizer !== "undefined")
      ? WordRamTokenizer.normalizeChechen(word)
      : word.toUpperCase();

    if (prog.collectedWords[upper]) {
      if (isCorrect) {
        prog.collectedWords[upper].mastery = Math.min(3, (prog.collectedWords[upper].mastery || 1) + 1);
        this.state.stats.blitzCorrectTotal++;
      }
    }
    this.save();
    return this.checkAchievements();
  }

  // ----------------------------------------------------
  // Ежедневные задания (Daily Quests)
  // ----------------------------------------------------
  getDailyQuests() {
    const todayStr = this.localDateStr();
    if (this.state.dailyQuests.date !== todayStr) {
      const qMap = {};
      const templates = (typeof WordRamData !== "undefined" && WordRamData.dailyQuestsTemplates) ? WordRamData.dailyQuestsTemplates : [];
      templates.forEach(t => {
        qMap[t.id] = {
          id: t.id,
          current: 0,
          target: t.target,
          completed: false,
          claimed: false
        };
      });
      this.state.dailyQuests = {
        date: todayStr,
        quests: qMap,
        allClaimed: false
      };
      this.save();
    }
    return this.state.dailyQuests;
  }

  updateDailyQuestProgress(type, amount = 1) {
    const dq = this.getDailyQuests();
    if (dq.quests && dq.quests[type] && !dq.quests[type].completed) {
      dq.quests[type].current = Math.min(dq.quests[type].target, dq.quests[type].current + amount);
      if (dq.quests[type].current >= dq.quests[type].target) {
        dq.quests[type].completed = true;
      }
      this.save();
    }
  }

  claimQuest(questId) {
    const dq = this.getDailyQuests();
    const q = dq.quests[questId];
    if (q && q.completed && !q.claimed) {
      q.claimed = true;
      const templates = (typeof WordRamData !== "undefined" && WordRamData.dailyQuestsTemplates) ? WordRamData.dailyQuestsTemplates : [];
      const t = templates.find(x => x.id === questId);
      if (t) {
        this.addCoins(t.rewardCoins);
        this.addXp(t.rewardXp);
      }
      this.save();
      return { success: true, template: t };
    }
    return { success: false };
  }

  claimAllQuestsChest() {
    const dq = this.getDailyQuests();
    const allCompleted = Object.values(dq.quests).every(q => q.completed);
    if (allCompleted && !dq.allClaimed) {
      dq.allClaimed = true;
      this.addCoins(50);
      this.addXp(100);
      this.state.hintsRemaining += 1;
      this.save();
      return { success: true, rewardCoins: 50, rewardXp: 100, rewardHints: 1 };
    }
    return { success: false };
  }

  canSpinLuckyWheel() {
    const todayStr = this.localDateStr();
    return this.state.lastWheelSpinDate !== todayStr;
  }

  applyLuckyWheelSector(sector) {
    const todayStr = this.localDateStr();
    this.state.lastWheelSpinDate = todayStr;

    if (sector.type === "coins") this.addCoins(sector.value);
    if (sector.type === "hints") this.state.hintsRemaining += sector.value;
    if (sector.type === "xp") this.addXp(sector.value);
    if (sector.type === "freeze") this.state.streakFreezes = Math.min(2, (this.state.streakFreezes || 0) + 1);

    this.save();
  }

  getStreakFreezes() {
    return this.state.streakFreezes || 0;
  }

  buyStreakFreeze(cost = 60) {
    if (this.state.coins >= cost && (this.state.streakFreezes || 0) < 2) {
      this.state.coins -= cost;
      this.state.streakFreezes = (this.state.streakFreezes || 0) + 1;
      this.save();
      return { success: true, count: this.state.streakFreezes };
    }
    return { success: false, reason: this.state.coins < cost ? "NOT_ENOUGH_COINS" : "MAX_REACHED" };
  }

  ensureLeagueWeek() {
    const week = this.isoWeekKey();
    if (this.state.leagueWeekKey === week) return null;

    const prevWeek = this.state.leagueWeekKey;
    const prevXp = this.state.weeklyXp || 0;
    const settle = prevWeek ? this.settleLeagueWeek(prevXp) : null;

    this.state.leagueWeekKey = week;
    this.state.weeklyXp = 0;
    this.save();
    return settle;
  }

  settleLeagueWeek(weeklyXp) {
    const leagues = (typeof WordRamData !== "undefined" && WordRamData.leagues) ? WordRamData.leagues : [];
    const currentId = this.state.currentLeagueId || 1;
    const league = leagues.find((l) => l.id === currentId) || leagues[0];
    if (!league) return null;

    let coins = 0;
    let moved = 0;
    if (weeklyXp >= (league.minXpWeek || 0) && league.rewardCoins) {
      this.addCoins(league.rewardCoins);
      coins = league.rewardCoins;
    }

    const next = leagues.find((l) => l.id === currentId + 1);
    const prev = leagues.find((l) => l.id === currentId - 1);
    if (next && weeklyXp >= next.minXpWeek) {
      this.state.currentLeagueId = next.id;
      moved = 1;
    } else if (prev && weeklyXp < (league.minXpWeek || 0)) {
      this.state.currentLeagueId = prev.id;
      moved = -1;
    }

    return { coins, moved, leagueName: league.name, weeklyXp };
  }

  getLeagueData() {
    this.ensureLeagueWeek();
    const leagueId = this.state.currentLeagueId || 1;
    const leagues = (typeof WordRamData !== "undefined" && WordRamData.leagues) ? WordRamData.leagues : [];
    const leagueInfo = leagues.find(l => l.id === leagueId) || leagues[0] || { name: "Лига", icon: "🏆" };

    const rivals = [
      { name: "Alex_Oxford", xp: Math.round(this.state.weeklyXp * 1.3 + 80), avatar: "🦊" },
      { name: "Elena_Sky", xp: Math.round(this.state.weeklyXp * 1.1 + 40), avatar: "🦉" },
      { name: "Вы (Игрок)", xp: this.state.weeklyXp, isUser: true, avatar: "⭐" },
      { name: "Dmitry_Pro", xp: Math.max(0, Math.round(this.state.weeklyXp * 0.9 - 20)), avatar: "🐺" },
      { name: "Sarah_London", xp: Math.max(0, Math.round(this.state.weeklyXp * 0.8 - 40)), avatar: "🐱" },
      { name: "Max_Mind", xp: Math.max(0, Math.round(this.state.weeklyXp * 0.6 - 60)), avatar: "🦁" }
    ];

    rivals.sort((a, b) => b.xp - a.xp);
    const userRank = rivals.findIndex(r => r.isUser) + 1;

    return {
      league: leagueInfo,
      rivals: rivals,
      userRank: userRank,
      weeklyXp: this.state.weeklyXp
    };
  }

  checkAchievements() {
    const unlockedNow = [];
    const stats = this.state.stats;
    const wordsCount = this.getCollectedWordsCount();
    const streak = this.state.daily.streak || 0;
    const bonusWords = this.state.stats.bonusWordsFound || 0;
    const achievements = (typeof WordRamData !== "undefined" && WordRamData.achievements) ? WordRamData.achievements : [];

    achievements.forEach(ach => {
      if (this.state.unlockedAchievements.includes(ach.id)) return;

      let achieved = false;
      if (ach.type === "words" && wordsCount >= ach.target) achieved = true;
      if (ach.type === "streak" && streak >= ach.target) achieved = true;
      if (ach.type === "no_hints" && stats.noHintLevels >= ach.target) achieved = true;
      if (ach.type === "blitz" && stats.blitzCorrectTotal >= ach.target) achieved = true;
      if (ach.type === "bonus_words" && bonusWords >= ach.target) achieved = true;
      if (ach.type === "big_grid" && stats.maxGridCompleted >= 6) achieved = true;
      if (ach.type === "huge_grid" && stats.maxGridCompleted >= 8) achieved = true;

      if (achieved) {
        this.state.unlockedAchievements.push(ach.id);
        this.addCoins(ach.rewardCoins);
        this.addXp(50);
        unlockedNow.push(ach);
      }
    });

    if (unlockedNow.length > 0) this.save();
    return unlockedNow;
  }

  getSetting(key) {
    if (key === "currentLevel") return this.getCurrentLevel();
    if (key === "unlockedLevel") return this.getUnlockedLevel();
    if (key === "englishLevel") return this.getEnglishLevel();
    return this.state[key];
  }

  setSetting(key, value) {
    if (key === "currentLevel") {
      this.setCurrentLevel(value);
      return;
    }
    if (key === "unlockedLevel") {
      this.setUnlockedLevel(value);
      return;
    }
    if (key === "englishLevel") {
      this.setEnglishLevel(value);
      return;
    }
    this.state[key] = value;
    this.save();
  }

  getCoins() {
    return this.state.coins;
  }

  addCoins(amount) {
    this.state.coins = Math.max(0, (this.state.coins || 0) + amount);
    this.save();
    return this.state.coins;
  }

  useHint() {
    if (this.state.hintsRemaining > 0) {
      this.state.hintsRemaining--;
      this.state.stats.hintsUsed++;
      this.save();
      return { success: true, free: true, remainingHints: this.state.hintsRemaining, coins: this.state.coins };
    }

    if (this.state.coins >= this.state.hintCost) {
      this.state.coins -= this.state.hintCost;
      this.state.stats.hintsUsed++;
      this.save();
      return { success: true, free: false, remainingHints: 0, coins: this.state.coins };
    }

    return { success: false, reason: "NOT_ENOUGH_COINS", needed: this.state.hintCost, current: this.state.coins };
  }

  getLevelStars(lvl, lang = this.getLanguage()) {
    return this.getLanguageProgress(lang).levelStars[lvl] || 0;
  }

  completeLevel(lvl, stars = 3, score = 100, rewardCoins = 15, usedHints = 0, gridSize = 5, lang = this.getLanguage(), rewardXp = null) {
    const prog = this.getLanguageProgress(lang);
    const alreadyCompleted = (prog.levelStars[lvl] || 0) > 0 || lvl < prog.unlockedLevel;

    prog.levelStars[lvl] = Math.max(prog.levelStars[lvl] || 0, stars);
    prog.levelHighScores[lvl] = Math.max(prog.levelHighScores[lvl] || 0, score);

    let xpRes = { xpAdded: 0, leveledUp: false };

    if (alreadyCompleted) {
      this.recordDailyPlay();
      this.clearActiveSavedGame();
      const newAchs = this.checkAchievements();
      this.save();
      return {
        xpResult: xpRes,
        achievements: newAchs,
        alreadyCompleted: true,
        coinsEarned: 0
      };
    }

    if (lvl >= prog.unlockedLevel) {
      prog.unlockedLevel = lvl + 1;
    }
    prog.currentLevel = Math.max(prog.currentLevel || 1, lvl + 1);
    this.state.stats.levelsCompleted++;

    if (usedHints === 0) {
      this.state.stats.noHintLevels++;
      this.updateDailyQuestProgress("no_hints", 1);
    }

    this.state.stats.maxGridCompleted = Math.max(this.state.stats.maxGridCompleted || 4, gridSize);

    this.addCoins(rewardCoins);
    const xpAmount = (typeof rewardXp === "number" && rewardXp >= 0) ? rewardXp : (30 + lvl * 2);
    xpRes = this.addXp(xpAmount, lang);
    this.recordDailyPlay();
    this.claimReachedMilestones(prog.unlockedLevel, lang);
    this.clearActiveSavedGame();
    const newAchs = this.checkAchievements();
    this.save();

    return {
      xpResult: xpRes,
      achievements: newAchs,
      alreadyCompleted: false,
      coinsEarned: rewardCoins
    };
  }

  saveActiveGame(gameSnapshot) {
    this.state.activeSavedGame = gameSnapshot;
    this.save();
  }

  getActiveSavedGame() {
    return this.state.activeSavedGame;
  }

  clearActiveSavedGame() {
    this.state.activeSavedGame = null;
    this.save();
  }

  localDateStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  daysBetween(fromStr, toStr) {
    if (!fromStr || !toStr) return 0;
    const a = new Date(fromStr + "T12:00:00");
    const b = new Date(toStr + "T12:00:00");
    return Math.round((b - a) / 86400000);
  }

  isoWeekKey(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayNum = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayNum + 3);
    const firstThursday = new Date(d.getFullYear(), 0, 4);
    const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
    return d.getFullYear() + "-W" + String(week).padStart(2, "0");
  }

  claimReachedMilestones(unlockedLevel, lang = this.getLanguage()) {
    const stages = (typeof WordRamData !== "undefined" && WordRamData.monstersStages) ? WordRamData.monstersStages : [];
    if (!this.state.claimedMilestones) this.state.claimedMilestones = {};
    let coins = 0;
    stages.forEach((stage) => {
      (stage.milestones || []).forEach((m) => {
        const key = lang + ":" + m.level;
        if (unlockedLevel >= m.level && !this.state.claimedMilestones[key]) {
          this.state.claimedMilestones[key] = true;
          const grant = m.level % 20 === 0 ? 80 : 30;
          coins += grant;
        }
      });
    });
    if (coins > 0) {
      this.addCoins(coins);
      return { coins };
    }
    return null;
  }

  grantStreakDayReward(streak) {
    const day = ((streak - 1) % 7) + 1;
    const todayStr = this.localDateStr();
    const claimKey = todayStr + ":" + day;
    if (!this.state.claimedDailyRewards) this.state.claimedDailyRewards = {};
    if (this.state.claimedDailyRewards[claimKey]) return null;
    const rewards = (typeof WordRamData !== "undefined" && WordRamData.dailyStreakRewards) ? WordRamData.dailyStreakRewards : [];
    const item = rewards.find((r) => r.day === day);
    if (!item) return null;
    this.state.claimedDailyRewards[claimKey] = true;
    this.addCoins(item.coins);
    if (item.hints) this.state.hintsRemaining = (this.state.hintsRemaining || 0) + item.hints;
    return item;
  }

  recordDailyPlay() {
    this.markWeekAlbumDay();
    const todayStr = this.localDateStr();
    const last = this.state.daily.lastPlayedDate;
    if (last === todayStr) {
      return { alreadyToday: true, streak: this.state.daily.streak || 0, reward: null };
    }

    this.state.daily.completed = false;

    if (last) {
      const gap = this.daysBetween(last, todayStr) - 1;
      let remainingGap = Math.max(0, gap);
      while (remainingGap > 0 && (this.state.streakFreezes || 0) > 0) {
        this.state.streakFreezes--;
        remainingGap--;
      }
      if (remainingGap > 0) {
        this.state.daily.streak = 0;
      }
    }

    this.state.daily.streak = (this.state.daily.streak || 0) + 1;
    this.state.daily.lastPlayedDate = todayStr;
    const reward = this.grantStreakDayReward(this.state.daily.streak);
    this.checkAchievements();
    this.save();
    return { alreadyToday: false, streak: this.state.daily.streak, reward };
  }

  formatLocalDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  getWeekKey(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return this.formatLocalDate(d);
  }

  getWeekDates(weekKey) {
    const parts = String(weekKey || this.getWeekKey()).split("-");
    const start = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(this.formatLocalDate(d));
    }
    return days;
  }

  ensureWeekAlbum() {
    const weekKey = this.getWeekKey();
    if (!this.state.weekAlbum) {
      this.state.weekAlbum = { weekKey, daysPlayed: [], stampClaimed: false, stamps: [] };
    }
    if (this.state.weekAlbum.weekKey !== weekKey) {
      this.state.weekAlbum.weekKey = weekKey;
      this.state.weekAlbum.daysPlayed = [];
      this.state.weekAlbum.stampClaimed = false;
      if (!this.state.weekAlbum.stamps) this.state.weekAlbum.stamps = [];
    }
    return this.state.weekAlbum;
  }

  markWeekAlbumDay() {
    const album = this.ensureWeekAlbum();
    const today = this.localDateStr();
    if (!album.daysPlayed.includes(today)) {
      album.daysPlayed.push(today);
      this.save();
    }
    return album;
  }

  getWeekAlbumStatus() {
    const album = this.ensureWeekAlbum();
    const dates = this.getWeekDates(album.weekKey);
    const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const today = this.localDateStr();
    return {
      weekKey: album.weekKey,
      filled: album.daysPlayed.length,
      stampClaimed: !!album.stampClaimed,
      stampsCount: (album.stamps || []).length,
      days: dates.map((date, idx) => ({
        date,
        label: labels[idx],
        done: album.daysPlayed.includes(date),
        isToday: date === today
      }))
    };
  }

  claimWeekStamp() {
    const album = this.ensureWeekAlbum();
    if (album.stampClaimed) return { success: false, reason: "already" };
    if ((album.daysPlayed || []).length < 7) return { success: false, reason: "incomplete" };
    album.stampClaimed = true;
    album.stamps = album.stamps || [];
    album.stamps.push({ weekKey: album.weekKey, date: this.localDateStr() });
    this.addCoins(40);
    this.addXp(60);
    this.save();
    return { success: true, coins: 40, xp: 60, stampsCount: album.stamps.length };
  }

  getWordEase() {
    const ease = this.state.wordEase;
    if (ease === "easier" || ease === "harder") return ease;
    return "normal";
  }

  setWordEase(ease) {
    this.state.wordEase = (ease === "easier" || ease === "harder") ? ease : "normal";
    this.save();
    return this.state.wordEase;
  }

  normalizeVocabKey(word, lang = this.getLanguage()) {
    if (!word) return "";
    if (lang === "chechen" && typeof WordRamTokenizer !== "undefined") {
      return WordRamTokenizer.normalizeChechen(String(word));
    }
    return String(word).trim().toUpperCase();
  }

  getWordOfTheDayItem(lang = this.getLanguage()) {
    const key = lang === "chechen" ? "chechen" : "english";
    const todayStr = this.localDateStr();
    if (!this.state.wodAssign) {
      this.state.wodAssign = {
        english: { date: null, word: "", recent: [] },
        chechen: { date: null, word: "", recent: [] }
      };
    }
    if (!this.state.wodAssign[key]) this.state.wodAssign[key] = { date: null, word: "", recent: [] };
    const slot = this.state.wodAssign[key];
    if (slot.date === todayStr && slot.word) {
      return (typeof WordRamData !== "undefined" && WordRamData.formatWordOfTheDay)
        ? WordRamData.formatWordOfTheDay(slot.word, key)
        : { word: slot.word, ph: "", tr: "", ex: "" };
    }
    const exclude = Array.isArray(slot.recent) ? slot.recent : [];
    const item = (typeof WordRamData !== "undefined" && WordRamData.getWordOfTheDay)
      ? WordRamData.getWordOfTheDay(key, todayStr, exclude)
      : { word: "", ph: "", tr: "", ex: "" };
    if (item && item.word) {
      slot.date = todayStr;
      slot.word = item.word;
      const recent = exclude.filter((w) => String(w).toUpperCase() !== String(item.word).toUpperCase());
      slot.recent = [item.word, ...recent].slice(0, 45);
      this.save();
    }
    return item;
  }

  tryClaimWodFromPlay(word, lang = this.getLanguage()) {
    if (this.isWodClaimedToday(lang)) return false;
    const todayItem = this.getWordOfTheDayItem(lang);
    if (!todayItem || !todayItem.word) return false;
    const found = this.normalizeVocabKey(word, lang);
    const target = this.normalizeVocabKey(todayItem.word, lang);
    if (!found || found !== target) return false;
    this.claimWodToday(lang);
    this.recordWordToVocabulary(todayItem.word, lang);
    this.addCoins(20);
    this.addXp(40);
    this.markWeekAlbumDay();
    return true;
  }

  getWeeklyReviewStatus(lang = this.getLanguage()) {
    const weekKey = this.getWeekKey();
    if (!this.state.weeklyReview) this.state.weeklyReview = { weekKey: null, claimed: false, wordsByLang: {} };
    if (!this.state.weeklyReview.wordsByLang) this.state.weeklyReview.wordsByLang = {};
    if (this.state.weeklyReview.weekKey !== weekKey) {
      this.state.weeklyReview.weekKey = weekKey;
      this.state.weeklyReview.claimed = false;
      this.state.weeklyReview.wordsByLang = {};
    }
    const all = Object.keys(this.getCollectedWords(lang));
    if (!this.state.weeklyReview.wordsByLang[lang] && all.length >= 3) {
      this.state.weeklyReview.wordsByLang[lang] = this.pickWeeklyReviewWords(lang, 5);
      this.save();
    }
    const words = this.state.weeklyReview.wordsByLang[lang] || [];
    return {
      weekKey,
      claimed: !!this.state.weeklyReview.claimed,
      available: all.length >= 3,
      words
    };
  }

  pickWeeklyReviewWords(lang = this.getLanguage(), count = 5) {
    const words = Object.keys(this.getCollectedWords(lang));
    const copy = words.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy.slice(0, Math.min(count, copy.length));
  }

  claimWeeklyReview(lang = this.getLanguage()) {
    const status = this.getWeeklyReviewStatus(lang);
    if (status.claimed) return { success: false, reason: "already" };
    if (!status.available) return { success: false, reason: "few" };
    this.state.weeklyReview.claimed = true;
    this.state.weeklyReview.weekKey = status.weekKey;
    this.addCoins(15);
    this.addXp(20);
    this.save();
    return { success: true, coins: 15, xp: 20 };
  }

  getDailyStatus() {
    this.ensureLeagueWeek();
    const todayStr = this.localDateStr();
    return {
      isTodayCompleted: this.state.daily.lastPlayedDate === todayStr,
      isDailyChallengeDone: this.state.daily.lastPlayedDate === todayStr && this.state.daily.completed,
      streak: this.state.daily.streak || 0,
      date: todayStr,
      freezes: this.state.streakFreezes || 0
    };
  }

  completeDailyChallenge() {
    const todayStr = this.localDateStr();
    if (this.state.daily.completed && this.state.daily.lastPlayedDate === todayStr) {
      return { alreadyCompleted: true, coinsEarned: 0, xpEarned: 0 };
    }
    this.recordDailyPlay();
    this.state.daily.completed = true;
    this.state.daily.lastPlayedDate = todayStr;
    this.addCoins(50);
    this.addXp(150);
    this.checkAchievements();
    this.save();
    return { alreadyCompleted: false, coinsEarned: 50, xpEarned: 150 };
  }

  isWodClaimedToday(lang) {
    const todayStr = this.localDateStr();
    if (!this.state.daily) this.state.daily = {};
    if (!this.state.daily.lastWodClaimByLang) this.state.daily.lastWodClaimByLang = {};
    return this.state.daily.lastWodClaimByLang[lang] === todayStr;
  }

  claimWodToday(lang) {
    const todayStr = this.localDateStr();
    if (!this.state.daily) this.state.daily = {};
    if (!this.state.daily.lastWodClaimByLang) this.state.daily.lastWodClaimByLang = {};
    this.state.daily.lastWodClaimByLang[lang] = todayStr;
    this.markWeekAlbumDay();
    this.save();
  }


  canClaimShareReward() {
    const todayStr = this.localDateStr();
    if (!this.state.daily) this.state.daily = {};
    return this.state.daily.lastShareClaimDate !== todayStr;
  }

  claimShareReward(amount = 30) {
    const todayStr = this.localDateStr();
    if (this.canClaimShareReward()) {
      this.state.daily.lastShareClaimDate = todayStr;
      this.addCoins(amount);
      this.addXp(amount);
      this.save();
      return { success: true, rewarded: true, coinsAdded: amount };
    }
    return { success: true, rewarded: false };
  }

  canClaimVictoryShareReward() {
    const todayStr = this.localDateStr();
    if (!this.state.daily) this.state.daily = {};
    return this.state.daily.lastVictoryShareClaimDate !== todayStr;
  }

  claimVictoryShareReward(amount = 10) {
    const todayStr = this.localDateStr();
    if (this.canClaimVictoryShareReward()) {
      this.state.daily.lastVictoryShareClaimDate = todayStr;
      this.addCoins(amount);
      this.save();
      return { success: true, rewarded: true, coinsAdded: amount };
    }
    return { success: true, rewarded: false };
  }

  resetAll() {
    this.state = this.getDefaultState();
    this.save();
  }
}


if (typeof window !== "undefined") {
  window.WordRamStorage = WordRamStorage;
}
if (typeof globalThis !== "undefined") {
  globalThis.WordRamStorage = WordRamStorage;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamStorage;
}
