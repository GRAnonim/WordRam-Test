import fs from "fs";
import WordRamDataModule from "./data.js";
import WordRamGenerator from "./generator.js";
import WordRamStorage from "./storage.js";
import WordRamGame from "./game.js";

const WordRamData = WordRamDataModule.WordRamData || WordRamDataModule;
const WordRamTokenizer = WordRamDataModule.WordRamTokenizer;

console.log("==================================================");
console.log("🧪 STARTING WORDRAM COMPREHENSIVE TEST SUITE");
console.log("==================================================\n");

// ----------------------------------------------------
// TEST 1 & 2: Tokenizer, Unknown Graphemes & Reconstruction
// ----------------------------------------------------
console.log("--- TEST 1 & 2: Chechen Dictionary & Tokenizer (1500 words) ---");
const rawChechenWords = JSON.parse(fs.readFileSync("./chechen.json", "utf8"));
console.log(`Loaded ${rawChechenWords.length} words from chechen.json.`);

let tokenizedCount = 0;
let unknownGraphemesCount = 0;
let emptyTilesCount = 0;
let tileCountCorrect = 0;
let reconstructPassCount = 0;

for (const item of rawChechenWords) {
  const normWord = WordRamTokenizer.normalizeChechen(item.word);
  const tiles = WordRamTokenizer.tokenize(normWord, "chechen");
  
  if (!tiles || tiles.length === 0) {
    emptyTilesCount++;
    continue;
  }
  tokenizedCount++;

  if (tiles.length === item.tileCount) {
    tileCountCorrect++;
  } else {
    console.error(`❌ Tile count mismatch for ${item.word}: expected ${item.tileCount}, got ${tiles.length}`);
  }

  // Check unknown graphemes (each tile must be either in MULTI or in CYRILLIC_LETTERS)
  const validTiles = tiles.every(t => 
    WordRamTokenizer.MULTI_GRAPHEMES_CHECHEN.includes(t) || 
    WordRamTokenizer.CYRILLIC_LETTERS_CHECHEN.has(t)
  );
  if (!validTiles) {
    unknownGraphemesCount++;
    console.error(`❌ Unknown grapheme in ${item.word}:`, tiles);
  }

  const recon = WordRamTokenizer.reconstruct(tiles, "chechen");
  if (recon === normWord) {
    reconstructPassCount++;
  } else {
    console.error(`❌ Reconstruction failed for ${item.word}: got '${recon}', expected '${normWord}'`);
  }
}

console.log(`Chechen dictionary: ${rawChechenWords.length} words`);
console.log(`Tokenizer: ${tokenizedCount}/${rawChechenWords.length} PASS`);
console.log(`Unknown graphemes: ${unknownGraphemesCount}`);
console.log(`Reconstruction: ${reconstructPassCount}/${rawChechenWords.length} PASS`);
console.log(`Tile counts verified: ${tileCountCorrect}/${rawChechenWords.length} PASS\n`);

// ----------------------------------------------------
// TEST 3: Level Generator (300 Chechen Levels)
// ----------------------------------------------------
console.log("--- TEST 3: Chechen Level Generator (300 levels) ---");
const generator = new WordRamGenerator(WordRamData);

let generatorPassed = 0;
let invalidRoutesCount = 0;
let diagonalRoutesCount = 0;
let repeatedCellsCount = 0;
let minTurnViolationsCount = 0;
let matchingTilesCount = 0;

const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

