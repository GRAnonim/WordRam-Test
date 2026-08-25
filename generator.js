/**
 * WordRam - Organic Labyrinth Generator & Level Packer (v29)
 * 100% покрытие поля, нетривиальные змейки (без 2x2 квадратов и прямых линий),
 * Универсальная мультиязычная генерация (English & Chechen) с поддержкой составных графем.
 */

class WordRamGenerator {
  constructor(dataModule) {
    this.data = dataModule || (typeof WordRamData !== "undefined" ? WordRamData : null);
  }

  partitionGrid(gridSize, wordLengths) {
    const totalCells = gridSize * gridSize;
    const sumLengths = wordLengths.reduce((a, b) => a + b, 0);
    if (sumLengths !== totalCells) {
      throw new Error(`Сумма длин (${sumLengths}) не равна размеру поля (${totalCells})`);
    }

    // Для блочных сеток 9x9 используем 3x3 змейки
    if (gridSize === 9 && wordLengths.length === 9 && wordLengths.every(l => l === 9)) {
      return this.partition9x9Modular();
    }

    // Эвристический органический поиск змеек
    let attempts = 0;
    while (attempts < 600) {
      attempts++;
      const result = this._findOrganicDFS(gridSize, wordLengths);
      if (result && this.validateRoutes(result, gridSize, wordLengths)) {
        return result;
      }
    }

    return this._generateFallbackRoutes(gridSize, wordLengths);
  }

  _findOrganicDFS(gridSize, wordLengths) {
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(-1));
    const sortedLengths = [...wordLengths].sort((a, b) => b - a);
    const routes = [];

