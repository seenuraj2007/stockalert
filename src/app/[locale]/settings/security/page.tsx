import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Lock, Shield, Key, Smartphone } from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata: Metadata = {
  title: 'Security Settings - DKS Stockox',
  description: 'Manage your password and security settings',
}

export default async function SecuritySettingsPage(props: { params: Promise<{ locale: string }> }) {
  const cookieStore = await cookies()
  const mockRequest = new Request('http://localhost', {
    headers: {
      cookie: cookieStore.toString(),
    },
  })
  const session = await getCurrentUser(mockRequest)

  if (!session) {
    redirect('/auth')
  }

  const params = await props.params
  const locale = params.locale

  return (
    <SidebarLayout>
      <div className="sm:max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div 
          className="sm:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center px-4 py-3 min-h-[48px]">
            <Link href={`/${locale}/settings`} className="text-indigo-600 font-medium">
              ← Back
            </Link>
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-12">Security</h1>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block mb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href={`/${locale}/settings`}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Settings
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          </div>
          <p className="text-gray-500">
            Manage your password and two-factor authentication
          </p>
        </div>

        {/* Mobile Content */}
        <div 
          className="sm:hidden mt-[calc(48px+env(safe-area-inset-top))] pb-8"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          {/* Password Section */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Change Password</h3>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Confirm new password"
                />
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Update Password
              </button>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Status: Not enabled</span>
                </div>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Disabled</span>
              </div>
              <button className="w-full mt-4 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="hidden sm:block px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid gap-6 max-w-2xl">
            {/* Password Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Change Password</h3>
                    <p className="text-sm text-gray-500">Update your account password</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Confirm new password"
                  />
                </div>
                <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg">
                  Update Password
                </button>
              </div>
            </div>

            {/* 2FA Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Status</p>
                      <p className="text-sm text-gray-500">Not enabled</p>
                    </div>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full">Disabled</span>
                </div>
                <button className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg">
                  Enable Two-Factor Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
