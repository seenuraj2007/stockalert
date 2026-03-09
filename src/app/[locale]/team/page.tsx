'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Mail, Shield, MoreVertical, X, RefreshCw, Lock, ChevronRight, Settings } from 'lucide-react'
import { SubscriptionGate } from '@/components/SubscriptionGate'
import { useUpgradeToast } from '@/components/UpgradeNotification'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

interface Role {
  id: string
  name: string
  isDefault: boolean
}

interface TeamMember {
  id: string
  userId: string
  username: string
  email: string | null
  full_name: string | null
  role: string
  roleId: string | null
  roleName: string
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED'
  created_at: string
}

export default function TeamPage() {
  const router = useRouter()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteMember, setDeleteMember] = useState<TeamMember | null>(null)
  const { showLimitReached, showPermissionDenied } = useUpgradeToast()

  const [createForm, setCreateForm] = useState<{
    username: string
    password: string
    full_name: string
    roleId: string
  }>({
    username: '',
    password: '',
    full_name: '',
    roleId: ''
  })

  useEffect(() => {
    fetchTeam()
    fetchRoles()
  }, [])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/team?nocache=' + Date.now(), {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const data = await res.json()
      if (res.ok) {
        setTeam(data.team)
      }
    } catch (err) {
      console.error('Error fetching team:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles', {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setRoles(data.roles)
        // Set default role if available, otherwise first role
        const defaultRole = data.roles.find((r: Role) => r.isDefault) || data.roles[0]
        if (defaultRole && !createForm.roleId) {
          setCreateForm(prev => ({ ...prev, roleId: defaultRole.id }))
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          if (data.error?.includes('Permission denied')) {
            showPermissionDenied(data.error)
          }
          if (data.error?.includes('limit')) {
            showLimitReached('team_members', data.current, data.limit)
          }
        }
        throw new Error(data.error || 'Failed to create user')
      }

      setSuccessMessage(`User created: ${createForm.username}`)
      setCreateForm({ username: '', password: '', full_name: '', roleId: roles[0]?.id || '' })
      setShowCreateForm(false)
      fetchTeam()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      console.log('Removing member:', memberId)
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Response data:', data)

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      // Optimistically update the team state by removing the deleted member
      setTeam(prevTeam => prevTeam.filter(member => member.id !== memberId))
      fetchTeam()
      alert('Member removed successfully')
    } catch (err: any) {
      console.error('Error removing member:', err)
      alert('Error: ' + err.message)
    }
  }

  const getRoleBadge = (role: TeamMember['role'], roleName?: string) => {
    const colors: Record<string, string> = {
      OWNER: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[role] || 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'}`}>
        {roleName || role}
      </span>
    )
  }

  const getStatusBadge = (status: TeamMember['status']) => {
    const colors: Record<TeamMember['status'], string> = {
      ACTIVE: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200',
      INVITED: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200',
      SUSPENDED: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
    }
    const label = status?.charAt(0) + status?.slice(1).toLowerCase()
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.ACTIVE}`}>
        {label}
      </span>
    )
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
            <h1 className="text-3xl font-bold text-gray-900">Team Members <span className="text-xs text-red-500">v2</span></h1>
            <p className="text-gray-600 mt-1">Manage your team and their access</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/roles"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Manage Roles
            </Link>
            <button
              onClick={() => {
                // Ensure roleId is set before opening modal
                if (roles.length > 0 && !createForm.roleId) {
                  const defaultRole = roles.find(r => r.isDefault) || roles[0]
                  setCreateForm(prev => ({ ...prev, roleId: defaultRole.id }))
                }
                setShowCreateForm(true)
              }}
              disabled={roles.length === 0}
              title={roles.length === 0 ? 'Create roles first before adding members' : ''}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-500 hover:text-green-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Team List */}
        <div className="grid gap-4">
          {team.map(member => (
            <div
              key={member.id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-5 flex-1 cursor-pointer"
                  onClick={() => router.push(`/team/${member.id}`)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {member.full_name?.charAt(0) || member.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                      {member.full_name || member.username}
                    </h3>
                    <p className="text-sm text-gray-500">@{member.username}</p>
                    {member.email && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRoleBadge(member.role, member.roleName)}
                  {getStatusBadge(member.status)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteMember(member);
                    }}
                    className="px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg text-sm font-bold cursor-pointer"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}

          {team.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No team members yet</p>
              <p className="text-sm text-gray-400">Add your first team member to get started</p>
            </div>
          )}
        </div>

        {/* Create Member Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add New Member</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={createForm.username}
                      onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                      placeholder="john_doe"
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-gray-900 bg-gray-50/50 hover:bg-white hover:shadow-md cursor-text"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">3-30 characters, letters, numbers, underscores only</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-gray-900 bg-gray-50/50 hover:bg-white hover:shadow-md cursor-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-gray-900 bg-gray-50/50 hover:bg-white hover:shadow-md cursor-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={createForm.roleId}
                      onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                      required
                      disabled={roles.length === 0}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none bg-gray-50/50 hover:bg-white cursor-pointer text-gray-900 disabled:opacity-50"
                    >
                      {roles.length === 0 ? (
                        <option value="">No roles available</option>
                      ) : (
                        roles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name} {role.isDefault && '(Default)'}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/roles"
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Settings className="w-4 h-4" />
                      Manage Roles
                    </Link>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || roles.length === 0}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Member
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Remove Team Member</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to remove <strong>{deleteMember.username}</strong> from the team? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteMember(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('Deleting member:', deleteMember.id);
                      const res = await fetch(`/api/team/${deleteMember.id}`, { 
                        method: 'DELETE', 
                        credentials: 'include' 
                      });
                      console.log('Delete response:', res.status);
                      const data = await res.json();
                      console.log('Delete data:', data);
                      if (!res.ok) {
                        alert('Error: ' + (data.error || 'Unknown error'));
                        return;
                      }
                      // Optimistically update the team state by removing the deleted member
                      setTeam(prevTeam => prevTeam.filter(member => member.id !== deleteMember.id))
                      setDeleteMember(null);
                      fetchTeam();
                      alert('Member removed successfully');
                    } catch (err: any) {
                      console.error('Delete error:', err);
                      alert('Error: ' + err.message);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Remove Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  )
}
