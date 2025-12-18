import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TetrisEngine } from '../game/TetrisGame';
import type { TetrisStats, GameState } from '../game/TetrisGame';

export default function Tetris() {
    const boardRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<TetrisEngine | null>(null);

    const [stats, setStats] = useState<TetrisStats>({ score: 0, lines: 0, level: 1 });
    const [gameState, setGameState] = useState<GameState>('playing');

    useEffect(() => {
        if (!boardRef.current || !previewRef.current) return;

        // Prevent double init in strict mode
        if (engineRef.current) return;

        const engine = new TetrisEngine(
            boardRef.current,
            previewRef.current,
            {
                onStatsUpdate: (s) => setStats(s),
                onGameStateChange: (s) => setGameState(s),
            }
        );
        engineRef.current = engine;
        engine.start();

        const handleKey = (e: KeyboardEvent) => {
            // Prevent default scrolling for game keys only if game is active or paused
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
            engine.handleInput(e.key);
        };

        document.addEventListener('keydown', handleKey);

        return () => {
            engine.destroy();
            document.removeEventListener('keydown', handleKey);
            // We don't nullify engineRef.current here immediately to avoid issues if strict mode re-mounts
            // but 'destroy' stops the loop.
        };
    }, []);

    return (
        <div className="tetris-page">
            <header className="tetris-header">
                <div>
                    <p className="eyebrow">Instant Arcade</p>
                    <h1>Classic Tetris</h1>
                </div>
                <Link className="back-link" to="/">Back to lobby</Link>
            </header>

            <main className="app">
                <section className="playfield">
                    <canvas ref={boardRef} width={300} height={900} aria-label="Tetris board"></canvas>
                </section>
                <section className="sidebar">
                    <h1>Tetris</h1>
                    <div className="stat">
                        <span className="label">Score</span>
                        <span className="value">{stats.score}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Lines</span>
                        <span className="value">{stats.lines}</span>
                    </div>
                    <div className="stat">
                        <span className="label">Level</span>
                        <span className="value">{stats.level}</span>
                    </div>
                    <div className="preview">
                        <span className="label">Next</span>
                        <canvas ref={previewRef} width={120} height={120}></canvas>
                    </div>
                    <div className="controls">
                        <h2>Controls</h2>
                        <ul>
                            <li>← / →: Move</li>
                            <li>↑: Rotate</li>
                            <li>↓: Soft drop</li>
                            <li>Space: Hard drop</li>
                            <li>P: Pause / resume</li>
                            <li>R: Restart</li>
                        </ul>
                    </div>
                    <button onClick={() => engineRef.current?.start()}>Restart</button>
                </section>
            </main>

            <div className={`overlay ${gameState === 'playing' ? 'hidden' : ''}`}>
                <p>{gameState === 'paused' ? 'Paused' : 'Game Over'}</p>
                <button onClick={() => {
                    if (gameState === 'paused') engineRef.current?.togglePause();
                    else engineRef.current?.start();
                }}>
                    {gameState === 'paused' ? 'Resume' : 'Play Again'}
                </button>
            </div>
        </div>
    );
}
