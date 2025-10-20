import { NextRequest, NextResponse } from 'next/server'
import { SprintTemplateService } from '@/lib/services/sprint-template-service'
import { ApiResponse, SprintType } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let templates
    if (type) {
      templates = await SprintTemplateService.getTemplatesByType(type as SprintType)
    } else {
      templates = await SprintTemplateService.getActiveTemplates()
    }

    const response: ApiResponse = {
      success: true,
      data: templates
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching sprint templates:', error)
    
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch sprint templates'
      }
    }

    return NextResponse.json(response, { status: 500 })
  }
}