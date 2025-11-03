import { NextRequest, NextResponse } from 'next/server'

// GET /api/habits - Get all habits
export async function GET() {
  try {
    // This is where you'd typically fetch from a database
    const habits = [
      {
        id: 1,
        title: "Morning Water",
        description: "Drink a glass of water after waking up",
        streak: 7,
        category: "health"
      },
      {
        id: 2,
        title: "Daily Reading",
        description: "Read for 20 minutes every evening",
        streak: 3,
        category: "learning"
      }
    ]

    return NextResponse.json({ habits })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    )
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category } = body

    // Validate input
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // This is where you'd typically save to a database
    const newHabit = {
      id: Date.now(), // In real app, use proper ID generation
      title,
      description,
      category: category || 'general',
      streak: 0,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({ habit: newHabit }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}