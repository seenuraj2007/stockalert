import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { PermissionsService } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  
  return NextResponse.json({
    user: user,
    isOwner: user ? PermissionsService.isOwner(user) : null,
    rawRole: user?.role,
    roleType: typeof user?.role,
    canAccess: {
      subscription: user ? PermissionsService.hasPermission(user, 'settings', 'update') : false
    }
  })
}
