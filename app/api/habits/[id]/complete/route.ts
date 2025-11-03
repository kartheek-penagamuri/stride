import { NextRequest, NextResponse } from 'next/server'

// POST /api/habits/[id]/complete - Mark a habit as completed for today
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // This is where you'd typically update the database
    // Check if already completed today
    // Update streak, completion date, etc.

    const updatedHabit = {
      id: parseInt(id),
      completedToday: true,
      streak: 8, // Increment streak
      lastCompleted: today,
      totalCompletions: 15
    }

    return NextResponse.json({ 
      message: 'Habit marked as completed!',
      habit: updatedHabit 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete habit' },
      { status: 500 }
    )
  }
}