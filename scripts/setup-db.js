// scripts/setup-db.js
// Run with: node scripts/setup-db.js
// Make sure DATABASE_URL is in your environment first.

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌  DATABASE_URL is not set. Copy .env.local.example → .env.local and fill it in.');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  console.log('🔌  Connected to Neon. Creating tables…');

  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'todo',
      priority    TEXT NOT NULL DEFAULT 'medium',
      due_date    DATE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS habits (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      icon       TEXT NOT NULL DEFAULT '✅',
      color      TEXT NOT NULL DEFAULT '#6366f1',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id         SERIAL PRIMARY KEY,
      habit_id   INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      logged_on  DATE NOT NULL DEFAULT CURRENT_DATE,
      UNIQUE (habit_id, logged_on)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      pinned     BOOLEAN NOT NULL DEFAULT FALSE,
      color      TEXT NOT NULL DEFAULT '#fef9c3',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS goals (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      target      INT  NOT NULL DEFAULT 100,
      current     INT  NOT NULL DEFAULT 0,
      unit        TEXT NOT NULL DEFAULT '%',
      deadline    DATE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log('✅  All tables created (or already existed).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
