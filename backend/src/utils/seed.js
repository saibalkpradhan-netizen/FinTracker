// Loads database/seed.sql (default categories + demo user). Run with `npm run seed`.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function seed() {
  const sqlPath = path.join(__dirname, '..', '..', '..', 'database', 'seed.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('Applying seed.sql ...');
  await pool.query(sql);
  console.log('Seed data applied successfully.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
