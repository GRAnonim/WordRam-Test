import WordRamData from "./data.js";
import WordRamGenerator from "./generator.js";

console.log("=== WordRam Automated Generator Test (300+ levels) ===");

const generator = new WordRamGenerator(WordRamData);
const totalTests = 300;
let passed = 0;
let failed = 0;
const turnDistribution = {};

for (let lvl = 1; lvl <= totalTests; lvl++) {
  try {
    const levelData = generator.generateLevel(lvl);
    const valid = generator.validateLevel(levelData.grid, levelData.words, levelData.routes);

    if (!valid) {
      console.error(`❌ Level ${lvl} failed validation!`);
      failed++;
      continue;
    }

    // Check turns for each word
    let allWordsSnake = true;
    for (const w of levelData.words) {
      const turns = generator.countTurns(levelData.routes[w]);
      turnDistribution[turns] = (turnDistribution[turns] || 0) + 1;
      if (turns < 1 && w.length >= 3) {
        console.error(`❌ Level ${lvl} word "${w}" is straight (0 turns)!`);
        allWordsSnake = false;
      }
    }

    if (!allWordsSnake) {
      failed++;
      continue;
    }

    passed++;
  } catch (err) {
    console.error(`❌ Exception on level ${lvl}:`, err);
    failed++;
  }
}

console.log(`\nTest Result: ${passed}/${totalTests} passed (${failed} failed).`);
console.log("Turns Distribution across words:", turnDistribution);

if (failed === 0) {
  console.log("✔ ALL 300 LEVELS GENERATED AND VALIDATED SUCCESSFULLY!");
} else {
  process.exit(1);
}
