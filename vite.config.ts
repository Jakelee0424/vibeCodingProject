import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import mariadb from 'mariadb'

// Create pool outside to preserve it across config re-evaluations (though it might still be re-created if vite.config.ts itself changes)
let pool: any;

function getPool(env: any) {
  if (!pool) {
    pool = mariadb.createPool({
      host: env.DB_HOST || '15.164.97.33',
      port: Number(env.DB_PORT) || 20531,
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || 'jth1373000531',
      database: env.DB_NAME || 'arcade_adm',
      connectionLimit: 5
    });
  }
  return pool;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dbPool = getPool(env);

  return {
    plugins: [
      react(),
      {
        name: 'score-db-api',
        configureServer(server) {
          // Initialize Table
          (async () => {
            let conn;
            try {
              conn = await dbPool.getConnection();
              await conn.query(`
                  CREATE TABLE IF NOT EXISTS score_board (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    game_name VARCHAR(255) NOT NULL,
                    score INT NOT NULL,
                    user_name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `);
              console.log('[ScoreDB API] Table verified/created successfully');
            } catch (err: any) {
              console.error('[ScoreDB API] Table Init Error:', err.message);
            } finally {
              if (conn) conn.release();
            }
          })();

          server.middlewares.use((req, res, next) => {
            // Log all API requests
            if (req.url?.startsWith('/api/')) {
              console.log(`[ScoreDB API] ${req.method} ${req.url}`);
            }

            if (req.url === '/api/scores' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => body += chunk);
              req.on('end', async () => {
                let conn;
                try {
                  console.log('[ScoreDB API] Received Body:', body);
                  if (!body) throw new Error('Empty request body');

                  const { game_name, score, user_name } = JSON.parse(body);
                  console.log(`[ScoreDB API] Inserting score for ${game_name}: ${score} by ${user_name}`);

                  conn = await dbPool.getConnection();
                  console.log('[ScoreDB API] DB Connected');

                  const result = await conn.query(
                    'INSERT INTO score_board (game_name, score, user_name) VALUES (?, ?, ?)',
                    [game_name, score, user_name]
                  );

                  const insertId = typeof result.insertId === 'bigint' ? Number(result.insertId) : result.insertId;
                  console.log('[ScoreDB API] Insert Success, ID:', insertId);

                  res.statusCode = 201;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ id: insertId }));
                } catch (err: any) {
                  console.error('[ScoreDB API] POST Error:', err.message);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                } finally {
                  if (conn) conn.release();
                }
              });
            } else if (req.url?.startsWith('/api/scores/') && req.method === 'GET') {
              const gameName = decodeURIComponent(req.url.split('/').pop() || '');
              let conn;
              (async () => {
                try {
                  console.log(`[ScoreDB API] Fetching high scores for: ${gameName}`);
                  conn = await dbPool.getConnection();
                  const rows = await conn.query(
                    'SELECT user_name, score, created_at FROM score_board WHERE game_name = ? ORDER BY score DESC LIMIT 10',
                    [gameName]
                  );
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(rows, (_, value) => typeof value === 'bigint' ? value.toString() : value));
                } catch (err: any) {
                  console.error(`[ScoreDB API] GET Error (${gameName}):`, err.message);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }))
                } finally {
                  if (conn) conn.release();
                }
              })();
            } else {
              next();
            }
          });
        }
      }
    ],
  }
})
