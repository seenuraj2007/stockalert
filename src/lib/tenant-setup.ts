import { prisma } from './prisma';
import { auth } from './auth';

const DEFAULT_PERMISSIONS = {
  products: { create: true, read: true, update: true, delete: true, stock_update: true },
  sales: { create: true, read: true, update: true, delete: true },
  customers: { create: true, read: true, update: true, delete: true },
  suppliers: { create: true, read: true, update: true, delete: true },
  purchase_orders: { create: true, read: true, update: true, delete: true, receive: true },
  stock_transfers: { create: true, read: true, update: true, delete: true },
  stock_takes: { create: true, read: true, update: true, delete: true },
  locations: { create: true, read: true, update: true, delete: true },
  reports: { read: true, export: true },
  analytics: { read: true },
  alerts: { read: true, update: true },
  users: { create: true, read: true, update: true, delete: true },
}

const VIEWER_PERMISSIONS = {
  products: { create: false, read: true, update: false, delete: false, stock_update: false },
  sales: { create: false, read: true, update: false, delete: false },
  customers: { create: false, read: true, update: false, delete: false },
  suppliers: { create: false, read: true, update: false, delete: false },
  purchase_orders: { create: false, read: true, update: false, delete: false, receive: false },
  stock_transfers: { create: false, read: true, update: false, delete: false },
  stock_takes: { create: false, read: true, update: false, delete: false },
  locations: { create: false, read: true, update: false, delete: false },
  reports: { read: true, export: false },
  analytics: { read: true },
  alerts: { read: true, update: false },
  users: { create: false, read: false, update: false, delete: false },
}

export async function ensureUserTenant(userId: string, email: string) {
  // Check if user already has a tenant through member relationship
  const existingMember = await prisma.member.findFirst({
    where: { userId },
    include: { tenant: true }
  });

  if (existingMember?.tenant) return existingMember.tenant;

  const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString(36);
  const tenant = await prisma.tenant.create({
    data: {
      name: email.split('@')[0] + "'s Business",
      slug
    }
  });

  // Create default roles for the tenant
  await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Admin',
      permissions: DEFAULT_PERMISSIONS,
      isDefault: true
    }
  });

  await prisma.role.create({
    data: {
      tenantId: tenant.id,
      name: 'Viewer',
      permissions: VIEWER_PERMISSIONS,
      isDefault: false
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
