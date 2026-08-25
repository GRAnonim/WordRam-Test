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
      languageLevel: lang === "chechen" ? "A1" : "A2",
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
      xp: 300,
      weeklyXp: 45,
      hasCompletedPlacementTest: false,
      hasCompletedChechenPlacementTest: false,
      unlockedAchievements: [],
      claimedDailyRewards: {},
      coins: 60,
      hintsRemaining: 3,
      hintCost: 15,
      streakFreezes: 0,
      lastWheelSpinDate: null,
      currentLeagueId: 1,
      soundEnabled: true,
      voiceSpeechEnabled: true,
      vibrationEnabled: true,
      daily: {
        lastPlayedDate: null,
        streak: 0,
        completed: false,
        lastWodClaimDate: null
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
    return this.getLanguageProgress(lang).languageLevel || (lang === "chechen" ? "A1" : "A2");
  }

  setLanguageLevel(levelCode, lang = this.getLanguage()) {
    this.getLanguageProgress(lang).languageLevel = levelCode;
    if (lang === "english") {
      this.state.hasCompletedPlacementTest = true;
      const rank = (typeof WordRamData !== "undefined" && WordRamData.xpRanks)
        ? WordRamData.xpRanks.find(r => r.code === levelCode)
        : null;
      if (rank && this.state.xp < rank.minXp) {
        this.state.xp = rank.minXp;
      }
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

  getXp() {
    return this.state.xp || 0;
  }

  getXpProgress() {
    const currentCode = this.getLanguageLevel("english");
    const ranks = (typeof WordRamData !== "undefined" && WordRamData.xpRanks) ? WordRamData.xpRanks : [];
    const currentRankIdx = ranks.findIndex(r => r.code === currentCode);
    const rank = ranks[currentRankIdx] || ranks[0] || { minXp: 0, nextXp: 500, title: "A1", badge: "A1" };
    const isMax = currentRankIdx === ranks.length - 1;

    const currentXp = this.state.xp || 0;
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

  addXp(amount) {
    const oldLevel = this.getEnglishLevel();
    this.state.xp = (this.state.xp || 0) + amount;
    this.state.weeklyXp = (this.state.weeklyXp || 0) + amount;

    const ranks = (typeof WordRamData !== "undefined" && WordRamData.xpRanks) ? WordRamData.xpRanks : [];
    let newLevel = oldLevel;
    for (let i = ranks.length - 1; i >= 0; i--) {
      const r = ranks[i];
      if (this.state.xp >= r.minXp) {
        newLevel = r.code;
        break;
      }
    }

    let leveledUp = false;
    if (newLevel !== oldLevel) {
      this.setLanguageLevel(newLevel, "english");
      leveledUp = true;
    }

    this.save();
    return {
      leveledUp: leveledUp,
      oldLevel: oldLevel,
      newLevel: newLevel,
      xpAdded: amount,
      totalXp: this.state.xp
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
      this.addXp(10);
    } else {
      prog.collectedWords[upper].count++;
      this.state.stats.totalWordsFound++;
      this.addXp(3);
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
        this.addXp(5);
      }
    }
    this.save();
    return this.checkAchievements();
  }

  // ----------------------------------------------------
  // Ежедневные задания (Daily Quests)
  // ----------------------------------------------------
  getDailyQuests() {
    const todayStr = new Date().toISOString().slice(0, 10);
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
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.state.lastWheelSpinDate !== todayStr;
  }

  applyLuckyWheelSector(sector) {
    const todayStr = new Date().toISOString().slice(0, 10);
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

  getLeagueData() {
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

  completeLevel(lvl, stars = 3, score = 100, rewardCoins = 15, usedHints = 0, gridSize = 5, lang = this.getLanguage()) {
    const prog = this.getLanguageProgress(lang);
    prog.levelStars[lvl] = Math.max(prog.levelStars[lvl] || 0, stars);
    prog.levelHighScores[lvl] = Math.max(prog.levelHighScores[lvl] || 0, score);

    if (lvl >= prog.unlockedLevel) {
      prog.unlockedLevel = lvl + 1;
    }
    prog.currentLevel = lvl + 1;
    this.state.stats.levelsCompleted++;

    if (usedHints === 0) {
      this.state.stats.noHintLevels++;
      this.updateDailyQuestProgress("no_hints", 1);
    }

    this.state.stats.maxGridCompleted = Math.max(this.state.stats.maxGridCompleted || 4, gridSize);

    this.addCoins(rewardCoins);
    const xpRes = this.addXp(30 + lvl * 2);
    this.clearActiveSavedGame();
    const newAchs = this.checkAchievements();
    this.save();

    return {
      xpResult: xpRes,
      achievements: newAchs
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

  getDailyStatus() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (this.state.daily.lastPlayedDate && this.state.daily.lastPlayedDate !== todayStr && this.state.daily.lastPlayedDate !== yesterday) {
      if (this.state.streakFreezes > 0) {
        this.state.streakFreezes--;
        this.state.daily.lastPlayedDate = yesterday;
        this.save();
      } else {
        this.state.daily.streak = 0;
      }
    }

    return {
      isTodayCompleted: this.state.daily.lastPlayedDate === todayStr && this.state.daily.completed,
      streak: this.state.daily.streak || 0,
      date: todayStr,
      freezes: this.state.streakFreezes || 0
    };
  }

  completeDailyChallenge() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (this.state.daily.lastPlayedDate === yesterday) {
      this.state.daily.streak = (this.state.daily.streak || 0) + 1;
    } else if (this.state.daily.lastPlayedDate !== todayStr) {
      this.state.daily.streak = 1;
    }

    this.state.daily.lastPlayedDate = todayStr;
    this.state.daily.completed = true;
    this.addCoins(50);
    this.addXp(150);
    this.checkAchievements();
    this.save();
  }

  resetAll() {
    this.state = this.getDefaultState();
    this.save();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamStorage;
}
