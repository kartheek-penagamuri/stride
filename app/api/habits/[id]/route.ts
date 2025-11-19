import { NextRequest, NextResponse } from 'next/server'

// GET /api/habits/[id] - Get a specific habit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // This is where you'd typically fetch from a database
    const habit = {
      id: parseInt(id),
      title: "Morning Water",
      description: "Drink a glass of water after waking up",
      streak: 7,
      category: "health",
      completedDates: [
        "2024-11-01",
        "2024-11-02",
        "2024-11-03"
      ]
    }

    if (!habit) {
      return NextResponse.json(
        { error: 'Habit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ habit })
  } catch (error) {
    console.error('Failed to fetch habit:', error)
    return NextResponse.json(
      { error: 'Failed to fetch habit' },
      { status: 500 }
    )
  }
}

// PUT /api/habits/[id] - Update a habit
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { title, description, category } = body

    // This is where you'd typically update in a database
    const updatedHabit = {
      id: parseInt(id),
      title,
      description,
      category,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({ habit: updatedHabit })
  } catch (error) {
    console.error('Failed to update habit:', error)
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    )
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    // This is where you'd typically delete from a database
    // await deleteHabitFromDatabase(id)

    return NextResponse.json({ message: `Habit ${id} deleted successfully` })
  } catch (error) {
    console.error('Failed to delete habit:', error)
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    )
  }
}
