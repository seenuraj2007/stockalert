import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { 
  Globe, MessageSquare, FileSpreadsheet, Building2, Bell, Shield, 
  MapPin, Phone, FileText, Info, CheckCircle2, Zap, Settings2, ChevronRight,
  Moon, User, Lock, CircleHelp, Star
} from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata: Metadata = {
  title: 'Settings - DKS StockAlert',
  description: 'Manage your account, notifications, and integrations',
}

// Toggle Switch Component
function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div className={`w-12 h-7 rounded-full relative flex-shrink-0 transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
      <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`} />
    </div>
  )
}

// Settings Row Component
function SettingsRow({ 
  icon, 
  iconBg, 
  iconColor, 
  title, 
  subtitle, 
  href, 
  showToggle, 
  toggleEnabled,
  badge,
  isLast = false 
}: { 
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle?: string
  href?: string
  showToggle?: boolean
  toggleEnabled?: boolean
  badge?: string
  isLast?: boolean
}) {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base text-gray-900">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
      </div>
      {badge && (
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {showToggle && <ToggleSwitch enabled={toggleEnabled || false} />}
      {!showToggle && <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}

// Section Header Component
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
    </div>
  )
}

// Section Container Component
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm">
      {children}
    </div>
  )
}

export default async function SettingsPage(props: { params: Promise<{ locale: string }> }) {
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
        {/* Mobile App Header - iOS Style */}
        <div 
          className="sm:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-center px-4 py-3 min-h-[48px]">
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden sm:block mb-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-500">
            Manage your account, notifications, and integrations
          </p>
        </div>

        {/* Mobile Content - iOS Settings Style */}
        <div 
          className="sm:hidden mt-[calc(48px+env(safe-area-inset-top))] pb-8 space-y-6"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          {/* User Profile Section */}
          <div className="px-4 py-4">
            <Link href={`/${locale}/profile`} className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-900 truncate">{(session as any).name || 'User'}</p>
                <p className="text-sm text-gray-500 truncate">{session.email || 'user@example.com'}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          </div>

          {/* General Section */}
          <div>
            <SectionHeader title="General" />
            <Section>
              <SettingsRow
                icon={<Building2 className="w-5 h-5 text-indigo-600" />}
                iconBg="bg-indigo-100"
                iconColor="text-indigo-600"
                title="Organization"
                href={`/${locale}/settings/organization`}
              />
              <SettingsRow
                icon={<Globe className="w-5 h-5 text-blue-600" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Language"
                badge="English"
              />
              <SettingsRow
                icon={<Moon className="w-5 h-5 text-purple-600" />}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                title="Dark Mode"
                showToggle
                toggleEnabled={false}
                isLast
              />
            </Section>
          </div>

          {/* Business Info Section */}
          <div>
            <SectionHeader title="Business Information" />
            <Section>
              <SettingsRow
                icon={<MapPin className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                title="Business Address"
                subtitle="Not configured"
              />
              <SettingsRow
                icon={<FileText className="w-5 h-5 text-amber-600" />}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                title="GST Number"
                subtitle="Not configured"
              />
              <SettingsRow
                icon={<Phone className="w-5 h-5 text-pink-600" />}
                iconBg="bg-pink-100"
                iconColor="text-pink-600"
                title="Contact Info"
                subtitle="Not configured"
                isLast
              />
            </Section>
          </div>

          {/* Notifications Section */}
          <div>
            <SectionHeader title="Notifications" />
            <Section>
              <SettingsRow
                icon={<Bell className="w-5 h-5 text-red-600" />}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                title="Push Notifications"
                showToggle
                toggleEnabled={true}
              />
              <SettingsRow
                icon={<MessageSquare className="w-5 h-5 text-green-600" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                title="WhatsApp Alerts"
                subtitle="1,000 FREE/mo"
                badge="Soon"
                isLast
              />
            </Section>
          </div>

          {/* Data & Import Section */}
          <div>
            <SectionHeader title="Data & Import" />
            <Section>
              <SettingsRow
                icon={<FileSpreadsheet className="w-5 h-5 text-violet-600" />}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
                title="Import from Tally"
                subtitle="XML and CSV formats supported"
                href={`/${locale}/settings/import`}
                isLast
              />
            </Section>
          </div>

          {/* Security Section */}
          <div>
            <SectionHeader title="Security" />
            <Section>
              <SettingsRow
                icon={<Lock className="w-5 h-5 text-slate-600" />}
                iconBg="bg-slate-100"
                iconColor="text-slate-600"
                title="Change Password"
              />
              <SettingsRow
                icon={<Shield className="w-5 h-5 text-cyan-600" />}
                iconBg="bg-cyan-100"
                iconColor="text-cyan-600"
                title="Two-Factor Authentication"
                subtitle="Not enabled"
                isLast
              />
            </Section>
          </div>

          {/* Support Section */}
          <div>
            <SectionHeader title="Support" />
            <Section>
              <SettingsRow
                icon={<CircleHelp className="w-5 h-5 text-teal-600" />}
                iconBg="bg-teal-100"
                iconColor="text-teal-600"
                title="Help Center"
              />
              <SettingsRow
                icon={<Star className="w-5 h-5 text-yellow-600" />}
                iconBg="bg-yellow-100"
                iconColor="text-yellow-600"
                title="Rate the App"
                isLast
              />
            </Section>
          </div>

          {/* App Info */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-400">DKS StockAlert v1.0.0</p>
            <p className="text-xs text-gray-400 mt-1">© 2024 DKS Technologies</p>
          </div>
        </div>

        {/* Desktop Content - Original Card-Based Layout */}
        <div className="hidden sm:block px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid gap-6">
            {/* Quick Actions Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  Organization Settings
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Manage your organization details for GST invoices and business operations
                </p>
              </div>
              <div className="p-6">
                <Link
                  href={`/${locale}/settings/organization`}
                  className="inline-flex items-center justify-center w-full px-4 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Manage Organization
                </Link>
              </div>
            </div>

            {/* Business Information Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  Business Information
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Configure your business details for invoices and communications
                </p>
              </div>
              <div className="p-6">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Business Address</p>
                      <p className="text-xs text-gray-500">Set your business location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">GST Number</p>
                      <p className="text-xs text-gray-500">Add GSTIN for tax compliance</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Contact Info</p>
                      <p className="text-xs text-gray-500">Phone and email for invoices</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="flex items-center gap-2 text-gray-900 text-lg font-semibold">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  Notifications
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  Manage your notification preferences
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">WhatsApp Alerts</p>
                      <p className="text-xs text-gray-500">Instant notifications on your phone</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Free 1,000/mo</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">In-App Notifications</p>
                      <p className="text-xs text-gray-500">Real-time alerts in the application</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">Always Free</span>
                </div>
              </div>
            </div>

            {/* Why Choose DKS StockAlert */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Why DKS StockAlert?</h3>
                  <p className="text-gray-500 mt-1 mb-4">
                    We have these killer features:
                  </p>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">
                        <span className="text-green-600 font-semibold">WhatsApp Alerts</span> - Get instant low stock alerts
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700">
                        <span className="text-purple-600 font-semibold">1-Click Tally Import</span> - Migrate in seconds
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-gray-700">
                        <span className="text-orange-600 font-semibold">Multi-language Support</span> - Reach broader audience
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-500 mt-4 text-sm">
                    Your data is securely stored with enterprise-grade encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
