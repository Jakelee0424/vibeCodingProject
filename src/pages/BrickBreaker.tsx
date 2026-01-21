import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../style/BrickBreaker.css';

interface Ball {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
}

interface Item {
    x: number;
    y: number;
    type: 'paddle-grow' | 'paddle-shrink' | 'ball-split' | 'ball-triple';
    width: number;
    height: number;
}

interface Brick {
    x: number;
    y: number;
    status: number;
    color: string;
}

export default function BrickBreaker() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(
        parseInt(localStorage.getItem('brickBreakerHighScore') || '0')
    );
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver' | 'won'>('ready');

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('brickBreakerHighScore', score.toString());
        }
    }, [score, highScore]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || gameState !== 'playing') return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        const CANVAS_WIDTH = 640;
        const CANVAS_HEIGHT = 400;

        const INITIAL_BALL_RADIUS = 6;
        const INITIAL_SPEED = 4;
        const balls: Ball[] = [{
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 30,
            dx: INITIAL_SPEED,
            dy: -INITIAL_SPEED,
            radius: INITIAL_BALL_RADIUS
        }];

        const PADDLE_HEIGHT = 10;
        const PADDLE_WIDTHS = [50, 75, 100, 125, 150];
        let paddleWidthIndex = 2; // Starts at 100
        let paddleWidth = PADDLE_WIDTHS[paddleWidthIndex];
        let paddleX = (CANVAS_WIDTH - paddleWidth) / 2;

        const items: Item[] = [];

        let rightPressed = false;
        let leftPressed = false;

        const brickRowCount = 5;
        const brickColumnCount = 8;
        const brickWidth = 70;
        const brickHeight = 20;
        const brickPadding = 10;
        const brickOffsetTop = 40;

        // Calculate centered offset
        const totalBricksWidth = brickColumnCount * brickWidth + (brickColumnCount - 1) * brickPadding;
        const brickOffsetLeft = (CANVAS_WIDTH - totalBricksWidth) / 2;

        // Initialize bricks with fixed coordinates to prevent "moving" issues
        const bricks: Brick[][] = [];
        for (let c = 0; c < brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < brickRowCount; r++) {
                const bx = c * (brickWidth + brickPadding) + brickOffsetLeft;
                const by = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r] = {
                    x: bx,
                    y: by,
                    status: 1,
                    color: `hsl(${c * 45}, 70%, 50%)`
                };
            }
        }

        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
            else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
        };

        const keyUpHandler = (e: KeyboardEvent) => {
            if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
            else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
        };

        const drawBall = (ball: Ball) => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fillStyle = "#f9d423";
            ctx.fill();
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#f9d423";
            ctx.closePath();
            ctx.shadowBlur = 0;
        };

        const drawPaddle = () => {
            ctx.beginPath();
            // Gradient for paddle
            const grad = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
            grad.addColorStop(0, "#ff4e50");
            grad.addColorStop(1, "#f9d423");
            ctx.fillStyle = grad;
            ctx.rect(paddleX, CANVAS_HEIGHT - PADDLE_HEIGHT, paddleWidth, PADDLE_HEIGHT);
            ctx.fill();
            ctx.closePath();
        };

        const drawBricks = () => {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    const b = bricks[c][r];
                    if (b.status === 1) {
                        ctx.beginPath();
                        ctx.rect(b.x, b.y, brickWidth, brickHeight);
                        ctx.fillStyle = b.color;
                        ctx.fill();
                        // Add a little highlight
                        ctx.fillStyle = "rgba(255,255,255,0.1)";
                        ctx.rect(b.x, b.y, brickWidth, brickHeight / 2);
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        };

        const drawItems = () => {
            items.forEach(item => {
                ctx.beginPath();
                ctx.roundRect(item.x, item.y, item.width, item.height, 4);

                let color = "#fff";
                let icon = "";
                switch (item.type) {
                    case 'paddle-grow': color = "#00f2fe"; icon = "+"; break;
                    case 'paddle-shrink': color = "#ff0080"; icon = "-"; break;
                    case 'ball-split': color = "#b000ff"; icon = "2"; break;
                    case 'ball-triple': color = "#ffd700"; icon = "3"; break;
                }

                ctx.fillStyle = color;
                ctx.fill();
                ctx.fillStyle = "#000";
                ctx.font = "bold 12px Arial";
                ctx.textAlign = "center";
                ctx.fillText(icon, item.x + item.width / 2, item.y + 12);
                ctx.closePath();
            });
        };

        const update = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            drawBricks();
            drawItems();
            balls.forEach(drawBall);
            drawPaddle();

            // Items movement and collision
            for (let i = items.length - 1; i >= 0; i--) {
                const item = items[i];
                item.y += 2.5;

                if (item.y + item.height > CANVAS_HEIGHT - PADDLE_HEIGHT &&
                    item.x + item.width > paddleX && item.x < paddleX + paddleWidth) {

                    if (item.type === 'paddle-grow') {
                        paddleWidthIndex = Math.min(paddleWidthIndex + 1, 4);
                        paddleWidth = PADDLE_WIDTHS[paddleWidthIndex];
                    } else if (item.type === 'paddle-shrink') {
                        paddleWidthIndex = Math.max(paddleWidthIndex - 1, 0);
                        paddleWidth = PADDLE_WIDTHS[paddleWidthIndex];
                    } else if (item.type === 'ball-split') {
                        const currentCount = balls.length;
                        for (let j = 0; j < currentCount; j++) {
                            const b = balls[j];
                            balls.push({ ...b, dx: -b.dx });
                        }
                    } else if (item.type === 'ball-triple') {
                        const currentCount = balls.length;
                        for (let j = 0; j < currentCount; j++) {
                            const b = balls[j];
                            // Add two more balls at 45 degree spreads
                            const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
                            balls.push({ ...b, dx: speed * 0.5, dy: -speed * 0.86 });
                            balls.push({ ...b, dx: -speed * 0.5, dy: -speed * 0.86 });
                        }
                    }
                    items.splice(i, 1);
                } else if (item.y > CANVAS_HEIGHT) {
                    items.splice(i, 1);
                }
            }

            // Balls update
            for (let i = balls.length - 1; i >= 0; i--) {
                const b = balls[i];

                let collisionFound = false;
                for (let c = 0; c < brickColumnCount; c++) {
                    for (let r = 0; r < brickRowCount; r++) {
                        const brick = bricks[c][r];
                        if (brick.status === 1) {
                            if (b.x + b.radius > brick.x && b.x - b.radius < brick.x + brickWidth &&
                                b.y + b.radius > brick.y && b.y - b.radius < brick.y + brickHeight) {

                                // Determine bounce direction
                                const fromTop = b.y < brick.y;
                                const fromBottom = b.y > brick.y + brickHeight;
                                if (fromTop || fromBottom) b.dy = -b.dy;
                                else b.dx = -b.dx;

                                brick.status = 0;
                                setScore(s => s + 10);
                                collisionFound = true;

                                // Random item drop
                                if (Math.random() < 0.25) {
                                    const rand = Math.random();
                                    let type: Item['type'] = 'paddle-grow';
                                    if (rand < 0.25) type = 'paddle-grow';
                                    else if (rand < 0.5) type = 'paddle-shrink';
                                    else if (rand < 0.75) type = 'ball-triple';
                                    else type = 'ball-split';

                                    items.push({
                                        x: brick.x + brickWidth / 2 - 10,
                                        y: brick.y + brickHeight,
                                        type,
                                        width: 20,
                                        height: 15
                                    });
                                }
                                break;
                            }
                        }
                    }
                    if (collisionFound) break;
                }

                // Wall collisions
                if (b.x + b.dx > CANVAS_WIDTH - b.radius || b.x + b.dx < b.radius) {
                    b.dx = -b.dx;
                }
                if (b.y + b.dy < b.radius) {
                    b.dy = Math.abs(b.dy); // Bounce down
                } else if (b.y + b.dy > CANVAS_HEIGHT - b.radius) {
                    if (b.x > paddleX && b.x < paddleX + paddleWidth) {
                        b.dy = -Math.abs(b.dy);
                        const hitPos = (b.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
                        b.dx = hitPos * 5;
                    } else {
                        balls.splice(i, 1);
                        if (balls.length === 0) {
                            setGameState('gameOver');
                            return;
                        }
                        continue;
                    }
                }

                b.x += b.dx;
                b.y += b.dy;
            }

            // Win check
            let activeBricks = 0;
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    if (bricks[c][r].status === 1) activeBricks++;
                }
            }
            if (activeBricks === 0) {
                setGameState('won');
                return;
            }

            // Paddle movement
            if (rightPressed && paddleX < CANVAS_WIDTH - paddleWidth) {
                paddleX += 8;
            } else if (leftPressed && paddleX > 0) {
                paddleX -= 8;
            }

            animationFrameId = requestAnimationFrame(update);
        };

        document.addEventListener("keydown", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler);

        update();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.removeEventListener("keydown", keyDownHandler);
            document.removeEventListener("keyup", keyUpHandler);
        };
    }, [gameState]);

    const handleStart = () => {
        setScore(0);
        setGameState('playing');
    };

    return (
        <div className="brick-breaker-page">
            <header className="brick-breaker-header">
                <div className="header-left">
                    <Link to="/" className="back-link">← Arcade Deck</Link>
                </div>
                <h1>Brick Breaker</h1>
                <div className="header-right">
                    <div className="stat-card mini">
                        <span className="stat-label">High Score</span>
                        <span className="stat-value">{highScore}</span>
                    </div>
                </div>
            </header>

            <main className="app">
                <section className="sidebar-left">
                    <div className="stat-card">
                        <span className="stat-label">Score</span>
                        <span className="stat-value">{score}</span>
                    </div>
                    <div className="controls-card">
                        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Items</h2>
                        <ul className="controls-list" style={{ fontSize: '0.8rem' }}>
                            <li><span style={{ color: '#00f2fe' }}>[+] Paddle Grow</span></li>
                            <li><span style={{ color: '#ff0080' }}>[-] Paddle Shrink</span></li>
                            <li><span style={{ color: '#ffd700' }}>[3] Triple Balls</span></li>
                            <li><span style={{ color: '#b000ff' }}>[2] Double Balls</span></li>
                        </ul>
                    </div>
                </section>

                <section className="playfield-wrapper">
                    <div className="playfield">
                        <canvas ref={canvasRef} width={640} height={400} />
                    </div>

                    {gameState !== 'playing' && (
                        <div className="overlay">
                            <p>
                                {gameState === 'ready' && 'READY?'}
                                {gameState === 'gameOver' && 'GAME OVER'}
                                {gameState === 'won' && 'YOU WIN!'}
                            </p>
                            <button className="game-btn" onClick={handleStart}>
                                {gameState === 'ready' ? 'START GAME' : 'PLAY AGAIN'}
                            </button>
                        </div>
                    )}
                </section>

                <section className="sidebar-right">
                    <div className="stat-card">
                        <h2>Controls</h2>
                        <ul className="controls-list">
                            <li><span>Move Left</span> <span className="key-badge">←</span></li>
                            <li><span>Move Right</span> <span className="key-badge">→</span></li>
                        </ul>
                    </div>
                    <button className="game-btn" onClick={handleStart}>RESTART GAME</button>
                </section>
            </main>
        </div>
    );
}
