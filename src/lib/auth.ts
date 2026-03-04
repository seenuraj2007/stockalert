import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/permissions';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';

export type { UserRole };

export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  tenantId: string;
  metadata: Record<string, any>;
  created_at: string;
  full_name: string | null;
  organization_id: string | null;
  role: UserRole | null;
  status: string | null;
  emailVerified: boolean;
  roleId: string | null;
  permissions?: Record<string, any>;
}

// JWT configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production-min-32-chars'
);

const JWT_EXPIRY = '7d';

export interface JWTPayload {
  sub: string;
  email: string;
  tenantId?: string;
  iat: number;
  exp: number;
}

// Password hashing with bcrypt
const SALT_ROUNDS = 12;

// Legacy SHA256 hash function (for backward compatibility with old passwords)
async function legacyHashPassword(password: string): Promise<string> {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash;
}

// Check if hash is a legacy SHA256 hash (64 hex chars = 32 bytes)
function isLegacyHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash);
}

// Updated verifyPassword that handles both bcrypt and legacy SHA256
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // If the hash is a legacy SHA256 hash (not bcrypt), verify using legacy method
  if (isLegacyHash(hashedPassword)) {
    const legacyHash = await legacyHashPassword(password);
    return legacyHash === hashedPassword;
  }

  // Otherwise, use bcrypt for verification
  return bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// JWT Token functions
export async function createSessionToken(userId: string, email: string, tenantId?: string): Promise<string> {
  const token = await new SignJWT({ sub: userId, email, tenantId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      tenantId: payload.tenantId as string | undefined,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
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

export async function signIn(identifier: string, password: string): Promise<{ user: any; token: string } | null> {
  try {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    // Check if identifier is an email (contains @) or username
    const isEmail = normalizedIdentifier.includes('@');
    
    // Find user in database by email or username
    const user = isEmail 
      ? await prisma.user.findUnique({
          where: { email: normalizedIdentifier }
        })
      : await prisma.user.findUnique({
          where: { username: normalizedIdentifier }
        });

    if (!user) {
      console.log('[AUTH] Sign in failed: User not found for:', normalizedIdentifier);
      return null;
    }

    if (!user.passwordHash) {
      console.log('[AUTH] Sign in failed: User has no password hash (OAuth user?):', user.id);
      return null;
    }

    // Verify password using appropriate method (bcrypt or legacy SHA256)
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      console.log('[AUTH] Sign in failed: Invalid password for user:', user.id);
      return null;
    }

    // If user has legacy hash, upgrade to bcrypt on successful login
    if (isLegacyHash(user.passwordHash)) {
      console.log('[AUTH] Upgrading legacy password to bcrypt for user:', user.id);
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });
    }

    // Create JWT session token
    // Get the tenant ID from the member record
    const member = await prisma.member.findFirst({
      where: { userId: user.id }
    });
    const token = await createSessionToken(user.id, user.email || user.username, member?.tenantId);

    console.log('[AUTH] Sign in successful for user:', user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        created_at: user.createdAt?.toISOString() || new Date().toISOString(),
        emailVerified: user.emailVerified,
      },
      token
    };
  } catch (error) {
    console.error('[AUTH] Sign in error:', error);
    return null;
  }
}

export async function signUp(email: string, password: string, name?: string, username?: string): Promise<{ user: any; token: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = (username || email.split('@')[0]).toLowerCase().trim();

  console.log('[AUTH] SignUp attempt for email:', normalizedEmail, 'username:', normalizedUsername);

  try {
    // Check if user already exists by email or username
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUserByEmail) {
      console.log('[AUTH] SignUp failed: User already exists with email:', normalizedEmail);
      return null;
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (existingUserByUsername) {
      console.log('[AUTH] SignUp failed: User already exists with username:', normalizedUsername);
      return null;
    }

    // Hash password with bcrypt (new format)
    const passwordHash = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateVerificationToken();

    // Create user with both email and username
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        name: name?.trim() || null,
        passwordHash,
        emailVerified: false,
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });

    console.log('[AUTH] SignUp successful: Created user with ID:', user.id, 'email:', user.email, 'username:', user.username);

    // Create JWT session token
    // Get the tenant ID from the member record (user was just created, should have a member)
    const newMember = await prisma.member.findFirst({
      where: { userId: user.id }
    });
    const token = await createSessionToken(user.id, user.email || user.username, newMember?.tenantId);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        created_at: user.createdAt?.toISOString() || new Date().toISOString(),
        emailVerified: user.emailVerified,
        emailVerificationToken,
      },
      token
    };
  } catch (error: any) {
    // Check for unique constraint violation (race condition)
    if (error?.code === 'P2002') {
      console.log('[AUTH] SignUp failed: Unique constraint violation for email:', normalizedEmail, 'or username:', normalizedUsername);
      return null;
    }

    console.error('[AUTH] SignUp error for email:', normalizedEmail, 'Error:', error);
    return null;
  }
}

