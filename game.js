/**
 * WordRam - Core Game Engine (v29)
 * Multilingual Support: English & Chechen, Step-by-Step Hints,
 * Multi-character Grapheme Tiles, Sound & Speech, Bonus Words.
 */

class WordRamGame {
  constructor(options = {}) {
    this.storage = options.storage || new WordRamStorage();
    this.generator = options.generator || new WordRamGenerator(typeof WordRamData !== "undefined" ? WordRamData : null);

    // DOM Элементы
    this.container = options.container || document.getElementById("game-container");
    this.gridElement = options.gridElement || document.getElementById("game-grid");
    this.wordPreviewElement = options.wordPreviewElement || document.getElementById("word-preview");
    this.progressElement = options.progressElement || document.getElementById("level-progress-text");
    this.hintButton = options.hintButton || document.getElementById("btn-hint");
    this.coinsDisplay = options.coinsDisplay || document.getElementById("coins-counter");
    this.levelTitleDisplay = options.levelTitleDisplay || document.getElementById("current-level-title");
    this.cefrBadgeDisplay = options.cefrBadgeDisplay || document.getElementById("header-cefr-badge");
    this.slotsContainer = options.slotsContainer || document.getElementById("word-slots-container");
    this.svgConnector = document.getElementById("drag-connector-svg");

    // Игровое состояние
    this.currentLevel = 1;
    this.levelData = null;
    this.isDailyMode = false;
    this.foundWords = [];
    this.foundBonusWordsInLevel = [];
    this.selectedPath = [];
    this.isDragging = false;
    this.revealedHints = {};
    this.hintsUsedInLevel = 0;
    this.isGameOver = false;

    // Комбо и время
    this.comboStreak = 0;
    this.lastWordFoundTime = 0;

    // Палитра цветов для найденных слов
    this.wordColors = [
      { bg: "rgba(168, 85, 247, 0.25)", border: "#a855f7", text: "#e9d5ff" },
      { bg: "rgba(59, 130, 246, 0.25)", border: "#3b82f6", text: "#bfdbfe" },
      { bg: "rgba(34, 197, 94, 0.25)", border: "#22c55e", text: "#bbf7d0" },
      { bg: "rgba(245, 158, 11, 0.25)", border: "#f59e0b", text: "#fef3c7" },
      { bg: "rgba(236, 72, 153, 0.25)", border: "#ec4899", text: "#fbcfe8" },
      { bg: "rgba(14, 165, 233, 0.25)", border: "#0ea5e9", text: "#bae6fd" },
      { bg: "rgba(139, 92, 246, 0.25)", border: "#8b5cf6", text: "#ddd6fe" },
      { bg: "rgba(20, 184, 166, 0.25)", border: "#14b8a6", text: "#ccfbf1" },
      { bg: "rgba(234, 179, 8, 0.25)", border: "#eab308", text: "#fef08a" },
      { bg: "rgba(244, 63, 94, 0.25)", border: "#f43f5e", text: "#fecdd3" }
    ];

    // Звуковой синтез Web Audio API
    this.audioCtx = null;
    this.initAudio();

    // Callbacks
    this.onLevelCompleted = options.onLevelCompleted || null;
    this.onWordDetailsRequested = options.onWordDetailsRequested || null;
    this.onXpUpdated = options.onXpUpdated || null;

    this.bindEvents();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio API не поддерживается:", e);
    }
  }

  ensureAudioUnlocked() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  speakWord(word) {
    if (!window.speechSynthesis || !word) return;
    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");
    
    // Полное отключение синтезатора для чеченского языка
    if (currentLang === "chechen") return;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.88;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const enVoice = voices.find(v => (v.lang === "en-US" || v.lang === "en_US" || v.lang.startsWith("en")) && !v.localService) ||
                        voices.find(v => v.lang.startsWith("en"));
        if (enVoice) utterance.voice = enVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech error:", e);
    }
  }

  ensureSpeechUnlocked() {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
        const dummy = new SpeechSynthesisUtterance(" ");
        dummy.volume = 0.01;
        window.speechSynthesis.speak(dummy);
      } catch (e) {}
    }
  }

  playSound(type) {
    if (!this.storage.getSetting("soundEnabled")) return;
    if (!this.audioCtx) return;
    this.ensureAudioUnlocked();

    const now = this.audioCtx.currentTime;

    if (type === "drag") {
      // Мягкий, кристальный щелчок маримбы при выборе буквы
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const baseFreq = 340 + (Math.min(this.selectedPath.length, 10) * 35);
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + 0.05);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "found") {
      // Гармоничный искрящийся мажорный аккорд (C5 - E5 - G5 - C6) с мягкой атакой
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.055 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.35);
      });
    } else if (type === "combo") {
      // Изящный колокольчик-арпеджио
      const chord = [587.33, 739.99, 880.00, 1174.66];
      chord.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.45);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.45);
      });
    } else if (type === "win") {
      // Праздничный теплый победный аккорд
      const victoryChords = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      victoryChords.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.10, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.7);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.7);
      });
    } else if (type === "error") {
      // Деликатный мягкий глухой стук без резкого жужжания
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "hint") {
      // Эфирный стеклянный колокольчик
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.50, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.22);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  vibrate(pattern = 15) {
    if (!this.storage.getSetting("vibrationEnabled")) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }

  bindEvents() {
    if (!this.gridElement) return;

    this.gridElement.addEventListener("pointerdown", (e) => this.handlePointerStart(e));
    window.addEventListener("pointermove", (e) => this.handlePointerMove(e));
    window.addEventListener("pointerup", (e) => this.handlePointerEnd(e));
    window.addEventListener("pointercancel", (e) => this.handlePointerEnd(e));

    this.gridElement.addEventListener("contextmenu", (e) => e.preventDefault());

    if (this.hintButton) {
      this.hintButton.addEventListener("click", () => this.applyStepHint());
    }
  }

  startLevel(levelNumber = 1, isDaily = false) {
    this.isDailyMode = isDaily;
    this.currentLevel = levelNumber;
    this.foundWords = [];
    this.foundBonusWordsInLevel = [];
    this.selectedPath = [];
    this.revealedHints = {};
    this.hintsUsedInLevel = 0;
    this.isGameOver = false;
    this.comboStreak = 0;
    this.lastWordFoundTime = 0;

    const currentLang = this.storage.getLanguage ? this.storage.getLanguage() : "english";
    const userCefr = this.storage.getLanguageLevel ? this.storage.getLanguageLevel(currentLang) : this.storage.getEnglishLevel();
    
    this.levelData = this.generator.generateLevel(levelNumber, userCefr, currentLang);

    for (const w of this.levelData.words) {
      this.revealedHints[w] = 0;
    }

    this.renderHeader();
    this.renderGrid();
    this.renderWordSlots();
    this.updatePreview("");
    this.updateCoinsDisplay();
    this.updateHintButtonLabel();
    this.clearSvgConnector();
    this.hideMagnifier();

    this.saveCurrentGameState();
  }

  updateHintButtonLabel() {
    if (!this.hintButton) return;
    const remainingFree = this.storage.state.hintsRemaining || 0;
    const cost = this.storage.state.hintCost || 15;

    if (remainingFree > 0) {
      this.hintButton.innerHTML = `<span class="btn-icon">💡</span> <span class="btn-text">Подсказка (${remainingFree} беспл.)</span>`;
    } else {
      this.hintButton.innerHTML = `<span class="btn-icon">💡</span> <span class="btn-text">Подсказка (-${cost} 🪙)</span>`;
    }
  }

  renderHeader() {
    const size = this.levelData ? this.levelData.gridSize : 5;
    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");
    const userCefr = this.storage.getLanguageLevel ? this.storage.getLanguageLevel(currentLang) : "A1";

    if (this.levelTitleDisplay) {
      if (this.isDailyMode) {
        this.levelTitleDisplay.textContent = `Сегодня (${size}×${size})`;
      } else {
        this.levelTitleDisplay.textContent = `Уровень ${this.currentLevel} (${size}×${size})`;
      }
    }

    if (this.cefrBadgeDisplay) {
      if (currentLang === "chechen") {
        this.cefrBadgeDisplay.textContent = `🟢 ${userCefr}`;
        this.cefrBadgeDisplay.title = "Язык игры: Чеченский";
      } else {
        this.cefrBadgeDisplay.textContent = `🇬🇧 ${userCefr}`;
        this.cefrBadgeDisplay.title = "Язык игры: English";
      }
    }

    if (this.progressElement && this.levelData) {
      this.progressElement.textContent = `Найдено ${this.foundWords.length} / ${this.levelData.words.length}`;
    }
  }

  renderWordSlots() {
    if (!this.slotsContainer || !this.levelData) return;
    this.slotsContainer.innerHTML = "";

    const currentLang = this.levelData.language || "english";

    this.levelData.words.forEach((word, idx) => {
      const isFound = this.foundWords.includes(word);
      const slot = document.createElement("div");
      slot.className = `word-slot ${isFound ? "found" : ""}`;
      slot.dataset.word = word;

      const tileCount = this.levelData.tilesMap && this.levelData.tilesMap[word]
        ? this.levelData.tilesMap[word].length
        : ((typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.getTileCount(word, currentLang) : word.length);

      if (isFound) {
        slot.textContent = word;
        const color = this.wordColors[idx % this.wordColors.length];
        slot.style.backgroundColor = color.bg;
        slot.style.borderColor = color.border;
        slot.style.color = color.text;

        slot.addEventListener("click", (e) => {
          e.stopPropagation();
          this.showWordDefinition(word);
        });
      } else {
        const dots = "● ".repeat(tileCount).trim();
        slot.innerHTML = `<span class="slot-dots">${dots}</span> <span class="slot-length">(${tileCount})</span>`;
      }

      this.slotsContainer.appendChild(slot);
    });
  }

  renderGrid() {
    if (!this.gridElement || !this.levelData) return;
    this.gridElement.innerHTML = "";

    const size = this.levelData.gridSize || 5;
    this.gridElement.dataset.size = size;
    this.gridElement.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    this.gridElement.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.row = r;
        cell.dataset.col = c;
        const val = this.levelData.grid[r][c];
        cell.textContent = val;

        if (val && val.length > 1) {
          cell.classList.add("cell-multichar");
        }

        const hintBadge = document.createElement("span");
        hintBadge.className = "hint-badge";
        cell.appendChild(hintBadge);

        this.gridElement.appendChild(cell);
      }
    }

    this.refreshCellStates();
  }

  updateSvgConnector() {
    if (!this.svgConnector || !this.gridElement || this.selectedPath.length < 2) {
      this.clearSvgConnector();
      return;
    }

    const gridRect = this.gridElement.getBoundingClientRect();
    let pathD = "";

    this.selectedPath.forEach(([r, c], idx) => {
      const cell = this.getCellElement(r, c);
      if (!cell) return;
      const cellRect = cell.getBoundingClientRect();
      const cx = (cellRect.left + cellRect.width / 2) - gridRect.left;
      const cy = (cellRect.top + cellRect.height / 2) - gridRect.top;

      if (idx === 0) {
        pathD += `M ${cx} ${cy}`;
      } else {
        pathD += ` L ${cx} ${cy}`;
      }
    });

    let pathEl = this.svgConnector.querySelector(".drag-line");
    if (!pathEl) {
      pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathEl.setAttribute("class", "drag-line");
      pathEl.setAttribute("fill", "none");
      pathEl.setAttribute("stroke", "#a855f7");
      pathEl.setAttribute("stroke-width", "8");
      pathEl.setAttribute("stroke-linecap", "round");
      pathEl.setAttribute("stroke-linejoin", "round");
      this.svgConnector.appendChild(pathEl);
    }
    pathEl.setAttribute("fill", "none");
    pathEl.setAttribute("stroke", "#a855f7");
    pathEl.setAttribute("stroke-width", "8");
    pathEl.setAttribute("stroke-linecap", "round");
    pathEl.setAttribute("stroke-linejoin", "round");
    pathEl.setAttribute("d", pathD);
  }

  clearSvgConnector() {
    if (this.svgConnector) {
      this.svgConnector.innerHTML = "";
    }
  }

  showMagnifier(text, clientX, clientY) {
    let mag = document.getElementById("magnifier-bubble");
    if (!mag) {
      mag = document.createElement("div");
      mag.id = "magnifier-bubble";
      mag.className = "magnifier-bubble";
      document.body.appendChild(mag);
    }
    mag.textContent = text;
    mag.style.display = "block";
    mag.style.left = `${clientX}px`;
    mag.style.top = `${clientY - 65}px`;
  }

  hideMagnifier() {
    const mag = document.getElementById("magnifier-bubble");
    if (mag) {
      mag.style.display = "none";
    }
  }

  getCellElement(r, c) {
    if (!this.gridElement) return null;
    return this.gridElement.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
  }

  updateCoinsDisplay() {
    if (this.coinsDisplay) {
      this.coinsDisplay.textContent = this.storage.getCoins();
    }
    const badge = document.querySelector(".coins-badge");
    if (badge) {
      badge.classList.add("coin-pop-anim");
      setTimeout(() => badge.classList.remove("coin-pop-anim"), 350);
    }
  }

  updatePreview(text = "") {
    if (!this.wordPreviewElement) return;
    this.wordPreviewElement.textContent = text;
    if (text) {
      this.wordPreviewElement.classList.add("active");
    } else {
      this.wordPreviewElement.classList.remove("active");
    }
  }

  getCellFromPointer(e) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target) return null;
    const cell = target.closest(".grid-cell");
    if (cell && this.gridElement.contains(cell)) {
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      return [r, c];
    }
    return null;
  }

  handlePointerStart(e) {
    if (this.isGameOver) return;
    this.ensureAudioUnlocked();
    this.ensureSpeechUnlocked();

    const cellCoords = this.getCellFromPointer(e);
    if (!cellCoords) return;

    this.isDragging = true;
    this.selectedPath = [cellCoords];
    this.refreshCellStates();
    this.updatePreviewFromPath();
    this.updateSvgConnector();
    this.playSound("drag");
    this.vibrate(10);

    const wordString = this.getSelectedWordString();
    this.showMagnifier(wordString, e.clientX, e.clientY);
  }

  handlePointerMove(e) {
    if (!this.isDragging || this.isGameOver) return;

    const cellCoords = this.getCellFromPointer(e);
    if (!cellCoords) return;

    const [r, c] = cellCoords;
    const lastIdx = this.selectedPath.length - 1;
    const [lr, lc] = this.selectedPath[lastIdx];

    if (this.selectedPath.length >= 2) {
      const [pr, pc] = this.selectedPath[lastIdx - 1];
      if (pr === r && pc === c) {
        this.selectedPath.pop();
        this.refreshCellStates();
        this.updatePreviewFromPath();
        this.updateSvgConnector();
        this.playSound("drag");
        this.vibrate(8);
        const curWord = this.getSelectedWordString();
        this.showMagnifier(curWord, e.clientX, e.clientY);
        return;
      }
    }

    if (lr === r && lc === c) {
      const curWord = this.getSelectedWordString();
      this.showMagnifier(curWord, e.clientX, e.clientY);
      return;
    }

    const dist = Math.abs(r - lr) + Math.abs(c - lc);
    if (dist === 1) {
      const isAlreadyInPath = this.selectedPath.some(([pr, pc]) => pr === r && pc === c);
      if (!isAlreadyInPath) {
        this.selectedPath.push([r, c]);
        this.refreshCellStates();
        this.updatePreviewFromPath();
        this.updateSvgConnector();
        this.playSound("drag");
        this.vibrate(12);

        const curWord = this.getSelectedWordString();
        this.showMagnifier(curWord, e.clientX, e.clientY);
      }
    }
  }

  handlePointerEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.clearSvgConnector();
    this.hideMagnifier();

    if (this.selectedPath.length >= 2) {
      this.submitSelectedWord();
    } else if (this.selectedPath.length === 1) {
      const [r, c] = this.selectedPath[0];
      const foundWordAtCell = this.findWordByCell(r, c);
      if (foundWordAtCell) {
        this.showWordDefinition(foundWordAtCell);
      }
      this.selectedPath = [];
      this.refreshCellStates();
      this.updatePreview("");
    } else {
      this.selectedPath = [];
      this.refreshCellStates();
      this.updatePreview("");
    }
  }

  findWordByCell(r, c) {
    for (const word of this.foundWords) {
      const route = this.levelData.routes[word];
      if (route && route.some(([pr, pc]) => pr === r && pc === c)) {
        return word;
      }
    }
    return null;
  }

  showWordDefinition(word) {
    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");
    const details = this.generator.data.getWordDetails(word, currentLang);
    if (details && typeof this.onWordDetailsRequested === "function") {
      this.speakWord(word);
      this.onWordDetailsRequested(details);
      this.storage.updateDailyQuestProgress("vocab_review", 1);
    }
  }

  getSelectedWordString() {
    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");
    const tiles = this.selectedPath.map(([r, c]) => this.levelData.grid[r][c]);
    if (typeof WordRamTokenizer !== "undefined") {
      return WordRamTokenizer.reconstruct(tiles, currentLang);
    }
    return tiles.join("");
  }

  updatePreviewFromPath() {
    const word = this.getSelectedWordString();
    this.updatePreview(word);
  }

  submitSelectedWord() {
    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");
    const selectedTiles = this.selectedPath.map(([r, c]) => this.levelData.grid[r][c]);
    const forwardWord = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.reconstruct(selectedTiles, currentLang) : selectedTiles.join("");

    let word = null;
    let matchedPath = this.selectedPath;

    // СТРОГО прямое направление от первой буквы к последней!
    if (this.levelData.words.includes(forwardWord)) {
      word = forwardWord;
    }

    if (word) {
      if (!this.foundWords.includes(word)) {
        this.foundWords.push(word);

        const now = Date.now();
        if (this.lastWordFoundTime > 0 && now - this.lastWordFoundTime <= 7000) {
          this.comboStreak++;
        } else {
          this.comboStreak = 1;
        }
        this.lastWordFoundTime = now;

        // Записываем слово в Личный словарь с языковым тегом
        const newAchs = this.storage.recordWordToVocabulary(word, currentLang);

        // Авто-озвучка слова
        if (this.storage.getSetting("voiceSpeechEnabled") !== false) {
          this.speakWord(word);
        }

        if (this.comboStreak > 1) {
          this.storage.addXp(this.comboStreak * 5);
          this.playSound("combo");
          this.vibrate([20, 30, 50]);
          this.showFloatingMessage(`🔥 КОМБО x${this.comboStreak}! (+${this.comboStreak * 5} XP)`, "bonus");
        } else {
          this.playSound("found");
          this.vibrate(40);
          this.showFloatingMessage(`Найдено: ${word}! (+10 XP)`, "success");
        }

        this.highlightFoundWordCells(this.selectedPath);
        this.renderHeader();
        this.renderWordSlots();
        this.saveCurrentGameState();

        if (typeof this.onXpUpdated === "function") {
          this.onXpUpdated();
        }

        if (newAchs && newAchs.length > 0) {
          newAchs.forEach(ach => {
            this.showFloatingMessage(`🏆 Достижение: ${ach.title} (+${ach.rewardCoins} 🪙)`, "bonus");
          });
        }

        if (this.foundWords.length > 0 && this.foundWords.length === this.levelData.words.length) {
          this.handleLevelWin();
          return;
        }
      } else {
        this.showFloatingMessage("Уже найдено! Нажмите на слово для перевода.", "info");
      }
    } else {
      // Проверяем: может быть, это реальное слово активного языка (Слово-бонус!)
      const isForwardBonus = WordRamData.isValidWord(forwardWord, currentLang);
      const bonusWord = isForwardBonus ? forwardWord : null;

      if (bonusWord) {
        if (!this.foundBonusWordsInLevel.includes(bonusWord)) {
          this.foundBonusWordsInLevel.push(bonusWord);
          this.storage.state.stats.bonusWordsFound = (this.storage.state.stats.bonusWordsFound || 0) + 1;
          this.storage.addCoins(5);
          this.storage.addXp(5);
          this.storage.checkAchievements();
          this.updateCoinsDisplay();

          this.playSound("found");
          this.vibrate([25, 40, 25]);
          if (this.storage.getSetting("voiceSpeechEnabled") !== false) {
            this.speakWord(bonusWord);
          }
          this.showFloatingMessage(`🌟 Слово-бонус: ${bonusWord} (+5 🪙 в Копилку, +5 XP)!`, "bonus");
        } else {
          this.showFloatingMessage("Это бонусное слово уже собрано на этом уровне!", "info");
        }
      } else {
        this.playSound("error");
        this.vibrate([30, 40, 30]);
        this.animateErrorCells(this.selectedPath);
      }
    }

    this.selectedPath = [];
    this.refreshCellStates();
    this.updatePreview("");
  }

  highlightFoundWordCells(path) {
    path.forEach(([r, c]) => {
      const cell = this.getCellElement(r, c);
      if (cell) {
        cell.classList.add("cell-found-pop");
        setTimeout(() => cell.classList.remove("cell-found-pop"), 400);
      }
    });
  }

  animateErrorCells(path) {
    path.forEach(([r, c]) => {
      const cell = this.getCellElement(r, c);
      if (cell) {
        cell.classList.add("cell-error-shake");
        setTimeout(() => cell.classList.remove("cell-error-shake"), 450);
      }
    });
  }

  applyStepHint() {
    if (this.isGameOver) return;

    const unsolvedWord = this.levelData.words.find(w => !this.foundWords.includes(w));
    if (!unsolvedWord) return;

    const hintRes = this.storage.useHint();
    if (!hintRes.success) {
      this.showFloatingMessage(`Нужно ${hintRes.needed} монет для подсказки!`, "warning");
      this.playSound("error");
      return;
    }

    this.hintsUsedInLevel++;
    this.updateCoinsDisplay();
    this.updateHintButtonLabel();
    this.playSound("hint");
    this.vibrate(25);

    const currentStep = this.revealedHints[unsolvedWord] || 0;
    const route = this.levelData.routes[unsolvedWord];

    if (currentStep < route.length) {
      this.revealedHints[unsolvedWord] = currentStep + 1;
      const [r, c] = route[currentStep];

      const cell = this.getCellElement(r, c);
      if (cell) {
        cell.classList.add("cell-hint-pulse");
        setTimeout(() => cell.classList.remove("cell-hint-pulse"), 1200);
      }

      this.refreshCellStates();
      this.saveCurrentGameState();
      this.showFloatingMessage(`💡 Подсказка: буква №${currentStep + 1} для ненайденного слова!`, "info");
    }
  }

  refreshCellStates() {
    if (!this.gridElement || !this.levelData) return;

    const size = this.levelData.gridSize || 5;

    // Сброс классов у всех ячеек
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = this.getCellElement(r, c);
        if (!cell) continue;

        cell.className = "grid-cell";
        if (this.levelData.grid[r][c] && this.levelData.grid[r][c].length > 1) {
          cell.classList.add("cell-multichar");
        }

        cell.style.backgroundColor = "";
        cell.style.borderColor = "";
        cell.style.color = "";

        const badge = cell.querySelector(".hint-badge");
        if (badge) {
          badge.textContent = "";
          badge.style.display = "none";
        }
      }
    }

    // Подсветка найденных слов
    this.foundWords.forEach((word, wordIdx) => {
      const route = this.levelData.routes[word];
      const color = this.wordColors[wordIdx % this.wordColors.length];
      if (route) {
        route.forEach(([r, c]) => {
          const cell = this.getCellElement(r, c);
          if (cell) {
            cell.classList.add("cell-found");
            cell.style.backgroundColor = color.bg;
            cell.style.borderColor = color.border;
            cell.style.color = color.text;
          }
        });
      }
    });

    // Подсветка подсказок
    for (const [w, revealedCount] of Object.entries(this.revealedHints)) {
      if (this.foundWords.includes(w)) continue;
      const route = this.levelData.routes[w];
      if (route && revealedCount > 0) {
        for (let i = 0; i < revealedCount && i < route.length; i++) {
          const [r, c] = route[i];
          const cell = this.getCellElement(r, c);
          if (cell && !cell.classList.contains("cell-found")) {
            cell.classList.add("cell-hint-revealed");
            const badge = cell.querySelector(".hint-badge");
            if (badge) {
              badge.textContent = `${i + 1}`;
              badge.style.display = "flex";
            }
          }
        }
      }
    }

    // Подсветка текущего выбора
    this.selectedPath.forEach(([r, c], idx) => {
      const cell = this.getCellElement(r, c);
      if (cell) {
        cell.classList.add("cell-selected");
        if (idx === 0) cell.classList.add("cell-selected-first");
        if (idx === this.selectedPath.length - 1) cell.classList.add("cell-selected-head");
      }
    });
  }

  showFloatingMessage(text, type = "info") {
    const existing = document.querySelector(".floating-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `floating-toast toast-${type}`;
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  handleLevelWin() {
    this.isGameOver = true;
    this.playSound("win");
    this.vibrate([40, 60, 100, 60, 40]);

    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");

    const stars = this.hintsUsedInLevel === 0 ? 3 : (this.hintsUsedInLevel <= 2 ? 2 : 1);
    const score = 100 + (this.foundBonusWordsInLevel.length * 20);
    const rewardCoins = this.levelData.coinsReward || 15;

    let winResult = null;
    if (this.isDailyMode) {
      this.storage.completeDailyChallenge();
      winResult = {
        level: "Сегодня",
        stars: 3,
        coinsEarned: 50,
        xpEarned: 150,
        words: this.levelData.words,
        bonusWords: this.foundBonusWordsInLevel,
        isDaily: true,
        language: currentLang
      };
    } else {
      const res = this.storage.completeLevel(
        this.currentLevel,
        stars,
        score,
        rewardCoins,
        this.hintsUsedInLevel,
        this.levelData.gridSize,
        currentLang
      );
      winResult = {
        level: this.currentLevel,
        stars: stars,
        coinsEarned: rewardCoins,
        xpEarned: res.xpResult ? res.xpResult.xpAdded : 30,
        words: this.levelData.words,
        bonusWords: this.foundBonusWordsInLevel,
        isDaily: false,
        language: currentLang
      };
    }

    this.updateCoinsDisplay();

    if (typeof this.onLevelCompleted === "function") {
      this.onLevelCompleted(winResult);
    }
  }

  saveCurrentGameState() {
    if (this.isGameOver || !this.levelData) return;
    const currentLang = (this.levelData && this.levelData.language) || (this.storage.getLanguage ? this.storage.getLanguage() : "english");

    const state = {
      level: this.currentLevel,
      isDaily: this.isDailyMode,
      language: currentLang,
      levelData: this.levelData,
      foundWords: this.foundWords,
      foundBonusWordsInLevel: this.foundBonusWordsInLevel,
      revealedHints: this.revealedHints,
      hintsUsedInLevel: this.hintsUsedInLevel,
      date: new Date().toISOString().slice(0, 10)
    };
    this.storage.saveActiveGame(state);
  }

  restoreGameState() {
    const saved = this.storage.getActiveSavedGame();
    if (!saved || !saved.levelData) return false;

    const currentLang = this.storage.getLanguage ? this.storage.getLanguage() : "english";
    if (saved.language && saved.language !== currentLang) {
      return false;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (saved.isDaily && saved.date !== todayStr) {
      this.storage.clearActiveSavedGame();
      return false;
    }

    this.currentLevel = saved.level;
    this.isDailyMode = saved.isDaily || false;
    this.levelData = saved.levelData;
    this.foundWords = saved.foundWords || [];
    this.foundBonusWordsInLevel = saved.foundBonusWordsInLevel || [];
    this.revealedHints = saved.revealedHints || {};
    this.hintsUsedInLevel = saved.hintsUsedInLevel || 0;
    this.isGameOver = false;

    this.renderHeader();
    this.renderGrid();
    this.renderWordSlots();
    this.updatePreview("");
    this.updateCoinsDisplay();
    this.updateHintButtonLabel();
    this.clearSvgConnector();
    this.hideMagnifier();
    return true;
  }
}


if (typeof window !== "undefined") {
  window.WordRamGame = WordRamGame;
}
if (typeof globalThis !== "undefined") {
  globalThis.WordRamGame = WordRamGame;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamGame;
}
