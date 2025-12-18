const COLS = 10;
const ROWS = 30;
const BLOCK_SIZE = 30;

const boardCanvas = document.getElementById("board");
const boardCtx = boardCanvas.getContext("2d");
const previewCanvas = document.getElementById("preview");
const previewCtx = previewCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const restartBtn = document.getElementById("restart");
const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlay-text");
const resumeBtn = document.getElementById("resume");

const COLORS = {
  I: "#00f0f0",
  J: "#0051ff",
  L: "#ff9000",
  O: "#ffe000",
  S: "#00e000",
  T: "#b000ff",
  Z: "#ff003c",
};

const SHAPES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
};

const lineRewards = [0, 100, 300, 500, 800];

let board = createMatrix(COLS, ROWS);
let currentPiece;
let nextPiece;

let score = 0;
let lines = 0;
let level = 1;

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let animationFrame;
let paused = false;
let gameOver = false;

restartBtn.addEventListener("click", () => startGame());
resumeBtn.addEventListener("click", togglePause);
document.addEventListener("keydown", handleInput);

startGame();

function startGame() {
  board = createMatrix(COLS, ROWS);
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 1000;
  dropCounter = 0;
  lastTime = 0;
  paused = false;
  gameOver = false;
  hideOverlay();
  nextPiece = createPiece();
  spawnPiece();
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(update);
  updateStats();
}

function createMatrix(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

function createPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    type,
    rotation: 0,
    matrix: SHAPES[type][0].map((row) => [...row]),
    x: 0,
    y: 0,
  };
}

function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = createPiece();
  currentPiece.x = Math.floor(COLS / 2) - Math.ceil(currentPiece.matrix[0].length / 2);
  currentPiece.y = 0;
  if (collides(board, currentPiece)) {
    endGame();
  }
}

function rotate(matrix) {
  const size = matrix.length;
  const rotated = matrix.map((row, y) =>
    row.map((_, x) => matrix[size - 1 - x][y])
  );
  return rotated;
}

function attemptRotate() {
  const original = currentPiece.matrix;
  const rotated = rotate(original);
  currentPiece.matrix = rotated;
  if (collides(board, currentPiece)) {
    // Try wall kicks: shift left or right once
    currentPiece.x += 1;
    if (collides(board, currentPiece)) {
      currentPiece.x -= 2;
      if (collides(board, currentPiece)) {
        currentPiece.x += 1;
        currentPiece.matrix = original;
      }
    }
  }
}

function collides(boardMatrix, piece) {
  for (let y = 0; y < piece.matrix.length; y++) {
    for (let x = 0; x < piece.matrix[y].length; x++) {
      if (piece.matrix[y][x]) {
        const newY = y + piece.y;
        const newX = x + piece.x;
        if (
          newX < 0 ||
          newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && boardMatrix[newY][newX])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(boardMatrix, piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && y + piece.y >= 0) {
        boardMatrix[y + piece.y][x + piece.x] = piece.type;
      }
    });
  });
}

function clearLines() {
  let cleared = 0;
  outer: for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!board[y][x]) {
        continue outer;
      }
    }
    const row = board.splice(y, 1)[0].fill(0);
    board.unshift(row);
    cleared += 1;
    y++;
  }
  if (cleared > 0) {
    score += lineRewards[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(1000 - (level - 1) * 75, 120);
    updateStats();
  }
}

function updateStats() {
  scoreEl.textContent = score.toString();
  linesEl.textContent = lines.toString();
  levelEl.textContent = level.toString();
  drawPreview();
}

function drawPreview() {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  const matrix = nextPiece.matrix;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
  });

  const pieceWidth = maxX - minX + 1;
  const pieceHeight = maxY - minY + 1;
  const padding = 12;
  const block = Math.min(
    (previewCanvas.width - padding * 2) / pieceWidth,
    (previewCanvas.height - padding * 2) / pieceHeight
  );
  const offsetX =
    (previewCanvas.width - block * pieceWidth) / 2 - minX * block;
  const offsetY =
    (previewCanvas.height - block * pieceHeight) / 2 - minY * block;

  previewCtx.fillStyle = COLORS[nextPiece.type];
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        previewCtx.fillRect(
          x * block + offsetX,
          y * block + offsetY,
          block,
          block
        );
      }
    });
  });
}

