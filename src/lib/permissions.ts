import { prisma } from '@/lib/prisma'

export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER'

export interface UserWithPermissions {
  id: string
  email: string | null
  username: string | null
  full_name: string | null
  organization_id: string | null
  role: UserRole | null
  roleId?: string | null
  rolePermissions?: Record<string, Record<string, boolean>>
  status: string | null
  created_at: string
}

export interface AuthUser {
  id: string
  email: string | null
  username: string | null
  displayName: string | null
  tenantId: string
  metadata: Record<string, any>
  created_at: string
  full_name: string | null
  organization_id: string | null
  role: UserRole | null
  roleId: string | null
  rolePermissions?: Record<string, Record<string, boolean>>
  status: string | null
  emailVerified: boolean
  permissions?: Record<string, any>
}

export interface Permission {
  resource: string
  action: string
  allowed: boolean
}

// Owner has all permissions
const OWNER_PERMISSIONS: Permission[] = [
  { resource: 'users', action: 'create', allowed: true },
  { resource: 'users', action: 'read', allowed: true },
  { resource: 'users', action: 'update', allowed: true },
  { resource: 'users', action: 'delete', allowed: true },
  { resource: 'roles', action: 'create', allowed: true },
  { resource: 'roles', action: 'read', allowed: true },
  { resource: 'roles', action: 'update', allowed: true },
  { resource: 'roles', action: 'delete', allowed: true },
  { resource: 'products', action: 'create', allowed: true },
  { resource: 'products', action: 'read', allowed: true },
  { resource: 'products', action: 'update', allowed: true },
  { resource: 'products', action: 'delete', allowed: true },
  { resource: 'products', action: 'stock_update', allowed: true },
  { resource: 'sales', action: 'create', allowed: true },
  { resource: 'sales', action: 'read', allowed: true },
  { resource: 'sales', action: 'update', allowed: true },
  { resource: 'sales', action: 'delete', allowed: true },
  { resource: 'customers', action: 'create', allowed: true },
  { resource: 'customers', action: 'read', allowed: true },
  { resource: 'customers', action: 'update', allowed: true },
  { resource: 'customers', action: 'delete', allowed: true },
  { resource: 'suppliers', action: 'create', allowed: true },
  { resource: 'suppliers', action: 'read', allowed: true },
  { resource: 'suppliers', action: 'update', allowed: true },
  { resource: 'suppliers', action: 'delete', allowed: true },
  { resource: 'purchase_orders', action: 'create', allowed: true },
  { resource: 'purchase_orders', action: 'read', allowed: true },
  { resource: 'purchase_orders', action: 'update', allowed: true },
  { resource: 'purchase_orders', action: 'delete', allowed: true },
  { resource: 'purchase_orders', action: 'receive', allowed: true },
  { resource: 'stock_transfers', action: 'create', allowed: true },
  { resource: 'stock_transfers', action: 'read', allowed: true },
  { resource: 'stock_transfers', action: 'update', allowed: true },
  { resource: 'stock_transfers', action: 'delete', allowed: true },
  { resource: 'stock_takes', action: 'create', allowed: true },
  { resource: 'stock_takes', action: 'read', allowed: true },
  { resource: 'stock_takes', action: 'update', allowed: true },
  { resource: 'stock_takes', action: 'delete', allowed: true },
  { resource: 'locations', action: 'create', allowed: true },
  { resource: 'locations', action: 'read', allowed: true },
  { resource: 'locations', action: 'update', allowed: true },
  { resource: 'locations', action: 'delete', allowed: true },
  { resource: 'reports', action: 'read', allowed: true },
  { resource: 'reports', action: 'export', allowed: true },
  { resource: 'analytics', action: 'read', allowed: true },
  { resource: 'alerts', action: 'read', allowed: true },
  { resource: 'alerts', action: 'update', allowed: true },
  { resource: 'settings', action: 'update', allowed: true },
]

export type AuthUserType = UserWithPermissions | AuthUser

export class PermissionsService {
  /**
   * Check if user has permission to perform action on resource
   */
  static async hasPermission(user: AuthUserType | null, resource: string, action: string): Promise<boolean> {
    if (!user) return false
    
    // Owners have all permissions
    if (user.role === 'OWNER') {
      return true
    }

    // If user has custom role with permissions, check those
    if (user.roleId && user.rolePermissions) {
      const resourcePermissions = user.rolePermissions[resource]
      if (resourcePermissions) {
        return resourcePermissions[action] || false
      }
      return false
    }

    // Fallback: check old enum-based roles
    return this.hasStaticPermission(user, resource, action)
  }

  /**
   * Check static permissions for old enum-based roles
   */
  static hasStaticPermission(user: AuthUserType | null, resource: string, action: string): boolean {
    if (!user) return false

    // Default to false for non-owners without custom roles
    return false
  }

  /**
   * Check if user can manage other users
   */
  static async canManageUsers(user: AuthUserType | null): Promise<boolean> {
    const create = await this.hasPermission(user, 'users', 'create')
    const update = await this.hasPermission(user, 'users', 'update')
    const deletePerm = await this.hasPermission(user, 'users', 'delete')
    return create && update && deletePerm
  }
  
  /**
   * Check if user can perform destructive actions (delete)
   */
  static async canDelete(user: AuthUserType | null, resource: string): Promise<boolean> {
    return await this.hasPermission(user, resource, 'delete')
  }
  
  /**
   * Check if user can perform updates
   */
  static async canUpdate(user: AuthUserType | null, resource: string): Promise<boolean> {
    return await this.hasPermission(user, resource, 'update')
  }
  
  /**
   * Check if user can create resources
   */
  static async canCreate(user: AuthUserType | null, resource: string): Promise<boolean> {
    return await this.hasPermission(user, resource, 'create')
  }
  
  /**
   * Check if user can export reports
   */
  static async canExportReports(user: AuthUserType | null): Promise<boolean> {
    return await this.hasPermission(user, 'reports', 'export')
  }

  /**
   * Get all permissions for a user role
   */
  static async getPermissions(user: AuthUserType | null): Promise<Permission[]> {
    if (!user) return []
    
    if (user.role === 'OWNER') {
      return OWNER_PERMISSIONS
    }

    if (user.roleId && user.rolePermissions) {
      const permissions: Permission[] = []
      for (const [resource, actions] of Object.entries(user.rolePermissions)) {
        for (const [action, allowed] of Object.entries(actions)) {
          permissions.push({ resource, action, allowed })
        }
      }
      return permissions
    }

    return []
  }
  
  /**
   * Check if user is owner
   */
  static isOwner(user: AuthUserType | null): boolean {
    return user?.role === 'OWNER'
  }
  
  /**
   * Check if user has admin-level access
   */
  static isAdmin(user: AuthUserType | null): boolean {
    return user?.role === 'OWNER' || user?.role === 'ADMIN'
  }
  
  /**
   * Validate that user is active and in organization
   */
  static isValidUser(user: AuthUserType | null): boolean {
    if (!user) return false
    return user.status === 'active' && user.organization_id !== null
  }

  /**
   * Load user with role permissions from database
   */
  static async loadUserPermissions(user: AuthUser): Promise<AuthUser> {
    if (!user.tenantId || !user.roleId) {
      return user
    }

    try {
      const role = await prisma.role.findFirst({
        where: { id: user.roleId, tenantId: user.tenantId }
      })

      if (role) {
        return {
          ...user,
          rolePermissions: role.permissions as Record<string, Record<string, boolean>>
        }
      }
    } catch (error) {
      console.error('Error loading role permissions:', error)
    }

    return user
  }
}
