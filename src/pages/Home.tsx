import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="lobby">
      <header className="lobby-header">
        <p className="eyebrow">Game lobby</p>
        <h1>Arcade Deck</h1>
        <p className="intro">
          Choose a challenge and jump straight into the action. Each card links to a dedicated screen.
        </p>
      </header>

      <section className="game-grid">
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Retro essential</p>
            <h2>Classic Tetris</h2>
            <p>Stack pieces, clear lines, and let the score climb with every strategic drop.</p>
          </div>
          <Link className="cta-button" to="/tetris">Play Tetris</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Merge adventure</p>
            <h2>Classic 2048</h2>
            <p>Slide the grid, combine identical numbers</p>
          </div>
          <Link className="cta-button" to="/2048">Play 2048</Link>
        </article>
      </section>
    </main>
  );
}
