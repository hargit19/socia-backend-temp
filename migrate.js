require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const sql = fs.readFileSync(path.join(__dirname, 'migrations/002_npos_influencers.sql'), 'utf8');

  // Split on semicolons, strip leading comment/blank lines from each chunk,
  // then filter out anything that becomes empty or is a pure SET statement
  const statements = sql
    .split(';')
    .map(s => {
      // Remove leading comment lines and blank lines
      return s.split('\n')
        .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
        .join('\n')
        .trim();
    })
    .filter(s => s.length > 0 && !s.toUpperCase().startsWith('SET'));

  let ok = 0, skipped = 0;
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      ok++;
      console.log('OK:', stmt.slice(0, 70).replace(/\n/g, ' ') + (stmt.length > 70 ? '…' : ''));
    } catch (e) {
      // 1060 = Duplicate column, 1061 = Duplicate key, 1050 = Table already exists, 1826 = Duplicate FK
      if ([1060, 1061, 1050, 1826].includes(e.errno)) {
        skipped++;
        console.log('SKIP (already exists):', stmt.slice(0, 60).replace(/\n/g, ' ') + '…');
      } else {
        console.error('FAIL:', e.message);
        console.error('  Statement:', stmt.slice(0, 120));
        await conn.end();
        process.exit(1);
      }
    }
  }

  console.log(`\nDone — ${ok} applied, ${skipped} skipped (already exist).`);
  await conn.end();
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