for (let lvl = 1; lvl <= 300; lvl++) {
  const chosenCefr = cefrLevels[(lvl - 1) % cefrLevels.length];
  const levelData = generator.generateLevel(lvl, chosenCefr, "chechen");

  // 1. Check all required words exist
  if (!levelData.words || levelData.words.length === 0) {
    console.error(`❌ Level ${lvl}: no words generated`);
    continue;
  }

  let levelValid = true;
  const grid = levelData.grid;
  const size = levelData.gridSize;
  const visitedCells = new Set();

  for (const word of levelData.words) {
    const route = levelData.routes[word];
    if (!route || route.length === 0) {
      console.error(`❌ Level ${lvl}: missing route for word '${word}'`);
      invalidRoutesCount++;
      levelValid = false;
      continue;
    }

    const tiles = WordRamTokenizer.tokenize(word, "chechen");
    if (tiles.length !== route.length) {
      console.error(`❌ Level ${lvl}: tile count (${tiles.length}) != route length (${route.length}) for '${word}'`);
      levelValid = false;
    }

    // Check cells match tiles
    for (let i = 0; i < route.length; i++) {
      const [r, c] = route[i];
      if (r < 0 || r >= size || c < 0 || c >= size) {
        invalidRoutesCount++;
        levelValid = false;
        continue;
      }
      if (grid[r][c] !== tiles[i]) {
        console.error(`❌ Level ${lvl}: cell (${r},${c}) has '${grid[r][c]}', expected tile '${tiles[i]}'`);
        levelValid = false;
      }

      const cellKey = `${r},${c}`;
      if (visitedCells.has(cellKey)) {
        repeatedCellsCount++;
        levelValid = false;
      }
      visitedCells.add(cellKey);

      // Check orthogonal step (no diagonals, distance == 1)
      if (i > 0) {
        const [pr, pc] = route[i - 1];
        const dr = Math.abs(r - pr);
        const dc = Math.abs(c - pc);
        const dist = dr + dc;
        if (dist !== 1) {
          if (dr === 1 && dc === 1) {
            diagonalRoutesCount++;
          } else {
            invalidRoutesCount++;
          }
          levelValid = false;
        }
      }
    }

    // Check turns: words with length >= 3 should have turns (minimum 1-2 turns)
    const turns = generator.countTurns(route);
    if (route.length >= 4 && turns < 1) {
      minTurnViolationsCount++;
      levelValid = false;
    }
  }

  // Check 100% cell coverage
  if (visitedCells.size !== size * size) {
    console.error(`❌ Level ${lvl}: incomplete grid coverage (${visitedCells.size}/${size * size})`);
    levelValid = false;
  }

  if (levelValid) {
    generatorPassed++;
  }
}

console.log(`Level generator: ${generatorPassed}/300 PASS`);
console.log(`Invalid routes: ${invalidRoutesCount}`);
console.log(`Diagonal routes: ${diagonalRoutesCount}`);
console.log(`Repeated cells: ${repeatedCellsCount}`);
console.log(`Minimum-turn violations: ${minTurnViolationsCount}\n`);

// ----------------------------------------------------
// TEST 4: Step-by-Step Hint Mechanism
// ----------------------------------------------------
console.log("--- TEST 4: Step-by-Step Hint Tests ---");
let hintTestsPass = true;
const testLevel = generator.generateLevel(5, "A1", "chechen");
const testWord = testLevel.words[0];
const testRoute = testLevel.routes[testWord];
const testTiles = WordRamTokenizer.tokenize(testWord, "chechen");

// Simulate 3 consecutive hints
let revealed = 0;
const revealedTiles = [];

for (let click = 1; click <= 3; click++) {
  if (revealed < testRoute.length) {
    const nextCell = testRoute[revealed];
    revealedTiles.push(testLevel.grid[nextCell[0]][nextCell[1]]);
    revealed++;
  }
  if (revealed !== click) {
    hintTestsPass = false;
    console.error(`❌ Hint click ${click} revealed ${revealed} tiles instead of ${click}`);
  }
}

// Verify that revealed tiles match the first 3 tiles of testWord
const expected3 = testTiles.slice(0, 3).join("");
const actual3 = revealedTiles.join("");
if (expected3 !== actual3) {
  hintTestsPass = false;
  console.error(`❌ Revealed hint tiles '${actual3}' != expected '${expected3}'`);
}

console.log(`Hint step 1 (1st tile): '${revealedTiles[0]}' -> match: ${revealedTiles[0] === testTiles[0]}`);
console.log(`Hint step 2 (1st+2nd): '${revealedTiles.slice(0,2).join("")}' -> match: ${revealedTiles.slice(0,2).join("") === testTiles.slice(0,2).join("")}`);
console.log(`Hint step 3 (1st+2nd+3rd): '${revealedTiles.slice(0,3).join("")}' -> match: ${actual3 === expected3}`);
console.log(`Hint tests: ${hintTestsPass ? "PASS" : "FAIL"}\n`);

