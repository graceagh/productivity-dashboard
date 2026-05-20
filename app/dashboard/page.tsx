'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, subDays, isToday, parseISO } from 'date-fns';
import {
  CheckSquare, Repeat, StickyNote, Target, Plus, Trash2,
  ChevronRight, Pin, Circle, CheckCircle2, Loader2, X
} from 'lucide-react';
import clsx from 'clsx';
import styles from './dashboard.module.css';

// ── Types ────────────────────────────────────────────────────────────────────
interface Task { id: number; title: string; description?: string; status: string; priority: string; due_date?: string; created_at: string; }
interface Habit { id: number; name: string; icon: string; color: string; logs: string[]; }
interface Note { id: number; title: string; body: string; pinned: boolean; color: string; updated_at: string; }
interface Goal { id: number; title: string; target: number; current: number; unit: string; deadline?: string; }

const PRIORITY_COLOR: Record<string, string> = { low: '#3af0c8', medium: '#f0a83a', high: '#f03a6e' };
const NOTE_COLORS = ['#fef9c3', '#d1fae5', '#dbeafe', '#ede9fe', '#fce7f3', '#ffedd5'];
const HABIT_COLORS = ['#c8f03a', '#3af0c8', '#f0a83a', '#f03a6e', '#a78bfa', '#60a5fa'];

// ── Helpers ──────────────────────────────────────────────────────────────────
const last7Days = () => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'));

