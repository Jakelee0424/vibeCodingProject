import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/Galaxia.css';
import { saveScore, getHighScore } from '../utils/api';
import ScoreModal from '../components/ScoreModal';

interface GameObject {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

interface Bullet extends GameObject {
    active: boolean;
}

interface Enemy extends GameObject {
    active: boolean;
    type: number;
    health: number;
    originX: number;
    originY: number;
    isDiving: boolean;
    divePhase: number;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 42;
const ENEMY_WIDTH = 34;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;

export default function Galaxia() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        const fetchHighScore = async () => {
            const topScore = await getHighScore('Galaxia');
            setHighScore(topScore);
        };
        fetchHighScore();
    }, []);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver' | 'won'>('ready');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scoreToSave, setScoreToSave] = useState(0);
    const scoreSavedRef = useRef(false);

    useEffect(() => {
        // Reset scoreSavedRef when game is not in a terminal state
        if (gameState === 'playing' || gameState === 'ready') {
            scoreSavedRef.current = false;
        }

        // Handle score saving only once when game ends (gameOver or won)
        const isTerminal = gameState === 'gameOver' || gameState === 'won';
        if (isTerminal && !scoreSavedRef.current) {
            if (score > highScore && score > 0) {
                setHighScore(score);
                setScoreToSave(score);
                setIsModalOpen(true);
                scoreSavedRef.current = true;
            }
        }
    }, [gameState, score, highScore]);

    const handleSaveScore = async (userName: string) => {
        await saveScore('Galaxia', scoreToSave, userName);
        setIsModalOpen(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || gameState !== 'playing') return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Game State Refs (avoid state closure issues in loop)
        const player = {
            x: (CANVAS_WIDTH - PLAYER_WIDTH) / 2,
            y: CANVAS_HEIGHT - PLAYER_HEIGHT - 30,
            speed: 6
        };

        const bullets: Bullet[] = [];
        const enemyBullets: Bullet[] = [];
        const enemies: Enemy[] = [];
        const particles: Particle[] = [];

        let leftPressed = false;
        let rightPressed = false;
        let spacePressed = false;
        let canShoot = true;

        const initEnemies = () => {
            enemies.length = 0;
            const rows = 4;
            const cols = 8;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const ox = 70 + c * (ENEMY_WIDTH + 26);
                    const oy = 60 + r * (ENEMY_HEIGHT + 24);
                    enemies.push({
                        x: ox,
                        y: oy,
                        originX: ox,
                        originY: oy,
                        width: ENEMY_WIDTH,
                        height: ENEMY_HEIGHT,
                        active: true,
                        type: r,
                        health: 1,
                        isDiving: false,
                        divePhase: 0
                    });
                }
            }
        };

        initEnemies();

        const spawnExplosion = (x: number, y: number, color: string) => {
            for (let i = 0; i < 15; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    life: 1.0,
                    color
                });
            }
        };

        const drawPlayer = (x: number, y: number) => {
            ctx.save();
            ctx.translate(x, y);

            // Engines
            ctx.fillStyle = '#ff4e50';
            ctx.fillRect(8, 30, 6, 10);
            ctx.fillRect(30, 30, 6, 10);

            // Wings
            ctx.fillStyle = '#00f2fe';
            ctx.beginPath();
            ctx.moveTo(0, 35); ctx.lineTo(15, 20); ctx.lineTo(15, 40); ctx.closePath(); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(44, 35); ctx.lineTo(29, 20); ctx.lineTo(29, 40); ctx.closePath(); ctx.fill();

            // Body
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(22, 0);
            ctx.lineTo(15, 30);
            ctx.lineTo(29, 30);
            ctx.closePath();
            ctx.fill();

            // Cockpit
            ctx.fillStyle = '#1e3c72';
            ctx.beginPath();
            ctx.arc(22, 18, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        const drawEnemy = (e: Enemy, x: number, y: number) => {
            ctx.save();
            ctx.translate(x, y);

            const color = e.type === 0 ? '#ff0080' : e.type === 1 ? '#ffcc00' : '#00f2fe';
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            if (e.type === 0) { // Beetle-like
                ctx.beginPath();
                ctx.arc(17, 15, 12, 0, Math.PI, true);
                ctx.fill();
                ctx.fillRect(5, 15, 24, 6);
                ctx.fillStyle = '#fff';
                ctx.fillRect(10, 8, 4, 4); ctx.fillRect(20, 8, 4, 4);
            } else if (e.type === 1) { // Winged
                ctx.beginPath();
                ctx.moveTo(0, 10); ctx.lineTo(17, 0); ctx.lineTo(34, 10); ctx.lineTo(17, 25); ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.fillRect(14, 8, 6, 6);
            } else { // UFO
                ctx.beginPath();
                ctx.ellipse(17, 15, 17, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(17, 12, 6, 0, Math.PI, true);
                ctx.fill();
            }

            ctx.restore();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') leftPressed = true;
            if (e.key === 'ArrowRight') rightPressed = true;
            if (e.key === ' ') spacePressed = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') leftPressed = false;
            if (e.key === 'ArrowRight') rightPressed = false;
            if (e.key === ' ') spacePressed = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const spawnBullet = () => {
            if (canShoot) {
                bullets.push({
                    x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
                    y: player.y,
                    width: BULLET_WIDTH,
                    height: BULLET_HEIGHT,
                    active: true
                });
                canShoot = false;
                setTimeout(() => (canShoot = true), 250);
            }
        };

        const update = (time: number) => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Stars
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            for (let i = 0; i < 40; i++) {
                const x = (Math.sin(i * 1234.5) * 0.5 + 0.5) * CANVAS_WIDTH;
                const y = ((Math.cos(i * 5432.1) * 0.5 + 0.5) * CANVAS_HEIGHT + time * 0.15) % CANVAS_HEIGHT;
                ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + (i % 5) * 0.1})`;
                ctx.fillRect(x, y, i % 3 + 1, i % 3 + 1);
            }

            if (leftPressed && player.x > 0) player.x -= player.speed;
            if (rightPressed && player.x < CANVAS_WIDTH - PLAYER_WIDTH) player.x += player.speed;
            if (spacePressed) spawnBullet();

            drawPlayer(player.x, player.y);

            // Particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;
                if (p.life <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.fillRect(p.x, p.y, 3, 3);
                    ctx.globalAlpha = 1.0;
                }
            }

            // Player Bullets
            ctx.fillStyle = '#00f2fe';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#00f2fe';
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                b.y -= 9;
                ctx.fillRect(b.x, b.y, b.width, b.height);
                if (b.y < -20) bullets.splice(i, 1);
            }

            // Enemy Bullets
            ctx.fillStyle = '#ffcc00';
            ctx.shadowColor = '#ffcc00';
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                const b = enemyBullets[i];
                b.y += 5;
                ctx.fillRect(b.x, b.y, b.width, b.height);
                if (b.x < player.x + PLAYER_WIDTH && b.x + b.width > player.x &&
                    b.y < player.y + PLAYER_HEIGHT && b.y + b.height > player.y) {
                    spawnExplosion(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, '#00f2fe');
                    setGameState('gameOver');
                    return;
                }
                if (b.y > CANVAS_HEIGHT) enemyBullets.splice(i, 1);
            }

            // Enemies Logic
            let allDead = true;
            const waveX = Math.sin(time * 0.002) * 50;

            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e.active) continue;
                allDead = false;

                let drawX = e.originX + waveX;
                let drawY = e.originY;

                // Dive AI
                if (!e.isDiving && Math.random() < 0.0002) {
                    e.isDiving = true;
                    e.divePhase = 0;
                }

                if (e.isDiving) {
                    e.divePhase += 0.02;
                    // Spiral/Arc dive
                    drawX += Math.sin(e.divePhase * 5) * 100;
                    drawY += e.divePhase * 300;

                    if (drawY > CANVAS_HEIGHT) {
                        e.isDiving = false;
                        e.divePhase = 0;
                    }

                    // Collision with player
                    if (drawX < player.x + PLAYER_WIDTH && drawX + e.width > player.x &&
                        drawY < player.y + PLAYER_HEIGHT && drawY + e.height > player.y) {
                        setGameState('gameOver');
                        return;
                    }
                }

                drawEnemy(e, drawX, drawY);

                // Bullet hits enemy
                for (let j = bullets.length - 1; j >= 0; j--) {
                    const b = bullets[j];
                    if (b.x < drawX + e.width && b.x + b.width > drawX &&
                        b.y < drawY + e.height && b.y + b.height > drawY) {
                        e.active = false;
                        bullets.splice(j, 1);
                        spawnExplosion(drawX + e.width / 2, drawY + e.height / 2, ctx.fillStyle as string);
                        setScore(s => s + 100);
                    }
                }

                // Random shooting
                if (Math.random() < 0.001 * level) {
                    enemyBullets.push({
                        x: drawX + e.width / 2,
                        y: drawY + e.height,
                        width: 4,
                        height: 12,
                        active: true
                    });
                }
            }

            if (allDead) {
                setGameState('won');
                return;
            }

            ctx.shadowBlur = 0;
            animationFrameId = requestAnimationFrame(update);
        };

        animationFrameId = requestAnimationFrame(update);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, [gameState, level]);

    const handleStart = () => {
        if (gameState === 'won') {
            setLevel(l => l + 1);
        } else {
            setScore(0);
            setLevel(1);
        }
        setGameState('playing');
    };

    return (
        <div className="galaxia-page">
            <header className="galaxia-header">
                <div className="header-left">
                    <Link to="/" className="back-link">← Arcade Deck</Link>
                </div>
                <h1>GALAXIA</h1>
                <div className="header-right">
                    <div className="stat-card mini">
                        <span className="stat-label">High Score</span>
                        <span className="stat-value">{highScore}</span>
                    </div>
                </div>
            </header>

            <main className="galaxia-content">
                <section className="sidebar-left">
                    <div className="stat-card">
                        <span className="stat-label">Score</span>
                        <span className="stat-value">{score}</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-label">Wave</span>
                        <span className="stat-value">{level}</span>
                    </div>
                </section>

                <section className="playfield-wrapper">
                    <div className="playfield">
                        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                    </div>

                    {gameState !== 'playing' && (
                        <div className="overlay">
                            {gameState === 'ready' && (
                                <div className="start-menu-content">
                                    <div className="logo-icon">🚀</div>
                                    <h2>GALAXIA</h2>
                                    <p className="description">Defend the sector against diving squadrons.</p>
                                </div>
                            )}
                            {gameState === 'gameOver' && <p className="status-text">MISSION FAILED</p>}
                            {gameState === 'won' && <p className="status-text">STAGE CLEAR</p>}
                            <button className="game-btn start-btn" onClick={handleStart}>
                                {gameState === 'ready' ? 'LAUNCH SHIP' : (gameState === 'won' ? 'NEXT WAVE' : 'RETRY MISSION')}
                            </button>
                        </div>
                    )}
                </section>

                <section className="sidebar-right">
                    <div className="stat-card">
                        <h2>Mission Pilot</h2>
                        <ul className="controls-list">
                            <li><span>Maneuver</span> <span className="key-badge">← →</span></li>
                            <li><span>Blasters</span> <span className="key-badge">Space</span></li>
                        </ul>
                    </div>
                    <button className="game-btn" onClick={() => setGameState('ready')}>ABORT MISSION</button>
                </section>
            </main>

            <ScoreModal
                isOpen={isModalOpen}
                score={scoreToSave}
                onSave={handleSaveScore}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
