import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../style/snake.css';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

export default function Snake() {
    const [snake, setSnake] = useState(INITIAL_SNAKE);
    const [direction, setDirection] = useState(INITIAL_DIRECTION);
    const [food, setFood] = useState({ x: 5, y: 5 });
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(
        parseInt(localStorage.getItem('snakeHighScore') || '0')
    );
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    const [isPaused, setIsPaused] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const lastDirectionRef = useRef(INITIAL_DIRECTION);
    const directionRef = useRef(INITIAL_DIRECTION);
    const foodRef = useRef({ x: 5, y: 5 });
    const scoreRef = useRef(0);
    const speedRef = useRef(INITIAL_SPEED);
    const snakeRef = useRef(INITIAL_SNAKE);
    const inputQueueRef = useRef<{ x: number, y: number }[]>([]);

    const getRandomFood = useCallback((currentSnake: { x: number, y: number }[]) => {
        let newFood: { x: number, y: number };
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            const isOnSnake = currentSnake.some(
                (segment) => segment.x === newFood.x && segment.y === newFood.y
            );
            if (!isOnSnake) break;
        }
        return newFood;
    }, []);

    const resetGame = useCallback(() => {
        const initialFood = getRandomFood(INITIAL_SNAKE);
        setSnake(INITIAL_SNAKE);
        snakeRef.current = INITIAL_SNAKE;
        setDirection(INITIAL_DIRECTION);
        directionRef.current = INITIAL_DIRECTION;
        lastDirectionRef.current = INITIAL_DIRECTION;
        setFood(initialFood);
        foodRef.current = initialFood;
        setGameOver(false);
        setScore(0);
        scoreRef.current = 0;
        setSpeed(INITIAL_SPEED);
        speedRef.current = INITIAL_SPEED;
        setIsPaused(false);
        inputQueueRef.current = [];
    }, [getRandomFood]);

    const startGame = () => {
        setGameStarted(true);
        resetGame();
    };

    const handleDirectionChange = useCallback((newDir: { x: number, y: number }) => {
        const lastInQueue = inputQueueRef.current.length > 0
            ? inputQueueRef.current[inputQueueRef.current.length - 1]
            : lastDirectionRef.current;

        // Prevent 180 degree turns
        if (newDir.x !== -lastInQueue.x || newDir.y !== -lastInQueue.y) {
            if (inputQueueRef.current.length < 3) {
                inputQueueRef.current.push(newDir);
            }
        }
    }, []);

    useEffect(() => {
        if (!gameStarted || gameOver || isPaused) return;

        const tick = () => {
            let nextDir = directionRef.current;
            if (inputQueueRef.current.length > 0) {
                nextDir = inputQueueRef.current.shift()!;
                directionRef.current = nextDir;
                setDirection(nextDir);
            }
            lastDirectionRef.current = nextDir;

            const head = snakeRef.current[0];
            const newHead = {
                x: head.x + nextDir.x,
                y: head.y + nextDir.y,
            };

            // Check wall collision
            if (
                newHead.x < 0 ||
                newHead.x >= GRID_SIZE ||
                newHead.y < 0 ||
                newHead.y >= GRID_SIZE
            ) {
                setGameOver(true);
                return;
            }

            // Check self collision
            if (snakeRef.current.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
                setGameOver(true);
                return;
            }

            const newSnake = [newHead, ...snakeRef.current];

            // Food collision check
            if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
                const newScore = scoreRef.current + 10;
                scoreRef.current = newScore;
                setScore(newScore);

                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('snakeHighScore', newScore.toString());
                }

                const newFood = getRandomFood(newSnake);
                foodRef.current = newFood;
                setFood(newFood);

                const newSpeed = Math.max(speedRef.current - 2, 50);
                speedRef.current = newSpeed;
                setSpeed(newSpeed);
            } else {
                newSnake.pop();
            }

            snakeRef.current = newSnake;
            setSnake(newSnake);
        };

        const interval = setInterval(tick, speedRef.current);
        return () => clearInterval(interval);
    }, [gameStarted, gameOver, isPaused, highScore, getRandomFood]); // Only restart loop if paused/over/started

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    handleDirectionChange({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    handleDirectionChange({ x: 0, y: 1 });
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    handleDirectionChange({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    handleDirectionChange({ x: 1, y: 0 });
                    break;
                case ' ':
                    setIsPaused((prev) => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDirectionChange]);

    return (
        <div className="snake-page">
            <header className="snake-header">
                <div className="header-left">
                    <Link to="/" className="back-link">← Arcade Deck</Link>
                </div>
                <h1>Snake Game</h1>
                <div className="header-right">
                    <div className="stat-card mini">
                        <span className="stat-label">High Score</span>
                        <span className="stat-value">{highScore}</span>
                    </div>
                </div>
            </header>

            <div className="snake-content">
                <div className="game-area">
                    {!gameStarted && (
                        <div className="snake-overlay start-menu">
                            <div className="logo-icon">🐍</div>
                            <h2>SNAKE</h2>
                            <p className="description">Classic retro experience with modern vibe.</p>
                            <button className="restart-btn start-btn" onClick={startGame}>Start Game</button>
                        </div>
                    )}
                    <div
                        className="snake-grid"
                        style={{
                            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                            width: 'fit-content',
                            margin: '0 auto'
                        }}
                    >
                        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                            const x = i % GRID_SIZE;
                            const y = Math.floor(i / GRID_SIZE);
                            const isSnakeHead = snake[0].x === x && snake[0].y === y;
                            const isSnakeBody = snake.slice(1).some(s => s.x === x && s.y === y);
                            const isFood = food.x === x && food.y === y;

                            return (
                                <div
                                    key={i}
                                    className={`grid-cell ${isSnakeHead ? 'snake-cell snake-head' : ''} ${isSnakeBody ? 'snake-cell' : ''} ${isFood ? 'food-cell' : ''}`}
                                ></div>
                            );
                        })}
                    </div>

                    {gameOver && (
                        <div className="snake-overlay">
                            <h2>GAME OVER</h2>
                            <div className="stat-panel" style={{ textAlign: 'center' }}>
                                <span className="stat-label">Final Score</span>
                                <span className="stat-value">{score}</span>
                            </div>
                            <button className="restart-btn" onClick={resetGame}>Try Again</button>
                        </div>
                    )}

                    {isPaused && !gameOver && (
                        <div className="snake-overlay">
                            <h2 style={{ background: 'linear-gradient(135deg, #5a6dff, #2f65ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>PAUSED</h2>
                            <button className="restart-btn" onClick={() => setIsPaused(false)}>Resume</button>
                        </div>
                    )}
                </div>

                <aside className="snake-sidebar">
                    <div className="stat-panel">
                        <span className="stat-label">Score</span>
                        <span className="stat-value">{score}</span>
                    </div>
                    <div className="stat-panel">
                        <span className="stat-label">High Score</span>
                        <span className="stat-value">{highScore}</span>
                    </div>
                    <div className="controls-hint">
                        <h3>Controls</h3>
                        <p>⌨️ <strong>WASD / Arrows</strong> to Move</p>
                        <p>⌨️ <strong>Space</strong> to Pause</p>
                        <p>🍎 Each food is <strong>+10</strong> points</p>
                        <p>⚡ Speed increases over time!</p>
                    </div>
                    <button
                        className="restart-btn"
                        style={{ background: '#181c31', border: '1px solid #4b5dff' }}
                        onClick={resetGame}
                    >
                        Reset Game
                    </button>
                </aside>
            </div>
        </div>
    );
}
