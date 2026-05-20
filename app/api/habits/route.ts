import { NextRequest, NextResponse } from 'next/server';
import { getHabits, createHabit, toggleHabitLog, deleteHabit } from '@/lib/db';

export async function GET() {
  try {
    const habits = await getHabits();
    return NextResponse.json(habits);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === 'toggle') {
      const result = await toggleHabitLog(body.habitId, body.date);
      return NextResponse.json(result);
    }
    const habit = await createHabit(body);
    return NextResponse.json(habit, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteHabit(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
