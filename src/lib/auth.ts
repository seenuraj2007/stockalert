import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { UserRole } from '@/lib/permissions';

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  tenantId: string | null;
  metadata: Record<string, any>;
  created_at: string;
  full_name: string | null;
  organization_id: string | null;
  role: UserRole | null;
  status: string | null;
}

// Simple hash function for password verification
async function hashPassword(password: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === storedHash;
}

function getTokenFromRequest(req: Request): string | null {
  // Try Authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // Fall back to cookie
  const cookieHeader = req.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
  if (tokenMatch) {
    return tokenMatch[1];
  }
  return null;
}

// Create a simple session token (in production, use proper JWT with HMAC)
function createSessionToken(userId: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    email,
    iat: Date.now(),
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  })).toString('base64');
  return payload;
}

function decodeToken(token: string): Record<string, any> | null {
  try {
    // Check if token needs URL decoding
    let decodedStr = token;
    if (token.includes('%')) {
      decodedStr = decodeURIComponent(token);
    }
    
    // Try standard base64 first, then URL-safe
    try {
      const decoded = Buffer.from(decodedStr, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      // Replace - with + and _ with / for URL-safe base64
      const urlSafeStr = decodedStr.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = Buffer.from(urlSafeStr, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    }
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<{ user: any; token: string } | null> {
  try {
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return null;
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash || '');
    
    if (!passwordValid) {
      return null;
    }

    // Create session token
    const token = createSessionToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      token
    };
  } catch {
    return null;
  }
}

export async function signUp(email: string, password: string, name?: string): Promise<{ user: any; token: string } | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return null;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        emailVerified: false,
      }
    });

    // Create session token
    const token = createSessionToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      token
    };
  } catch {
    return null;
  }
}

export async function getCurrentUserId(req: Request): Promise<string | null> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) return null;

    // Check if token is expired
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    return user ? decoded.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentTenantId(req: Request): Promise<string | null> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) return null;

    // Get user's tenant from member table
    const member = await prisma.member.findFirst({
      where: { userId: decoded.sub }
    });

    return member?.tenantId || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;

    const decoded = decodeToken(token);
    if (!decoded) return null;

    // Check if token is expired
    if (decoded.exp && Date.now() > decoded.exp) {
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) return null;

    // Get user's tenant
    const member = await prisma.member.findFirst({
      where: { userId: user.id }
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.name,
      tenantId: member?.tenantId || null,
      metadata: {},
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      full_name: user.name,
      organization_id: member?.tenantId || null,
      role: member?.role || null,
      status: member?.status || null,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req: Request): Promise<{ userId: string; tenantId: string }> {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    throw new Error('Unauthorized: No valid session');
  }

  const tenantId = await getCurrentTenantId(req);
  if (!tenantId) {
    throw new Error('Unauthorized: No tenant associated with user');
  }

  return { userId, tenantId };
}

export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  return getCurrentUser(req);
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw new Error('Unauthorized: No valid user session');
  }
  return user;
}

export async function getTenantId(req: Request): Promise<string | null> {
  return getCurrentTenantId(req);
}

// Export for use in other modules
export const auth = {
  signIn,
  signUp,
  getCurrentUser,
  getCurrentUserId,
  getCurrentTenantId,
  getUserFromRequest,
  requireAuth,
  requireUser,
  getTenantId,
};
