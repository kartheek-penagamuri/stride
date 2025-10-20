import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Test Redis connection
    await redis.ping()
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected'
        }
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'One or more services are unavailable',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }, { status: 503 })
  }
}