require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await db.query('SELECT 1'); // fail fast if the database is unreachable
    app.listen(PORT, () => {
      console.log(`FinTrack API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  }
}

start();