async function api(path: string, opts?: RequestInit) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts?.headers) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.iconBtn} onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── TASKS PANEL ───────────────────────────────────────────────────────────────
function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', priority: 'medium', due_date: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setTasks(await api('/api/tasks'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim()) return;
    await api('/api/tasks', { method: 'POST', body: JSON.stringify(form) });
    setForm({ title: '', priority: 'medium', due_date: '' });
    setAdding(false);
    load();
  };

  const cycle = async (t: Task) => {
    const next = t.status === 'todo' ? 'doing' : t.status === 'doing' ? 'done' : 'todo';
    await api('/api/tasks', { method: 'PATCH', body: JSON.stringify({ id: t.id, status: next }) });
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x));
  };

  const remove = async (id: number) => {
    await api('/api/tasks', { method: 'DELETE', body: JSON.stringify({ id }) });
    setTasks(prev => prev.filter(x => x.id !== id));
  };

  const todo = tasks.filter(t => t.status === 'todo');
  const doing = tasks.filter(t => t.status === 'doing');
  const done = tasks.filter(t => t.status === 'done');

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <CheckSquare size={14} className={styles.panelIcon} />
        <span>Tasks</span>
        <span className={styles.badge}>{tasks.filter(t => t.status !== 'done').length}</span>
        <button className={styles.addBtn} onClick={() => setAdding(v => !v)}><Plus size={14} /></button>
      </div>

      {adding && (
        <div className={styles.addForm}>
          <input placeholder="Task title…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && add()} autoFocus />
          <div className={styles.formRow}>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <button className={styles.submitBtn} onClick={add}>Add Task</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className={styles.taskCols}>
          {[{ label: 'TODO', items: todo, color: '#8a8580' }, { label: 'DOING', items: doing, color: '#f0a83a' }, { label: 'DONE', items: done, color: '#c8f03a' }].map(col => (
            <div key={col.label} className={styles.taskCol}>
              <div className={styles.colLabel} style={{ color: col.color }}>{col.label} <span>({col.items.length})</span></div>
              {col.items.map(t => (
                <div key={t.id} className={clsx(styles.taskCard, t.status === 'done' && styles.taskDone)}>
                  <button className={styles.statusBtn} onClick={() => cycle(t)}>
                    {t.status === 'done' ? <CheckCircle2 size={14} color="#c8f03a" /> : <Circle size={14} />}
                  </button>
                  <div className={styles.taskBody}>
                    <span className={styles.taskTitle}>{t.title}</span>
                    {t.due_date && <span className={styles.taskMeta}>{format(parseISO(t.due_date), 'MMM d')}</span>}
                  </div>
                  <span className={styles.priorityDot} style={{ background: PRIORITY_COLOR[t.priority] }} title={t.priority} />
                  <button className={styles.deleteBtn} onClick={() => remove(t.id)}><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HABITS PANEL ──────────────────────────────────────────────────────────────
function HabitsPanel() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '⚡', color: '#c8f03a' });
  const days = last7Days();

  const load = useCallback(async () => {
    setLoading(true);
    setHabits(await api('/api/habits'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (habitId: number, date: string) => {
    await api('/api/habits', { method: 'POST', body: JSON.stringify({ action: 'toggle', habitId, date }) });
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const has = h.logs.includes(date);
      return { ...h, logs: has ? h.logs.filter(d => d !== date) : [...h.logs, date] };
    }));
  };

  const add = async () => {
    if (!form.name.trim()) return;
    await api('/api/habits', { method: 'POST', body: JSON.stringify(form) });
    setForm({ name: '', icon: '⚡', color: '#c8f03a' });
    setAdding(false);
    load();
  };

  const remove = async (id: number) => {
    await api('/api/habits', { method: 'DELETE', body: JSON.stringify({ id }) });
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <Repeat size={14} className={styles.panelIcon} />
        <span>Habits</span>
        <span className={styles.badge}>{habits.filter(h => h.logs.includes(today)).length}/{habits.length}</span>
        <button className={styles.addBtn} onClick={() => setAdding(v => !v)}><Plus size={14} /></button>
      </div>

      {adding && (
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <input placeholder="Emoji icon" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} style={{ width: 70 }} />
            <input placeholder="Habit name…" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && add()} autoFocus />
          </div>
          <div className={styles.colorRow}>
            {HABIT_COLORS.map(c => (
              <button key={c} className={clsx(styles.colorSwatch, form.color === c && styles.colorSelected)}
                style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
            ))}
          </div>
          <button className={styles.submitBtn} onClick={add}>Add Habit</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className={styles.habitTable}>
          <div className={styles.habitDayRow}>
            <div className={styles.habitNameCell} />
            {days.map(d => (
              <div key={d} className={clsx(styles.dayLabel, d === today && styles.dayToday)}>
                {format(parseISO(d), 'EEE')[0]}
                <span>{format(parseISO(d), 'd')}</span>
              </div>
            ))}
          </div>
          {habits.map(h => (
            <div key={h.id} className={styles.habitRow}>
              <div className={styles.habitNameCell}>
                <span>{h.icon}</span>
                <span className={styles.habitName}>{h.name}</span>
                <button className={styles.deleteBtn} onClick={() => remove(h.id)}><Trash2 size={11} /></button>
              </div>
              {days.map(d => {
                const checked = h.logs.includes(d);
                return (
                  <button key={d} className={clsx(styles.habitCell, checked && styles.habitChecked)}
                    style={checked ? { background: h.color + '33', borderColor: h.color } : {}}
                    onClick={() => toggle(h.id, d)}>
                    {checked && <span style={{ color: h.color }}>✓</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {habits.length === 0 && <div className={styles.empty}>No habits yet — add one above.</div>}
        </div>
      )}
    </div>
  );
}

// ── NOTES PANEL ───────────────────────────────────────────────────────────────
function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ title: '', body: '', color: NOTE_COLORS[0] });

  const load = useCallback(async () => {
    setLoading(true);
    setNotes(await api('/api/notes'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim()) return;
    await api('/api/notes', { method: 'POST', body: JSON.stringify(form) });
    setForm({ title: '', body: '', color: NOTE_COLORS[0] });
    setAdding(false);
    load();
  };

  const pin = async (note: Note) => {
    await api('/api/notes', { method: 'PATCH', body: JSON.stringify({ id: note.id, pinned: !note.pinned }) });
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n));
  };

  const save = async () => {
    if (!editing) return;
    await api('/api/notes', { method: 'PATCH', body: JSON.stringify({ id: editing.id, title: editing.title, body: editing.body }) });
    setNotes(prev => prev.map(n => n.id === editing.id ? editing : n));
    setEditing(null);
  };

  const remove = async (id: number) => {
    await api('/api/notes', { method: 'DELETE', body: JSON.stringify({ id }) });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <StickyNote size={14} className={styles.panelIcon} />
        <span>Notes</span>
        <span className={styles.badge}>{notes.length}</span>
        <button className={styles.addBtn} onClick={() => setAdding(v => !v)}><Plus size={14} /></button>
      </div>

      {adding && (
        <div className={styles.addForm}>
          <input placeholder="Note title…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <textarea placeholder="Body…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} />
          <div className={styles.colorRow}>
            {NOTE_COLORS.map(c => (
              <button key={c} className={clsx(styles.colorSwatch, form.color === c && styles.colorSelected)}
                style={{ background: c }} onClick={() => setForm(f => ({ ...f, color: c }))} />
            ))}
          </div>
          <button className={styles.submitBtn} onClick={add}>Add Note</button>
        </div>
      )}

      {editing && (
        <Modal title="Edit Note" onClose={() => setEditing(null)}>
          <div className={styles.addForm}>
            <input value={editing.title} onChange={e => setEditing(n => n ? { ...n, title: e.target.value } : n)} />
            <textarea value={editing.body} onChange={e => setEditing(n => n ? { ...n, body: e.target.value } : n)} rows={6} />
            <button className={styles.submitBtn} onClick={save}>Save</button>
          </div>
        </Modal>
      )}

      {loading ? <Spinner /> : (
        <div className={styles.notesGrid}>
          {notes.map(n => (
            <div key={n.id} className={styles.noteCard} style={{ background: n.color + '18', borderColor: n.color + '44' }}>
              <div className={styles.noteHeader}>
                <span className={styles.noteTitle}>{n.title}</span>
                <div className={styles.noteActions}>
                  <button onClick={() => pin(n)} className={clsx(styles.iconBtn, n.pinned && styles.pinned)}><Pin size={11} /></button>
                  <button onClick={() => setEditing(n)} className={styles.iconBtn}><ChevronRight size={11} /></button>
                  <button onClick={() => remove(n.id)} className={styles.iconBtn}><Trash2 size={11} /></button>
                </div>
              </div>
              <p className={styles.noteBody}>{n.body}</p>
              <span className={styles.noteMeta}>{format(new Date(n.updated_at), 'MMM d, HH:mm')}</span>
            </div>
          ))}
          {notes.length === 0 && <div className={styles.empty}>No notes yet.</div>}
        </div>
      )}
    </div>
  );
}

// ── GOALS PANEL ───────────────────────────────────────────────────────────────
function GoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', target: 100, unit: '%', deadline: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setGoals(await api('/api/goals'));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim()) return;
    await api('/api/goals', { method: 'POST', body: JSON.stringify(form) });
    setForm({ title: '', target: 100, unit: '%', deadline: '' });
    setAdding(false);
    load();
  };

  const updateProgress = async (id: number, current: number) => {
    await api('/api/goals', { method: 'PATCH', body: JSON.stringify({ id, current }) });
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current } : g));
  };

  const remove = async (id: number) => {
    await api('/api/goals', { method: 'DELETE', body: JSON.stringify({ id }) });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <Target size={14} className={styles.panelIcon} />
        <span>Goals</span>
        <span className={styles.badge}>{goals.filter(g => g.current >= g.target).length}/{goals.length} done</span>
        <button className={styles.addBtn} onClick={() => setAdding(v => !v)}><Plus size={14} /></button>
      </div>

      {adding && (
        <div className={styles.addForm}>
          <input placeholder="Goal title…" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label>Target</label>
              <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: +e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Unit</label>
              <input placeholder="%, km, hrs…" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>
          <button className={styles.submitBtn} onClick={add}>Add Goal</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className={styles.goalsList}>
          {goals.map(g => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const done = g.current >= g.target;
            return (
              <div key={g.id} className={clsx(styles.goalCard, done && styles.goalDone)}>
                <div className={styles.goalHeader}>
                  <span className={styles.goalTitle}>{done ? '✓ ' : ''}{g.title}</span>
                  <span className={styles.goalMeta}>{g.current} / {g.target} {g.unit}</span>
                  <button className={styles.deleteBtn} onClick={() => remove(g.id)}><Trash2 size={11} /></button>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${pct}%`, background: done ? '#c8f03a' : '#f0a83a' }} />
                </div>
                <div className={styles.goalControls}>
                  <button className={styles.progressBtn} onClick={() => updateProgress(g.id, Math.max(0, g.current - Math.ceil(g.target / 10)))}>−</button>
                  <span className={styles.pct}>{pct}%</span>
                  <button className={styles.progressBtn} onClick={() => updateProgress(g.id, Math.min(g.target, g.current + Math.ceil(g.target / 10)))}>+</button>
                </div>
              </div>
            );
          })}
          {goals.length === 0 && <div className={styles.empty}>No goals yet.</div>}
        </div>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className={styles.spinner}>
      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [inited, setInited] = useState(false);
  const [tab, setTab] = useState<'tasks' | 'habits' | 'notes' | 'goals'>('tasks');

  useEffect(() => {
    fetch('/api/init').then(() => setInited(true));
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>◈</div>
          <div>
            <div className={styles.greeting}>{greeting}.</div>
            <div className={styles.date}>{format(now, 'EEEE, MMMM d yyyy')}</div>
          </div>
        </div>
        <div className={styles.statusDot} title={inited ? 'DB connected' : 'Connecting…'} style={{ background: inited ? '#c8f03a' : '#f0a83a' }} />
      </header>

      {/* Nav */}
      <nav className={styles.nav}>
        {([
          { key: 'tasks', icon: <CheckSquare size={13} />, label: 'Tasks' },
          { key: 'habits', icon: <Repeat size={13} />, label: 'Habits' },
          { key: 'notes', icon: <StickyNote size={13} />, label: 'Notes' },
          { key: 'goals', icon: <Target size={13} />, label: 'Goals' },
        ] as const).map(({ key, icon, label }) => (
          <button key={key} className={clsx(styles.navBtn, tab === key && styles.navActive)} onClick={() => setTab(key)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className={styles.content}>
        {!inited && (
          <div className={styles.initBanner}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Initialising database…
          </div>
        )}
        {tab === 'tasks' && <TasksPanel />}
        {tab === 'habits' && <HabitsPanel />}
        {tab === 'notes' && <NotesPanel />}
        {tab === 'goals' && <GoalsPanel />}
      </main>
    </div>
  );
}
