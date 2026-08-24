import WordRamData from "./data.js";
import WordRamGenerator from "./generator.js";

const gen = new WordRamGenerator(WordRamData);
let total = 300;
let passed = 0;
const cefrs = ["A1", "A2", "B1", "B2", "C1"];

for (let lvl = 1; lvl <= total; lvl++) {
  const cefr = cefrs[(lvl - 1) % cefrs.length];
  const levelData = gen.generateLevel(lvl, cefr);
  const isValid = gen.validateLevel(levelData.grid, levelData.words, levelData.routes);

  if (isValid) {
    passed++;
  } else {
    console.error(`❌ Failed on level ${lvl} (${cefr})`);
  }
}

console.log(`=== 100% 25-Cell Grid Packing Test: ${passed}/${total} passed ===`);
