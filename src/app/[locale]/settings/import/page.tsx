import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { FileSpreadsheet, Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata: Metadata = {
  title: 'Import from Tally - DKS StockAlert',
  description: 'Import your data from Tally',
}

export default async function ImportPage(props: { params: Promise<{ locale: string }> }) {
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

  const importTypes = [
    {
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: 'XML Format',
      description: 'Import from Tally XML export',
      supported: true,
    },
    {
      icon: <FileSpreadsheet className="w-5 h-5" />,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: 'CSV Format',
      description: 'Import from CSV files',
      supported: true,
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
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-12">Import Data</h1>
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
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Import from Tally</h1>
          </div>
          <p className="text-gray-500">
            Import your existing data from Tally in XML or CSV format
          </p>
        </div>

        {/* Mobile Content */}
        <div 
          className="sm:hidden mt-[calc(48px+env(safe-area-inset-top))] pb-8"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          {/* Import Types */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm mb-6">
            {importTypes.map((type, index) => (
              <div 
                key={type.title}
                className={`flex items-center gap-3 px-4 py-4 ${index !== importTypes.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className={`w-10 h-10 ${type.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className={type.iconColor}>{type.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{type.title}</p>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
                {type.supported && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            ))}
          </div>

          {/* Upload Section */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Upload File</h3>
                  <p className="text-sm text-gray-500">Select your Tally export file</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">Tap to upload</p>
                <p className="text-xs text-gray-500">XML or CSV files supported</p>
              </div>
              <button className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg font-medium active:scale-95 transition-all">
                Start Import
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mx-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Instructions</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Before you import:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Export data from Tally in XML or CSV format</li>
                    <li>Ensure file size is under 10MB</li>
                    <li>Verify data accuracy before importing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="hidden sm:block px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid gap-6 max-w-3xl">
            {/* Import Options Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Supported Formats</h3>
                <p className="text-sm text-gray-500 mt-1">Choose your import method</p>
              </div>
              <div className="p-6 grid gap-4 sm:grid-cols-2">
                {importTypes.map((type) => (
                  <div 
                    key={type.title}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                  >
                    <div className={`w-12 h-12 ${type.iconBg} rounded-xl flex items-center justify-center`}>
                      <span className={type.iconColor}>{type.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{type.title}</h4>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                    {type.supported && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Upload Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Upload File</h3>
                <p className="text-sm text-gray-500 mt-1">Select your Tally export file</p>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-500">XML or CSV files up to 10MB</p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg">
                    Start Import
                  </button>
                  <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Sample
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Before you import</h3>
                  <ul className="space-y-2 text-sm text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      Export your data from Tally in XML or CSV format
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      Ensure the file size is under 10MB
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      Verify data accuracy before importing
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      Backup your existing data before proceeding
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
