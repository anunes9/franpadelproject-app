import { NextResponse } from 'next/server'

/**
 * Route handler for Chrome DevTools configuration
 * This prevents 404 errors in the console when Chrome DevTools tries to fetch this file
 */
export async function GET() {
  return NextResponse.json({}, { status: 200 })
}
