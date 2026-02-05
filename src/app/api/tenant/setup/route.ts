import { ensureUserTenant } from '@/lib/tenant-setup';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const userId = body.userId || user.id;
    const email = body.email || user.email;

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing user information' }, { status: 400 });
    }

    const tenant = await ensureUserTenant(userId, email);

    return NextResponse.json({ tenantId: tenant.id });
  } catch (error) {
    console.error('Tenant setup error:', error);
    return NextResponse.json({ error: 'Failed to setup tenant' }, { status: 500 });
  }
}
