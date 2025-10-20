import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sessionService } from '@/lib/services/session-service'
import { z } from 'zod'

const attendanceSchema = z.object({
  attended: z.boolean(),
  joinedAt: z.string().datetime().optional(),
  leftAt: z.string().datetime().optional()
})

interface RouteParams {
  params: Promise<{
    sessionId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = attendanceSchema.parse(body)

    const { sessionId } = await params
    await sessionService.markAttendance(
      sessionId,
      session.user.id,
      validatedData.attended,
      validatedData.joinedAt ? new Date(validatedData.joinedAt) : undefined,
      validatedData.leftAt ? new Date(validatedData.leftAt) : undefined
    )

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully'
    })
  } catch (error) {
    console.error('Error marking attendance:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to mark attendance'
        }
      },
      { status: 500 }
    )
  }
}