const GRID_SIZE = 4;
const SPAWN_TYPES = 3;
const FRUITS = [
  "2",
  "4",
  "8",
  "16",
  "32",
  "64",
  "128",
  "256",
  "512",
  "1024",
  "2048",
  "4096",
];
const FRUIT_LABELS = [
  "2",
  "4",
  "8",
  "16",
  "32",
  "64",
  "128",
  "256",
  "512",
  "1024",
  "2048",
  "4096",
];

const boardEl = document.getElementById("board-grid");
const scoreEl = document.getElementById("wm-score");
const overlay = document.getElementById("game-2024-overlay");
const overlayText = document.getElementById("game-2024-overlay-text");
const restartBtn = document.getElementById("wm-restart");

let grid = [];
let score = 0;
let gameOver = false;

const directionMap = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

function initGame() {
  grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  score = 0;
  gameOver = false;
  overlay?.classList.add("hidden");
  spawnFruit();
  spawnFruit();
  renderGrid();
  updateScore();
}

function spawnFruit() {
  const empties = [];
  grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) {
        empties.push({ x, y });
      }
    });
  });
  if (!empties.length) return;
  const { x, y } = empties[Math.floor(Math.random() * empties.length)];
  grid[y][x] = { type: Math.floor(Math.random() * SPAWN_TYPES) };
}

function renderGrid() {
  boardEl.innerHTML = "";
  grid.forEach((row) => {
    row.forEach((cell) => {
      const tile = document.createElement("div");
      tile.className = "fruit-tile";
      const label = document.createElement("span");
      if (cell) {
        tile.classList.add(`fruit-${FRUITS[cell.type]}`);
        label.textContent = FRUIT_LABELS[cell.type];
      } else {
        label.textContent = "";
      }
      tile.appendChild(label);
      boardEl.appendChild(tile);
    });
  });
}

function updateScore() {
  scoreEl.textContent = score.toString();
}

function collapseLine(line) {
  const filtered = line
    .filter(Boolean)
    .map((cell) => ({ type: cell.type }));

  for (let i = 0; i < filtered.length - 1; i++) {
    if (filtered[i].type === filtered[i + 1].type) {
      filtered[i] = {
        type: Math.min(filtered[i].type + 1, FRUITS.length - 1),
      };
      score += (filtered[i].type + 1) * 25;
      filtered.splice(i + 1, 1);
    }
  }

  while (filtered.length < GRID_SIZE) {
    filtered.push(null);
  }
  return filtered;
}

function updateLine(line, reverse = false) {
  const source = reverse ? [...line].reverse() : [...line];
  const collapsed = collapseLine(source);
  const result = reverse ? collapsed.reverse() : collapsed;
  const changed = result.some((cell, idx) => {
    const original = line[idx];
    if (!cell && !original) return false;
    if (!cell || !original) return true;
    return cell.type !== original.type;
  });
  return { result, changed };
}

function move(direction) {
  if (gameOver) return;
  let moved = false;
  if (direction === "left" || direction === "right") {
    grid = grid.map((row) => {
      const { result, changed } = updateLine(
        row,
        direction === "right"
      );
      if (changed) moved = true;
      return result;
    });
  } else {
    for (let x = 0; x < GRID_SIZE; x++) {
      const column = grid.map((row) => row[x]);
      const { result, changed } = updateLine(
        column,
        direction === "down"
      );
      if (changed) moved = true;
      result.forEach((cell, y) => {
        grid[y][x] = cell;
      });
    }
  }

  if (!moved) return;
  spawnFruit();
  renderGrid();
  updateScore();

  if (!hasMoves()) {
    endGame();
  }
}

function hasMoves() {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!grid[y][x]) return true;
      const currentType = grid[y][x].type;
      const right = x + 1 < GRID_SIZE && grid[y][x + 1];
      const down = y + 1 < GRID_SIZE && grid[y + 1][x];
      if (
        (right && right.type === currentType) ||
        (down && down.type === currentType)
      ) {
        return true;
      }
    }
  }
  return false;
}

function endGame() {
  gameOver = true;
  overlayText.textContent = "Game Over";
  overlay.classList.remove("hidden");
}

function handleKey(event) {
  if (!directionMap[event.key]) return;
  event.preventDefault();
  move(directionMap[event.key]);
}

document.addEventListener("keydown", handleKey);
restartBtn?.addEventListener("click", initGame);

initGame();

