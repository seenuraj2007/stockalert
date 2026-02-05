'use client';

import React from 'react';

export interface SessionUser {
  id: string;
  email: string;
  displayName?: string;
  tenantId?: string;
  metadata?: {
    tenantId?: string;
    [key: string]: any;
  };
}

export interface SessionData {
  user: SessionUser | null;
}

interface AuthResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

// Use current location for API calls (auto-detects port)
const API_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3004';

export default function createAuthClient() {
  return {
    signUp: {
      email: async ({ email, password, name }: { email: string; password: string; name?: string }): Promise<AuthResponse<{ user: SessionUser; session: any }>> => {
        try {
          const res = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: name }),
            credentials: 'include',
          });
          const data = await res.json();
          if (!res.ok) {
            return { data: null, error: { message: data.message || 'Signup failed', code: data.code } };
          }
          return { data, error: null };
        } catch (error) {
          return { data: null, error: { message: String(error) } };
        }
      }
    },
    signIn: {
      email: async ({ email, password }: { email: string; password: string }): Promise<AuthResponse<{ user: SessionUser; session: any }>> => {
        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });
          const data = await res.json();
          if (!res.ok) {
            return { data: null, error: { message: data.message || 'Login failed', code: data.code } };
          }
          return { data, error: null };
        } catch (error) {
          return { data: null, error: { message: String(error) } };
        }
      }
    },
    signOut: async (): Promise<AuthResponse<null>> => {
      try {
        const res = await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json();
          return { data: null, error: { message: data.message || 'Logout failed' } };
        }
        return { data: null, error: null };
      } catch (error) {
        return { data: null, error: { message: String(error) } };
      }
    },
    useSession: () => {
      const [session, setSession] = React.useState<SessionData>({ user: null });
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        console.log('[AUTH CLIENT] Fetching /api/auth/me...');
        fetch(`${API_URL}/api/auth/me`, { 
          method: 'GET', 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
          .then(async res => {
            console.log('[AUTH CLIENT] Response status:', res.status);
            const data = await res.json();
            console.log('[AUTH CLIENT] Response data:', JSON.stringify(data).substring(0, 200));
            if (data.user) {
              setSession({ user: data.user });
            }
          })
          .catch(err => {
            console.error('[AUTH CLIENT] Fetch error:', err);
          })
          .finally(() => setLoading(false));
      }, []);

      return { data: session, isPending: loading };
    }
  };
}

export const authClient = createAuthClient();
export const { signIn, signOut, signUp } = authClient;
export const useSession = authClient.useSession;

export function useCurrentTenant() {
  const { data: session } = useSession();
  return session?.user?.tenantId || null;
}
