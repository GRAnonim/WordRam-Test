/**
 * WordRam - Main Application Controller (v18)
 * 5 экранов: Игра, Словарь (с Блицем), Карта глав, События (Квесты, Колесо, Заморозка),
 * Рейтинг (Еженедельные лиги, Профиль, Достижения).
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = new WordRamStorage();
  const generator = new WordRamGenerator(WordRamData);

  // Модальные окна
  const winModal = document.getElementById("modal-victory");
  const winWordsList = document.getElementById("win-words-list");
  const winRewardText = document.getElementById("win-reward-text");
  const btnNextLevel = document.getElementById("btn-next-level");
  const btnCloseModal = document.getElementById("btn-close-modal");

  const placementModal = document.getElementById("modal-placement");
  const btnOpenPlacement = document.getElementById("btn-open-placement-test");
  const btnClosePlacement = document.getElementById("btn-close-placement");
  const quizStep = document.getElementById("placement-quiz-step");
  const resultStep = document.getElementById("placement-result-step");
  const quizWordEl = document.getElementById("quiz-word-display");
  const quizCounterEl = document.getElementById("quiz-progress-counter");
  const quizFillEl = document.getElementById("quiz-progress-fill");
  const btnApplyPlacement = document.getElementById("btn-apply-placement");
  const resultBadgeEl = document.getElementById("placement-result-badge");
  const resultTitleEl = document.getElementById("placement-result-title");
  const resultDescEl = document.getElementById("placement-result-desc");
  const headerCefrBadge = document.getElementById("header-cefr-badge");

  // Модалка перевода слова
  const defModal = document.getElementById("modal-word-definition");
  const defWordRibbon = document.getElementById("def-word-ribbon");
  const defPhonetic = document.getElementById("def-phonetic");
  const defTranslation = document.getElementById("def-translation");
  const defMeaning = document.getElementById("def-meaning");
  const defExampleBox = document.getElementById("def-example-box");
  const defExampleText = document.getElementById("def-example-text");
  const btnCloseDefinition = document.getElementById("btn-close-definition");
  const btnOkDefinition = document.getElementById("btn-ok-definition");

  // Модалка Колеса Фортуны
  
  
  // Модалка Блиц-повторения
  const blitzModal = document.getElementById("modal-blitz-quiz");
  const btnCloseBlitz = document.getElementById("btn-close-blitz");
  const btnStartBlitz = document.getElementById("btn-start-blitz");
  const blitzWordEl = document.getElementById("blitz-target-word");
  const blitzPhEl = document.getElementById("blitz-target-ph");
  const blitzOptionsGrid = document.getElementById("blitz-options-grid");
  const blitzProgressFill = document.getElementById("blitz-progress-fill");
  const blitzScoreCounter = document.getElementById("blitz-score-counter");

  function hideAllModals() {
    const infoModalEl = document.getElementById("modal-info-dialog");
    [winModal, defModal, placementModal,  blitzModal, infoModalEl].forEach(m => {
      if (m) {
        m.style.setProperty("display", "none", "important");
        m.classList.remove("open");
      }
    });
  }

  
  // Модалка кастомного инфо-диалога (замена alert)
  const infoModal = document.getElementById("modal-info-dialog");
  const infoDialogIcon = document.getElementById("info-dialog-icon");
  const infoDialogTitle = document.getElementById("info-dialog-title");
  const infoDialogMessage = document.getElementById("info-dialog-message");
  const btnCloseInfoDialog = document.getElementById("btn-close-info-dialog");
  const btnOkInfoDialog = document.getElementById("btn-ok-info-dialog");

  function showCustomInfoDialog(icon, title, messageHtml) {
    if (infoDialogIcon) infoDialogIcon.textContent = icon || "ℹ️";
    if (infoDialogTitle) infoDialogTitle.textContent = title || "Информация";
    if (infoDialogMessage) infoDialogMessage.innerHTML = messageHtml || "";
    showModal(infoModal);
  }

  if (btnCloseInfoDialog) btnCloseInfoDialog.addEventListener("click", () => hideAllModals());
  if (btnOkInfoDialog) btnOkInfoDialog.addEventListener("click", () => hideAllModals());


  function showModal(modalEl) {
    if (modalEl) {
      modalEl.style.setProperty("display", "flex", "important");
      modalEl.classList.add("open");
    }
  }

  const btnSpeakDef = document.getElementById("btn-speak-definition");
  const defCollocationsBox = document.getElementById("def-collocations-box");
  const defCollocationsList = document.getElementById("def-collocations-list");
  let currentActiveWord = "";

  if (btnSpeakDef) {
    btnSpeakDef.addEventListener("click", () => {
      if (currentActiveWord) game.speakWord(currentActiveWord);
    });
  }

  function showWordDefinitionModal(details) {
    if (!defModal || !details) return;
    currentActiveWord = details.word;
    if (defWordRibbon) defWordRibbon.textContent = details.word;

    if (defPhonetic) {
      if (details.ph && details.ph.trim()) {
        defPhonetic.textContent = details.ph;
        defPhonetic.style.display = "block";
      } else {
        defPhonetic.style.display = "none";
      }
    }

    if (defTranslation) defTranslation.textContent = details.tr || details.word;
    if (defMeaning) defMeaning.textContent = details.def || "Слово английского языка.";

    if (defExampleBox && defExampleText) {
      if (details.ex && details.ex.trim().length > 0 && !details.ex.includes("English context")) {
        defExampleText.textContent = details.ex;
        defExampleBox.style.display = "block";
      } else {
        defExampleBox.style.display = "none";
      }
    }

    if (defCollocationsBox && defCollocationsList) {
      if (details.collocations && details.collocations.length > 0) {
        defCollocationsList.innerHTML = details.collocations
          .map(c => `<span class="collocation-tag">${c}</span>`)
          .join("");
        defCollocationsBox.style.display = "block";
      } else {
        defCollocationsBox.style.display = "none";
      }
    }

    showModal(defModal);
  }

  if (btnCloseDefinition) btnCloseDefinition.addEventListener("click", () => hideAllModals());
  if (btnOkDefinition) btnOkDefinition.addEventListener("click", () => hideAllModals());
  if (btnCloseModal) btnCloseModal.addEventListener("click", () => hideAllModals());

  function showVictoryModal(summary) {
    if (!winModal || !summary || !summary.words || summary.words.length === 0) return;

    if (winWordsList) {
      winWordsList.innerHTML = summary.words
        .map((w) => `<li class="win-word-item" data-word="${w}">✔ <strong>${w}</strong></li>`)
        .join("");

      winWordsList.querySelectorAll(".win-word-item").forEach(item => {
        item.style.cursor = "pointer";
        item.addEventListener("click", () => {
          const w = item.dataset.word;
          const details = WordRamData.getWordDetails(w);
          showWordDefinitionModal(details);
        });
      });
    }

    if (winRewardText) {
      winRewardText.textContent = `+${summary.rewardCoins} 🪙 монет получено!`;
    }

    showModal(winModal);
    updateProfileUI();
  }

  if (btnNextLevel) {
    btnNextLevel.addEventListener("click", () => {
      hideAllModals();
      const nextLvl = (storage.getSetting("currentLevel") || 1);
      game.startLevel(nextLvl, false);
      switchTab("game");
    });
  }

  
  // Подсказки при нажатии на бейджи шапки и свинью-копилку
  const btnHeaderCefr = document.getElementById("header-cefr-badge");
  const btnHeaderCoins = document.getElementById("btn-show-coins-info");
  const btnShowBonusPiggy = document.getElementById("btn-show-bonus-words");

  if (btnHeaderCefr) {
    btnHeaderCefr.addEventListener("click", () => {
      const lvl = storage.getEnglishLevel();
      const rank = WordRamData.xpRanks.find(r => r.code === lvl) || WordRamData.xpRanks[0];
      showCustomInfoDialog(
        "🇬🇧",
        "Уровень: " + rank.title,
        "<p>Ваш текущий ранг: <strong>" + rank.badge + "</strong>.</p><p class='mt-2'>Он определяет сложность и словарный запас генерируемых уровней. Зарабатывайте опыт (XP) на уровнях и в Блиц-повторении, чтобы повысить ранг!</p>"
      );
    });
  }

  if (btnHeaderCoins) {
    btnHeaderCoins.addEventListener("click", () => {
      showCustomInfoDialog(
        "🪙",
        "Баланс монет",
        "<p>У вас: <strong>" + storage.getCoins() + " 🪙 монет</strong>.</p><p class='mt-2'>Монеты используются для покупки подсказок в игре (15 🪙) и заморозки стрика (60 🪙).</p><p class='mt-2'>Зарабатывайте монеты за победы, квесты дня и вращение Колеса фортуны!</p>"
      );
    });
  }

  if (btnShowBonusPiggy) {
    btnShowBonusPiggy.addEventListener("click", () => {
      const bonusCount = storage.state.stats.bonusWordsFound || 0;
      showCustomInfoDialog(
        "🐷",
        "Копилка эрудита",
        "<p>Собрано бонусных слов: <strong>" + bonusCount + "</strong> (+" + (bonusCount * 5) + " 🪙 монет получено).</p><p class='mt-2'>Сюда попадают реальные английские слова, найденные вами на игровом поле вне обязательного списка уровня.</p><p class='mt-2'>За каждое найденное слово-бонус начисляется <strong>+5 🪙 монет</strong> и <strong>+5 XP опыта</strong>!</p>"
      );
    });
  }


  // Инициализация игрового ядра
  const game = new WordRamGame({
    storage: storage,
    generator: generator,
    onLevelCompleted: (summary) => showVictoryModal(summary),
    onWordDetailsRequested: (details) => showWordDefinitionModal(details),
    onXpUpdated: () => updateProfileUI()
  });

  // ----------------------------------------------------
  

  // ----------------------------------------------------
  // Блиц-повторение слов (Flashcards Quiz)
  // ----------------------------------------------------
  let blitzQuestions = [];
  let blitzIndex = 0;
  let blitzScore = 0;

  const btnSpeakBlitz = document.getElementById("btn-speak-blitz");
  let currentBlitzTargetWord = "";

  if (btnSpeakBlitz) {
    btnSpeakBlitz.addEventListener("click", () => {
      if (currentBlitzTargetWord) game.speakWord(currentBlitzTargetWord);
    });
  }

  function startBlitzSession() {
    const collected = storage.getCollectedWords();
    const words = Object.keys(collected);

    if (words.length < 4) {
      showCustomInfoDialog("⚡", "Блиц-повторение", "<p>Сначала найдите хотя бы 4 слова на игровых уровнях, чтобы открыть режим интервального повторения!</p>");
      return;
    }

    // Умное интервальное повторение: сначала слова с наименьшим мастерством (1 звезда)
    blitzQuestions = [...words].sort((a, b) => {
      const mA = (collected[a] && collected[a].mastery) || 1;
      const mB = (collected[b] && collected[b].mastery) || 1;
      return (mA - mB) + (Math.random() * 0.4 - 0.2);
    }).slice(0, 10);

    blitzIndex = 0;
    blitzScore = 0;

    showModal(blitzModal);
    renderBlitzQuestion();
  }

  function renderBlitzQuestion() {
    if (blitzIndex >= blitzQuestions.length) {
      // Завершение сессии
      game.playSound("win");
      storage.addXp(blitzScore * 10);
      showCustomInfoDialog("🎯", "Тренировка завершена!", "<p>Отличный результат! Вы заработали <strong>+" + (blitzScore * 10) + " XP</strong> и закрепили выученные слова!</p><p class='mt-2'>Слова получили дополнительное мастерство ⭐ в вашем словаре.</p>");
      hideAllModals();
      updateProfileUI();
      renderVocabScreen();
      return;
    }

    const currentWord = blitzQuestions[blitzIndex]; currentBlitzTargetWord = currentWord; game.speakWord(currentWord);
    const details = WordRamData.getWordDetails(currentWord);

    if (blitzWordEl) blitzWordEl.textContent = currentWord;
    if (blitzPhEl) blitzPhEl.textContent = details ? details.ph : "";
    if (blitzScoreCounter) blitzScoreCounter.textContent = `Очки: ${blitzScore} / ${blitzQuestions.length}`;
    if (blitzProgressFill) {
      const pct = ((blitzIndex + 1) / blitzQuestions.length) * 100;
      blitzProgressFill.style.width = `${pct}%`;
    }

    // Генерируем 4 варианта ответа (1 верный + 3 дистрактора)
    const allDictWords = Object.keys(WordRamData.wordDefinitions);
    const distractors = allDictWords
      .filter(w => w !== currentWord)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => WordRamData.getWordDetails(w).tr);

    const options = [details.tr, ...distractors].sort(() => 0.5 - Math.random());

    if (blitzOptionsGrid) {
      blitzOptionsGrid.innerHTML = "";
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "blitz-opt-btn";
        btn.textContent = opt;

        btn.addEventListener("click", () => {
          const isCorrect = (opt === details.tr);
          if (isCorrect) {
            btn.classList.add("correct");
            game.playSound("found");
            blitzScore++;
            storage.recordBlitzAnswer(currentWord, true);
          } else {
            btn.classList.add("wrong");
            game.playSound("error");
            storage.recordBlitzAnswer(currentWord, false);
          }

          // Блокируем кнопки на 0.5с и переходим к следующему
          blitzOptionsGrid.querySelectorAll("button").forEach(b => b.disabled = true);
          setTimeout(() => {
            blitzIndex++;
            renderBlitzQuestion();
          }, 600);
        });

        blitzOptionsGrid.appendChild(btn);
      });
    }
  }

  if (btnStartBlitz) btnStartBlitz.addEventListener("click", () => startBlitzSession());
  if (btnCloseBlitz) btnCloseBlitz.addEventListener("click", () => hideAllModals());

  // ----------------------------------------------------
  // Диагностический тест уровня английского (CEFR)
  // ----------------------------------------------------
  let quizIndex = 0;
  let quizAnswers = {};
  let evaluatedResult = null;

  function openPlacementTest() {
    quizIndex = 0;
    quizAnswers = {};
    if (quizStep) quizStep.style.display = "block";
    if (resultStep) resultStep.style.display = "none";
    renderQuizQuestion();
    showModal(placementModal);
  }

  function closePlacementTest() {
    storage.setSetting("hasCompletedPlacementTest", true);
    hideAllModals();
  }

  function renderQuizQuestion() {
    const questions = WordRamData.placementTestWords;
    if (quizIndex >= questions.length) {
      showQuizResult();
      return;
    }

    const current = questions[quizIndex];
    if (quizWordEl) quizWordEl.textContent = current.word;
    if (quizCounterEl) quizCounterEl.textContent = `${quizIndex + 1} / ${questions.length}`;
    if (quizFillEl) {
      const pct = ((quizIndex + 1) / questions.length) * 100;
      quizFillEl.style.width = `${pct}%`;
    }
  }

  function handleQuizAnswer(answerType) {
    const questions = WordRamData.placementTestWords;
    const current = questions[quizIndex];
    quizAnswers[current.word] = answerType;

    quizIndex++;
    if (quizIndex < questions.length) {
      renderQuizQuestion();
    } else {
      showQuizResult();
    }
  }

  function showQuizResult() {
    evaluatedResult = WordRamData.evaluatePlacementTest(quizAnswers);
    if (quizStep) quizStep.style.display = "none";
    if (resultStep) resultStep.style.display = "block";

    if (resultBadgeEl) resultBadgeEl.textContent = evaluatedResult.badge;
    if (resultTitleEl) resultTitleEl.textContent = `Ваш уровень: ${evaluatedResult.title}`;
    if (resultDescEl) resultDescEl.textContent = evaluatedResult.desc;
  }

  const quizButtons = document.querySelectorAll(".quiz-btn");
  quizButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const ans = btn.dataset.answer;
      handleQuizAnswer(ans);
    });
  });

  if (btnOpenPlacement) btnOpenPlacement.addEventListener("click", () => openPlacementTest());
  if (btnClosePlacement) btnClosePlacement.addEventListener("click", () => closePlacementTest());

  if (btnApplyPlacement) {
    btnApplyPlacement.addEventListener("click", () => {
      if (evaluatedResult) {
        storage.setEnglishLevel(evaluatedResult.code);
        updateProfileUI();
      }
      closePlacementTest();
      game.startLevel(1, false);
      switchTab("game");
    });
  }

  function updateProfileUI() {
    const levelCode = storage.getEnglishLevel();
    if (headerCefrBadge) headerCefrBadge.textContent = `🇬🇧 ${levelCode}`;

    const profileCefrBadge = document.getElementById("profile-cefr-badge");
    const profileXpFill = document.getElementById("profile-xp-fill");
    const profileXpText = document.getElementById("profile-xp-text");
    const profileXpPercent = document.getElementById("profile-xp-percent");

    const xpData = storage.getXpProgress();

    if (profileCefrBadge) profileCefrBadge.textContent = xpData.rank.badge;
    if (profileXpFill) profileXpFill.style.width = `${xpData.percent}%`;
    if (profileXpText) {
      profileXpText.textContent = xpData.isMax ? `Опыт: ${xpData.currentXp} XP (Макс.)` : `Опыт: ${xpData.currentXp} / ${xpData.nextXp} XP`;
    }
    if (profileXpPercent) profileXpPercent.textContent = `${xpData.percent}%`;
  }

  // ----------------------------------------------------
  // Экраны и вкладки (5 Вкладок)
  // ----------------------------------------------------
  const screens = {
    game: document.getElementById("screen-game"),
    vocab: document.getElementById("screen-vocab"),
    levels: document.getElementById("screen-levels"),
    daily: document.getElementById("screen-daily"),
    settings: document.getElementById("screen-settings")
  };

  const navButtons = {
    game: document.getElementById("nav-btn-game"),
    vocab: document.getElementById("nav-btn-vocab"),
    levels: document.getElementById("nav-btn-levels"),
    daily: document.getElementById("nav-btn-daily"),
    settings: document.getElementById("nav-btn-settings")
  };

  let activeTab = "game";

  function switchTab(tabKey) {
    activeTab = tabKey;

    Object.keys(screens).forEach((key) => {
      if (screens[key]) {
        screens[key].style.display = (key === tabKey) ? "flex" : "none";
      }
    });

    Object.keys(navButtons).forEach((key) => {
      if (navButtons[key]) {
        if (key === tabKey) {
          navButtons[key].classList.add("active");
        } else {
          navButtons[key].classList.remove("active");
        }
      }
    });

    if (tabKey === "vocab") renderVocabScreen();
    if (tabKey === "levels") renderLevelsScreen();
    if (tabKey === "daily") renderDailyScreen();
    if (tabKey === "settings") renderSettingsScreen();
  }

  Object.keys(navButtons).forEach((key) => {
    if (navButtons[key]) {
      navButtons[key].addEventListener("click", () => switchTab(key));
    }
  });

  // ----------------------------------------------------
  // Экран: Мой словарь
  // ----------------------------------------------------
  const vocabCardsGrid = document.getElementById("vocab-cards-grid");
  const vocabStatsSubtitle = document.getElementById("vocab-stats-subtitle");
  const vocabSearchInput = document.getElementById("vocab-search-input");
  const vocabChips = document.querySelectorAll("#vocab-cefr-filters .chip");

  let activeVocabFilter = "ALL";
  let vocabSearchQuery = "";

  function renderVocabScreen() {
    if (!vocabCardsGrid) return;
    vocabCardsGrid.innerHTML = "";

    const collected = storage.getCollectedWords();
    const collectedWordsList = Object.keys(collected);
    const userCefr = storage.getEnglishLevel();
    const rankOrder = ["A1", "A2", "B1", "B2", "C1"];
    const userRankIdx = rankOrder.indexOf(userCefr);

    if (vocabStatsSubtitle) {
      vocabStatsSubtitle.textContent = "Выучено слов: " + collectedWordsList.length + " из 1500";
    }

    // Подсчет статистики по уровням CEFR
    const cefrCounts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    const cefrTotals = { A1: 314, A2: 659, B1: 331, B2: 76, C1: 120 };

    collectedWordsList.forEach(w => {
      const lvl = findCefrLevel(w);
      if (cefrCounts[lvl] !== undefined) cefrCounts[lvl]++;
    });

    // Отрисовка детализации прогресса по уровням
    const vocabBreakdownCard = document.getElementById("vocab-cefr-breakdown-card");
    if (vocabBreakdownCard) {
      let rowsHtml = "";
      rankOrder.forEach((lvl, idx) => {
        const isLocked = idx > userRankIdx;
        const count = cefrCounts[lvl] || 0;
        const total = cefrTotals[lvl] || 100;
        const pct = Math.min(100, Math.round((count / total) * 100));

        rowsHtml += '<div class="cefr-breakdown-row">' +
          '<span class="cefr-lvl-tag ' + lvl + '">' + lvl + '</span>' +
          '<div class="cefr-bar-bg">' +
            '<div class="cefr-bar-fill ' + lvl + '" style="width: ' + pct + '%;"></div>' +
          '</div>' +
          '<span class="cefr-count-txt">' + count + ' / ' + total + (isLocked ? ' <span class="cefr-lock-badge">🔒</span>' : '') + '</span>' +
        '</div>';
      });

      vocabBreakdownCard.innerHTML = '<div class="cefr-breakdown-title">📊 Прогресс по уровням CEFR</div>' +
        '<div class="cefr-breakdown-list">' + rowsHtml + '</div>';
    }

    // Обновляем счетчики на чипах фильтров
    vocabChips.forEach(chip => {
      const f = chip.dataset.filter;
      if (f === "ALL") {
        chip.textContent = "Все (" + collectedWordsList.length + ")";
      } else {
        const isLocked = rankOrder.indexOf(f) > userRankIdx;
        const count = cefrCounts[f] || 0;
        const total = cefrTotals[f] || 100;
        chip.textContent = isLocked ? (f + " 🔒 (" + count + "/" + total + ")") : (f + " (" + count + "/" + total + ")");
      }
    });

    function findCefrLevel(word) {
      for (const lvl of ["A1", "A2", "B1", "B2", "C1"]) {
        const wordsAtLvl = WordRamData.cefrDictionary[lvl];
        for (const len in wordsAtLvl) {
          if (wordsAtLvl[len].includes(word)) return lvl;
        }
      }
      return "A2";
    }

    const filtered = collectedWordsList.filter(w => {
      const lvl = findCefrLevel(w);
      if (activeVocabFilter !== "ALL" && lvl !== activeVocabFilter) return false;

      if (vocabSearchQuery) {
        const details = WordRamData.getWordDetails(w);
        const q = vocabSearchQuery.toLowerCase();
        const matchesWord = w.toLowerCase().includes(q);
        const matchesTr = details && details.tr && details.tr.toLowerCase().includes(q);
        if (!matchesWord && !matchesTr) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      vocabCardsGrid.innerHTML = `
        <div class="empty-vocab-msg">
          <p>🔍 ${collectedWordsList.length === 0 ? "Вы еще не нашли слов. Проходите уровни, и слова появятся здесь!" : "По вашему запросу слов не найдено."}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(w => {
      const details = WordRamData.getWordDetails(w);
      const lvl = findCefrLevel(w);
      const mastery = (collected[w] && collected[w].mastery) || 1;
      const masteryStars = "⭐".repeat(mastery);

      const card = document.createElement("div");
      card.className = "vocab-card";
      card.innerHTML = `
        <div class="vocab-card-left">
          <div class="vocab-word-title">${w} <span class="mastery-stars">${masteryStars}</span></div>
          <div class="vocab-word-tr">${details ? details.tr : ""}</div>
          <div class="vocab-word-ph">${details && details.ph ? details.ph : ""}</div>
        </div>
        <div class="vocab-card-right">
          <span class="vocab-tag">${lvl}</span>
          <span style="font-size: 1.1rem; color: #a855f7;">➔</span>
        </div>
      `;

      card.addEventListener("click", () => {
        showWordDefinitionModal(details);
      });

      vocabCardsGrid.appendChild(card);
    });
  }

  if (vocabSearchInput) {
    vocabSearchInput.addEventListener("input", (e) => {
      vocabSearchQuery = e.target.value.trim();
      renderVocabScreen();
    });
  }

  vocabChips.forEach(chip => {
    chip.addEventListener("click", () => {
      vocabChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeVocabFilter = chip.dataset.filter;
      renderVocabScreen();
    });
  });

  // ----------------------------------------------------
  // Экран: Уровни и Монстрики этапа (в точности как на скриншоте)
  // ----------------------------------------------------
  const stageMonsterAvatar = document.getElementById("stage-monster-avatar");
  const stageMonsterName = document.getElementById("stage-monster-name");
  const stagePercentDisplay = document.getElementById("stage-percent-display");
  const stageMilestoneFill = document.getElementById("stage-milestone-fill");
  const stageMilestonesPoints = document.getElementById("stage-milestones-points");
  const btnStagePlayCurrent = document.getElementById("btn-stage-play-current");
  const bonusWordsCounter = document.getElementById("bonus-words-counter");
  const btnToggleLevelsGrid = document.getElementById("btn-toggle-levels-grid");
  const levelsGridWrapper = document.getElementById("levels-grid-wrapper");
  const levelsGrid = document.getElementById("levels-grid");

  let isLevelsGridVisible = false;

  if (btnToggleLevelsGrid && levelsGridWrapper) {
    btnToggleLevelsGrid.addEventListener("click", () => {
      isLevelsGridVisible = !isLevelsGridVisible;
      levelsGridWrapper.style.display = isLevelsGridVisible ? "block" : "none";
      btnToggleLevelsGrid.textContent = isLevelsGridVisible ? "▲ Скрыть сетку уровней" : "📋 Все уровни со звездами";
    });
  }

  if (btnStagePlayCurrent) {
    btnStagePlayCurrent.addEventListener("click", () => {
      hideAllModals();
      const curLvl = storage.getSetting("unlockedLevel") || 1;
      game.startLevel(curLvl, false);
      switchTab("game");
    });
  }

  function renderLevelsScreen() {
    const curLvl = storage.getSetting("unlockedLevel") || 1;
    const stages = WordRamData.monstersStages;
    const activeStage = stages.find(s => curLvl >= s.startLevel && curLvl <= s.endLevel) || stages[0];

    // 1. Аватар монстрика и имя
    if (stageMonsterAvatar) stageMonsterAvatar.textContent = activeStage.icon;
    if (stageMonsterName) stageMonsterName.textContent = activeStage.name;

    // 2. Процент прохождения текущего монстрика
    const stageLen = activeStage.endLevel - activeStage.startLevel + 1;
    const passedInStage = Math.max(0, curLvl - activeStage.startLevel);
    const pct = Math.min(100, Math.max(0, (passedInStage / stageLen) * 100));
    if (stagePercentDisplay) {
      stagePercentDisplay.textContent = `${pct.toFixed(2).replace(".", ",") }%`;
    }

    // 3. Заполнение полосы вех
    if (stageMilestoneFill) {
      stageMilestoneFill.style.width = `${pct}%`;
    }

    // 4. Отрисовка вех/сундуков
    if (stageMilestonesPoints) {
      stageMilestonesPoints.innerHTML = "";
      activeStage.milestones.forEach(m => {
        const isReached = curLvl >= m.level;
        const pt = document.createElement("div");
        pt.className = `milestone-point-item ${isReached ? "reached" : ""}`;
        pt.innerHTML = `
          <div class="milestone-icon-bubble" title="${m.title}">${m.icon}</div>
          <span class="milestone-lbl">${m.label}</span>
        `;
        stageMilestonesPoints.appendChild(pt);
      });
    }

    // 5. Кнопка запуска текущего уровня
    if (btnStagePlayCurrent) {
      btnStagePlayCurrent.textContent = `УРОВЕНЬ ${curLvl}`;
    }

    // 6. Счетчик копилки бонусных слов
    if (bonusWordsCounter) {
      const bonusWords = storage.state.stats.bonusWordsFound || 0;
      bonusWordsCounter.textContent = `${bonusWords * 5} 🪙`;
    }

    // 7. Сетка всех уровней (со звездами)
    if (levelsGrid) {
      levelsGrid.innerHTML = "";
      const totalLevels = 60;
      const unlocked = storage.getSetting("unlockedLevel") || 1;

      for (let lvl = 1; lvl <= totalLevels; lvl++) {
        const isUnlocked = lvl <= unlocked;
        const stars = storage.getLevelStars(lvl);
        const isCurrent = lvl === curLvl;

        const card = document.createElement("button");
        card.className = `level-card ${isUnlocked ? "unlocked" : "locked"} ${isCurrent ? "current" : ""}`;
        card.disabled = !isUnlocked;

        let starsHtml = "";
        if (isUnlocked && stars > 0) {
          starsHtml = `<div class="level-stars">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</div>`;
        }

        card.innerHTML = `
          <div class="level-num">${isUnlocked ? lvl : "🔒"}</div>
          ${starsHtml}
        `;

        if (isUnlocked) {
          card.addEventListener("click", () => {
            hideAllModals();
            game.startLevel(lvl, false);
            switchTab("game");
          });
        }

        levelsGrid.appendChild(card);
      }
    }
  }

  // ----------------------------------------------------
  // Экран: События, Квесты и Стрик
  // ----------------------------------------------------
  const dailyBtnStart = document.getElementById("btn-start-daily");
  const dailyStreakEl = document.getElementById("daily-streak-count");
  const freezeCounterBadge = document.getElementById("freeze-counter-badge");
  const btnBuyFreeze = document.getElementById("btn-buy-freeze");
  const dailyRewardsCalendar = document.getElementById("daily-rewards-calendar");
  const dailyQuestsList = document.getElementById("daily-quests-list");
  const questsProgressCounter = document.getElementById("quests-progress-counter");
  const btnClaimSuperChest = document.getElementById("btn-claim-super-chest");

  function renderDailyScreen() {
    renderWordOfDay();
    const status = storage.getDailyStatus();
    if (dailyStreakEl) dailyStreakEl.textContent = status.streak;

    if (freezeCounterBadge) {
      freezeCounterBadge.textContent = `❄️ Защита: ${status.freezes}/2`;
    }

    

    // 1. Календарь наград
    if (dailyRewardsCalendar) {
      dailyRewardsCalendar.innerHTML = "";
      const currentDayInStreak = Math.max(1, (status.streak % 7) || (status.isTodayCompleted ? 7 : 1));

      WordRamData.dailyStreakRewards.forEach(item => {
        const isClaimed = item.day < currentDayInStreak || (item.day === currentDayInStreak && status.isTodayCompleted);
        const isCurrent = item.day === currentDayInStreak;

        const dayBox = document.createElement("div");
        dayBox.className = `reward-day-item ${isClaimed ? "claimed" : ""} ${isCurrent ? "current" : ""}`;
        dayBox.innerHTML = `
          <span class="reward-day-title">${item.label}</span>
          <span class="reward-day-prize">+${item.coins} 🪙</span>
          ${item.hints > 0 ? `<span style="font-size: 0.65rem; color: #a855f7;">+${item.hints} 💡</span>` : ""}
          <span style="font-size: 0.75rem;">${isClaimed ? "✔" : (isCurrent ? "⭐" : "🔒")}</span>
        `;
        dailyRewardsCalendar.appendChild(dayBox);
      });
    }

    // 2. Ежедневные задания (3 квеста)
    const dq = storage.getDailyQuests();
    if (dailyQuestsList) {
      dailyQuestsList.innerHTML = "";
      let completedCount = 0;

      WordRamData.dailyQuestsTemplates.forEach(t => {
        const qState = dq.quests[t.id] || { current: 0, target: t.target, completed: false, claimed: false };
        if (qState.completed) completedCount++;

        const qCard = document.createElement("div");
        qCard.className = `quest-item-card ${qState.completed ? "completed" : ""} ${qState.claimed ? "claimed-card" : ""}`;

        let buttonHtml = "";
        if (qState.claimed) {
          buttonHtml = `<div class="quest-done-badge"><span class="check-icon">✓</span> <span>Выполнено</span></div>`;
        } else if (qState.completed) {
          buttonHtml = `<button class="claim-ready-btn pulse-glow">Забрать</button>`;
        } else {
          buttonHtml = `<div class="quest-progress-pill">${qState.current} / ${t.target}</div>`;
        }

        qCard.innerHTML = `
          <div class="quest-item-info">
            <div class="quest-title-row">
              <strong>${t.title}</strong>
              ${qState.claimed ? '<span class="quest-check-pill">✔</span>' : ''}
            </div>
            <div class="quest-sub">${t.desc} (${qState.current}/${t.target})</div>
            <div class="quest-reward">+${t.rewardCoins} 🪙, +${t.rewardXp} XP</div>
          </div>
          <div class="quest-action-box">
            ${buttonHtml}
          </div>
        `;

        const claimBtn = qCard.querySelector("button.claim-ready-btn");
        if (claimBtn && qState.completed && !qState.claimed) {
          claimBtn.addEventListener("click", () => {
            storage.claimQuest(t.id);
            game.playSound("found");
            renderDailyScreen();
            updateProfileUI();
          });
        }

        dailyQuestsList.appendChild(qCard);
      });

      if (questsProgressCounter) {
        questsProgressCounter.textContent = `${completedCount} / 3`;
      }

      if (btnClaimSuperChest) {
        btnClaimSuperChest.disabled = (completedCount < 3 || dq.allClaimed);
        btnClaimSuperChest.textContent = dq.allClaimed ? "Открыт ✔" : "Забрать";
      }
    }
  }

  if (btnClaimSuperChest) {
    btnClaimSuperChest.addEventListener("click", () => {
      const res = storage.claimAllQuestsChest();
      if (res.success) {
        game.playSound("win");
        showCustomInfoDialog("🎁", "Сундук мастера открыт!", "<p>Поздравляем! Вы выполнили все 3 задания дня и получили:</p><p class='mt-2'><strong>+50 🪙 монет</strong>, <strong>+100 XP опыта</strong> и <strong>+1 💡 бесплатную подсказку</strong>!</p>");
        renderDailyScreen();
        updateProfileUI();
      }
    });
  }

  if (btnBuyFreeze) {
    btnBuyFreeze.addEventListener("click", () => {
      const res = storage.buyStreakFreeze(60);
      if (res.success) {
        game.playSound("found");
        showCustomInfoDialog("❄️", "Заморозка стрика", "<p>Защита успешно активирована!</p><p class='mt-2'>Если вы пропустите один день, заморозка автоматически защитит вашу серию входов от сгорания.</p>");
        renderDailyScreen();
      } else {
        showCustomInfoDialog("❄️", "Заморозка стрика", res.reason === "NOT_ENOUGH_COINS" ? "<p>Недостаточно монет (нужно <strong>60 🪙</strong>)!</p>" : "<p>У вас уже максимальный запас защит (<strong>2 из 2</strong>)!</p>");
      }
    });
  }

  if (dailyBtnStart) {
    dailyBtnStart.addEventListener("click", () => {
      hideAllModals();
      const todayLvl = 10 + (new Date().getDate() % 20);
      game.startLevel(todayLvl, true);
      switchTab("game");
    });
  }

  // ----------------------------------------------------
  // Экран: Рейтинг, Лиги и Профиль
  // ----------------------------------------------------
  const leagueNameEl = document.getElementById("league-name");
  const leagueIconEl = document.getElementById("league-icon");
  const leagueLeaderboardList = document.getElementById("league-leaderboard-list");
  const leagueRewardPreview = document.getElementById("league-reward-preview");
  const achievementsListEl = document.getElementById("achievements-list");
  const toggleVoice = document.getElementById("setting-voice");
  const toggleSound = document.getElementById("setting-sound");
  const toggleVibration = document.getElementById("setting-vibration");
  const btnResetData = document.getElementById("btn-reset-data");

  function renderSettingsScreen() {
    updateProfileUI();
    if (toggleVoice) toggleVoice.checked = storage.getSetting("voiceSpeechEnabled") !== false;

    // 1. Еженедельная лига
    const leagueData = storage.getLeagueData();
    if (leagueNameEl) leagueNameEl.textContent = leagueData.league.name;
    if (leagueIconEl) leagueIconEl.textContent = leagueData.league.icon;
    if (leagueRewardPreview) leagueRewardPreview.textContent = `Приз: +${leagueData.league.rewardCoins} 🪙`;

    if (leagueLeaderboardList) {
      leagueLeaderboardList.innerHTML = "";
      leagueData.rivals.forEach((r, idx) => {
        const row = document.createElement("div");
        row.className = `leaderboard-row ${r.isUser ? "user-row" : ""}`;
        row.innerHTML = `
          <div class="row-rank">#${idx + 1}</div>
          <div class="row-avatar">${r.avatar}</div>
          <div class="row-name">${r.name}</div>
          <div class="row-xp">${r.xp} XP</div>
        `;
        leagueLeaderboardList.appendChild(row);
      });
    }

    // 2. Достижения
    if (achievementsListEl) {
      achievementsListEl.innerHTML = "";
      const unlockedIds = storage.state.unlockedAchievements || [];

      WordRamData.achievements.forEach(ach => {
        const isUnlocked = unlockedIds.includes(ach.id);
        const card = document.createElement("div");
        card.className = `achievement-card ${isUnlocked ? "unlocked" : ""}`;
        card.innerHTML = `
          <div class="ach-icon">${ach.icon}</div>
          <div class="ach-info">
            <div class="ach-title">${ach.title} ${isUnlocked ? "✔" : ""}</div>
            <div class="ach-desc">${ach.desc}</div>
          </div>
          <div class="ach-reward">+${ach.rewardCoins} 🪙</div>
        `;
        achievementsListEl.appendChild(card);
      });
    }

    if (toggleSound) toggleSound.checked = !!storage.getSetting("soundEnabled");
    if (toggleVibration) toggleVibration.checked = !!storage.getSetting("vibrationEnabled");
  }

  if (toggleVoice) {
    toggleVoice.addEventListener("change", (e) => {
      storage.setSetting("voiceSpeechEnabled", e.target.checked);
      if (e.target.checked) game.speakWord("WordRam");
    });
  }

  if (toggleSound) {
    toggleSound.addEventListener("change", (e) => {
      storage.setSetting("soundEnabled", e.target.checked);
      if (e.target.checked) game.playSound("select");
    });
  }

  if (toggleVibration) {
    toggleVibration.addEventListener("change", (e) => {
      storage.setSetting("vibrationEnabled", e.target.checked);
      if (e.target.checked) game.vibrate(20);
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener("click", () => {
      if (confirm("Сбросить весь прогресс, словарь и монеты?")) {
        storage.resetAll();
        hideAllModals();
        renderSettingsScreen();
        game.startLevel(1, false);
        switchTab("game");
      }
    });
  }

  
  // ----------------------------------------------------
  // Поделиться и Обратная связь (v29)
  // ----------------------------------------------------

  
  // ----------------------------------------------------
  // Слово дня (Word of the Day - v32)
  // ----------------------------------------------------
  const wodWord = document.getElementById("wod-word");
  const wodPhonetic = document.getElementById("wod-phonetic");
  const wodTranslation = document.getElementById("wod-translation");
  const wodExample = document.getElementById("wod-example");
  const btnWodSpeak = document.getElementById("btn-wod-speak");
  const btnClaimWod = document.getElementById("btn-claim-wod");
  const wodRewardTag = document.getElementById("wod-reward-tag");

  function getDailyWord() {
    const words = Object.keys(WordRamData.wordDefinitions);
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const wordKey = words[dayOfYear % words.length];
    return WordRamData.getWordDetails(wordKey);
  }

  let activeDailyWord = getDailyWord();

  function renderWordOfDay() {
    if (!wodWord || !activeDailyWord) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const claimedDate = storage.state.claimedDailyWordDate;

    wodWord.textContent = activeDailyWord.word;
    wodPhonetic.textContent = activeDailyWord.ph || "";
    wodTranslation.textContent = activeDailyWord.tr || activeDailyWord.word;
    wodExample.textContent = activeDailyWord.ex || "Learn new words every day!";

    if (claimedDate === todayStr) {
      if (btnClaimWod) {
        btnClaimWod.textContent = "✓ Слово дня изучено (+20 🪙 получено)";
        btnClaimWod.disabled = true;
        btnClaimWod.className = "secondary-btn small-btn full-width mt-2";
      }
      if (wodRewardTag) wodRewardTag.textContent = "Изучено";
    } else {
      if (btnClaimWod) {
        btnClaimWod.textContent = "Изучить и забрать награду (+20 🪙)";
        btnClaimWod.disabled = false;
        btnClaimWod.className = "primary-btn small-btn full-width mt-2";
      }
      if (wodRewardTag) wodRewardTag.textContent = "+20 🪙 +40 XP";
    }
  }

  if (btnWodSpeak) {
    btnWodSpeak.addEventListener("click", (e) => {
      e.stopPropagation();
      if (activeDailyWord) game.speakWord(activeDailyWord.word);
    });
  }

  if (btnClaimWod) {
    btnClaimWod.addEventListener("click", () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      storage.state.claimedDailyWordDate = todayStr;
      storage.addCoins(20);
      storage.addXp(40);
      storage.recordWordToVocabulary(activeDailyWord.word);
      storage.save();
      game.updateCoinsDisplay();
      game.speakWord(activeDailyWord.word);
      renderWordOfDay();
      showCustomInfoDialog(
        "💡",
        "Слово дня изучено!",
        "<p>Вы изучили слово <strong>" + activeDailyWord.word + "</strong> (<em>" + activeDailyWord.tr + "</em>) и получили:</p><p class='mt-2'><strong>+20 🪙 монет</strong> и <strong>+40 XP опыта</strong>!</p><p class='mt-2'>Слово добавлено в ваш Личный словарь.</p>"
      );
    });
  }

  // ----------------------------------------------------
  // Поделиться игрой (v32)
  // ----------------------------------------------------
  const btnShareGame = document.getElementById("btn-share-game");
  const btnWinShare = document.getElementById("btn-win-share");

  function shareWordRamGame() {
    const count = storage.getCollectedWordsCount();
    let wordWord = "слов";
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) wordWord = "слово";
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) wordWord = "слова";

    const shareData = {
      title: "WordRam — Английские филворды",
      text: "Я изучаю английский в WordRam! 🇬🇧 Мой уровень: " + storage.getEnglishLevel() + " (выучено: " + count + " " + wordWord + "). Попробуй сыграть со мной: https://granonim.github.io/WordRam/",
      url: "https://granonim.github.io/WordRam/"
    };

    if (navigator.share) {
      navigator.share(shareData).then(() => {
        storage.addCoins(30);
        game.updateCoinsDisplay();
        showCustomInfoDialog("🎁", "Награда получена!", "<p>Спасибо, что делитесь игрой!</p><p class='mt-2'>Вам начислено <strong>+30 🪙 монет</strong>!</p>");
      }).catch(() => {});
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText("https://granonim.github.io/WordRam/").then(() => {
          storage.addCoins(30);
          game.updateCoinsDisplay();
          showCustomInfoDialog("📋", "Ссылка скопирована!", "<p>Ссылка на игру <strong>https://granonim.github.io/WordRam/</strong> скопирована! Отправьте её друзьям. Вам начислено <strong>+30 🪙 монет</strong>!</p>");
        });
      }
    }
  }

  if (btnShareGame) btnShareGame.addEventListener("click", shareWordRamGame);
  if (btnWinShare) btnWinShare.addEventListener("click", shareWordRamGame);

  
  // ----------------------------------------------------
  // Резервное копирование прогресса (v34)
  // ----------------------------------------------------
  const btnExportBackup = document.getElementById("btn-export-backup");
  const btnImportBackup = document.getElementById("btn-import-backup");

  if (btnExportBackup) {
    btnExportBackup.addEventListener("click", () => {
      const code = storage.exportSaveCode();
      if (code) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(() => {
            showCustomInfoDialog(
              "💾",
              "Прогресс скопирован!",
              "<p>Код резервной копии скопирован в буфер обмена!</p><p class='mt-2'>Сохраните его в заметках или отправьте себе в Telegram. Чтобы восстановить прогресс на новом телефоне, нажмите «📥 Восстановить» и вставьте этот код.</p>"
            );
          });
        } else {
          showCustomInfoDialog(
            "💾",
            "Ваш код прогресса",
            "<p>Скопируйте этот текст:</p><textarea readonly style='width:100%; height:80px; font-size:0.75rem; background:#221721; color:#fde047; border:1px solid #5c4756; border-radius:8px; padding:6px; margin-top:8px;'>" + code + "</textarea>"
          );
        }
      }
    });
  }

  if (btnImportBackup) {
    btnImportBackup.addEventListener("click", () => {
      const inputCode = prompt("Вставьте скопированный код резервной копии:");
      if (inputCode && inputCode.trim()) {
        const success = storage.importSaveCode(inputCode.trim());
        if (success) {
          game.updateCoinsDisplay();
          updateProfileUI();
          renderDailyScreen();
          renderVocabScreen();
          const cur = storage.getSetting("currentLevel") || 1;
          game.startLevel(cur, false);
          showCustomInfoDialog(
            "✅",
            "Прогресс восстановлен!",
            "<p>Все ваши выученные слова, уровень, звезды и монеты успешно загружены!</p>"
          );
        } else {
          showCustomInfoDialog(
            "❌",
            "Ошибка восстановления",
            "<p>Введен неверный или поврежденный код резервной копии. Проверьте правильность скопированного текста.</p>"
          );
        }
      }
    });
  }

  // ----------------------------------------------------
  // Запуск при старте
  // ----------------------------------------------------
  updateProfileUI();

  const saved = storage.getActiveSavedGame();
  if (saved && saved.levelData && saved.foundWords && saved.foundWords.length < saved.levelData.words.length) {
    game.restoreGameState(saved);
  } else {
    storage.clearActiveSavedGame();
    const cur = storage.getSetting("currentLevel") || 1;
    game.startLevel(cur, false);
  }

  if (!storage.getSetting("hasCompletedPlacementTest")) {
    setTimeout(() => {
      openPlacementTest();
    }, 600);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .then((reg) => {
          console.log("WordRam ServiceWorker v18 активен:", reg.scope);
        })
        .catch((err) => {
          console.warn("Ошибка регистрации ServiceWorker:", err);
        });
    });
  }
});
