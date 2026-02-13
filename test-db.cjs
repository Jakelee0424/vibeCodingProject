const mariadb = require('mariadb');
const dotenv = require('dotenv');
dotenv.config();

async function testConnection() {
    let conn;
    try {
        console.log('Attempting to connect to MariaDB...');
        conn = await mariadb.createConnection({
            host: '15.164.97.33',
            port: 20531,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'jth1373000531',
            database: process.env.DB_NAME || 'arcade_adm'
        });
        console.log('Connected successfully!');

        try {
            const rows = await conn.query('DESCRIBE score_board');
            console.log('Table structure:', rows);
        } catch (tableErr) {
            console.log('Table score_board might not exist. Creating it...');
            await conn.query(`
                CREATE TABLE IF NOT EXISTS score_board (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    game_name VARCHAR(255) NOT NULL,
                    score INT NOT NULL,
                    user_name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Table created or verified.');
        }

        const count = await conn.query('SELECT COUNT(*) as cnt FROM score_board');
        console.log('Current row count:', count);

    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        if (conn) await conn.end();
    }
}

testConnection();
