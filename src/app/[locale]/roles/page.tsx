'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Plus, Edit, Trash2, X, Check, Users, ChevronRight, Settings } from 'lucide-react'
import SidebarLayout from '@/components/SidebarLayout'

interface Role {
  id: string
  name: string
  permissions: Record<string, Record<string, boolean>>
  isDefault: boolean
  _count: {
    members: number
  }
  createdAt: string
}

const PERMISSION_MODULES = [
  { key: 'products', label: 'Products', actions: ['create', 'read', 'update', 'delete', 'stock_update'] },
  { key: 'sales', label: 'Sales', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'customers', label: 'Customers', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'suppliers', label: 'Suppliers', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'purchase_orders', label: 'Purchase Orders', actions: ['create', 'read', 'update', 'delete', 'receive'] },
  { key: 'stock_transfers', label: 'Stock Transfers', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'stock_takes', label: 'Stock Takes', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'locations', label: 'Locations', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'billing', label: 'Billing / POS', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'invoices', label: 'Invoices', actions: ['create', 'read', 'update', 'delete'] },
  { key: 'reports', label: 'Reports', actions: ['read', 'export'] },
  { key: 'analytics', label: 'Analytics', actions: ['read'] },
  { key: 'alerts', label: 'Alerts', actions: ['read', 'update'] },
  { key: 'users', label: 'User Management', actions: ['create', 'read', 'update', 'delete'] },
]

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    isDefault: false,
    permissions: PERMISSION_MODULES.reduce((acc, mod) => {
      acc[mod.key] = mod.actions.reduce((a, action) => {
        a[action] = false
        return a
      }, {} as Record<string, boolean>)
      return acc
    }, {} as Record<string, Record<string, boolean>>)
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save role')
      }

      setShowForm(false)
      setEditingRole(null)
      resetForm()
      fetchRoles()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      isDefault: role.isDefault,
      permissions: role.permissions as Record<string, Record<string, boolean>>
    })
    setShowForm(true)
  }

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete role')
      }

      fetchRoles()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      isDefault: false,
      permissions: PERMISSION_MODULES.reduce((acc, mod) => {
        acc[mod.key] = mod.actions.reduce((a, action) => {
          a[action] = false
          return a
        }, {} as Record<string, boolean>)
        return acc
      }, {} as Record<string, Record<string, boolean>>)
    })
  }

  const togglePermission = (moduleKey: string, action: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: {
          ...prev.permissions[moduleKey],
          [action]: !prev.permissions[moduleKey]?.[action]
        }
      }
    }))
  }

  const toggleAllInModule = (moduleKey: string, enabled: boolean) => {
    const module = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!module) return

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleKey]: module.actions.reduce((a, action) => {
          a[action] = enabled
          return a
        }, {} as Record<string, boolean>)
      }
    }))
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Create',
      read: 'Read',
      update: 'Edit',
      delete: 'Delete',
      stock_update: 'Stock Update',
      receive: 'Receive',
      export: 'Export',
    }
    return labels[action] || action
  }

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-600 mt-1">Create and manage custom roles with specific permissions</p>
          </div>
          <button
            onClick={() => {
              setEditingRole(null)
              resetForm()
              setShowForm(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Role
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Roles List */}
        <div className="grid gap-4">
          {roles.map(role => (
            <div
              key={role.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.isDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {role._count.members} member(s) assigned
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(role)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={role._count.members > 0}
                    title={role._count.members > 0 ? 'Cannot delete role with members' : 'Delete role'}
                  >
                    <Trash2 className={`w-5 h-5 ${role._count.members > 0 ? 'opacity-30' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Permission Summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(role.permissions as Record<string, Record<string, boolean>>).map(([modKey, actions]) => {
                  const enabledActions = Object.entries(actions).filter(([, v]) => v)
                  if (enabledActions.length === 0) return null
                  const mod = PERMISSION_MODULES.find(m => m.key === modKey)
                  return (
                    <span
                      key={modKey}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                    >
                      {mod?.label}: {enabledActions.map(([a]) => getActionLabel(a)).join(', ')}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No custom roles yet</p>
              <p className="text-sm text-gray-400">Create your first role to get started</p>
            </div>
          )}
        </div>

        {/* Create/Edit Role Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingRole(null)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-6">
                  {/* Role Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Sales Manager, Warehouse Staff"
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>

                  {/* Set as Default */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                      Set as default role for new team members
                    </label>
                  </div>

                  {/* Permissions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        Permissions
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allFalse = Object.values(formData.permissions).every(
                            mod => Object.values(mod).every(v => !v)
                          )
                          if (allFalse) {
                            setFormData(prev => ({
                              ...prev,
                              permissions: PERMISSION_MODULES.reduce((acc, mod) => {
                                acc[mod.key] = mod.actions.reduce((a, action) => {
                                  a[action] = true
                                  return a
                                }, {} as Record<string, boolean>)
                                return acc
                              }, {} as Record<string, Record<string, boolean>>)
                            }))
                          } else {
                            resetForm()
                          }
                        }}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        Select All / Clear All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {PERMISSION_MODULES.map(module => (
                        <div key={module.key} className="border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`${module.key}-all`}
                                checked={module.actions.every(a => formData.permissions[module.key]?.[a])}
                                onChange={(e) => toggleAllInModule(module.key, e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor={`${module.key}-all`} className="font-medium text-gray-900">
                                {module.label}
                              </label>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3 ml-6">
                            {module.actions.map(action => (
                              <label
                                key={action}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permissions[module.key]?.[action] || false}
                                  onChange={() => togglePermission(module.key, action)}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-600">
                                  {getActionLabel(action)}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingRole(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {editingRole ? 'Update Role' : 'Create Role'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
