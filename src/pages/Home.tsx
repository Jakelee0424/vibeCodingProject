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
            <p className="game-description">Stack pieces, clear lines, and let the score climb with every strategic drop.</p>
          </div>
          <Link className="cta-button" to="/tetris">Play Tetris</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Merge adventure</p>
            <h2>Classic 2048</h2>
            <p className="game-description">Slide the grid, combine identical numbers</p>
          </div>
          <Link className="cta-button" to="/2048">Play 2048</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Arcade Classic</p>
            <h2>Brick Breaker</h2>
            <p className="game-description">Destroy all colors by bouncing the ball and moving the paddle.</p>
          </div>
          <Link className="cta-button" to="/brick-breaker">Play Game</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Classic Arcade</p>
            <h2>Snake</h2>
            <p className="game-description">Eat food to grow your length, but avoid hitting the walls or your own tail!</p>
          </div>
          <Link className="cta-button" to="/snake">Play Snake</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Speed test</p>
            <h2>Car Dodge</h2>
            <p className="game-description">Dodge traffic and see how long you can survive as the speed picks up!</p>
          </div>
          <Link className="cta-button" to="/car-dodge">Play Game</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Space Shooter</p>
            <h2>Galaxia</h2>
            <p className="game-description">Classic arcade shooter. Defend the galaxy from waves of invaders!</p>
          </div>
          <Link className="cta-button" to="/galaxia">Play Galaxia</Link>
        </article>
        <article className="game-card">
          <div className="card-copy">
            <p className="tagline">Upcoming</p>
            <h2>Game 7</h2>
            <p className="game-description">Description for game 7 (should wrap)</p>
          </div>
          <Link className="cta-button" to="/">Play 7</Link>
        </article>
      </section>
    </main>
  );
}