function drawBoard() {
  boardCtx.fillStyle = "#05060b";
  boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

  drawGrid();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawCell(x, y, COLORS[board[y][x]]);
      }
    }
  }
}

function drawPiece(piece) {
  piece.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && y + piece.y >= 0) {
        drawCell(x + piece.x, y + piece.y, COLORS[piece.type]);
      }
    });
  });
}

function getGhostPiece() {
  if (!currentPiece) return null;
  const ghost = {
    type: currentPiece.type,
    matrix: currentPiece.matrix,
    x: currentPiece.x,
    y: currentPiece.y,
  };
  while (!collides(board, ghost)) {
    ghost.y += 1;
  }
  ghost.y -= 1;
  return ghost;
}

function drawGhostPiece() {
  const ghost = getGhostPiece();
  if (!ghost || ghost.y < 0) return;

  boardCtx.save();
  boardCtx.globalAlpha = 0.2;
  ghost.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && y + ghost.y >= 0) {
        drawCell(x + ghost.x, y + ghost.y, COLORS[ghost.type]);
      }
    });
  });
  boardCtx.restore();
}

function drawCell(x, y, color) {
  const posX = x * BLOCK_SIZE;
  const posY = y * BLOCK_SIZE;
  boardCtx.fillStyle = color;
  boardCtx.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
  boardCtx.strokeStyle = "rgba(5, 6, 11, 0.6)";
  boardCtx.lineWidth = 1;
  boardCtx.strokeRect(posX + 0.5, posY + 0.5, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

function drawGrid() {
  boardCtx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  boardCtx.lineWidth = 1;

  for (let x = 0; x <= COLS; x++) {
    const posX = x * BLOCK_SIZE + 0.5;
    boardCtx.beginPath();
    boardCtx.moveTo(posX, 0);
    boardCtx.lineTo(posX, boardCanvas.height);
    boardCtx.stroke();
  }

  for (let y = 0; y <= ROWS; y++) {
    const posY = y * BLOCK_SIZE + 0.5;
    boardCtx.beginPath();
    boardCtx.moveTo(0, posY);
    boardCtx.lineTo(boardCanvas.width, posY);
    boardCtx.stroke();
  }
}

function softDrop() {
  currentPiece.y += 1;
  if (collides(board, currentPiece)) {
    currentPiece.y -= 1;
    merge(board, currentPiece);
    clearLines();
    spawnPiece();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collides(board, currentPiece)) {
    currentPiece.y += 1;
  }
  currentPiece.y -= 1;
  merge(board, currentPiece);
  score += 2 * (ROWS - currentPiece.y); // quick reward for hard drop
  clearLines();
  spawnPiece();
  dropCounter = 0;
  updateStats();
}

function move(offset) {
  currentPiece.x += offset;
  if (collides(board, currentPiece)) {
    currentPiece.x -= offset;
  }
}

function handleInput(event) {
  if (gameOver) {
    if (event.key.toLowerCase() === "r") startGame();
    return;
  }
  switch (event.key) {
    case "ArrowLeft":
      move(-1);
      break;
    case "ArrowRight":
      move(1);
      break;
    case "ArrowDown":
      softDrop();
      score += 1;
      updateStats();
      break;
    case "ArrowUp":
      attemptRotate();
      break;
    case " ":
      event.preventDefault();
      hardDrop();
      break;
    case "p":
    case "P":
      togglePause();
      break;
    case "r":
    case "R":
      startGame();
      break;
    default:
      break;
  }
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (paused) {
    overlayText.textContent = "Paused";
    resumeBtn.textContent = "Resume";
    showOverlay();
    cancelAnimationFrame(animationFrame);
  } else {
    hideOverlay();
    lastTime = performance.now();
    animationFrame = requestAnimationFrame(update);
  }
}

function endGame() {
  gameOver = true;
  overlayText.textContent = "Game Over";
  resumeBtn.textContent = "Restart";
  showOverlay();
}

function showOverlay() {
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

resumeBtn.addEventListener("click", () => {
  if (gameOver) {
    startGame();
  } else {
    togglePause();
  }
});

function update(time = 0) {
  if (paused) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) {
    softDrop();
  }
  drawBoard();
  drawGhostPiece();
  drawPiece(currentPiece);
  animationFrame = requestAnimationFrame(update);
}

