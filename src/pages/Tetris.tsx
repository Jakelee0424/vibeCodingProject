import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TetrisEngine } from '../game/TetrisGame';
import type { TetrisStats, GameState } from '../game/TetrisGame';
import '../style/Tetris.css';
import { saveScore, getHighScore } from '../utils/api';
import ScoreModal from '../components/ScoreModal';

export default function Tetris() {
    const boardRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<TetrisEngine | null>(null);

    const [stats, setStats] = useState<TetrisStats>({ score: 0, lines: 0, level: 1 });
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<GameState | 'ready'>('ready');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scoreToSave, setScoreToSave] = useState(0);
    const scoreSavedRef = useRef(false);

    useEffect(() => {
        const fetchHighScore = async () => {
            const topScore = await getHighScore('Tetris');
            setHighScore(topScore);
        };
        fetchHighScore();
    }, []);

    useEffect(() => {
        // Reset scoreSavedRef when game is not in a terminal state
        if (gameState !== 'gameover') {
            scoreSavedRef.current = false;
        }

        // Handle score saving only once when game ends
        if (gameState === 'gameover' && !scoreSavedRef.current) {
            if (stats.score > highScore && stats.score > 0) {
                setHighScore(stats.score);
                setScoreToSave(stats.score);
                setIsModalOpen(true);
                scoreSavedRef.current = true;
            }
        }
    }, [gameState, stats.score, highScore]);

    const handleSaveScore = async (userName: string) => {
        await saveScore('Tetris', scoreToSave, userName);
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (!boardRef.current || !previewRef.current) return;

        const engine = new TetrisEngine(
            boardRef.current,
            previewRef.current,
            {
                onStatsUpdate: (s) => setStats(s),
                onGameStateChange: (s) => setGameState(s),
            }
        );
        engineRef.current = engine;

        return () => {
            engine.destroy();
        };
    }, []); // Init only once

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState === 'ready') return;
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            engineRef.current?.handleInput(e.key);
        };

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [gameState]); // Key handler depends on state

    const handleStart = () => {
        engineRef.current?.start();
    };

    return (
        <div className="tetris-page">
            <header className="tetris-header">
                <div className="header-left">
                    <Link to="/" className="back-link">← Arcade Deck</Link>
                </div>
                <h1>Tetris Game</h1>
                <div className="header-right">
                    <div className="stat-card mini">
                        <span className="stat-label">High Score</span>
                        <span className="stat-value">{highScore}</span>
                    </div>
                </div>
            </header>

            <main className="tetris-content">
                <section className="sidebar-left">
                    <div className="stat-card">
                        <span className="stat-label">Score</span>
                        <span className="stat-value">{stats.score}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Lines</span>
                        <span className="stat-value">{stats.lines}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Level</span>
                        <span className="stat-value">{stats.level}</span>
                    </div>
                </section>

                <section className="playfield-wrapper">
                    <div className="playfield">
                        <canvas ref={boardRef} width={300} height={600} aria-label="Tetris board"></canvas>
                    </div>

                    {gameState !== 'playing' && (
                        <div className="overlay">
                            {gameState === 'ready' && (
                                <div className="start-menu-content">
                                    <div className="logo-icon">🧩</div>
                                    <h2>TETRIS</h2>
                                    <p className="description">Classic block puzzle experience with modern vibe.</p>
                                </div>
                            )}
                            {gameState === 'paused' && <p className="status-text">PAUSED</p>}
                            {gameState === 'gameover' && <p className="status-text">GAME OVER</p>}
                            <button className="game-btn start-btn" onClick={() => {
                                if (gameState === 'paused') engineRef.current?.togglePause();
                                else handleStart();
                            }}>
                                {gameState === 'ready' ? 'START GAME' : (gameState === 'paused' ? 'RESUME GAME' : 'PLAY AGAIN')}
                            </button>
                        </div>
                    )}
                </section>

                <section className="sidebar-right">
                    <div className="next-piece-card">
                        <span className="stat-label">Next Piece</span>
                        <canvas ref={previewRef} width={120} height={100}></canvas>
                    </div>

                    <div className="controls-card">
                        <h2>Controls</h2>
                        <ul className="controls-list">
                            <li><span>Move</span> <div><span className="key-badge">←</span> <span className="key-badge">→</span></div></li>
                            <li><span>Rotate</span> <span className="key-badge">↑</span></li>
                            <li><span>Soft Drop</span> <span className="key-badge">↓</span></li>
                            <li><span>Hard Drop</span> <span className="key-badge">Space</span></li>
                            <li><span>Pause</span> <span className="key-badge">P</span></li>
                        </ul>
                    </div>

                    <button className="game-btn" onClick={handleStart}>RESTART GAME</button>
                </section>
            </main>
            <footer></footer>

            <ScoreModal
                isOpen={isModalOpen}
                score={scoreToSave}
                onSave={handleSaveScore}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
