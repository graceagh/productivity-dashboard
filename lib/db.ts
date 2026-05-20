import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);

// ── Schema setup ────────────────────────────────────────────────────────────
export async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'todo',   -- todo | doing | done
      priority    TEXT NOT NULL DEFAULT 'medium', -- low | medium | high
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
}

// ── Task helpers ─────────────────────────────────────────────────────────────
export async function getTasks() {
  return sql`SELECT * FROM tasks ORDER BY created_at DESC`;
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) {
  const [task] = await sql`
    INSERT INTO tasks (title, description, priority, due_date)
    VALUES (${data.title}, ${data.description ?? null}, ${data.priority ?? 'medium'}, ${data.due_date ?? null})
    RETURNING *
  `;
  return task;
}

export async function updateTaskStatus(id: number, status: string) {
  const [task] = await sql`
    UPDATE tasks SET status = ${status}, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return task;
}

export async function deleteTask(id: number) {
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

// ── Habit helpers ─────────────────────────────────────────────────────────────
export async function getHabits() {
  const habits = await sql`SELECT * FROM habits ORDER BY created_at`;
  const logs = await sql`
    SELECT habit_id, logged_on::text
    FROM habit_logs
    WHERE logged_on >= CURRENT_DATE - INTERVAL '6 days'
  `;
  return habits.map((h) => ({
    ...h,
    logs: logs.filter((l) => l.habit_id === h.id).map((l) => l.logged_on),
  }));
}

export async function createHabit(data: { name: string; icon: string; color: string }) {
  const [habit] = await sql`
    INSERT INTO habits (name, icon, color) VALUES (${data.name}, ${data.icon}, ${data.color})
    RETURNING *
  `;
  return habit;
}

export async function toggleHabitLog(habitId: number, date: string) {
  const [existing] = await sql`
    SELECT id FROM habit_logs WHERE habit_id = ${habitId} AND logged_on = ${date}
  `;
  if (existing) {
    await sql`DELETE FROM habit_logs WHERE habit_id = ${habitId} AND logged_on = ${date}`;
    return { logged: false };
  } else {
    await sql`INSERT INTO habit_logs (habit_id, logged_on) VALUES (${habitId}, ${date})`;
    return { logged: true };
  }
}

export async function deleteHabit(id: number) {
  await sql`DELETE FROM habits WHERE id = ${id}`;
}

// ── Note helpers ──────────────────────────────────────────────────────────────
export async function getNotes() {
  return sql`SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC`;
}

export async function createNote(data: { title: string; body?: string; color?: string }) {
  const [note] = await sql`
    INSERT INTO notes (title, body, color)
    VALUES (${data.title}, ${data.body ?? ''}, ${data.color ?? '#fef9c3'})
    RETURNING *
  `;
  return note;
}

export async function updateNote(id: number, data: { title?: string; body?: string; pinned?: boolean }) {
  const [note] = await sql`
    UPDATE notes
    SET title   = COALESCE(${data.title ?? null}, title),
        body    = COALESCE(${data.body ?? null}, body),
        pinned  = COALESCE(${data.pinned ?? null}, pinned),
        updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return note;
}

export async function deleteNote(id: number) {
  await sql`DELETE FROM notes WHERE id = ${id}`;
}

// ── Goal helpers ──────────────────────────────────────────────────────────────
export async function getGoals() {
  return sql`SELECT * FROM goals ORDER BY created_at DESC`;
}

export async function createGoal(data: {
  title: string;
  target: number;
  unit?: string;
  deadline?: string;
}) {
  const [goal] = await sql`
    INSERT INTO goals (title, target, unit, deadline)
    VALUES (${data.title}, ${data.target}, ${data.unit ?? '%'}, ${data.deadline ?? null})
    RETURNING *
  `;
  return goal;
}

export async function updateGoalProgress(id: number, current: number) {
  const [goal] = await sql`
    UPDATE goals SET current = ${current}, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return goal;
}

export async function deleteGoal(id: number) {
  await sql`DELETE FROM goals WHERE id = ${id}`;
}
