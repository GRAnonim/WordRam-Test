/**
 * WordRam - Core Game Engine (v19)
 * Web Speech API озвучка, слова-бонусы, Magnifier Bubble над пальцем,
 * комбо-множитель, тематические уровни и SVG линии.
 */

class WordRamGame {
  constructor(options = {}) {
    this.storage = options.storage || new WordRamStorage();
    this.generator = options.generator || new WordRamGenerator(WordRamData);

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

    // Комбо-система
    this.comboStreak = 0;
    this.lastWordFoundTime = 0;

    // Magnifier Bubble над пальцем
    this.magnifierBubble = document.getElementById("cell-magnifier-bubble");
    if (!this.magnifierBubble) {
      this.magnifierBubble = document.createElement("div");
      this.magnifierBubble.id = "cell-magnifier-bubble";
      this.magnifierBubble.className = "magnifier-bubble";
      document.body.appendChild(this.magnifierBubble);
    }

    // Сочная палитра цветов для слов
    this.wordColors = [
      { bg: "#d8b4fe", border: "#a855f7", text: "#3b0764" }, // Лаванда
      { bg: "#fda4af", border: "#f43f5e", text: "#881337" }, // Роза / Коралл
      { bg: "#86efac", border: "#22c55e", text: "#14532d" }, // Мята / Зеленый
      { bg: "#93c5fd", border: "#3b82f6", text: "#1e3a8a" }, // Лазурь / Синий
      { bg: "#fdba74", border: "#f97316", text: "#7c2d12" }, // Персик / Оранж
      { bg: "#5eead4", border: "#14b8a6", text: "#134e4a" }, // Бирюза
      { bg: "#fde047", border: "#eab308", text: "#713f12" }, // Золото
      { bg: "#f0abfc", border: "#d946ef", text: "#701a75" }  // Пурпур
    ];

    this.audioCtx = null;
    this.onLevelCompleted = options.onLevelCompleted || (() => {});
    this.onWordDetailsRequested = options.onWordDetailsRequested || (() => {});
    this.onXpUpdated = options.onXpUpdated || (() => {});

    this.initAudio();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
    }
    this.bindEvents();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("Web Audio API не поддерживается", e);
    }
  }

  ensureAudioUnlocked() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  speakWord(word) {
    if (!window.speechSynthesis || !word) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.88; // Четкий, понятный темп для обучения
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
    if (!this.storage.getSetting("soundEnabled") || !this.audioCtx) return;
    this.ensureAudioUnlocked();

    const now = this.audioCtx.currentTime;

    if (type === "select") {
      const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
      const pitchIdx = Math.min(this.selectedPath.length - 1, pentatonic.length - 1);
      const freq = pentatonic[Math.max(0, pitchIdx)];

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "found" || type === "combo") {
      const baseNotes = type === "combo" ? [659.25, 783.99, 987.77, 1318.51] : [523.25, 659.25, 783.99, 987.77, 1046.5];
      baseNotes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } else if (type === "error") {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.14);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === "hint") {
      const notes = [659.25, 987.77];
      notes.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.1, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } else if (type === "win") {
      const chord = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.85);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.85);
      });
    }
  }

  vibrate(duration = 20) {
    if (this.storage.getSetting("vibrationEnabled") && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  }

  bindEvents() {
    const unlockHandler = () => {
      this.ensureAudioUnlocked();
      this.ensureSpeechUnlocked();
      window.removeEventListener("touchstart", unlockHandler);
      window.removeEventListener("mousedown", unlockHandler);
      window.removeEventListener("click", unlockHandler);
    };
    window.addEventListener("touchstart", unlockHandler, { passive: true });
    window.addEventListener("mousedown", unlockHandler, { passive: true });
    window.addEventListener("click", unlockHandler, { passive: true });

    if (!this.gridElement) return;

    this.gridElement.addEventListener("mousedown", (e) => this.handlePointerStart(e));
    window.addEventListener("mousemove", (e) => this.handlePointerMove(e));
    window.addEventListener("mouseup", (e) => this.handlePointerEnd(e));

    this.gridElement.addEventListener("touchstart", (e) => this.handlePointerStart(e), { passive: false });
    window.addEventListener("touchmove", (e) => this.handlePointerMove(e), { passive: false });
    window.addEventListener("touchend", (e) => this.handlePointerEnd(e), { passive: false });
    window.addEventListener("touchcancel", (e) => this.handlePointerEnd(e), { passive: false });

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

    const userCefr = this.storage.getEnglishLevel();
    this.levelData = this.generator.generateLevel(levelNumber, userCefr);

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

    if (this.levelTitleDisplay) {
      if (this.isDailyMode) {
        this.levelTitleDisplay.textContent = `Сегодня (${size}×${size})`;
      } else {
        this.levelTitleDisplay.textContent = `Уровень ${this.currentLevel} (${size}×${size})`;
      }
    }

    // Обновляем плашку семантической темы прямо над слотами
    const themeIconEl = document.getElementById("theme-icon");
    const themeTitleEl = document.getElementById("theme-title");
    const themeBadgeEl = document.getElementById("level-theme-badge");

    if (themeIconEl && themeTitleEl && this.levelData) {
      themeIconEl.textContent = this.levelData.themeIcon || "🌿";
      themeTitleEl.textContent = `Тема: ${this.levelData.themeTitle || "Слова"}`;
      if (themeBadgeEl) themeBadgeEl.style.display = "inline-flex";
    }

    if (this.cefrBadgeDisplay) {
      this.cefrBadgeDisplay.textContent = `🇬🇧 ${this.storage.getEnglishLevel()}`;
    }

    if (this.progressElement) {
      let foundLetters = 0;
      this.foundWords.forEach(w => foundLetters += w.length);
      const totalLetters = this.levelData ? this.levelData.totalCells : 25;
      this.progressElement.textContent = `Слов: ${this.foundWords.length}/${this.levelData.words.length} (${foundLetters}/${totalLetters} букв)`;
    }
  }

  renderWordSlots() {
    if (!this.slotsContainer) return;
    this.slotsContainer.innerHTML = "";

    this.levelData.words.forEach((word, idx) => {
      const isFound = this.foundWords.includes(word);
      const slot = document.createElement("div");
      slot.className = `word-slot ${isFound ? "found" : ""}`;
      slot.dataset.word = word;

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
        const dots = "● ".repeat(word.length).trim();
        slot.innerHTML = `<span class="slot-dots">${dots}</span> <span class="slot-length">(${word.length})</span>`;
      }

      this.slotsContainer.appendChild(slot);
    });
  }

  renderGrid() {
    if (!this.gridElement) return;
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
        cell.textContent = this.levelData.grid[r][c];

        const hintBadge = document.createElement("span");
        hintBadge.className = "hint-badge";
        cell.appendChild(hintBadge);

        this.gridElement.appendChild(cell);
      }
    }

    this.refreshCellStates();
  }

  updateSvgConnector() {
    if (!this.svgConnector || !this.gridElement) return;
    if (this.selectedPath.length < 2) {
      this.clearSvgConnector();
      return;
    }

    const gridRect = this.gridElement.getBoundingClientRect();
    const points = this.selectedPath.map(([r, c]) => {
      const cell = this.getCellElement(r, c);
      if (!cell) return null;
      const cellRect = cell.getBoundingClientRect();
      const x = cellRect.left - gridRect.left + cellRect.width / 2;
      const y = cellRect.top - gridRect.top + cellRect.height / 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).filter(Boolean);

    if (points.length < 2) return;

    this.svgConnector.setAttribute("viewBox", `0 0 ${gridRect.width} ${gridRect.height}`);
    this.svgConnector.innerHTML = `
      <polyline points="${points.join(" ")}" class="drag-svg-glow" />
      <polyline points="${points.join(" ")}" class="drag-svg-core" />
    `;
  }

  clearSvgConnector() {
    if (this.svgConnector) {
      this.svgConnector.innerHTML = "";
    }
  }

  showMagnifier(letter, clientX, clientY) {
    if (!this.magnifierBubble) return;
    this.magnifierBubble.textContent = letter;
    this.magnifierBubble.style.left = `${clientX}px`;
    this.magnifierBubble.style.top = `${clientY - 55}px`;
    this.magnifierBubble.classList.add("show");
  }

  hideMagnifier() {
    if (this.magnifierBubble) {
      this.magnifierBubble.classList.remove("show");
    }
  }

  getCellElement(r, c) {
    return this.gridElement ? this.gridElement.querySelector(`[data-row='${r}'][data-col='${c}']`) : null;
  }

  updateCoinsDisplay() {
    if (this.coinsDisplay) {
      this.coinsDisplay.textContent = this.storage.getCoins();
    }
    this.updateHintButtonLabel();
  }

  updatePreview(text) {
    if (this.wordPreviewElement) {
      this.wordPreviewElement.textContent = text || " ";
      if (text) {
        this.wordPreviewElement.classList.add("active");
      } else {
        this.wordPreviewElement.classList.remove("active");
      }
    }
  }

  getCellFromPointer(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return null;

    const cell = element.closest(".grid-cell");
    if (cell && this.gridElement.contains(cell)) {
      const r = parseInt(cell.dataset.row, 10);
      const c = parseInt(cell.dataset.col, 10);
      return { coords: [r, c], clientX, clientY };
    }
    return null;
  }

  handlePointerStart(e) {
    if (this.isGameOver) return;
    const res = this.getCellFromPointer(e);
    if (!res) return;

    if (e.cancelable && e.type.startsWith("touch")) {
      e.preventDefault();
    }

    const [r, c] = res.coords;
    this.isDragging = true;
    this.selectedPath = [[r, c]];
    this.playSound("select");
    this.vibrate(15);
    this.refreshCellStates();
    this.updatePreviewFromPath();
    this.updateSvgConnector();
    this.showMagnifier(this.levelData.grid[r][c], res.clientX, res.clientY);
  }

  handlePointerMove(e) {
    if (!this.isDragging || this.isGameOver) return;
    const res = this.getCellFromPointer(e);
    if (!res) return;

    if (e.cancelable && e.type.startsWith("touch")) {
      e.preventDefault();
    }

    const [r, c] = res.coords;
    const pathLen = this.selectedPath.length;
    const [lastR, lastC] = this.selectedPath[pathLen - 1];

    this.showMagnifier(this.levelData.grid[r][c], res.clientX, res.clientY);

    if (pathLen > 1) {
      const [prevR, prevC] = this.selectedPath[pathLen - 2];
      if (prevR === r && prevC === c) {
        this.selectedPath.pop();
        this.playSound("select");
        this.vibrate(10);
        this.refreshCellStates();
        this.updatePreviewFromPath();
        this.updateSvgConnector();
        return;
      }
    }

    const alreadyVisited = this.selectedPath.some(([pr, pc]) => pr === r && pc === c);
    if (alreadyVisited) return;

    const manhattanDist = Math.abs(r - lastR) + Math.abs(c - lastC);
    if (manhattanDist === 1) {
      this.selectedPath.push([r, c]);
      this.playSound("select");
      this.vibrate(15);
      this.refreshCellStates();
      this.updatePreviewFromPath();
      this.updateSvgConnector();
    }
  }

  handlePointerEnd(e) {
    if (!this.isDragging || this.isGameOver) return;
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
    const details = this.generator.data.getWordDetails(word);
    if (details && typeof this.onWordDetailsRequested === "function") {
      this.playSound("select");
      this.speakWord(word);
      this.onWordDetailsRequested(details);
      this.storage.updateDailyQuestProgress("vocab_review", 1);
    }
  }

  getSelectedWordString() {
    return this.selectedPath.map(([r, c]) => this.levelData.grid[r][c]).join("");
  }

  updatePreviewFromPath() {
    const word = this.getSelectedWordString();
    this.updatePreview(word);
  }

  submitSelectedWord() {
    const word = this.getSelectedWordString(); // СТРОГО прямое направление от первой буквы к последней!

    if (this.levelData.words.includes(word)) {
      if (!this.foundWords.includes(word)) {
        this.foundWords.push(word);

        const now = Date.now();
        if (this.lastWordFoundTime > 0 && now - this.lastWordFoundTime <= 7000) {
          this.comboStreak++;
        } else {
          this.comboStreak = 1;
        }
        this.lastWordFoundTime = now;

        // Записываем слово в Личный словарь
        const newAchs = this.storage.recordWordToVocabulary(word);

        // Авто-озвучка слова, если включена в настройках
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

                if (!this.storage.state.hasSeenWordClickHint) {
          this.storage.state.hasSeenWordClickHint = true;
          this.storage.save();
          setTimeout(() => {
            this.showFloatingMessage("💡 Нажмите на найденное слово в слоте для перевода и озвучки!", "info");
          }, 1800);
        }

        if (this.foundWords.length > 0 && this.foundWords.length === this.levelData.words.length) {
          this.handleLevelWin();
          return;
        }
      } else {
        this.showFloatingMessage("Уже найдено! Нажмите на слово для перевода.", "info");
      }
    } else {
      // Проверяем: может быть, это реальное английское слово (Слово-бонус!)
      if (WordRamData.isValidWord(word)) {
        if (!this.foundBonusWordsInLevel.includes(word)) {
          this.foundBonusWordsInLevel.push(word);
          this.storage.state.stats.bonusWordsFound = (this.storage.state.stats.bonusWordsFound || 0) + 1;
          this.storage.addCoins(5); // Щедрая награда: +5 монет за найденное скрытое слово!
          this.storage.addXp(5);
          this.storage.checkAchievements();
          this.updateCoinsDisplay();
          this.playSound("combo");
          this.vibrate([20, 40]);
          if (this.storage.getSetting("voiceSpeechEnabled") !== false) {
            this.speakWord(word);
          }
          this.showFloatingMessage(`🌟 Слово-бонус: ${word} (+5 🪙 в Копилку, +5 XP)!`, "bonus");
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
        cell.classList.add("cell-shake");
        setTimeout(() => cell.classList.remove("cell-shake"), 400);
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

      this.showFloatingMessage(`Подсказка: буква ${currentStep + 1} (${unsolvedWord[currentStep]})`, "info");
      this.refreshCellStates();
      this.saveCurrentGameState();
    }
  }

  refreshCellStates() {
    if (!this.gridElement || !this.levelData) return;

    const allCells = this.gridElement.querySelectorAll(".grid-cell");
    allCells.forEach(cell => {
      cell.classList.remove("selected", "path-head", "hinted", "found-cell");
      cell.style.backgroundColor = "";
      cell.style.borderColor = "";
      cell.style.color = "";
      const badge = cell.querySelector(".hint-badge");
      if (badge) badge.textContent = "";
    });

    this.selectedPath.forEach(([r, c], idx) => {
      const cell = this.getCellElement(r, c);
      if (cell) {
        cell.classList.add("selected");
        if (idx === this.selectedPath.length - 1) {
          cell.classList.add("path-head");
        }
      }
    });

    for (const word of this.levelData.words) {
      if (this.foundWords.includes(word)) continue;
      const count = this.revealedHints[word] || 0;
      const route = this.levelData.routes[word];
      for (let i = 0; i < count && i < route.length; i++) {
        const [r, c] = route[i];
        const cell = this.getCellElement(r, c);
        if (cell) {
          cell.classList.add("hinted");
          const badge = cell.querySelector(".hint-badge");
          if (badge) badge.textContent = `${i + 1}`;
        }
      }
    }

    this.levelData.words.forEach((word, wordIdx) => {
      if (this.foundWords.includes(word)) {
        const color = this.wordColors[wordIdx % this.wordColors.length];
        const route = this.levelData.routes[word];
        if (route) {
          route.forEach(([r, c]) => {
            const cell = this.getCellElement(r, c);
            if (cell) {
              cell.classList.add("found-cell");
              cell.style.backgroundColor = color.bg;
              cell.style.borderColor = color.border;
              cell.style.color = color.text;
            }
          });
        }
      }
    });
  }

  showFloatingMessage(text, type = "info") {
    const midToast = document.getElementById("game-floating-toast");
    if (midToast && !this.isGameOver) {
      midToast.textContent = text;
      midToast.className = `game-mid-toast toast-${type} show`;
      if (this.midToastTimer) clearTimeout(this.midToastTimer);
      this.midToastTimer = setTimeout(() => {
        midToast.className = `game-mid-toast toast-${type}`;
      }, 1600);
      return;
    }

    const toast = document.createElement("div");
    toast.className = `game-toast toast-${type}`;
    toast.textContent = text;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 20);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 1800);
  }

  handleLevelWin() {
    if (this.isGameOver) return;
    if (!this.foundWords || this.foundWords.length === 0) return;

    this.isGameOver = true;
    this.playSound("win");
    this.vibrate([100, 50, 100, 50, 150]);

    const rewardCoins = this.levelData.coinsReward || 20;
    let completeRes = null;

    if (this.isDailyMode) {
      this.storage.completeDailyChallenge();
    } else {
      completeRes = this.storage.completeLevel(
        this.currentLevel,
        3,
        500,
        rewardCoins,
        this.hintsUsedInLevel,
        this.levelData.gridSize
      );
    }

    this.updateCoinsDisplay();

    if (typeof this.onLevelCompleted === "function") {
      this.onLevelCompleted({
        level: this.currentLevel,
        isDaily: this.isDailyMode,
        words: this.levelData.words,
        gridSize: this.levelData.gridSize,
        totalCells: this.levelData.totalCells,
        rewardCoins: rewardCoins,
        completeResult: completeRes
      });
    }
  }

  saveCurrentGameState() {
    if (this.isGameOver) return;
    this.storage.saveActiveGame({
      level: this.currentLevel,
      isDaily: this.isDailyMode,
      levelData: this.levelData,
      foundWords: this.foundWords,
      revealedHints: this.revealedHints,
      hintsUsedInLevel: this.hintsUsedInLevel
    });
  }

  restoreGameState(saved) {
    if (!saved || !saved.levelData) return false;
    this.currentLevel = saved.level;
    this.isDailyMode = saved.isDaily;
    this.levelData = saved.levelData;
    this.foundWords = saved.foundWords || [];
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamGame;
}
