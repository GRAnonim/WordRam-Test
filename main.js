/**
 * WordRam - Main Application Controller (v18)
 * 5 экранов: Игра, Словарь (с Блицем), Карта глав, События (Квесты, Колесо, Заморозка),
 * Рейтинг (Еженедельные лиги, Профиль, Достижения).
 */

document.addEventListener("DOMContentLoaded", () => {
  const storage = new WordRamStorage();
  if (typeof window !== "undefined") { window.storage = storage; }
  const generator = new WordRamGenerator(WordRamData);

  // Модальные окна
  const winModal = document.getElementById("modal-victory");
  const winWordsList = document.getElementById("win-words-list");
  const winStars = document.getElementById("win-stars");
  const winLevelLabel = document.getElementById("win-level-label");
  const winRewardCoins = document.getElementById("win-reward-coins");
  const winRewardXp = document.getElementById("win-reward-xp");
  const winNewWords = document.getElementById("win-new-words");
  const btnNextLevel = document.getElementById("btn-next-level");
  const btnShareWin = document.getElementById("btn-share-win");
  const btnCloseModal = document.getElementById("btn-close-modal");
  let lastVictorySummary = null;
  let victoryShareClaimed = false;

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
  const defMeta = document.getElementById("def-meta");
  const defSenses = document.getElementById("def-senses");
  const defPrimary = document.getElementById("def-primary");
  const btnCloseDefinition = document.getElementById("btn-close-definition");
  const btnOkDefinition = document.getElementById("btn-ok-definition");

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
    const allModals = document.querySelectorAll(".modal-overlay, .modal-backdrop");
    allModals.forEach(m => {
      m.style.setProperty("display", "none", "important");
      m.classList.remove("open");
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
    if (infoDialogIcon) {
      if (icon && String(icon).indexOf("<") !== -1) infoDialogIcon.innerHTML = icon;
      else infoDialogIcon.textContent = icon || "ℹ️";
    }
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

  function escapeDefHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightLemmaHtml(text, lemma) {
    const src = String(text || "");
    const needle = String(lemma || "").trim();
    if (!needle) return escapeDefHtml(src);
    const re = new RegExp("(" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return src.split(re).map((part) => {
      if (part && part.toUpperCase() === needle.toUpperCase()) {
        return `<mark class="def-hit">${escapeDefHtml(part)}</mark>`;
      }
      return escapeDefHtml(part);
    }).join("");
  }

  function splitTranslationSenses(raw) {
    return String(raw || "")
      .split(/\s*\/\s*|[;•]|,(?=\s)/)
      .map((part) => part.replace(/^\d+\)\s*/, "").trim())
      .filter((part) => part.length > 1)
      .slice(0, 4);
  }

  function isGlossOnlyExample(ex, word, tr) {
    const compact = (value) => String(value || "")
      .toLowerCase()
      .replace(/[«»"“”.!?,:;()]/g, " ")
      .replace(/[—–-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const example = compact(ex);
    const lemma = compact(word);
    const gloss = compact(tr);
    if (!example || !lemma) return true;
    if (example === lemma || example === gloss) return true;
    if (example === lemma + " " + gloss) return true;
    const left = compact(String(ex).split(/\s+[—–]\s+/)[0]);
    const right = compact(String(ex).split(/\s+[—–]\s+/).slice(1).join(" "));
    if (left === lemma && right && (right === gloss || gloss.indexOf(right) !== -1 || right.indexOf(lemma) !== -1)) {
      return true;
    }
    return left === lemma && !right;
  }

  function posLabel(pos) {
    const map = {
      noun: "сущ.",
      verb: "гл.",
      adjective: "прил.",
      adverb: "нар.",
      pronoun: "мест.",
      numeral: "числ.",
      particle: "част.",
      interjection: "межд."
    };
    return map[pos] || "";
  }

  function showWordDefinitionModal(details) {
    if (!defModal || !details) return;
    currentActiveWord = details.word;
    if (defWordRibbon) defWordRibbon.textContent = details.word;

    const currentLang = storage.getLanguage();
    const btnSpeakDefEl = document.getElementById("btn-speak-def") || document.querySelector("#modal-word-definition .speak-btn");
    if (btnSpeakDefEl) {
      const isChechenWord = currentLang === "chechen" || /[А-ЯЁӀ]/i.test(details.word || "");
      btnSpeakDefEl.style.display = isChechenWord ? "none" : "flex";
    }

    if (defPhonetic) {
      if (details.ph && details.ph.trim()) {
        defPhonetic.textContent = details.ph;
        defPhonetic.style.display = "block";
      } else {
        defPhonetic.style.display = "none";
      }
    }

    if (defMeta) {
      const bits = [];
      const pos = posLabel(details.pos);
      if (pos) bits.push(pos);
      if (details.level) bits.push(details.level);
      defMeta.innerHTML = bits.length
        ? bits.map((bit) => `<span>${escapeDefHtml(bit)}</span>`).join('<span class="def-meta-dot">·</span>')
        : "";
      defMeta.style.display = bits.length ? "flex" : "none";
    }

    const senses = splitTranslationSenses(details.tr || details.word);
    const headSenses = senses.slice(0, 2);
    const extraSenses = senses.slice(2);
    if (defPrimary) {
      defPrimary.textContent = headSenses.join(" · ") || (details.tr || details.word);
      defPrimary.style.display = "block";
    }
    if (defSenses) {
      if (extraSenses.length) {
        defSenses.innerHTML = extraSenses.map((sense) =>
          `<span class="def-sense">${escapeDefHtml(sense)}</span>`
        ).join("");
        defSenses.style.display = "flex";
      } else {
        defSenses.innerHTML = "";
        defSenses.style.display = "none";
      }
    }
    if (defTranslation) {
      defTranslation.textContent = details.tr || details.word;
      defTranslation.style.display = senses.length ? "none" : "block";
    }

    if (defMeaning) {
      const rawDef = (details.def || "").trim();
      const isAutoDef = /^Словарное значение:/i.test(rawDef);
      if (!rawDef || isAutoDef) {
        defMeaning.style.display = "none";
        defMeaning.textContent = "";
      } else {
        defMeaning.innerHTML = highlightLemmaHtml(rawDef, details.word);
        defMeaning.style.display = "block";
      }
    }

    if (defExampleBox && defExampleText) {
      const ex = (details.ex || "").trim();
      const skip = !ex || ex.includes("English context") || isGlossOnlyExample(ex, details.word, details.tr);
      if (skip) {
        defExampleBox.style.display = "none";
        defExampleText.textContent = "";
      } else {
        const parts = ex.split(/\s+[—–]\s+/);
        if (parts.length >= 2) {
          defExampleText.innerHTML =
            `<span class="def-ex-src">${highlightLemmaHtml(parts[0], details.word)}</span>` +
            `<span class="def-ex-tr">${escapeDefHtml(parts.slice(1).join(" — "))}</span>`;
        } else {
          defExampleText.innerHTML = highlightLemmaHtml(ex, details.word);
        }
        defExampleBox.style.display = "block";
      }
    }

    if (defCollocationsBox && defCollocationsList) {
      if (details.collocations && details.collocations.length > 0) {
        defCollocationsList.innerHTML = details.collocations
          .map(c => `<span class="collocation-tag">${escapeDefHtml(c)}</span>`)
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

  function getVictoryShareText(summary) {
    const s = summary || lastVictorySummary;
    if (!s) {
      return "🏆 Я прохожу WordRam — игру в слова! Сыграй со мной: https://granonim.github.io/WordRam/";
    }
    const starsCount = Math.max(1, Math.min(3, s.stars || 3));
    const starsStr = "★".repeat(starsCount) + "☆".repeat(3 - starsCount);
    const levelPart = s.isDaily ? "ежедневный вызов" : `уровень ${s.level}`;
    const wordsPreview = (s.words || []).slice(0, 5).join(", ");
    const more = (s.words || []).length > 5 ? "…" : "";
    return `🏆 Я прошёл ${levelPart} в WordRam! ${starsStr}\nСлова: ${wordsPreview}${more}\nСыграй со мной: https://granonim.github.io/WordRam/`;
  }

  function claimVictoryShareReward() {
    if (victoryShareClaimed) return;
    const res = storage.claimVictoryShareReward(10);
    if (!res.rewarded) {
      victoryShareClaimed = true;
      updateShareWinButton();
      game.showFloatingMessage("Сегодня награда за победу уже получена — спасибо, что делитесь!", "info");
      return;
    }
    victoryShareClaimed = true;
    game.playSound("win");
    game.vibrate([20, 40, 20]);
    game.updateCoinsDisplay();
    updateProfileUI();
    updateShareWinButton();
    game.showFloatingMessage("🎉 Спасибо, что делитесь! +10 🪙 за победу", "bonus");
  }

  function updateShareWinButton() {
    if (!btnShareWin) return;
    const canClaim = !victoryShareClaimed && storage.canClaimVictoryShareReward();
    btnShareWin.innerHTML = canClaim
      ? '🏆 Поделиться победой (+10 <span class="coin-icon"></span>)'
      : "🏆 Поделиться победой";
  }

  async function shareVictory() {
    const text = getVictoryShareText(lastVictorySummary);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "WordRam",
          text: text,
          url: "https://granonim.github.io/WordRam/"
        });
        claimVictoryShareReward();
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        game.showFloatingMessage("📋 Текст победы скопирован — вставьте в мессенджер!", "info");
        claimVictoryShareReward();
        return;
      }
      window.open(
        `https://t.me/share/url?url=https://granonim.github.io/WordRam/&text=${encodeURIComponent(text)}`,
        "_blank"
      );
      claimVictoryShareReward();
    } catch (err) {
      if (err && err.name === "AbortError") return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          game.showFloatingMessage("📋 Текст победы скопирован!", "info");
          claimVictoryShareReward();
        }
      } catch (e) {
        console.warn("Share win error:", err || e);
      }
    }
  }

  function showVictoryModal(summary) {
    if (!winModal || !summary || !summary.words || summary.words.length === 0) return;

    lastVictorySummary = summary;
    victoryShareClaimed = !storage.canClaimVictoryShareReward();
    updateShareWinButton();

    const starsCount = Math.max(1, Math.min(3, summary.stars || 3));
    const coins = summary.alreadyCompleted ? 0 : (summary.coinsEarned || summary.rewardCoins || 15);
    const xp = summary.alreadyCompleted ? 0 : (summary.xpEarned || 30);
    const levelLabel = summary.isDaily
      ? "Ежедневный вызов"
      : (summary.alreadyCompleted ? `Уровень ${summary.level} · повтор` : `Уровень ${summary.level}`);

    if (winLevelLabel) {
      winLevelLabel.textContent = levelLabel;
    }

    if (winStars) {
      winStars.innerHTML = [1, 2, 3]
        .map((i) => `<span class="star${i <= starsCount ? " filled" : ""}">★</span>`)
        .join("");
      winStars.setAttribute("aria-label", `${starsCount} из 3 звёзд`);
    }

    if (winRewardCoins) {
      winRewardCoins.textContent = `+${coins}`;
    }

    if (winRewardXp) {
      winRewardXp.textContent = `+${xp} XP`;
    }

    if (winNewWords) {
      const fresh = (summary.newWords && summary.newWords.length) || 0;
      winNewWords.textContent = fresh > 0
        ? `Новых слов в словаре: ${fresh}. Они теперь твои.`
        : "Ты повторил знакомые слова — так они лучше запоминаются.";
    }

    if (winWordsList) {
      winWordsList.innerHTML = "";
      summary.words.forEach((w) => {
        const details = WordRamData.getWordDetails(w);
        const rawTr = details && details.tr ? String(details.tr).trim() : "";
        const sameAsWord = rawTr.toUpperCase() === String(w).trim().toUpperCase();
        const li = document.createElement("li");
        li.className = "win-word-item";
        li.setAttribute("role", "button");
        li.tabIndex = 0;
        li.setAttribute("aria-expanded", "false");

        const check = document.createElement("span");
        check.className = "win-word-check";
        check.textContent = "✔";

        const body = document.createElement("span");
        body.className = "win-word-body";

        const strong = document.createElement("strong");
        strong.textContent = w;

        const trEl = document.createElement("span");
        trEl.className = "win-word-tr";
        trEl.textContent = !rawTr || sameAsWord ? "Перевод не найден" : rawTr;

        body.append(strong, trEl);
        li.append(check, body);

        const toggle = () => {
          const open = li.classList.toggle("is-open");
          li.setAttribute("aria-expanded", open ? "true" : "false");
        };
        li.addEventListener("click", toggle);
        li.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          toggle();
        });
        winWordsList.appendChild(li);
      });
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

  if (btnShareWin) {
    btnShareWin.addEventListener("click", () => {
      shareVictory();
    });
  }

  
  // Подсказки при нажатии на бейджи шапки и свинью-копилку
  const btnHeaderCefr = document.getElementById("header-cefr-badge");
  const btnHeaderCoins = document.getElementById("btn-show-coins-info");
  const btnShowBonusPiggy = document.getElementById("btn-show-bonus-words");

  if (btnHeaderCefr) {
    btnHeaderCefr.addEventListener("click", () => {
      const lang = storage.getLanguage();
      const lvl = storage.getLanguageLevel(lang);
      const rank = WordRamData.xpRanks.find(r => r.code === lvl) || WordRamData.xpRanks[0];
      showCustomInfoDialog(
        lang === "chechen" ? '<span class="flag-ce"></span>' : "🇬🇧",
        "Уровень: " + rank.title,
        "<p>Текущий ранг <strong>" + (lang === "chechen" ? "чеченского" : "английского") + "</strong> словаря: <strong>" + rank.badge + "</strong>.</p><p class='mt-2'>Опыт и CEFR считаются отдельно для каждого языка. Он задаёт сложность новых уровней.</p>"
      );
    });
  }

  if (btnHeaderCoins) {
    btnHeaderCoins.addEventListener("click", () => {
      showCustomInfoDialog(
        '<span class="coin-icon coin-icon-lg"></span>',
        "Баланс монет",
        "<p>У вас: <strong>" + storage.getCoins() + " <span class='coin-icon'></span> монет</strong>.</p><p class='mt-2'>Траты: подсказка 15 <span class='coin-icon'></span>, заморозка стрика 60 <span class='coin-icon'></span>.</p><p class='mt-2'>Доход: уровни, квесты, слово дня, стрик-календарь.</p>"
      );
    });
  }

  if (btnShowBonusPiggy) {
    btnShowBonusPiggy.addEventListener("click", () => {
      const bonusCount = storage.state.stats.bonusWordsFound || 0;
      showCustomInfoDialog(
        "💰",
        "Копилка эрудита",
        "<p>Собрано бонусных слов: <strong>" + bonusCount + "</strong> (+" + (bonusCount * 5) + " <span class='coin-icon'></span> монет получено).</p><p class='mt-2'>Сюда попадают реальные слова текущего языка, найденные на поле вне списка уровня.</p><p class='mt-2'>За каждое: <strong>+5 <span class='coin-icon'></span></strong> и <strong>+5 XP</strong>.</p>"
      );
    });
  }

  const btnMapLevelInfo = document.getElementById("btn-map-level-info");
  if (btnMapLevelInfo) {
    btnMapLevelInfo.addEventListener("click", () => {
      showCustomInfoDialog(
        "ℹ",
        "Как устроена карта",
        "<p>Это карта твоего пути.</p>" +
        "<p class='mt-2'>Внизу есть большая кнопка «УРОВЕНЬ». Нажми её — начнётся игра.</p>" +
        "<p class='mt-2'>Цифра с процентами: сколько уровней на этом этапе ты уже прошёл.</p>" +
        "<p class='mt-2'>Слова на поле бывают проще или сложнее. Это зависит от твоего уровня языка в профиле: A1 — самые лёгкие, дальше сложнее.</p>"
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
    const words = Object.keys(collected).filter((word) => wordStillInLexicon(word, storage.getLanguage()));

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
    const xpEarned = blitzScore * 10;
      storage.addXp(xpEarned);
      const blitzXpEl = document.getElementById("blitz-xp-counter");
      if (blitzXpEl) blitzXpEl.textContent = `+${xpEarned} XP`;
      showCustomInfoDialog("🎯", "Тренировка завершена!", "<p>Отличный результат! Вы заработали <strong>+" + xpEarned + " XP</strong> и закрепили выученные слова!</p><p class='mt-2'>Слова получили дополнительное мастерство ⭐ в вашем словаре.</p>");
      hideAllModals();
      updateProfileUI();
      renderVocabScreen();
      return;
    }

    const currentWord = blitzQuestions[blitzIndex]; currentBlitzTargetWord = currentWord; game.speakWord(currentWord);
    const details = WordRamData.getWordDetails(currentWord, storage.getLanguage());

    if (blitzWordEl) blitzWordEl.textContent = currentWord;
    if (blitzPhEl) blitzPhEl.textContent = details ? details.ph : "";
    const blitzCorrectEl = document.getElementById("blitz-correct-counter");
    const blitzXpLive = document.getElementById("blitz-xp-counter");
    if (blitzCorrectEl) blitzCorrectEl.textContent = String(blitzScore);
    if (blitzXpLive) blitzXpLive.textContent = `+${blitzScore * 10} XP`;
    const blitzStepEl = document.getElementById("blitz-step-pill");
    if (blitzStepEl) blitzStepEl.textContent = `${blitzIndex + 1} / ${blitzQuestions.length}`;
    if (blitzScoreCounter) blitzScoreCounter.textContent = `Очки: ${blitzScore} / ${blitzQuestions.length}`;
    if (blitzProgressFill) {
      const pct = ((blitzIndex + 1) / blitzQuestions.length) * 100;
      blitzProgressFill.style.width = `${pct}%`;
    }

    // Генерируем 4 варианта ответа (1 верный + 3 дистрактора)
    const lang = storage.getLanguage();
    let pool = [];
    if (lang === "chechen" && typeof WordRamDataCE !== "undefined" && WordRamDataCE.definitions) {
      pool = Object.keys(WordRamDataCE.definitions);
    } else if (typeof WordRamDataEN !== "undefined" && WordRamDataEN.wordDefinitions) {
      pool = Object.keys(WordRamDataEN.wordDefinitions);
    }
    const distractors = pool
      .filter(w => w !== currentWord)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => WordRamData.getWordDetails(w, lang).tr);

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
  let quizQuestions = [];

  function getActiveQuizList() {
    return quizQuestions.length ? quizQuestions : WordRamData.buildPlacementQuiz(storage.getLanguage());
  }

  function openPlacementTest() {
    quizIndex = 0;
    quizAnswers = {};
    quizQuestions = WordRamData.buildPlacementQuiz(storage.getLanguage());
    if (quizStep) quizStep.style.display = "block";
    if (resultStep) resultStep.style.display = "none";

    const currentLang = storage.getLanguage();
    const modalTitleEl = document.querySelector("#modal-placement .modal-header h2");
    if (modalTitleEl) {
      modalTitleEl.textContent = currentLang === "chechen"
        ? "Определение уровня чеченского"
        : "🎯 Тест словарного запаса (English)";
    }

    renderQuizQuestion();
    showModal(placementModal);
  }

  function closePlacementTest() {
    const currentLang = storage.getLanguage();
    if (currentLang === "chechen") {
      storage.setSetting("hasCompletedChechenPlacementTest", true);
    } else {
      storage.setSetting("hasCompletedPlacementTest", true);
    }
    hideAllModals();
  }

  function renderQuizQuestion() {
    const questions = getActiveQuizList();
    if (quizIndex >= questions.length) {
      showQuizResult();
      return;
    }

    const current = questions[quizIndex];
    if (quizWordEl) {
      quizWordEl.textContent = current.word;
      if (current.tr) quizWordEl.title = current.tr;
    }
    if (quizCounterEl) quizCounterEl.textContent = `${quizIndex + 1} / ${questions.length}`;
    if (quizFillEl) {
      const pct = ((quizIndex + 1) / questions.length) * 100;
      quizFillEl.style.width = `${pct}%`;
    }
  }

  function handleQuizAnswer(answerType) {
    const questions = getActiveQuizList();
    const current = questions[quizIndex];
    if (current) {
      quizAnswers[current.word] = answerType;
    }

    quizIndex++;
    if (quizIndex < questions.length) {
      renderQuizQuestion();
    } else {
      showQuizResult();
    }
  }

  function showQuizResult() {
    if (quizStep) quizStep.style.display = "none";
    if (resultStep) resultStep.style.display = "block";

    const currentLang = storage.getLanguage();
    if (currentLang === "chechen") {
      const res = WordRamData.evaluateChechenPlacementTest(quizAnswers, quizQuestions);
      storage.setLanguageLevel(res.code, "chechen");
      storage.setSetting("hasCompletedChechenPlacementTest", true);

      if (resultBadgeEl) resultBadgeEl.textContent = res.badge;
      if (resultTitleEl) resultTitleEl.textContent = res.title;
      if (resultDescEl) {
        resultDescEl.innerHTML = `<p>Ваш рекомендуемый уровень: <strong>${res.title}</strong>.</p>
        <p class='mt-2'>Чеченские слова в игре теперь откалиброваны под ваш реальный словарный запас!</p>`;
      }
    } else {
      const res = WordRamData.evaluatePlacementTest(quizAnswers, "english", quizQuestions);
      storage.setEnglishLevel(res.code);
      storage.setSetting("hasCompletedPlacementTest", true);

      if (resultBadgeEl) resultBadgeEl.textContent = res.badge;
      if (resultTitleEl) resultTitleEl.textContent = res.title;
      if (resultDescEl) {
        resultDescEl.innerHTML = `<p>Ваш рекомендуемый уровень: <strong>${res.title}</strong>.</p>
        <p class='mt-2'>Слова в игре теперь откалиброваны под ваш реальный словарный запас!</p>`;
      }
    }
    updateProfileUI();
  }

  if (btnOpenPlacement) btnOpenPlacement.addEventListener("click", () => openPlacementTest());
  if (btnClosePlacement) btnClosePlacement.addEventListener("click", () => closePlacementTest());

  
  // Привязка кнопок ответа в Тесте уровня
  const quizActionButtons = document.querySelectorAll("#placement-quiz-step .quiz-btn, #placement-quiz-step button[data-answer]");
  quizActionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const ans = btn.dataset.answer || "DONT_KNOW";
      handleQuizAnswer(ans);
    });
  });


  // Универсальное закрытие всех модальных окон
  document.querySelectorAll(".modal-close-icon, .close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      hideAllModals();
    });
  });

  if (btnApplyPlacement) {
    btnApplyPlacement.addEventListener("click", () => {
      closePlacementTest();
      game.startLevel(1, false);
      switchTab("game");
    });
  }

  function updateProfileUI() {
    const currentLang = storage.getLanguage();
    const levelCode = storage.getLanguageLevel(currentLang);
    
    if (headerCefrBadge) {
      const flag = currentLang === "chechen"
        ? '<span class="flag-ce" title="Флаг Чеченской Республики"></span>'
        : '<span class="flag-gb">🇬🇧</span>';
      headerCefrBadge.innerHTML = `${flag} ${levelCode}`;
      headerCefrBadge.title = currentLang === "chechen" ? "Язык игры: Чеченский" : "Язык игры: English";
    }

    const profileCefrBadge = document.getElementById("profile-cefr-badge");
    const profileXpFill = document.getElementById("profile-xp-fill");
    const profileXpText = document.getElementById("profile-xp-text");
    const profileXpPercent = document.getElementById("profile-xp-percent");

    const xpData = storage.getXpProgress();

    if (profileCefrBadge) {
      const flag = currentLang === "chechen"
        ? '<span class="flag-ce" title="Флаг Чеченской Республики"></span>'
        : '<span class="flag-gb">🇬🇧</span>';
      if (currentLang === "chechen") {
        profileCefrBadge.innerHTML = `${flag} ${levelCode}`;
      } else {
        profileCefrBadge.innerHTML = `${flag} ${xpData.rank.badge}`;
      }
    }
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

    function findCefrLevel(word, lang = storage.getLanguage()) {
    if (!word) return "A1";
    const details = WordRamData.getWordDetails(word, lang);
    if (details && details.level) return details.level;
    return "A1";
  }

  function wordStillInLexicon(word, lang) {
    const raw = String(word || "").trim().toUpperCase();
    if (!raw) return false;
    if (lang === "chechen") {
      const key = (typeof WordRamTokenizer !== "undefined") ? WordRamTokenizer.normalizeChechen(raw) : raw;
      return !!(typeof WordRamDataCE !== "undefined" && WordRamDataCE.definitions && WordRamDataCE.definitions[key]);
    }
    return !!(typeof WordRamDataEN !== "undefined" && WordRamDataEN.wordDefinitions && WordRamDataEN.wordDefinitions[raw]);
  }

function renderVocabScreen() {
    if (!vocabCardsGrid) return;
    vocabCardsGrid.innerHTML = "";

    const currentLang = storage.getLanguage();
    const collected = storage.getCollectedWords(currentLang);
    const collectedWordsList = Object.keys(collected).filter((word) => wordStillInLexicon(word, currentLang));
    const userCefr = storage.getLanguageLevel(currentLang);

    const rankOrder = currentLang === "chechen"
      ? ["A1", "A2", "B1", "B2", "C1", "C2"]
      : ["A1", "A2", "B1", "B2", "C1"];
    const userRankIdx = rankOrder.indexOf(userCefr);

    if (vocabStatsSubtitle) {
      const langLabel = currentLang === "chechen" ? "чеченских" : "";
      const lexiconTotal = WordRamData.getLexiconSize(currentLang);
      vocabStatsSubtitle.textContent = `Выучено ${langLabel} слов: ${collectedWordsList.length} из ${lexiconTotal}`.replace("  ", " ");
    }

    // Подсчет статистики по уровням
    const cefrCounts = {};
    rankOrder.forEach(l => { cefrCounts[l] = 0; });

    const cefrTotals = WordRamData.getCefrTotals(currentLang);

    collectedWordsList.forEach(w => {
      const lvl = findCefrLevel(w, currentLang);
      if (cefrCounts[lvl] !== undefined) cefrCounts[lvl]++;
    });

    // Отрисовка детализации прогресса по уровням (как на скриншоте 45)
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

      const titleText = currentLang === "chechen" ? "📊 Прогресс по уровням словаря" : "📊 Прогресс по уровням CEFR";
      vocabBreakdownCard.innerHTML = '<div class="cefr-breakdown-title">' + titleText + '</div>' +
        '<div class="cefr-breakdown-list">' + rowsHtml + '</div>';
    }

    // Обновляем счетчики на чипах фильтров
    const chipsList = document.querySelectorAll("#vocab-cefr-filters .chip");
    chipsList.forEach(chip => {
      const f = chip.dataset.filter;
      if (f === "ALL") {
        chip.textContent = "Все (" + collectedWordsList.length + ")";
        chip.style.display = "inline-flex";
      } else if (f === "C2") {
        if (currentLang === "chechen") {
          const isLocked = rankOrder.indexOf("C2") > userRankIdx;
          const count = cefrCounts["C2"] || 0;
          const totalC2 = cefrTotals.C2 || 0;
          chip.textContent = isLocked ? `C2 🔒 (${count}/${totalC2})` : `C2 (${count}/${totalC2})`;
          chip.style.display = "inline-flex";
        } else {
          chip.style.display = "none";
        }
      } else {
        const isLocked = rankOrder.indexOf(f) > userRankIdx;
        const count = cefrCounts[f] || 0;
        const total = cefrTotals[f] || 100;
        chip.textContent = isLocked ? `${f} 🔒 (${count}/${total})` : `${f} (${count}/${total})`;
        chip.style.display = "inline-flex";
      }
    });

    // Фильтрация и поиск слов
    let filteredWords = collectedWordsList;
    if (activeVocabFilter !== "ALL") {
      filteredWords = filteredWords.filter(w => findCefrLevel(w, currentLang) === activeVocabFilter);
    }
    if (vocabSearchQuery && vocabSearchQuery.trim().length > 0) {
      const q = vocabSearchQuery.trim().toUpperCase();
      filteredWords = filteredWords.filter(w => {
        const details = WordRamData.getWordDetails(w, currentLang);
        return w.includes(q) || (details && details.tr && details.tr.toUpperCase().includes(q));
      });
    }

    if (filteredWords.length === 0) {
      vocabCardsGrid.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>Вы еще не нашли слов. Проходите уровни, и слова появятся здесь!</p>
        </div>
      `;
      return;
    }

    filteredWords.forEach(word => {
      const info = collected[word] || { count: 1, mastery: 1 };
      const details = WordRamData.getWordDetails(word, currentLang);
      const lvl = findCefrLevel(word, currentLang);
      const masteryStars = "★".repeat(info.mastery || 1);

      const card = document.createElement("div");
      card.className = "vocab-card";
      card.innerHTML = `
        <div class="vocab-card-left">
          <div class="vocab-word-title">${word} <span class="mastery-stars">${masteryStars}</span></div>
          <div class="vocab-word-tr">${details ? details.tr : word}</div>
          <div class="vocab-word-ph">${details && details.ph ? details.ph : ""}</div>
        </div>
        <div class="vocab-card-right">
          <span class="vocab-tag">${lvl}</span>
          <span style="font-size: 1.1rem; color: #a855f7;">➔</span>
        </div>
      `;

      card.addEventListener("click", () => {
        if (details) showWordDefinitionModal(details);
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
    const currentLang = storage.getLanguage();
    const curLvl = storage.getUnlockedLevel(currentLang) || 1;
    const stages = WordRamData.getStages(currentLang);
    const activeStage = stages.find(s => curLvl >= s.startLevel && curLvl <= s.endLevel) || stages[stages.length - 1] || stages[0];

    const screenHeaderTitle = document.querySelector("#screen-levels .screen-header h2");
    const screenHeaderSub = document.querySelector("#screen-levels .screen-header .subtitle");
    if (screenHeaderTitle) {
      screenHeaderTitle.textContent = currentLang === "chechen" ? "Карта уровней (Нохчийн мотт)" : "Карта монстриков";
    }
    if (screenHeaderSub) {
      screenHeaderSub.textContent = currentLang === "chechen" ? "Исследуйте локации и открывайте награды" : "Побеждайте монстров и собирайте сундуки";
    }

    // 1. Аватар монстрика и имя
    if (stageMonsterAvatar) stageMonsterAvatar.textContent = activeStage.icon;
    if (stageMonsterName) stageMonsterName.textContent = activeStage.name;
    const stageStoryEl = document.getElementById("stage-story");
    if (stageStoryEl) {
      stageStoryEl.textContent = activeStage.story || activeStage.desc || "Пройди уровни по одному. Большая кнопка «УРОВЕНЬ» начинает игру.";
    }

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
      bonusWordsCounter.innerHTML = `${bonusWords * 5} <span class="coin-icon"></span>`;
    }

    // 7. Сетка всех уровней (со звездами)
    if (levelsGrid) {
      levelsGrid.innerHTML = "";
      const totalLevels = 60;
      const unlocked = storage.getUnlockedLevel(currentLang) || 1;

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

  function renderWeekAlbum() {
    const albumDaysEl = document.getElementById("week-album-days");
    const albumCountEl = document.getElementById("week-album-count");
    const btnStamp = document.getElementById("btn-claim-week-stamp");
    if (!albumDaysEl) return;
    const status = storage.getWeekAlbumStatus();
    if (albumCountEl) albumCountEl.textContent = `${status.filled}/7`;
    albumDaysEl.innerHTML = status.days.map((d) =>
      `<div class="week-album-day${d.done ? " done" : ""}${d.isToday ? " today" : ""}"><span>${d.label}</span></div>`
    ).join("");
    if (btnStamp) {
      btnStamp.disabled = status.stampClaimed || status.filled < 7;
      btnStamp.innerHTML = status.stampClaimed
        ? "Печать недели уже у тебя"
        : 'Печать недели · +40 <span class="coin-icon"></span>';
    }
  }

  function renderWeeklyReview() {
    const listEl = document.getElementById("weekly-review-list");
    const btn = document.getElementById("btn-claim-weekly-review");
    const card = document.getElementById("card-weekly-review");
    if (!listEl) return;
    const lang = storage.getLanguage();
    const status = storage.getWeeklyReviewStatus(lang);
    if (card) card.style.display = status.available ? "" : "none";
    if (!status.available) return;
    const picked = status.words && status.words.length ? status.words : storage.pickWeeklyReviewWords(lang, 5);
    listEl.innerHTML = picked.map((w) => {
      const details = WordRamData.getWordDetails(w, lang) || {};
      const tr = details.tr || "";
      return `<button type="button" class="weekly-review-item" data-word="${w}"><strong>${w}</strong><span class="weekly-review-tr">${tr}</span></button>`;
    }).join("");
    if (btn) {
      btn.disabled = status.claimed;
      btn.textContent = status.claimed ? "Награда уже получена" : "Забрать награду";
    }
  }

  function renderDailyScreen() {
    updateDailyWordCard();
    renderWeekAlbum();
    renderWeeklyReview();
    const status = storage.getDailyStatus();
    if (dailyStreakEl) dailyStreakEl.textContent = status.streak;

    if (freezeCounterBadge) {
      freezeCounterBadge.textContent = `❄️ ${status.freezes}/2`;
    }

    

    // 1. Календарь наград
    if (dailyRewardsCalendar) {
      dailyRewardsCalendar.innerHTML = "";
      const cycleDay = status.streak > 0 ? ((status.streak - 1) % 7) + 1 : 1;
      const playedToday = !!status.isTodayCompleted;

      WordRamData.dailyStreakRewards.forEach(item => {
        const isClaimed = playedToday ? item.day <= cycleDay : item.day < cycleDay;
        const isCurrent = item.day === cycleDay;

        const dayBox = document.createElement("div");
        dayBox.className = `reward-day-item ${isClaimed ? "claimed" : ""} ${isCurrent ? "current" : ""}`;
        dayBox.innerHTML = `
          <span class="reward-day-num">${item.label}</span>
          <span class="reward-day-prize"><span class="coin-icon"></span>${item.coins}</span>
          ${item.hints > 0 ? `<span class="reward-day-extra">+${item.hints} 💡</span>` : ""}
          <span class="reward-day-status">${isClaimed ? "✔" : (isCurrent ? "★" : "")}</span>
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

        const isReadyToClaim = qState.completed && !qState.claimed;
        const isClaimed = qState.claimed;

        let btnText = `${qState.current}/${t.target}`;
        let btnClass = "small-btn locked-btn";

        if (isClaimed) {
          btnText = "✔ Забрано";
          btnClass = "small-btn claimed-btn";
        } else if (isReadyToClaim) {
          btnText = "✔ Забрать";
          btnClass = "small-btn claim-ready-btn pulse-ready";
        }

        const qCard = document.createElement("div");
        qCard.className = `quest-item-card ${qState.completed ? "completed" : ""}`;
        qCard.innerHTML = `
          <div class="quest-item-info">
            <div class="quest-title-row">
              <strong>${t.title}</strong>
              ${qState.completed ? '<span class="quest-check-badge">✔</span>' : ''}
            </div>
            <div class="quest-sub">${t.desc}</div>
            <div class="quest-meta"><span>${qState.current}/${t.target}</span><span class="quest-reward">+${t.rewardCoins} <span class="coin-icon"></span> · +${t.rewardXp} XP</span></div>
          </div>
          <button class="quest-claim-btn ${btnClass}" ${(!qState.completed || qState.claimed) ? "disabled" : ""}>
            ${btnText}
          </button>
        `;

        const claimBtn = qCard.querySelector("button");
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

    if (dailyBtnStart) {
      const challengeDone = !!status.isDailyChallengeDone;
      dailyBtnStart.disabled = challengeDone;
      dailyBtnStart.innerHTML = challengeDone
        ? "Вызов пройден сегодня"
        : 'Ежедневный вызов · +50 <span class="coin-icon"></span>';
    }

    const btnOpenWheel = document.getElementById("btn-open-lucky-wheel");
    if (btnOpenWheel) {
      btnOpenWheel.disabled = !storage.canSpinLuckyWheel();
      btnOpenWheel.textContent = storage.canSpinLuckyWheel()
        ? "🎡 Колесо фортуны (1 раз в день)"
        : "🎡 Колесо уже крутили сегодня";
    }
  }

  if (btnClaimSuperChest) {
    btnClaimSuperChest.addEventListener("click", () => {
      const res = storage.claimAllQuestsChest();
      if (res.success) {
        game.playSound("win");
        showCustomInfoDialog("🎁", "Сундук мастера открыт!", "<p>Поздравляем! Вы выполнили все 3 задания дня и получили:</p><p class='mt-2'><strong>+50 <span class='coin-icon'></span> монет</strong>, <strong>+100 XP опыта</strong> и <strong>+1 💡 бесплатную подсказку</strong>!</p>");
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
        showCustomInfoDialog("❄️", "Заморозка стрика", res.reason === "NOT_ENOUGH_COINS" ? "<p>Недостаточно монет (нужно <strong>60 <span class='coin-icon'></span></strong>)!</p>" : "<p>У вас уже максимальный запас защит (<strong>2 из 2</strong>)!</p>");
      }
    });
  }

  const btnClaimWeekStamp = document.getElementById("btn-claim-week-stamp");
  if (btnClaimWeekStamp) {
    btnClaimWeekStamp.addEventListener("click", () => {
      const res = storage.claimWeekStamp();
      if (res.success) {
        game.playSound("win");
        game.updateCoinsDisplay();
        updateProfileUI();
        renderDailyScreen();
        game.showFloatingMessage("Печать недели у тебя! +40 монет и +60 XP", "bonus");
      }
    });
  }

  const btnClaimWeeklyReview = document.getElementById("btn-claim-weekly-review");
  if (btnClaimWeeklyReview) {
    btnClaimWeeklyReview.addEventListener("click", () => {
      const res = storage.claimWeeklyReview(storage.getLanguage());
      if (res.success) {
        game.playSound("win");
        game.updateCoinsDisplay();
        updateProfileUI();
        renderDailyScreen();
        game.showFloatingMessage("Повтор недели засчитан! +15 монет и +20 XP", "bonus");
      }
    });
  }

  if (dailyBtnStart) {
    dailyBtnStart.addEventListener("click", () => {
      if (storage.getDailyStatus().isDailyChallengeDone) {
        showCustomInfoDialog("🎯", "Ежедневный вызов", "<p>Награда за вызов уже получена сегодня. Завтра будет новая сетка.</p>");
        return;
      }
      hideAllModals();
      const todayLvl = 10 + (new Date().getDate() % 20);
      game.startLevel(todayLvl, true);
      switchTab("game");
    });
  }

  const luckyWheelModal = document.getElementById("modal-lucky-wheel");
  const btnOpenLuckyWheel = document.getElementById("btn-open-lucky-wheel");
  const btnCloseLuckyWheel = document.getElementById("btn-close-lucky-wheel");
  const btnSpinWheel = document.getElementById("btn-spin-wheel");
  const luckyWheelDisc = document.getElementById("lucky-wheel-disc");
  const wheelResultBadge = document.getElementById("wheel-result-badge");

  function paintLuckyWheel() {
    if (!luckyWheelDisc) return;
    const sectors = WordRamData.luckyWheelSectors || [];
    luckyWheelDisc.innerHTML = sectors.map((s, i) =>
      `<div class="wheel-sector-label" style="transform: rotate(${i * (360 / sectors.length)}deg)">${s.label}</div>`
    ).join("");
  }
  paintLuckyWheel();

  if (btnOpenLuckyWheel) {
    btnOpenLuckyWheel.addEventListener("click", () => {
      if (wheelResultBadge) {
        wheelResultBadge.style.display = "none";
      }
      if (btnSpinWheel) {
        btnSpinWheel.disabled = !storage.canSpinLuckyWheel();
        btnSpinWheel.textContent = storage.canSpinLuckyWheel() ? "Крутить" : "Уже крутили сегодня";
      }
      showModal(luckyWheelModal);
    });
  }
  if (btnCloseLuckyWheel) {
    btnCloseLuckyWheel.addEventListener("click", () => hideAllModals());
  }
  if (btnSpinWheel) {
    btnSpinWheel.addEventListener("click", () => {
      if (!storage.canSpinLuckyWheel()) return;
      const sectors = WordRamData.luckyWheelSectors || [];
      const idx = Math.floor(Math.random() * sectors.length);
      const sector = sectors[idx];
      if (luckyWheelDisc) {
        luckyWheelDisc.style.transition = "transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)";
        luckyWheelDisc.style.transform = `rotate(${360 * 4 + idx * (360 / sectors.length)}deg)`;
      }
      storage.applyLuckyWheelSector(sector);
      game.playSound("win");
      game.updateCoinsDisplay();
      updateProfileUI();
      btnSpinWheel.disabled = true;
      btnSpinWheel.textContent = "Уже крутили сегодня";
      if (wheelResultBadge) {
        wheelResultBadge.style.display = "inline-block";
        wheelResultBadge.textContent = "Выпало: " + sector.label;
      }
      renderDailyScreen();
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
    const btnOpenPlacementTestEl = document.getElementById("btn-open-placement-test");
    if (btnOpenPlacementTestEl) {
      const curLang = storage.getLanguage();
      btnOpenPlacementTestEl.textContent = curLang === "chechen"
        ? "📝 Пройти тест на определение уровня чеченского (A1–C2)"
        : "📝 Пройти тест на определение уровня английского (A1–C1)";
    }
    updateProfileUI();
    refreshShareBonusChips();

    // Переключатель языка слов в игре
    const btnLangEn = document.getElementById("btn-lang-en");
    const btnLangCe = document.getElementById("btn-lang-ce");
    const currentLang = storage.getLanguage();

    if (btnLangEn && btnLangCe) {
      btnLangEn.classList.toggle("active", currentLang === "english");
      btnLangCe.classList.toggle("active", currentLang === "chechen");
    }

    const ease = storage.getWordEase();
    document.querySelectorAll(".word-ease-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.ease === ease);
    });

    // Лиги скрыты в профиле, пока нет живых игроков.

    if (achievementsListEl) {
      achievementsListEl.innerHTML = "";
      const unlockedIds = storage.state.unlockedAchievements || [];
      const previewCount = 4;

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
          <div class="ach-reward">+${ach.rewardCoins} <span class="coin-icon"></span></div>
        `;
        achievementsListEl.appendChild(card);
      });

      const moreBtn = document.getElementById("btn-achievements-more");
      const total = WordRamData.achievements.length;
      if (moreBtn) {
        const expanded = achievementsListEl.classList.contains("is-expanded");
        moreBtn.hidden = total <= previewCount;
        moreBtn.textContent = expanded ? "Свернуть" : "Ещё";
        moreBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
      }
    }

    if (toggleSound) toggleSound.checked = !!storage.getSetting("soundEnabled");
    if (toggleVibration) toggleVibration.checked = !!storage.getSetting("vibrationEnabled");
  }


  // Кнопки выбора языка игры в Настройках
  const btnLangEn = document.getElementById("btn-lang-en");
  const btnLangCe = document.getElementById("btn-lang-ce");

  if (btnLangEn) {
    btnLangEn.addEventListener("click", () => {
      if (storage.getLanguage() !== "english") {
        storage.setLanguage("english");
        renderSettingsScreen();
        updateDailyWordCard();
        game.startLevel(storage.getCurrentLevel("english"), false);
        game.showFloatingMessage("Язык слов переключен на English 🇬🇧", "success");
      }
    });
  }

  if (btnLangCe) {
    btnLangCe.addEventListener("click", () => {
      if (storage.getLanguage() !== "chechen") {
        storage.setLanguage("chechen");
        renderSettingsScreen();
        updateDailyWordCard();
        game.startLevel(storage.getCurrentLevel("chechen"), false);
        game.showFloatingMessage("Язык слов переключен на чеченский", "success");
      }
    });
  }

  document.querySelectorAll(".word-ease-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ease = btn.dataset.ease || "normal";
      storage.setWordEase(ease);
      renderSettingsScreen();
      game.showFloatingMessage(
        ease === "easier" ? "Следующий уровень будет с более лёгкими словами" :
        ease === "harder" ? "Следующий уровень будет со словами посложнее" :
        "Слова снова как у твоего уровня языка",
        "success"
      );
    });
  });


  // Обработчики: Слово дня
  const btnClaimWod = document.getElementById("btn-claim-wod");
  const btnWodSpeak = document.getElementById("btn-wod-speak");
  const wodWordEl = document.getElementById("wod-word");
  const wodPhoneticEl = document.getElementById("wod-phonetic");
  const wodTranslationEl = document.getElementById("wod-translation");
  const wodExampleEl = document.getElementById("wod-example");

  function updateDailyWordCard() {
    const currentLang = storage.getLanguage();
    const item = storage.getWordOfTheDayItem(currentLang) || {};
    let word = item.word || "COURAGE";
    let phonetic = item.ph || "";
    let translation = item.tr || "";
    let example = item.ex || "";
    if (currentLang === "chechen") {
      const ceDetails = WordRamData.getWordDetails(word, "chechen");
      phonetic = (ceDetails && ceDetails.ph) ? ceDetails.ph : "";
    }

    if (wodWordEl) wodWordEl.textContent = word;
    if (wodPhoneticEl) wodPhoneticEl.textContent = phonetic;
    if (wodTranslationEl) wodTranslationEl.textContent = translation;
    if (wodExampleEl) wodExampleEl.textContent = example;
    if (btnWodSpeak) {
      btnWodSpeak.style.display = currentLang === "chechen" ? "none" : "";
    }

    const isClaimed = storage.isWodClaimedToday(currentLang);
    if (btnClaimWod) {
      if (isClaimed) {
        btnClaimWod.disabled = true;
        btnClaimWod.textContent = "Изучено на сегодня ✔";
        btnClaimWod.classList.add("claimed-btn");
      } else {
        btnClaimWod.disabled = false;
        btnClaimWod.innerHTML = 'Изучить · +20 <span class="coin-icon"></span>';
        btnClaimWod.classList.remove("claimed-btn");
      }
    }
  }

  if (btnWodSpeak) {
    btnWodSpeak.addEventListener("click", () => {
      const word = wodWordEl ? wodWordEl.textContent : "";
      if (word) game.speakWord(word);
    });
  }

  if (btnClaimWod) {
    btnClaimWod.addEventListener("click", () => {
      const lang = storage.getLanguage();
      if (storage.isWodClaimedToday(lang)) {
        game.showFloatingMessage("Вы уже забрали сегодняшнюю награду за Слово дня!", "info");
        return;
      }
      storage.claimWodToday(lang);
      storage.recordWordToVocabulary(storage.getWordOfTheDayItem(lang).word, lang);
      storage.addCoins(20);
      storage.addXp(40);
      game.playSound("win");
      game.vibrate([20, 40, 20]);
      game.updateCoinsDisplay();
      updateProfileUI();
      updateDailyWordCard();
      game.showFloatingMessage("🎁 Слово дня изучено! Получено: +20 🪙 монет и +40 XP!", "bonus");
    });
  }


  // Кнопка: Поделиться игрой с другом (+30 монет)
  const btnShareGame = document.getElementById("btn-share-game");
  if (btnShareGame) {
    btnShareGame.addEventListener("click", () => {
      openShareGameModal();
    });
  }

  // Кнопка: Поделиться своим прогрессом и титулом (+30 монет)
  const btnShareProgressCard = document.getElementById("btn-share-progress-card");
  if (btnShareProgressCard) {
    btnShareProgressCard.addEventListener("click", () => {
      openShareProgressModal();
    });
  }
  // ----------------------------------------------------
  // Модальное окно: Поделиться прогрессом (v44)
  // ----------------------------------------------------
  const shareProgressModal = document.getElementById("modal-share-progress");
  const btnCloseShareProgress = document.getElementById("btn-close-share-progress");
  const shareCardLangBadge = document.getElementById("share-card-lang-badge");
  const shareMasteryTitleEl = document.getElementById("share-mastery-title");
  const shareMasteryDescEl = document.getElementById("share-mastery-desc");
  const shareStatWordsEl = document.getElementById("share-stat-words");
  const shareStatLevelEl = document.getElementById("share-stat-level");
  const shareStatStarsEl = document.getElementById("share-stat-stars");

  const btnShareTg = document.getElementById("btn-share-tg");
  const btnShareWa = document.getElementById("btn-share-wa");
  const btnShareCopy = document.getElementById("btn-share-copy");
  const btnShareNative = document.getElementById("btn-share-native");

  function openShareProgressModal(customContext = null) {
    const currentLang = storage.getLanguage();
    const wordsCount = storage.getCollectedWordsCount(currentLang);
    const mastery = WordRamData.getWordMastery(wordsCount, currentLang);
    const curLvl = storage.getCurrentLevel(currentLang);
    
    // Подсчет звезд
    const starsObj = storage.getLanguageProgress(currentLang).levelStars || {};
    const totalStars = Object.values(starsObj).reduce((a, b) => a + b, 0);

    if (shareCardLangBadge) {
      shareCardLangBadge.innerHTML = currentLang === "chechen"
        ? '<span class="flag-ce"></span> Чеченский язык'
        : "🇬🇧 English";
    }
    if (shareMasteryTitleEl) shareMasteryTitleEl.textContent = `«${mastery.title}»`;
    if (shareMasteryDescEl) shareMasteryDescEl.textContent = mastery.desc;
    const lexiconTotal = WordRamData.getLexiconSize(currentLang);
    if (shareStatWordsEl) shareStatWordsEl.textContent = `${wordsCount} / ${lexiconTotal}`;
    if (shareStatLevelEl) shareStatLevelEl.textContent = curLvl;
    if (shareStatStarsEl) shareStatStarsEl.textContent = `${totalStars} ⭐`;

    showModal(shareProgressModal);
  }

  function getShareTextPayload() {
    const currentLang = storage.getLanguage();
    const wordsCount = storage.getCollectedWordsCount(currentLang);
    const mastery = WordRamData.getWordMastery(wordsCount, currentLang);
    const curLvl = storage.getCurrentLevel(currentLang);
    const langName = currentLang === "chechen" ? "чеченском" : "английском";

    const lexiconTotal = WordRamData.getLexiconSize(currentLang);
    return `🏆 Мой титул в WordRam: «${mastery.title}» (${mastery.desc})! Выучено слов: ${wordsCount}/${lexiconTotal} на ${langName} языке (Уровень ${curLvl}). Сыграй со мной: https://granonim.github.io/WordRam/`;
  }

  function onShareActionExecuted() {
    const res = storage.claimShareReward(30);
    if (res.rewarded) {
      game.playSound("win");
      game.vibrate([20, 40, 20]);
      game.updateCoinsDisplay();
      updateProfileUI();
      refreshShareBonusChips();
      game.showFloatingMessage("🎉 Спасибо, что делитесь! Награда: +30 🪙 монет и +30 XP получена!", "bonus");
    } else {
      refreshShareBonusChips();
    }
  }

  function refreshShareBonusChips() {
    const can = storage.canClaimShareReward();
    document.querySelectorAll(".btn-bonus-chip").forEach((el) => {
      el.style.opacity = can ? "1" : "0.35";
      el.innerHTML = can ? '+30 <span class="coin-icon"></span>' : "сегодня получено";
    });
  }

  if (btnCloseShareProgress) {
    btnCloseShareProgress.addEventListener("click", () => hideAllModals());
  }

  if (btnShareTg) {
    btnShareTg.addEventListener("click", () => {
      const textPayload = encodeURIComponent(getShareTextPayload());
      window.open(`https://t.me/share/url?url=https://granonim.github.io/WordRam/&text=${textPayload}`, "_blank");
      onShareActionExecuted();
    });
  }

  if (btnShareWa) {
    btnShareWa.addEventListener("click", () => {
      const textPayload = encodeURIComponent(getShareTextPayload());
      window.open(`https://api.whatsapp.com/send?text=${textPayload}`, "_blank");
      onShareActionExecuted();
    });
  }

  if (btnShareCopy) {
    btnShareCopy.addEventListener("click", async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(getShareTextPayload());
          game.showFloatingMessage("📋 Текст и ссылка скопированы в буфер обмена!", "info");
          onShareActionExecuted();
        }
      } catch (e) {}
    });
  }

  if (btnShareNative) {
    btnShareNative.addEventListener("click", async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "WordRam",
            text: getShareTextPayload(),
            url: "https://granonim.github.io/WordRam/"
          });
          onShareActionExecuted();
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(getShareTextPayload());
          game.showFloatingMessage("📋 Ссылка скопирована!", "info");
          onShareActionExecuted();
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Share error:", err);
        }
      }
    });
  }


  // Модальное окно: Поделиться игрой (Пригласить друзей)
  const modalShareGame = document.getElementById("modal-share-game");
  const btnCloseShareGame = document.getElementById("btn-close-share-game");
  const btnGameShareTg = document.getElementById("btn-game-share-tg");
  const btnGameShareWa = document.getElementById("btn-game-share-wa");
  const btnGameShareCopy = document.getElementById("btn-game-share-copy");
  const btnGameShareNative = document.getElementById("btn-game-share-native");

  function getGameInviteText() {
    return "Играю в WordRam — находи слова, учи язык, копи звания. Присоединяйся: https://granonim.github.io/WordRam/";
  }

  function openShareGameModal() {
    showModal(modalShareGame);
  }

  if (btnCloseShareGame) {
    btnCloseShareGame.addEventListener("click", () => hideAllModals());
  }

  if (btnGameShareTg) {
    btnGameShareTg.addEventListener("click", () => {
      const textPayload = encodeURIComponent(getGameInviteText());
      window.open(`https://t.me/share/url?url=https://granonim.github.io/WordRam/&text=${textPayload}`, "_blank");
      onShareActionExecuted();
    });
  }

  if (btnGameShareWa) {
    btnGameShareWa.addEventListener("click", () => {
      const textPayload = encodeURIComponent(getGameInviteText());
      window.open(`https://api.whatsapp.com/send?text=${textPayload}`, "_blank");
      onShareActionExecuted();
    });
  }

  if (btnGameShareCopy) {
    btnGameShareCopy.addEventListener("click", async () => {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(getGameInviteText());
          game.showFloatingMessage("📋 Ссылка и приглашение скопированы!", "info");
          onShareActionExecuted();
        }
      } catch (e) {}
    });
  }

  if (btnGameShareNative) {
    btnGameShareNative.addEventListener("click", async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "WordRam",
            text: getGameInviteText(),
            url: "https://granonim.github.io/WordRam/"
          });
          onShareActionExecuted();
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(getGameInviteText());
          game.showFloatingMessage("📋 Ссылка скопирована!", "info");
          onShareActionExecuted();
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Share error:", err);
        }
      }
    });
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

  const btnAchievementsMore = document.getElementById("btn-achievements-more");
  if (btnAchievementsMore && achievementsListEl) {
    btnAchievementsMore.addEventListener("click", () => {
      const expanded = achievementsListEl.classList.toggle("is-expanded");
      achievementsListEl.classList.toggle("is-collapsed", !expanded);
      btnAchievementsMore.textContent = expanded ? "Свернуть" : "Ещё";
      btnAchievementsMore.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  const btnExportBackup = document.getElementById("btn-export-backup");
  const btnImportBackup = document.getElementById("btn-import-backup");
  if (btnExportBackup) {
    btnExportBackup.addEventListener("click", async () => {
      const code = storage.exportCode();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code);
          game.showFloatingMessage("Код прогресса скопирован. Сохраните его.", "success");
          return;
        }
      } catch (e) { /* clipboard blocked */ }
      window.prompt("Скопируйте код прогресса и сохраните его:", code);
    });
  }
  if (btnImportBackup) {
    btnImportBackup.addEventListener("click", () => {
      const raw = window.prompt("Вставьте код прогресса");
      if (!raw || !raw.trim()) return;
      try {
        storage.importCode(raw);
        game.showFloatingMessage("Прогресс восстановлен", "success");
        window.location.reload();
      } catch (e) {
        game.showFloatingMessage("Этот код не подошёл", "info");
      }
    });
  }

  if (btnResetData) {
    btnResetData.addEventListener("click", () => {
      if (confirm("Сбросить весь прогресс, словарь и монеты?")) {
        storage.resetAll();
        hideAllModals();
        renderSettingsScreen();
        switchTab("game");
        showModal(welcomeLangModal);
      }
    });
  }

  // ----------------------------------------------------
  // Запуск при старте
  // ----------------------------------------------------
  updateProfileUI();
  refreshShareBonusChips();
  storage.ensureLeagueWeek();

  const welcomeLangModal = document.getElementById("modal-welcome-lang");
  const btnWelcomeLangEn = document.getElementById("btn-welcome-lang-en");
  const btnWelcomeLangCe = document.getElementById("btn-welcome-lang-ce");

  function maybeOpenPlacementAfterWelcome() {
    const lang = storage.getLanguage();
    const needsPlacement = lang === "chechen"
      ? !storage.getSetting("hasCompletedChechenPlacementTest")
      : !storage.getSetting("hasCompletedPlacementTest");
    if (needsPlacement) {
      setTimeout(() => openPlacementTest(), 400);
    }
  }

  function applyWelcomeLanguage(lang) {
    storage.setLanguage(lang);
    storage.state.hasChosenLanguage = true;
    storage.save();
    hideAllModals();
    game.startLevel(1, false);
    updateProfileUI();
    renderSettingsScreen();
    switchTab("game");
    game.showFloatingMessage(
      lang === "chechen" ? "Выбран чеченский язык слов" : "Выбран английский язык слов",
      "success"
    );
    maybeOpenPlacementAfterWelcome();
  }

  if (btnWelcomeLangEn) {
    btnWelcomeLangEn.addEventListener("click", () => applyWelcomeLanguage("english"));
  }
  if (btnWelcomeLangCe) {
    btnWelcomeLangCe.addEventListener("click", () => applyWelcomeLanguage("chechen"));
  }

  if (!storage.state.hasChosenLanguage) {
    showModal(welcomeLangModal);
  } else {
    const saved = storage.getActiveSavedGame();
    if (saved && saved.levelData && saved.foundWords && saved.foundWords.length < saved.levelData.words.length) {
      game.restoreGameState(saved);
    } else {
      storage.clearActiveSavedGame();
      const cur = storage.getSetting("currentLevel") || 1;
      game.startLevel(cur, false);
    }

    const lang = storage.getLanguage();
    const needsPlacement = lang === "chechen"
      ? !storage.getSetting("hasCompletedChechenPlacementTest")
      : !storage.getSetting("hasCompletedPlacementTest");
    if (needsPlacement) {
      setTimeout(() => openPlacementTest(), 600);
    }
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
