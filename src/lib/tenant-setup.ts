import { prisma } from './prisma';
import { auth } from './auth';

export async function ensureUserTenant(userId: string, email: string) {
  const existing = await prisma.tenant.findFirst({
    where: { ownerId: userId }
  });

  if (existing) return existing;

  const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString(36);
  const tenant = await prisma.tenant.create({
    data: {
      name: email.split('@')[0] + "'s Business",
      slug,
      ownerId: userId,
      settings: {
        currency: 'USD',
        timezone: 'UTC',
      }
    }
  });

  const member = await prisma.member.create({
    data: {
      tenantId: tenant.id,
      userId,
      role: 'OWNER',
      status: 'ACTIVE',
    }
  });

  return tenant;
}

export async function getUserTenant(userId: string) {
  const member = await prisma.member.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: { tenant: true }
  });

  return member?.tenant || null;
}

export async function getUserRole(userId: string, tenantId: string) {
  const member = await prisma.member.findUnique({
    where: { tenantId_userId: { tenantId, userId } }
  });

  return member?.role || null;
}

export async function isTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
  const role = await getUserRole(userId, tenantId);
  return role === 'OWNER' || role === 'ADMIN';
}
