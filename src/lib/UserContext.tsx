'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface UserPermissions {
  products?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean; stock_update?: boolean }
  sales?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  customers?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  suppliers?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  purchase_orders?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean; receive?: boolean }
  stock_transfers?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  stock_takes?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  locations?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  reports?: { read?: boolean; export?: boolean }
  analytics?: { read?: boolean }
  alerts?: { read?: boolean; update?: boolean }
  users?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  invoices?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  billing?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  team?: { create?: boolean; read?: boolean; update?: boolean; delete?: boolean }
  settings?: { read?: boolean; update?: boolean }
  profile?: { read?: boolean; update?: boolean }
}

export interface UserData {
  id: string
  email: string | null
  username: string | null
  displayName: string | null
  full_name: string | null
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER' | null
  roleId: string | null
  tenantId: string | null
  status: string | null
  emailVerified: boolean
  permissions: UserPermissions
}

interface UserContextType {
  user: UserData | null
  loading: boolean
  error: string | null
  refetchUser: () => Promise<void>
  hasPermission: (resource: string, action: string) => boolean
  canAccessPage: (page: string) => boolean
  isReady: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const STORAGE_KEY = 'stockalert_user_permissions'

// Map page routes to permission resources
const PAGE_PERMISSION_MAP: Record<string, string> = {
  'dashboard': 'reports',
  'products': 'products',
  'locations': 'locations',
  'suppliers': 'suppliers',
  'customers': 'customers',
  'purchase-orders': 'purchase_orders',
  'stock-transfers': 'stock_transfers',
  'stock-takes': 'stock_takes',
  'alerts': 'alerts',
  'analytics': 'analytics',
  'reports': 'reports',
  'invoices': 'invoices',
  'billing': 'billing',
  'team': 'users',
  'roles': 'users',
  'settings': 'settings',
  'profile': 'profile',
}

// Load cached permissions from localStorage
function loadCachedPermissions(): UserData | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error('Error loading cached permissions:', e)
  }
  return null
}

// Save permissions to localStorage
function saveCachedPermissions(user: UserData) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (e) {
    console.error('Error saving cached permissions:', e)
  }
}

// Clear cached permissions
function clearCachedPermissions() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Error clearing cached permissions:', e)
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  // Initialize with cached data to prevent empty sidebar flash
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load cached data on mount
  useEffect(() => {
    const cached = loadCachedPermissions()
    if (cached) {
      setUser(cached)
    }
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        // Add cache-busting to prevent stale data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setError(null)
        // Cache the user data
        if (data.user) {
          saveCachedPermissions(data.user)
        }
      } else if (response.status === 401) {
        // User not logged in
        setUser(null)
        clearCachedPermissions()
      } else {
        throw new Error('Failed to fetch user')
      }
    } catch (err) {
      console.error('Error fetching user:', err)
      setError('Failed to fetch user data')
      // Keep cached data on error
    } finally {
      setLoading(false)
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // Refetch user data when window gains focus (in case permissions changed)
  useEffect(() => {
    const handleFocus = () => {
      fetchUser()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchUser])

  const hasPermission = useCallback((resource: string, action: string): boolean => {
    // OWNER always has full permissions
    if (user?.role === 'OWNER') return true

    const permissions = user?.permissions || {}
    const resourcePerms = permissions[resource as keyof UserPermissions] as Record<string, boolean> | undefined
    
    if (!resourcePerms) return false
    
    return resourcePerms[action] === true
  }, [user])

  const canAccessPage = useCallback((page: string): boolean => {
    // OWNER always has access
    if (user?.role === 'OWNER') return true

    const resource = PAGE_PERMISSION_MAP[page]
    if (!resource) return true // Allow access if no mapping exists

    // Check read permission for the resource
    return hasPermission(resource, 'read')
  }, [user, hasPermission])

  const value: UserContextType = {
    user,
    loading,
    error,
    refetchUser: fetchUser,
    hasPermission,
    canAccessPage,
    isReady,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export function usePermissions() {
  const { hasPermission, canAccessPage, user, loading, isReady } = useUser()
  
  return {
    hasPermission,
    canAccessPage,
    isOwner: user?.role === 'OWNER',
    permissions: user?.permissions || {},
    loading,
    isReady,
  }
}
