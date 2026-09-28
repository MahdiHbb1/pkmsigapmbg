const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sigap_mbg',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] MySQL connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] MySQL connection failed:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
