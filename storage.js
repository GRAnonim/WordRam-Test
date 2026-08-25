/**
 * WordRam - LocalStorage & Gamification State Engine (v21)
 * Управление всеми системами: квесты дня, заморозка стрика, колесо фортуны,
 * еженедельные лиги, словарь выученных слов, XP, авто-озвучка и настройки.
 */

class WordRamStorage {
  constructor() {
    this.STORAGE_KEY = "wordram_v39_save";
    this.state = this.load();
  }

  getDefaultState() {
    return {
      currentLevel: 1,
      unlockedLevel: 1,
      englishLevel: "A2",
      xp: 300,
      weeklyXp: 45,
      hasCompletedPlacementTest: false,
      hasSeenWordClickHint: false,
      collectedWords: {},           // { "BEAUTIFUL": { count: 1, firstSeen: "...", mastery: 1 } }
      unlockedAchievements: [],    // ["first_words", ...]
      claimedDailyRewards: {},      // { "1": "2026-08-24" }
      levelStars: {},               // { "1": 3, "2": 2, ... }
      levelHighScores: {},
      coins: 60,
      hintsRemaining: 3,
      hintCost: 15,
      streakFreezes: 0,            // Количество защит серии
      lastWheelSpinDate: null,
      currentLeagueId: 1,
      soundEnabled: true,
      voiceSpeechEnabled: true,     // Авто-озвучка произношения слов (включена по умолчанию)
      vibrationEnabled: true,
      daily: {
        lastPlayedDate: null,
        streak: 0,
        completed: false
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
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...this.getDefaultState(), ...parsed };
      }
    } catch (e) {
      console.warn("Ошибка чтения LocalStorage", e);
    }
    return this.getDefaultState();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Ошибка сохранения в LocalStorage", e);
    }
  }

  // ----------------------------------------------------
  // Уровень английского (CEFR) и Опыт (XP)
  // ----------------------------------------------------
  getEnglishLevel() {
    return this.state.englishLevel || "A2";
  }

  setEnglishLevel(levelCode) {
    this.state.englishLevel = levelCode;
    this.state.hasCompletedPlacementTest = true;
    const rank = WordRamData.xpRanks.find(r => r.code === levelCode);
    if (rank && this.state.xp < rank.minXp) {
      this.state.xp = rank.minXp;
    }
    this.save();
  }

  getXp() {
    return this.state.xp || 0;
  }

  getXpProgress() {
    const currentCode = this.getEnglishLevel();
    const currentRankIdx = WordRamData.xpRanks.findIndex(r => r.code === currentCode);
    const rank = WordRamData.xpRanks[currentRankIdx] || WordRamData.xpRanks[0];
    const isMax = currentRankIdx === WordRamData.xpRanks.length - 1;

    const currentXp = this.state.xp || 0;
    const minXp = rank.minXp;
    const nextXp = rank.nextXp;

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

    let newLevel = oldLevel;
    for (let i = WordRamData.xpRanks.length - 1; i >= 0; i--) {
      const r = WordRamData.xpRanks[i];
      if (this.state.xp >= r.minXp) {
        newLevel = r.code;
        break;
      }
    }

    let leveledUp = false;
    if (newLevel !== oldLevel) {
      this.state.englishLevel = newLevel;
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
  recordWordToVocabulary(word) {
    const upper = word.toUpperCase();
    if (!this.state.collectedWords[upper]) {
      this.state.collectedWords[upper] = {
        count: 1,
        firstSeen: new Date().toISOString().slice(0, 10),
        mastery: 1
      };
      this.state.stats.totalWordsFound++;
      this.addXp(10);
    } else {
      this.state.collectedWords[upper].count++;
      this.state.stats.totalWordsFound++;
      this.addXp(3);
    }

    this.updateDailyQuestProgress("find_words", 1);
    this.save();
    return this.checkAchievements();
  }

  getCollectedWords() {
    return this.state.collectedWords || {};
  }

  getCollectedWordsCount() {
    return Object.keys(this.state.collectedWords || {}).length;
  }

  recordBlitzAnswer(word, isCorrect) {
    const upper = word.toUpperCase();
    if (this.state.collectedWords[upper]) {
      if (isCorrect) {
        this.state.collectedWords[upper].mastery = Math.min(3, (this.state.collectedWords[upper].mastery || 1) + 1);
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
      WordRamData.dailyQuestsTemplates.forEach(t => {
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
      const t = WordRamData.dailyQuestsTemplates.find(x => x.id === questId);
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

  // ----------------------------------------------------
  // Колесо Фортуны (Daily Lucky Wheel)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // Заморозка стрика (Streak Freeze)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // Еженедельные Лиги (Weekly Leagues)
  // ----------------------------------------------------
  getLeagueData() {
    const leagueId = this.state.currentLeagueId || 1;
    const leagueInfo = WordRamData.leagues.find(l => l.id === leagueId) || WordRamData.leagues[0];

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

  // ----------------------------------------------------
  // Проверка и выдача достижений
  // ----------------------------------------------------
  checkAchievements() {
    const unlockedNow = [];
    const stats = this.state.stats;
    const wordsCount = this.getCollectedWordsCount();
    const streak = this.state.daily.streak || 0;
    const bonusWords = this.state.stats.bonusWordsFound || 0;

    WordRamData.achievements.forEach(ach => {
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
    return this.state[key];
  }

  setSetting(key, value) {
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

  getLevelStars(lvl) {
    return this.state.levelStars[lvl] || 0;
  }

  completeLevel(lvl, stars = 3, score = 100, rewardCoins = 15, usedHints = 0, gridSize = 5) {
    this.state.levelStars[lvl] = Math.max(this.state.levelStars[lvl] || 0, stars);
    this.state.levelHighScores[lvl] = Math.max(this.state.levelHighScores[lvl] || 0, score);

    if (lvl >= this.state.unlockedLevel) {
      this.state.unlockedLevel = lvl + 1;
    }
    this.state.currentLevel = lvl + 1;
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

  // ----------------------------------------------------
  // Резервное копирование и перенос прогресса (v34)
  // ----------------------------------------------------
  exportSaveCode() {
    try {
      const dataStr = JSON.stringify(this.state);
      return btoa(unescape(encodeURIComponent(dataStr)));
    } catch (e) {
      console.error("Export error:", e);
      return "";
    }
  }

  importSaveCode(codeStr) {
    try {
      if (!codeStr || typeof codeStr !== "string") return false;
      const jsonStr = decodeURIComponent(escape(atob(codeStr.trim())));
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === "object" && (parsed.stats || parsed.collectedWords || parsed.xp !== undefined)) {
        this.state = { ...this.getDefaultState(), ...parsed };
        this.save();
        return true;
      }
    } catch (e) {
      console.error("Import error:", e);
    }
    return false;
  }

  resetAll() {
    this.state = this.getDefaultState();
    this.save();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamStorage;
}
