import WordRamData from "./data.js";
import WordRamGenerator from "./generator.js";

const gen = new WordRamGenerator(WordRamData);
let total = 100;
let passed = 0;
const cefrs = ["A1", "A2", "B1", "B2", "C1"];
const sizeCounts = {};

for (let lvl = 1; lvl <= total; lvl++) {
  const cefr = cefrs[(lvl - 1) % cefrs.length];
  const levelData = gen.generateLevel(lvl, cefr);
  const isValid = gen.validateLevel(levelData.grid, levelData.words, levelData.routes, levelData.gridSize);

  sizeCounts[levelData.gridSize] = (sizeCounts[levelData.gridSize] || 0) + 1;

  if (isValid) {
    passed++;
  } else {
    console.error(`❌ Failed on level ${lvl} (size ${levelData.gridSize}x${levelData.gridSize})`);
  }
}

console.log(`=== Dynamic Grids 4x4..9x9 Test: ${passed}/${total} passed ===`);
console.log("Grid Sizes Tested:", sizeCounts);
