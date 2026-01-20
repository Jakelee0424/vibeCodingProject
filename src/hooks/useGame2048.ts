import { useState, useCallback, useEffect } from "react";

const GRID_SIZE = 4;
const SPAWN_TYPES = 3;

export const TILES = [
    "2", "4", "8", "16", "32", "64", "128", "256", "512", "1024", "2048", "4096",
];

export const TILE_VALUES = [
    "2", "4", "8", "16", "32", "64", "128", "256", "512", "1024", "2048", "4096",
];

type Cell = {
    type: number;
    id: number; // for unique keys if we needed them, currently simplistic
} | null;

type Direction = "left" | "right" | "up" | "down";

let uniqueIdCounter = 0;
function getUniqueId() {
    return uniqueIdCounter++;
}

export function useGame2048() {
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);


    // Initialize game
    const initGame = useCallback(() => {
        const newGrid = Array.from({ length: GRID_SIZE }, () =>
            Array(GRID_SIZE).fill(null)
        );
        // spawn 2 tiles
        spawnTile(newGrid);
        spawnTile(newGrid);

        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
    }, []);

    // Spawn a tile in a random empty cell
    const spawnTile = (currentGrid: Cell[][]) => {
        const empties: { x: number; y: number }[] = [];
        currentGrid.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (!cell) {
                    empties.push({ x, y });
                }
            });
        });

        if (empties.length === 0) return;
        const { x, y } = empties[Math.floor(Math.random() * empties.length)];
        currentGrid[y][x] = {
            type: Math.floor(Math.random() * SPAWN_TYPES),
            id: getUniqueId()
        };
    };

    const collapseLine = (line: Cell[], currentScore: { value: number }) => {
        // Filter out nulls first to work with NonNullable cells
        const items = line.filter((cell): cell is NonNullable<Cell> => cell !== null);

        // Merge
        for (let i = 0; i < items.length - 1; i++) {
            if (items[i].type === items[i + 1].type) {
                const newType = Math.min(items[i].type + 1, TILES.length - 1);
                items[i] = { ...items[i], type: newType };
                currentScore.value += (newType + 1) * 25; // Scoring logic from original
                items.splice(i + 1, 1);
            }
        }

        // Pad with nulls
        const result: Cell[] = items;
        while (result.length < GRID_SIZE) {
            result.push(null);
        }
        return result;
    };

    const move = useCallback((direction: Direction) => {
        if (gameOver) return;

        setGrid((prevGrid) => {
            let moved = false;
            const newGrid = prevGrid.map((row) => [...row]);
            const scoreTracker = { value: score }; // track score changes in this move

            // Helper to check changes
            const isChanged = (original: Cell[], collapsed: Cell[]) => {
                return original.some((cell, i) => {
                    if (!cell && !collapsed[i]) return false;
                    if (!cell || !collapsed[i]) return true;
                    return cell.type !== collapsed[i]!.type;
                });
            };

            if (direction === "left" || direction === "right") {
                for (let y = 0; y < GRID_SIZE; y++) {
                    const row = newGrid[y];
                    const source = direction === "right" ? [...row].reverse() : [...row];
                    const collapsed = collapseLine(source, scoreTracker); // cast simplistic
                    const result = direction === "right" ? collapsed.reverse() : collapsed;

                    if (isChanged(row, result)) {
                        moved = true;
                        newGrid[y] = result;
                    }
                }
            } else {
                // Up/Down
                for (let x = 0; x < GRID_SIZE; x++) {
                    const column = newGrid.map(row => row[x]);
                    const source = direction === "down" ? [...column].reverse() : [...column];
                    const collapsed = collapseLine(source, scoreTracker);
                    const result = direction === "down" ? collapsed.reverse() : collapsed;

                    if (isChanged(column, result)) {
                        moved = true;
                        for (let y = 0; y < GRID_SIZE; y++) {
                            newGrid[y][x] = result[y];
                        }
                    }
                }
            }

            if (moved) {
                spawnTile(newGrid);
                setScore(scoreTracker.value);

                // Check game over
                if (!hasMoves(newGrid)) {
                    setGameOver(true);
                }
                return newGrid;
            }
            return prevGrid;
        });
    }, [gameOver, score]);

    const hasMoves = (grid: Cell[][]) => {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (!grid[y][x]) return true;
                const type = grid[y][x]!.type;
                const right = x + 1 < GRID_SIZE ? grid[y][x + 1] : null;
                const down = y + 1 < GRID_SIZE ? grid[y + 1][x] : null;
                if (right && right.type === type) return true;
                if (down && down.type === type) return true;
            }
        }
        return false;
    };

    // Key listeners
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            const keyMap: Record<string, Direction> = {
                ArrowLeft: "left",
                ArrowRight: "right",
                ArrowUp: "up",
                ArrowDown: "down"
            };

            if (keyMap[e.key]) {
                e.preventDefault();
                move(keyMap[e.key]);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [move]);

    return { grid, score, gameOver, restart: initGame };
}
