import { NextRequest, NextResponse } from 'next/server'
import { SprintTemplateService } from '@/lib/services/sprint-template-service'
import { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const template = await SprintTemplateService.getTemplateById(id)

    if (!template) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Sprint template not found'
        }
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: ApiResponse = {
      success: true,
      data: template
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching sprint template:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch sprint template'
      }
    }

    return NextResponse.json(response, { status: 500 })
  }
}