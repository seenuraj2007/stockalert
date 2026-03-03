'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, User, Shield, Trash2, AlertTriangle } from 'lucide-react'
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
  status: string
  invitedBy: string | null
  created_at: string
}

export default function EditTeamMemberPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [member, setMember] = useState<TeamMember | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')

  useEffect(() => {
    fetchMember()
    fetchRoles()
  }, [memberId])

  const fetchMember = async () => {
    try {
      const res = await fetch(`/api/team/${memberId}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setMember(data.member)
        setSelectedRoleId(data.member.roleId || '')
      } else {
        setError('Member not found')
      }
    } catch (err) {
      console.error('Error fetching member:', err)
      setError('Failed to load member')
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
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }

  const handleUpdateRole = async () => {
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId }),
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update member')
      }

      router.push('/team')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const res = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      router.push('/team')
    } catch (err: any) {
      setError(err.message)
    }
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

  if (!member) {
    return (
      <SidebarLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">Member not found</p>
            <Link href="/team" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
              Back to Team
            </Link>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/team"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Team Member</h1>
            <p className="text-gray-600">Manage member role and permissions</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Member Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {member.full_name?.charAt(0) || member.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{member.full_name || member.username}</h2>
              <p className="text-sm text-gray-500">@{member.username}</p>
              {member.email && (
                <p className="text-sm text-gray-500">{member.email}</p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Role
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name} {role.isDefault && '(Default)'}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Select a role to define what this member can access and do.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={handleRemoveMember}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove Member
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/team"
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleUpdateRole}
                disabled={saving || selectedRoleId === member.roleId}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