// Generate secure verification token
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// OAuth user creation/sign-in
export async function oauthSignIn(email: string, name: string | null, provider: string, providerAccountId: string, accessToken?: string, refreshToken?: string): Promise<{ user: any; token: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();

  console.log('[AUTH] OAuth sign in attempt:', { provider, providerAccountId, email: normalizedEmail });

  try {
    // Check if OAuth account already exists
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        }
      },
      include: { user: true }
    });

    if (existingOAuth) {
      // Update tokens
      await prisma.oAuthAccount.update({
        where: { id: existingOAuth.id },
        data: {
          accessToken,
          refreshToken,
        }
      });

      console.log('[AUTH] OAuth sign in: Found existing OAuth account, user ID:', existingOAuth.user.id);

      const token = await createSessionToken(existingOAuth.user.id, existingOAuth.user.email || existingOAuth.user.username, existingOAuth.user.tenantId || undefined);
      return {
        user: {
          id: existingOAuth.user.id,
          email: existingOAuth.user.email,
          username: existingOAuth.user.username,
          name: existingOAuth.user.name,
          created_at: existingOAuth.user.createdAt?.toISOString() || new Date().toISOString(),
          emailVerified: existingOAuth.user.emailVerified,
        },
        token
      };
    }

    // Find existing user by email
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // Create new user for OAuth
      console.log('[AUTH] OAuth sign in: Creating new user for email:', normalizedEmail);

      // Generate username from email (before @)
      const baseUsername = normalizedEmail.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      
      // Check if username exists and append number if needed
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          username,
          name: name || baseUsername,
          emailVerified: true, // OAuth providers verify email
          passwordHash: null, // No password for OAuth users
        }
      });
    } else if (!user.emailVerified) {
      // Mark email as verified if signing in with OAuth
      console.log('[AUTH] OAuth sign in: Marking existing user email as verified, ID:', user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true }
      });
    }

    // Create OAuth account link
    await prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId,
        accessToken,
        refreshToken,
      }
    });

    console.log('[AUTH] OAuth sign in successful: User ID:', user.id);

    // Create JWT session token
    // Get the tenant ID from the member record
    const oauthMember = await prisma.member.findFirst({
      where: { userId: user.id }
    });
    const token = await createSessionToken(user.id, user.email || user.username, oauthMember?.tenantId);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        created_at: user.createdAt?.toISOString() || new Date().toISOString(),
        emailVerified: true,
      },
      token
    };
  } catch (error: any) {
    // Check for unique constraint violation
    if (error?.code === 'P2002') {
      console.log('[AUTH] OAuth sign in: Unique constraint violation, retrying...', error?.meta);
      // Could be a race condition - try to find the user again
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      if (existingUser) {
        // Get the tenant ID from the member record
        const existingMember = await prisma.member.findFirst({
          where: { userId: existingUser.id }
        });
        const token = await createSessionToken(existingUser.id, existingUser.email || existingUser.username, existingMember?.tenantId);
        return {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            name: existingUser.name,
            created_at: existingUser.createdAt?.toISOString() || new Date().toISOString(),
            emailVerified: existingUser.emailVerified,
          },
          token
        };
      }
    }

    console.error('[AUTH] OAuth sign in error:', error);
    return null;
  }
}

export async function getCurrentUserId(req: Request): Promise<string | null> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;

    const decoded = await verifyToken(token);
    if (!decoded) return null;

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

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    // If tenantId is in token, use it
    if (decoded.tenantId) {
      return decoded.tenantId;
    }

    // Fallback: Get user's tenant from member table
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

    const decoded = await verifyToken(token);
    if (!decoded) return null;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) return null;

    // Get user's tenant and role - use tenantId from token if available, otherwise fallback to first member
    const tenantId = decoded.tenantId || null;
    
    let member = null;
    if (tenantId) {
      // Use tenant from token to get the correct member record
      member = await prisma.member.findFirst({
        where: { userId: user.id, tenantId }
      });
    }
    
    // Fallback: if no tenant in token or member not found, get first member
    if (!member) {
      member = await prisma.member.findFirst({
        where: { userId: user.id }
      });
    }

    // If no member or tenantId, user can't be authenticated for tenant-scoped operations
    if (!member?.tenantId) {
      return null;
    }

    // Get role permissions if member has a roleId
    let permissions: Record<string, any> = {};
    if (member.roleId) {
      const roleData = await prisma.role.findUnique({
        where: { id: member.roleId }
      });
      if (roleData?.permissions) {
        permissions = roleData.permissions as Record<string, any>;
      }
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.name,
      tenantId: member.tenantId,
      metadata: {},
      created_at: user.createdAt?.toISOString() || new Date().toISOString(),
      full_name: user.name,
      organization_id: member.tenantId,
      role: member.role,
      status: member.status,
      emailVerified: user.emailVerified || false,
      roleId: member.roleId,
      permissions,
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

// Email verification
export async function verifyEmail(token: string): Promise<boolean> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) return false;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }
    });

    return true;
  } catch {
    return false;
  }
}

// Password reset using the PasswordResetToken model
export async function initiatePasswordReset(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      console.log('[AUTH] Password reset: No user found for email:', normalizedEmail);
      return null;
    }

    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpires,
      }
    });

    console.log('[AUTH] Password reset token created for user:', user.id);

    return resetToken;
  } catch (error) {
    console.error('[AUTH] Password reset error:', error);
    return null;
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      }
    });

    if (!resetToken) return false;

    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    });

    console.log('[AUTH] Password reset successful for user:', resetToken.userId);

    return true;
  } catch (error) {
    console.error('[AUTH] Password reset error:', error);
    return false;
  }
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
  verifyEmail,
  initiatePasswordReset,
  resetPassword,
  hashPassword,
  verifyPassword,
  oauthSignIn,
};
