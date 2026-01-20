import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGame2048, TILES, TILE_VALUES } from '../hooks/useGame2048';
import '../style/Game2048.css';

export default function Game2048() {
    const { grid, score, gameOver, restart } = useGame2048();
    const [isStarted, setIsStarted] = useState(false);

    const handleStart = () => {
        restart();
        setIsStarted(true);
    };

    return (
        <div className="game-2024-page">
            <header className="game-2024-header">
                <div>
                    <p className="eyebrow">Merge challenge</p>
                    <h1>Classic 2048</h1>
                </div>
                <Link className="back-link" to="/">Back to lobby</Link>
            </header>

            <main className="game-2024-content">
                <section className="board-panel">
                    <div className="board-grid" id="board-grid">
                        {/* Background grid cells */}
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="grid-cell" />
                        ))}

                        {/* Animated tiles */}
                        {isStarted && grid.flatMap((row, y) => row.map((cell, x) => {
                            if (!cell) return null;
                            return (
                                <div
                                    key={cell.id}
                                    className={`game-tile tile-${TILES[cell.type] || '2'}`}
                                    style={{
                                        '--x': x,
                                        '--y': y,
                                    } as React.CSSProperties}
                                >
                                    <span>{TILE_VALUES[cell.type]}</span>
                                </div>
                            );
                        }))}
                    </div>

                    {(!isStarted || gameOver) && (
                        <div className="overlay" id="game-2024-overlay">
                            <p>{gameOver ? 'Game Over' : 'Classic 2048'}</p>
                            <button className="game-btn" onClick={handleStart}>
                                {gameOver ? 'Play Again' : 'START GAME'}
                            </button>
                        </div>
                    )}
                </section>

                <aside className="game-2024-hud">
                    <div className="stat-card">
                        <span className="stat-label">Score</span>
                        <strong className="stat-value">{score}</strong>
                    </div>

                    <div className="controls-card">
                        <h2>How to Play</h2>
                        <ul className="controls-list">
                            <li><span>Slide Tiles</span> <div><span className="key-badge">←</span> <span className="key-badge">↑</span> <span className="key-badge">↓</span> <span className="key-badge">→</span></div></li>
                            <li><span>Goal</span> <span className="key-badge">2048</span></li>
                        </ul>
                    </div>

                    <button className="game-btn restart-btn" onClick={handleStart}>{isStarted ? 'New Game' : 'Start'}</button>

                    <div className="controls-panel" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                            Combine matching numbering to create larger tiles. Reach 2048 to win!
                        </p>
                    </div>
                </aside>
            </main>
        </div>
    );
}
