export type TetrisStats = {
    score: number;
    lines: number;
    level: number;
};

export type GameState = 'playing' | 'paused' | 'gameover';

export type TetrisCallbacks = {
    onStatsUpdate: (stats: TetrisStats) => void;
    onGameStateChange: (state: GameState) => void;
};

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const COLORS: Record<string, string> = {
    I: "#00f0f0", // Cyan
    J: "#0051ff", // Blue
    L: "#ff9000", // Orange
    O: "#ffe000", // Yellow
    S: "#00e000", // Green
    T: "#b000ff", // Purple
    Z: "#ff003c", // Red
};

// Gradient stops for "3D" effect
const LIGHT_COLORS: Record<string, string> = {
    I: "#80ffff",
    J: "#4d85ff",
    L: "#ffc560",
    O: "#ffff80",
    S: "#80ff80",
    T: "#d980ff",
    Z: "#ff809d",
};

const DARK_COLORS: Record<string, string> = {
    I: "#00b0b0",
    J: "#003cb0",
    L: "#b06200",
    O: "#b09b00",
    S: "#009900",
    T: "#7a00b0",
    Z: "#b00029",
};

const SHAPES: Record<string, number[][][]> = {
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

type Piece = {
    type: string;
    rotation: number;
    matrix: number[][];
    x: number;
    y: number;
};

export class TetrisEngine {
    private ctx: CanvasRenderingContext2D;
    private previewCtx: CanvasRenderingContext2D;
    private callbacks: TetrisCallbacks;

    private board: (string | 0)[][];
    private currentPiece!: Piece;
    private nextPiece!: Piece;

    private score = 0;
    private lines = 0;
    private level = 1;

    private dropCounter = 0;
    private dropInterval = 1000;
    private lastTime = 0;
    private animationFrame = 0;
    private paused = false;
    private gameOver = false;

    constructor(
        canvas: HTMLCanvasElement,
        previewCanvas: HTMLCanvasElement,
        callbacks: TetrisCallbacks
    ) {
        this.ctx = canvas.getContext("2d")!;
        this.previewCtx = previewCanvas.getContext("2d")!;
        this.callbacks = callbacks;
        this.board = this.createMatrix(COLS, ROWS);
    }

    public start() {
        this.board = this.createMatrix(COLS, ROWS);
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.lastTime = performance.now();
        this.paused = false;
        this.gameOver = false;
        this.callbacks.onGameStateChange('playing');
        this.callbacks.onStatsUpdate({ score: 0, lines: 0, level: 1 });

        this.nextPiece = this.createPiece();
        this.spawnPiece();

        // Scale canvas to match block size
        // Note: In strict React/CSS sizing, make sure logic matches canvas internal resolution
        // Here logic uses BLOCK_SIZE=30, so canvas width should be 30*10=300, height=30*30=900

        cancelAnimationFrame(this.animationFrame);
        this.update();
    }

    public destroy() {
        cancelAnimationFrame(this.animationFrame);
    }

    public handleInput(key: string) {
        if (this.gameOver) {
            if (key.toLowerCase() === "r") this.start();
            return;
        }
        switch (key) {
            case "ArrowLeft":
                this.move(-1);
                break;
            case "ArrowRight":
                this.move(1);
                break;
            case "ArrowDown":
                this.softDrop();
                this.score += 1;
                this.updateStats();
                break;
            case "ArrowUp":
                this.attemptRotate();
                break;
            case " ":
                this.hardDrop();
                break;
            case "p":
            case "P":
                this.togglePause();
                break;
            case "r":
            case "R":
                this.start();
                break;
        }
    }

    public togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        this.callbacks.onGameStateChange(this.paused ? 'paused' : 'playing');
        if (!this.paused) {
            this.lastTime = 0;
            this.animationFrame = requestAnimationFrame(this.update);
        } else {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    private createMatrix(width: number, height: number) {
        return Array.from({ length: height }, () => Array(width).fill(0));
    }

    private createPiece(): Piece {
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

    private spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        this.currentPiece.x = Math.floor(COLS / 2) - Math.ceil(this.currentPiece.matrix[0].length / 2);
        this.currentPiece.y = 0;
        if (this.collides(this.board, this.currentPiece)) {
            this.endGame();
        }
    }

    private rotate(matrix: number[][]) {
        const size = matrix.length;
        const rotated = matrix.map((row, y) =>
            row.map((_, x) => matrix[size - 1 - x][y])
        );
        return rotated;
    }

    private attemptRotate() {
        const original = this.currentPiece.matrix;
        const rotated = this.rotate(original);
        this.currentPiece.matrix = rotated;
        if (this.collides(this.board, this.currentPiece)) {
            this.currentPiece.x += 1;
            if (this.collides(this.board, this.currentPiece)) {
                this.currentPiece.x -= 2;
                if (this.collides(this.board, this.currentPiece)) {
                    this.currentPiece.x += 1;
                    this.currentPiece.matrix = original;
                }
            }
        }
    }

    private collides(boardMatrix: (string | 0)[][], piece: Piece) {
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

    private merge(boardMatrix: (string | 0)[][], piece: Piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value && y + piece.y >= 0) {
                    boardMatrix[y + piece.y][x + piece.x] = piece.type;
                }
            });
        });
    }

    private clearLines() {
        let cleared = 0;
        outer: for (let y = ROWS - 1; y >= 0; y--) {
            for (let x = 0; x < COLS; x++) {
                if (!this.board[y][x]) {
                    continue outer;
                }
            }
            const row = this.board.splice(y, 1)[0].fill(0);
            this.board.unshift(row);
            cleared += 1;
            y++;
        }
        if (cleared > 0) {
            this.score += lineRewards[cleared] * this.level;
            this.lines += cleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(1000 - (this.level - 1) * 75, 120);
            this.updateStats();
        }
    }

    private updateStats() {
        this.callbacks.onStatsUpdate({
            score: this.score,
            lines: this.lines,
            level: this.level,
        });
        this.drawPreview();
    }

    private drawPreview() {
        this.previewCtx.clearRect(0, 0, this.previewCtx.canvas.width, this.previewCtx.canvas.height);
        const matrix = this.nextPiece.matrix;
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
        const padding = 12; // Adjusted padding strategy
        const previewW = this.previewCtx.canvas.width;
        const previewH = this.previewCtx.canvas.height;

        // safe division
        const block = Math.min(
            (previewW - padding * 2) / (pieceWidth || 1),
            (previewH - padding * 2) / (pieceHeight || 1)
        );

        const offsetX = (previewW - block * pieceWidth) / 2 - minX * block;
        const offsetY = (previewH - block * pieceHeight) / 2 - minY * block;

        this.previewCtx.fillStyle = COLORS[this.nextPiece.type];
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.previewCtx.fillRect(
                        x * block + offsetX,
                        y * block + offsetY,
                        block,
                        block
                    );
                }
            });
        });
    }

    private drawBoard() {
        // Clear with transparency so CSS background shows through (or semi-transparent overlay)
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Optional: faint background for the board area
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.drawGrid();

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    const type = this.board[y][x] as string;
                    this.drawCell(x, y, COLORS[type], type);
                }
            }
        }
    }

    private drawPiece(piece: Piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value && y + piece.y >= 0) {
                    this.drawCell(x + piece.x, y + piece.y, COLORS[piece.type], piece.type);
                }
            });
        });
    }

    private getGhostPiece() {
        if (!this.currentPiece) return null;
        const ghost = {
            type: this.currentPiece.type,
            rotation: this.currentPiece.rotation,
            matrix: this.currentPiece.matrix,
            x: this.currentPiece.x,
            y: this.currentPiece.y,
        };
        while (!this.collides(this.board, ghost)) {
            ghost.y += 1;
        }
        ghost.y -= 1;
        return ghost; // It's a valid object satisfying Piece shape-ish (missing rotation if not used?)
        // Actually Piece has rotation, matrix, etc.
    }

    private drawGhostPiece() {
        const ghost = this.getGhostPiece() as Piece;
        if (!ghost || ghost.y < 0) return;

        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        ghost.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value && y + ghost.y >= 0) {
                    this.drawCell(x + ghost.x, y + ghost.y, COLORS[ghost.type]);
                }
            });
        });
        this.ctx.restore();
    }

    private drawCell(x: number, y: number, color: string, type?: string) {
        const posX = x * BLOCK_SIZE;
        const posY = y * BLOCK_SIZE;

        // Simple fallback if type not provided
        const mainColor = color;
        const lightColor = type ? LIGHT_COLORS[type] || color : color;
        const darkColor = type ? DARK_COLORS[type] || color : color;

        // Gradient Fill
        const gradient = this.ctx.createLinearGradient(posX, posY, posX, posY + BLOCK_SIZE);
        gradient.addColorStop(0, lightColor);
        gradient.addColorStop(0.5, mainColor);
        gradient.addColorStop(1, darkColor);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);

        // Inner Bevel / Glow
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        this.ctx.fillRect(posX + 2, posY + 2, BLOCK_SIZE - 4, BLOCK_SIZE * 0.4);

        // Border
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(posX, posY, BLOCK_SIZE, BLOCK_SIZE);
    }

    private drawGrid() {
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        this.ctx.lineWidth = 1;
        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;

        for (let x = 0; x <= COLS; x++) {
            const posX = x * BLOCK_SIZE + 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(posX, 0);
            this.ctx.lineTo(posX, height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= ROWS; y++) {
            const posY = y * BLOCK_SIZE + 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(0, posY);
            this.ctx.lineTo(width, posY);
            this.ctx.stroke();
        }
    }

    private softDrop() {
        this.currentPiece.y += 1;
        if (this.collides(this.board, this.currentPiece)) {
            this.currentPiece.y -= 1;
            this.merge(this.board, this.currentPiece);
            this.clearLines();
            this.spawnPiece();
        }
        this.dropCounter = 0;
    }

    private hardDrop() {
        while (!this.collides(this.board, this.currentPiece)) {
            this.currentPiece.y += 1;
        }
        this.currentPiece.y -= 1;
        this.merge(this.board, this.currentPiece);
        this.score += 2 * (ROWS - this.currentPiece.y);
        this.clearLines();
        this.spawnPiece();
        this.dropCounter = 0;
        this.updateStats();
    }

    private move(offset: number) {
        this.currentPiece.x += offset;
        if (this.collides(this.board, this.currentPiece)) {
            this.currentPiece.x -= offset;
        }
    }

    private endGame() {
        this.gameOver = true;
        this.callbacks.onGameStateChange('gameover');
    }

    private update = (time = 0) => {
        if (this.paused || this.gameOver) return;
        if (this.lastTime === 0) {
            this.lastTime = time;
        }
        const delta = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += delta;
        if (this.dropCounter > this.dropInterval) {
            this.softDrop();
        }
        this.drawBoard();
        this.drawGhostPiece();
        this.drawPiece(this.currentPiece);
        this.animationFrame = requestAnimationFrame(this.update);
    };
}
