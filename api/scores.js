import mariadb from 'mariadb';

let pool;

function getPool() {
    if (!pool) {
        pool = mariadb.createPool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectionLimit: 5
        });
    }
    return pool;
}

export default async function handler(req, res) {
    const dbPool = getPool();
    const { method, url } = req;

    // Log API requests (server-side logs)
    console.log(`[Score API] ${method} ${url}`);

    try {
        if (method === 'POST') {
            const { game_name, score, user_name } = req.body;
            if (!game_name || score === undefined || !user_name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            console.log(`[Score API] Inserting score for ${game_name}: ${score} by ${user_name}`);

            const conn = await dbPool.getConnection();
            try {
                const result = await conn.query(
                    'INSERT INTO score_board (game_name, score, user_name) VALUES (?, ?, ?)',
                    [game_name, score, user_name]
                );
                const insertId = typeof result.insertId === 'bigint' ? Number(result.insertId) : result.insertId;
                return res.status(201).json({ id: insertId });
            } finally {
                if (conn) conn.release();
            }

        } else if (method === 'GET') {
            // Vercel routes /api/scores/[gameName] or we can handle query params
            // Based on original code: `/api/scores/${encodeURIComponent(gameName)}`
            // In Vercel, if we use /api/scores.js, the gameName might be a query param or part of the path if configured.
            // Easiest is to check query or the last part of the path.

            const gameName = decodeURIComponent(req.query.gameName || url.split('/').pop());
            console.log(`[Score API] Fetching high scores for: ${gameName}`);

            const conn = await dbPool.getConnection();
            try {
                const rows = await conn.query(
                    'SELECT user_name, score, created_at FROM score_board WHERE game_name = ? ORDER BY score DESC LIMIT 10',
                    [gameName]
                );
                // Serialize BigInt to string
                const serializedRows = JSON.parse(JSON.stringify(rows, (_, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                ));
                return res.status(200).json(serializedRows);
            } finally {
                if (conn) conn.release();
            }

        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
        }
    } catch (error) {
        console.error('[Score API] Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