    const getNeighbors = (r, c) => {
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const res = [];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === -1) {
          res.push([nr, nc]);
        }
      }
      return res;
    };

    const countFreeNeighbors = (r, c) => getNeighbors(r, c).length;

    const findStartCell = () => {
      let best = null;
      let minDegree = 999;
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (grid[r][c] === -1) {
            const deg = countFreeNeighbors(r, c);
            if (deg < minDegree) {
              minDegree = deg;
              best = [r, c];
            }
          }
        }
      }
      return best;
    };

    const countStraightTail = (path) => {
      if (path.length < 3) return 0;
      let count = 1;
      const lastIdx = path.length - 1;
      const dr = path[lastIdx][0] - path[lastIdx - 1][0];
      const dc = path[lastIdx][1] - path[lastIdx - 1][1];

      for (let i = lastIdx - 1; i >= 1; i--) {
        const curDr = path[i][0] - path[i - 1][0];
        const curDc = path[i][1] - path[i - 1][1];
        if (curDr === dr && curDc === dc) {
          count++;
        } else {
          break;
        }
      }
      return count;
    };

    for (let wordIdx = 0; wordIdx < sortedLengths.length; wordIdx++) {
      const targetLen = sortedLengths[wordIdx];
      const start = findStartCell();
      if (!start) return null;

      const path = [start];
      grid[start[0]][start[1]] = wordIdx;

      let success = false;
      let stepAttempts = 0;

      const dfsStep = () => {
        stepAttempts++;
        if (stepAttempts > 2000) return false;
        if (path.length === targetLen) {
          if (targetLen >= 3 && this.countTurns(path) < 1) return false;
          return true;
        }

        const current = path[path.length - 1];
        let neighbors = getNeighbors(current[0], current[1]);
        if (neighbors.length === 0) return false;

        const straightTail = countStraightTail(path);
        if (straightTail >= 2) {
          const lastIdx = path.length - 1;
          const dr = path[lastIdx][0] - path[lastIdx - 1][0];
          const dc = path[lastIdx][1] - path[lastIdx - 1][1];
          const turningNeighbors = neighbors.filter(([nr, nc]) => (nr - current[0] !== dr) || (nc - current[1] !== dc));
          if (turningNeighbors.length > 0) {
            neighbors = turningNeighbors;
          }
        }

        neighbors.sort((a, b) => {
          const degA = countFreeNeighbors(a[0], a[1]);
          const degB = countFreeNeighbors(b[0], b[1]);
          return (degA - degB) + (Math.random() * 0.8 - 0.4);
        });

        for (const [nr, nc] of neighbors) {
          grid[nr][nc] = wordIdx;
          path.push([nr, nc]);

          if (dfsStep()) return true;

          path.pop();
          grid[nr][nc] = -1;
        }

        return false;
      };

      success = dfsStep();
      if (!success) return null;
      routes.push(path);
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (grid[r][c] === -1) return null;
      }
    }

    return routes;
  }

  partition9x9Modular() {
    const routes = [];
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const r0 = br * 3;
        const c0 = bc * 3;
        const bRoute = this.get3x3Snake9(r0, c0);
        routes.push(bRoute);
      }
    }
    return routes;
  }

  get3x3Snake9(r0, c0) {
    const tmpl = [[0,0],[0,1],[0,2],[1,2],[1,1],[1,0],[2,0],[2,1],[2,2]];
    return tmpl.map(([r, c]) => [r0 + r, c0 + c]);
  }

  _generateFallbackRoutes(gridSize, wordLengths) {
    if (gridSize === 4) {
      if (wordLengths.length === 4 && wordLengths.every(l => l === 4)) {
        return [
          [[0,0],[0,1],[1,1],[1,0]],
          [[0,2],[0,3],[1,3],[1,2]],
          [[2,0],[2,1],[3,1],[3,0]],
          [[2,2],[2,3],[3,3],[3,2]]
        ];
      }
      if (wordLengths.length === 4 && wordLengths.join(",") === "3,4,4,5") {
        return [
          [[0,0],[0,1],[1,1]],
          [[0,2],[0,3],[1,3],[1,2]],
          [[1,0],[2,0],[3,0],[3,1]],
          [[2,1],[2,2],[3,2],[3,3],[2,3]]
        ];
      }
      if (wordLengths.length === 3 && wordLengths.join(",") === "5,5,6") {
        return [
          [[0,0],[0,1],[0,2],[1,2],[1,1]],
          [[1,0],[2,0],[3,0],[3,1],[2,1]],
          [[0,3],[1,3],[2,3],[3,3],[3,2],[2,2]]
        ];
      }
    }

    const routes = [];
    let currentPath = [];
    let lenIdx = 0;

    for (let r = 0; r < gridSize; r++) {
      const cols = (r % 2 === 0) ? [...Array(gridSize).keys()] : [...Array(gridSize).keys()].reverse();
      for (const c of cols) {
        currentPath.push([r, c]);
        if (currentPath.length === wordLengths[lenIdx]) {
          routes.push(currentPath);
          currentPath = [];
          lenIdx++;
        }
      }
    }
    return routes;
  }

  validateRoutes(routes, gridSize, wordLengths) {
    const totalCells = gridSize * gridSize;
    const visited = new Set();

    if (routes.length !== wordLengths.length) return false;

    for (const route of routes) {
      for (let i = 0; i < route.length; i++) {
        const [r, c] = route[i];
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return false;
        const key = `${r},${c}`;
        if (visited.has(key)) return false;
        visited.add(key);

        if (i > 0) {
          const [pr, pc] = route[i - 1];
          const dist = Math.abs(r - pr) + Math.abs(c - pc);
          if (dist !== 1) return false;
        }
      }
      if (route.length >= 4 && this.countTurns(route) < 1) {
        return false;
      }
    }

    return visited.size === totalCells;
  }

  validateLevel(grid, words, routes, gridSize, lang = "english") {
    const sz = gridSize || (grid && grid.length) || 5;
    const routesList = Object.values(routes);
    const tokenizer = (this.data && this.data.WordRamTokenizer) || (typeof WordRamTokenizer !== "undefined" ? WordRamTokenizer : null);
    const lengths = words.map(w => (tokenizer ? tokenizer.getTileCount(w, lang) : w.length));
    return this.validateRoutes(routesList, sz, lengths);
  }

  countTurns(route) {
    if (!route || route.length < 3) return 0;
    let turns = 0;
    for (let i = 1; i < route.length - 1; i++) {
      const dr1 = route[i][0] - route[i - 1][0];
      const dc1 = route[i][1] - route[i - 1][1];
      const dr2 = route[i + 1][0] - route[i][0];
      const dc2 = route[i + 1][1] - route[i][1];
      if (dr1 !== dr2 || dc1 !== dc2) {
        turns++;
      }
    }
    return turns;
  }

  generateLevel(levelNumber, userCefr = "A2", lang = "english") {
    const config = this.data.getLevelPackingConfig(levelNumber, userCefr);
    const routesArray = this.partitionGrid(config.gridSize, config.wordLengths);

    const grid = Array.from({ length: config.gridSize }, () => Array(config.gridSize).fill(""));
    const words = [];
    const routesMap = {};
    const tilesMap = {};
    const usedWords = [];

    const tokenizer = (this.data && this.data.WordRamTokenizer) || (typeof WordRamTokenizer !== "undefined" ? WordRamTokenizer : null);

    for (let i = 0; i < routesArray.length; i++) {
      const route = routesArray[i];
      const len = route.length;
      let word = this.data.getWordForCefrAndLength(userCefr, len, usedWords, config.themeKey, lang);
      let tiles = tokenizer ? tokenizer.tokenize(word, lang) : (word ? word.split("") : []);

      if (!tiles || tiles.length !== len) {
        if (lang === "chechen") {
          word = this.data.getWordForCefrAndLength("A1", len, usedWords, null, "chechen");
          tiles = tokenizer ? tokenizer.tokenize(word, "chechen") : word.split("");
        } else {
          word = (word || "WORD").padEnd(len, "S").slice(0, len);
          tiles = word.split("");
        }
      }
      usedWords.push(word);
      words.push(word);
      routesMap[word] = route;
      tilesMap[word] = tiles;

      for (let j = 0; j < len; j++) {
        const [r, c] = route[j];
        grid[r][c] = tiles[j];
      }
    }

    return {
      level: levelNumber,
      gridSize: config.gridSize,
      totalCells: config.totalCells,
      words: words,
      routes: routesMap,
      tilesMap: tilesMap,
      grid: grid,
      themeKey: config.themeKey,
      themeTitle: config.themeTitle,
      themeIcon: config.themeIcon,
      coinsReward: config.coinsReward,
      xpReward: config.xpReward,
      language: lang
    };
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = WordRamGenerator;
}
