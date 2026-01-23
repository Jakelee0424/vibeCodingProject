import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../style/CarGame.css';

const GAME_WIDTH = 450;
const GAME_HEIGHT = 500;
const PLAYER_WIDTH = 42;
const PLAYER_HEIGHT = 75;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.05;
const PLAYER_SPEED = 7;

type VehicleType = 'sedan' | 'motorcycle' | 'sports-car' | 'truck' | 'van';

interface VehicleConfig {
    width: number;
    height: number;
    speedMult: number;
}

const VEHICLE_CONFIGS: Record<VehicleType, VehicleConfig> = {
    'sedan': { width: 46, height: 85, speedMult: 1.0 },
    'motorcycle': { width: 22, height: 55, speedMult: 1.3 },
    'sports-car': { width: 48, height: 80, speedMult: 1.6 },
    'truck': { width: 65, height: 140, speedMult: 0.7 },
    'van': { width: 56, height: 95, speedMult: 0.9 },
};

interface Obstacle {
    id: number;
    x: number;
    y: number;
    vx: number;
    type: VehicleType;
}

const CarGame: React.FC = () => {
    const [playerPosition, setPlayerPosition] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(
        parseInt(localStorage.getItem('carDodgeHighScore') || '0')
    );
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED);

    const gameLoopRef = useRef<number>(0);
    const scoreRef = useRef(0);
    const speedRef = useRef(INITIAL_SPEED);
    const playerXRef = useRef(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    const obstaclesRef = useRef<Obstacle[]>([]);
    const lastObstacleTimeRef = useRef(0);
    const keysPressedRef = useRef<{ [key: string]: boolean }>({});

    const stateRef = useRef({
        gameStarted,
        gameOver,
        isPaused,
        highScore
    });

    useEffect(() => {
        stateRef.current = { gameStarted, gameOver, isPaused, highScore };
    }, [gameStarted, gameOver, isPaused, highScore]);

    const startGame = () => {
        resetGame();
        setGameStarted(true);
    };

    const resetGame = () => {
        const initialX = GAME_WIDTH / 2 - PLAYER_WIDTH / 2;
        setPlayerPosition(initialX);
        playerXRef.current = initialX;
        setObstacles([]);
        obstaclesRef.current = [];
        setScore(0);
        scoreRef.current = 0;
        setGameOver(false);
        setSpeed(INITIAL_SPEED);
        speedRef.current = INITIAL_SPEED;
        lastObstacleTimeRef.current = 0;
        setIsPaused(false);
        keysPressedRef.current = {};
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressedRef.current[e.key] = true;
            if (e.key === ' ' && stateRef.current.gameStarted && !stateRef.current.gameOver) {
                setIsPaused(prev => !prev);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressedRef.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const update = useCallback(() => {
        const { gameStarted, gameOver, isPaused, highScore } = stateRef.current;

        if (!gameStarted || gameOver || isPaused) {
            gameLoopRef.current = requestAnimationFrame(update);
            return;
        }

        // 1. Player Movement
        if (keysPressedRef.current['ArrowLeft'] || keysPressedRef.current['a'] || keysPressedRef.current['A']) {
            playerXRef.current = Math.max(0, playerXRef.current - PLAYER_SPEED);
            setPlayerPosition(playerXRef.current);
        }
        if (keysPressedRef.current['ArrowRight'] || keysPressedRef.current['d'] || keysPressedRef.current['D']) {
            playerXRef.current = Math.min(GAME_WIDTH - PLAYER_WIDTH, playerXRef.current + PLAYER_SPEED);
            setPlayerPosition(playerXRef.current);
        }

        // 2. Difficulty & Score
        speedRef.current += SPEED_INCREMENT / 60;
        setSpeed(speedRef.current);
        scoreRef.current += 0.1;
        const currentScore = Math.floor(scoreRef.current);
        setScore(currentScore);

        if (currentScore > highScore) {
            setHighScore(currentScore);
            localStorage.setItem('carDodgeHighScore', currentScore.toString());
        }

        // 3. Update Obstacles
        const updatedObstacles = obstaclesRef.current
            .map((obs) => {
                const config = VEHICLE_CONFIGS[obs.type];
                let nextX = obs.x + obs.vx;
                let nextVx = obs.vx;

                if (nextX <= 0 || nextX >= GAME_WIDTH - config.width) {
                    nextVx = -nextVx;
                }

                return {
                    ...obs,
                    x: nextX,
                    vx: nextVx,
                    y: obs.y + speedRef.current * config.speedMult
                };
            })
            .filter((obs) => obs.y < GAME_HEIGHT);

        // 4. Spawn Obstacles
        const currentTime = Date.now();
        const spawnInterval = Math.max(400, 1000 - speedRef.current * 60);
        if (currentTime - lastObstacleTimeRef.current > spawnInterval) {
            const vehicleTypes: VehicleType[] = ['sedan', 'motorcycle', 'sports-car', 'truck', 'van'];
            const randomType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const config = VEHICLE_CONFIGS[randomType];

            const laneWidth = GAME_WIDTH / 3;
            const laneCenters = [
                laneWidth / 2 - config.width / 2,
                GAME_WIDTH / 2 - config.width / 2,
                GAME_WIDTH - laneWidth / 2 - config.width / 2
            ];

            const jitter = (Math.random() - 0.5) * 60;
            const randomX = Math.max(20, Math.min(GAME_WIDTH - config.width - 20, laneCenters[Math.floor(Math.random() * 3)] + jitter));

            const isOverlap = updatedObstacles.some(obs => {
                const existingConfig = VEHICLE_CONFIGS[obs.type];
                const horizontalMatch = Math.abs(randomX - obs.x) < (config.width + existingConfig.width) / 2 + 20;

                if (horizontalMatch) {
                    const verticalDist = Math.abs((-config.height) - obs.y);
                    const minSafeDist = Math.max(config.height, existingConfig.height) + 160;
                    if (verticalDist < minSafeDist) return true;
                    if (config.speedMult > existingConfig.speedMult && obs.y > 0) return true;
                }
                return false;
            });

            if (!isOverlap) {
                let obstacleVx = 0;
                if (speedRef.current > 7) {
                    obstacleVx = (Math.random() - 0.5) * (speedRef.current - 5) * 0.4;
                }

                updatedObstacles.push({
                    id: currentTime,
                    x: randomX,
                    y: -config.height,
                    vx: obstacleVx,
                    type: randomType
                });
                lastObstacleTimeRef.current = currentTime;
            }
        }

        // 5. Collision Detection
        const hasCollision = updatedObstacles.some((obs) => {
            const config = VEHICLE_CONFIGS[obs.type];
            const p = 0; // Zero tolerance - brush = game over
            return (
                obs.x + p < playerXRef.current + PLAYER_WIDTH - p &&
                obs.x + config.width - p > playerXRef.current + p &&
                obs.y + p < (GAME_HEIGHT - 35) &&
                obs.y + config.height - p > (GAME_HEIGHT - 35 - PLAYER_HEIGHT)
            );
        });

        if (hasCollision) {
            setGameOver(true);
        }

        obstaclesRef.current = updatedObstacles;
        setObstacles(updatedObstacles);
        gameLoopRef.current = requestAnimationFrame(update);
    }, []);

    useEffect(() => {
        gameLoopRef.current = requestAnimationFrame(update);
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [update]);

    // Enhanced CSS Vehicle Renderers
    const renderPlayerCar = () => (
        <div className="vehicle player-car-model" style={{ left: `${playerPosition}px`, width: `${PLAYER_WIDTH}px`, height: `${PLAYER_HEIGHT}px`, bottom: '35px' }}>
            <div className="v-wheel wheel-tl"></div>
            <div className="v-wheel wheel-tr"></div>
            <div className="v-wheel wheel-bl"></div>
            <div className="v-wheel wheel-br"></div>
            <div className="v-hood-line"></div>
            <div className="v-window v-window-front"></div>
            <div className="v-window v-window-back"></div>
            <div className="v-light light-l" style={{ left: '10%' }}></div>
            <div className="v-light light-r" style={{ right: '10%' }}></div>
            <div className="v-tail-light tail-l" style={{ left: '10%' }}></div>
            <div className="v-tail-light tail-r" style={{ right: '10%' }}></div>
        </div>
    );

    const renderObstacle = (obs: Obstacle) => {
        const config = VEHICLE_CONFIGS[obs.type];
        return (
            <div
                key={obs.id}
                className={`vehicle obstacle-model ${obs.type}-model`}
                style={{ left: `${obs.x}px`, top: `${obs.y}px`, width: `${config.width}px`, height: `${config.height}px` }}
            >
                {obs.type === 'motorcycle' && (
                    <>
                        <div className="v-mirror mirror-l"></div>
                        <div className="v-mirror mirror-r"></div>
                    </>
                )}
                <div className="v-wheel wheel-tl"></div>
                <div className="v-wheel wheel-tr"></div>
                <div className="v-wheel wheel-bl"></div>
                <div className="v-wheel wheel-br"></div>
                <div className="v-hood-line" style={{ top: 'auto', bottom: '5%' }}></div>
                {obs.type === 'truck' ? (
                    <div className="cabin">
                        <div className="cabin-window"></div>
                    </div>
                ) : obs.type === 'van' ? (
                    <div className="v-window v-window-main" style={{ top: '10%', height: '75%', left: '8%', right: '8%' }}></div>
                ) : (
                    <>
                        <div className="v-window window-main"></div>
                        <div className="v-light light-l" style={{ left: '10%' }}></div>
                        <div className="v-light light-r" style={{ right: '10%' }}></div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="car-game-page">
            <header className="car-game-header">
                <div className="header-left">
                    <Link to="/" className="back-link">← Arcade Deck</Link>
                </div>
                <h1>Car Dodge</h1>
                <div className="header-right">
                    <div className="stat-panel mini" style={{ padding: '0.5vh 1vw', minWidth: '100px', textAlign: 'center' }}>
                        <span className="stat-label" style={{ fontSize: '0.6rem' }}>High Score</span>
                        <span className="stat-value" style={{ fontSize: '1rem' }}>{highScore}</span>
                    </div>
                </div>
            </header>

            <div className="car-game-content">
                <div className="game-area">
                    {!gameStarted && (
                        <div className="car-game-overlay">
                            <div className="logo-icon">🏎️</div>
                            <h2>CAR DODGE</h2>
                            <p className="description">Dodge traffic and survive as the speed picks up!</p>
                            <button className="restart-btn" onClick={startGame}>Start Game</button>
                        </div>
                    )}

                    <div className="game-board">
                        {gameStarted && !isPaused && !gameOver && (
                            <>
                                <div className="road-edge road-edge-l"></div>
                                <div className="road-line"></div>
                                <div className="road-line road-line-2"></div>
                                <div className="road-edge road-edge-r"></div>
                            </>
                        )}

                        {renderPlayerCar()}
                        {obstacles.map(renderObstacle)}

                        {gameOver && (
                            <div className="car-game-overlay">
                                <h2>GAME OVER</h2>
                                <div className="stat-panel" style={{ background: 'transparent', border: 'none' }}>
                                    <span className="stat-label">Final Score</span>
                                    <span className="stat-value">{score}</span>
                                </div>
                                <button className="restart-btn" onClick={resetGame}>Try Again</button>
                            </div>
                        )}

                        {isPaused && !gameOver && (
                            <div className="car-game-overlay">
                                <h2>PAUSED</h2>
                                <button className="restart-btn" onClick={() => setIsPaused(false)}>Resume</button>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="car-game-sidebar">
                    <div className="stat-panel">
                        <span className="stat-label">Score</span>
                        <span className="stat-value">{score}</span>
                    </div>
                    <div className="stat-panel">
                        <span className="stat-label">High Score</span>
                        <span className="stat-value">{highScore}</span>
                    </div>
                    <div className="stat-panel">
                        <span className="stat-label">Speed</span>
                        <span className="stat-value">{speed.toFixed(1)}</span>
                    </div>
                    <div className="controls-hint">
                        <h3>Controls</h3>
                        <p>⌨️ <strong>Arrows / WASD</strong> to Move</p>
                        <p>⌨️ <strong>Space</strong> to Pause</p>
                        <p>⚡ Speed increases over time!</p>
                    </div>
                    <button
                        className="restart-btn"
                        style={{ background: '#181c31', border: '1px solid #ff4b4b', marginTop: 'auto' }}
                        onClick={resetGame}
                    >
                        Reset Game
                    </button>
                </aside>
            </div>
        </div>
    );
};

export default CarGame;
