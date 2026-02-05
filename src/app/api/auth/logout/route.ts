import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // Clear all auth cookies
    const response = NextResponse.json({ success: true }, { status: 200 })
    
    // Delete auth tokens
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('auth_token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Even on error, return success to prevent stuck sessions
    const response = NextResponse.json({ success: true }, { status: 200 })
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('auth_token')
    return response
  }
}
