import { Link } from 'react-router-dom';
import { useGame2048, FRUITS, FRUIT_LABELS } from '../hooks/useGame2048';

export default function Game2048() {
    const { grid, score, gameOver, restart } = useGame2048();

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
                        {grid.map((row, y) =>
                            row.map((cell, x) => (
                                <div key={`${y}-${x}`} className={`fruit-tile ${cell ? `fruit-${FRUITS[cell.type]}` : ''}`}>
                                    <span>{cell ? FRUIT_LABELS[cell.type] : ''}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <aside className="game-2024-hud">
                    <div className="score-board">
                        <span>Score</span>
                        <strong id="wm-score">{score}</strong>
                    </div>
                    <div className="controls-panel">
                        <p>Use the arrow keys to slide tiles. Matching fruits merge into the next stage, and every merge adds to your score.</p>
                    </div>
                </aside>
            </main>

            <div className={`overlay ${!gameOver ? 'hidden' : ''}`} id="game-2024-overlay">
                <p>Game Over</p>
                <button onClick={restart}>Play again</button>
            </div>
        </div>
    );
}
