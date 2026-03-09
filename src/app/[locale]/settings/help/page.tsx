import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CircleHelp, MessageCircle, BookOpen, Video, Mail, Phone, Bug, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata: Metadata = {
  title: 'Help Center - DKS Stockox',
  description: 'Get help and support for DKS Stockox',
}

export default async function HelpCenterPage(props: { params: Promise<{ locale: string }> }) {
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

  const helpTopics = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'Documentation',
      description: 'Browse our comprehensive guides',
    },
    {
      icon: <Video className="w-5 h-5" />,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials',
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'FAQs',
      description: 'Find answers to common questions',
    },
  ]

  const contactMethods = [
    {
      icon: <Bug className="w-5 h-5" />,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      title: 'Report a Bug',
      description: 'Found an issue? Let us know',
      href: `/${locale}/settings/help/report-bug`,
    },
    {
      icon: <Mail className="w-5 h-5" />,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      title: 'Email Support',
      value: 'support@dksstockalert.com',
      action: 'Send Email',
    },
    {
      icon: <Phone className="w-5 h-5" />,
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      title: 'Phone Support',
      value: '+91 12345 67890',
      action: 'Call Now',
    },
  ]

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
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-12">Help Center</h1>
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
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <CircleHelp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          </div>
          <p className="text-gray-500">
            Find answers and get support
          </p>
        </div>

        {/* Mobile Content */}
        <div 
          className="sm:hidden mt-[calc(48px+env(safe-area-inset-top))] pb-8"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          {/* Help Topics */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm mb-6">
            {helpTopics.map((topic, index) => (
              <div 
                key={topic.title}
                className={`flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors ${index !== helpTopics.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className={`w-10 h-10 ${topic.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className={topic.iconColor}>{topic.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{topic.title}</p>
                  <p className="text-sm text-gray-500">{topic.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Methods */}
          <div className="mx-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Contact Us</p>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200/50 shadow-sm">
              {contactMethods.map((method, index) => (
                <Link 
                  key={method.title}
                  href={method.href || '#'}
                  className={`flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors ${index !== contactMethods.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className={`w-10 h-10 ${method.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className={method.iconColor}>{method.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{method.title}</p>
                    <p className="text-sm text-gray-500">{method.description || method.value}</p>
                  </div>
                  {method.action && (
                    <button className="text-sm text-indigo-600 font-medium">
                      {method.action}
                    </button>
                  )}
                  {!method.action && <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                </Link>
              ))}
            </div>
          </div>

          {/* Version Info */}
          <div className="text-center px-4">
            <p className="text-sm text-gray-500">DKS Stockox v1.0.0</p>
            <p className="text-xs text-gray-400 mt-1">We're here to help 24/7</p>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="hidden sm:block px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid gap-6 max-w-3xl">
            {/* Help Topics Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Help Topics</h3>
                <p className="text-sm text-gray-500 mt-1">Browse resources to get started</p>
              </div>
              <div className="p-6 grid gap-4 sm:grid-cols-3">
                {helpTopics.map((topic) => (
                  <button 
                    key={topic.title}
                    className="flex flex-col items-center text-center p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                  >
                    <div className={`w-12 h-12 ${topic.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                      <span className={topic.iconColor}>{topic.icon}</span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{topic.title}</h4>
                    <p className="text-sm text-gray-500">{topic.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Contact Support</h3>
                <p className="text-sm text-gray-500 mt-1">Get in touch with our team</p>
              </div>
              <div className="p-6 space-y-4">
                {contactMethods.map((method) => (
                  <Link 
                    key={method.title}
                    href={method.href || '#'}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${method.iconBg} rounded-xl flex items-center justify-center`}>
                        <span className={method.iconColor}>{method.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{method.title}</h4>
                        <p className="text-sm text-gray-500">{method.description || method.value}</p>
                      </div>
                    </div>
                    {method.action ? (
                      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                        {method.action}
                      </button>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