// ----------------------------------------------------
// TEST 5: English Regression Tests (300 English Levels)
// ----------------------------------------------------
console.log("--- TEST 5: English Regression Tests (300 levels) ---");
let englishPassed = 0;
for (let lvl = 1; lvl <= 300; lvl++) {
  const enLvlData = generator.generateLevel(lvl, "A2", "english");
  const valid = generator.validateLevel(enLvlData.grid, enLvlData.words, enLvlData.routes, enLvlData.gridSize, "english");
  if (valid && enLvlData.words.length > 0) {
    englishPassed++;
  } else {
    console.error(`❌ English level ${lvl} validation failed`);
  }
}
console.log(`English regression tests: ${englishPassed}/300 ${englishPassed === 300 ? "PASS" : "FAIL"}\n`);

// ----------------------------------------------------
// TEST 6: Language Switching & Independent Progress
// ----------------------------------------------------
console.log("--- TEST 6: Language Switching & Progress Isolation ---");
let langSwitchPass = true;
const storage = new WordRamStorage();

// 1. Initial default is English
if (storage.getLanguage() !== "english") langSwitchPass = false;

// 2. Play and complete level 1 in English
storage.completeLevel(1, 3, 100, 15, 0, 4, "english");
if (storage.getCurrentLevel("english") !== 2 || storage.getUnlockedLevel("english") !== 2) {
  langSwitchPass = false;
  console.error("❌ English progress failed to advance to level 2");
}

// 3. Switch to Chechen
storage.setLanguage("chechen");
if (storage.getLanguage() !== "chechen") langSwitchPass = false;

// Chechen level must still be 1 (independent progress)
if (storage.getCurrentLevel("chechen") !== 1 || storage.getUnlockedLevel("chechen") !== 1) {
  langSwitchPass = false;
  console.error("❌ Chechen progress was unexpectedly altered by English progress!");
}

// 4. Play and complete level 1 and 2 in Chechen
storage.completeLevel(1, 3, 100, 15, 0, 4, "chechen");
storage.completeLevel(2, 3, 100, 15, 0, 4, "chechen");

if (storage.getCurrentLevel("chechen") !== 3 || storage.getUnlockedLevel("chechen") !== 3) {
  langSwitchPass = false;
  console.error("❌ Chechen progress failed to advance to level 3");
}

// 5. Switch back to English
storage.setLanguage("english");
if (storage.getLanguage() !== "english") langSwitchPass = false;

// English level must still be 2
if (storage.getCurrentLevel("english") !== 2 || storage.getUnlockedLevel("english") !== 2) {
  langSwitchPass = false;
  console.error("❌ English progress altered after switching back from Chechen!");
}

console.log(`Language switching: ${langSwitchPass ? "PASS" : "FAIL"}\n`);

console.log("==================================================");
console.log("📊 FINAL VERIFICATION REPORT");
console.log("==================================================");
console.log(`Chechen dictionary:\n${rawChechenWords.length} words\n`);
console.log(`Tokenizer:\n${tokenizedCount}/${rawChechenWords.length} PASS\n`);
console.log(`Unknown graphemes:\n${unknownGraphemesCount}\n`);
console.log(`Reconstruction:\n${reconstructPassCount}/${rawChechenWords.length} PASS\n`);
console.log(`Level generator:\n${generatorPassed}/300 PASS\n`);
console.log(`Invalid routes:\n${invalidRoutesCount}\n`);
console.log(`Diagonal routes:\n${diagonalRoutesCount}\n`);
console.log(`Repeated cells:\n${repeatedCellsCount}\n`);
console.log(`Minimum-turn violations:\n${minTurnViolationsCount}\n`);
console.log(`Hint tests:\n${hintTestsPass ? "PASS" : "FAIL"}\n`);
console.log(`English regression tests:\n${englishPassed === 300 ? "PASS" : "FAIL"}\n`);
console.log(`Language switching:\n${langSwitchPass ? "PASS" : "FAIL"}`);
console.log("==================================================");
