import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { WhatsAppSettings } from '@/components/WhatsAppSettings'
import { TallyImporter } from '@/components/TallyImporter'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, MessageSquare, FileSpreadsheet, Building2, Bell, Shield, MapPin, Phone, Mail, FileText, Info, CheckCircle2, Zap } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Settings - DKS StockAlert',
  description: 'Manage your account, notifications, and integrations',
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
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-2">
            Manage your account, notifications, and integrations
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 flex flex-wrap gap-1 w-full">
            <TabsTrigger value="general" className="data-[state=active]:bg-violet-600">
              <Building2 className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-violet-600">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-violet-600">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-violet-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-violet-600">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-violet-400" />
                  Organization Settings
                </CardTitle>
                <CardDescription>
                  Manage your business information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-400 mb-4">
                    Configure your organization details for GST invoices and business operations.
                  </p>
                  <Link 
                    href={`/${locale}/settings/organization`}
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Organization
                  </Link>
                  <div className="grid gap-3 mt-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <MapPin className="w-5 h-5 text-violet-400" />
                      <div>
                        <p className="text-sm text-slate-300">Business Address</p>
                        <p className="text-xs text-slate-500">Set your business location</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <FileText className="w-5 h-5 text-violet-400" />
                      <div>
                        <p className="text-sm text-slate-300">GST Number</p>
                        <p className="text-xs text-slate-500">Add GSTIN for tax compliance</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <Phone className="w-5 h-5 text-violet-400" />
                      <div>
                        <p className="text-sm text-slate-300">Contact Info</p>
                        <p className="text-xs text-slate-500">Phone and email for invoices</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings Overview */}
          <TabsContent value="notifications">
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-green-400" />
                    Email Notifications
                    <span className="ml-auto text-xs font-semibold bg-green-900 text-green-400 px-2 py-1 rounded">FREE Forever</span>
                  </CardTitle>
                  <CardDescription>
                    Unlimited email notifications - no limits, no costs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-green-400">FREE:</span> Unlimited email notifications with no message limits
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-3">Email notification types:</p>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Bell className="w-4 h-4 text-yellow-400" />
                        Low Stock Alerts
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Bell className="w-4 h-4 text-red-400" />
                        Out of Stock Alerts
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Purchase Order Updates
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Mail className="w-4 h-4 text-green-400" />
                        Daily Inventory Summary
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    <p>Configure email settings in the <span className="text-blue-400 font-medium">Email</span> tab. Contact your admin for SMTP credentials.</p>
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Notifications */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    WhatsApp Alerts
                    <span className="ml-auto text-xs font-semibold bg-green-900 text-green-400 px-2 py-1 rounded">Free 1,000/mo</span>
                  </CardTitle>
                  <CardDescription>
                    Instant notifications on your phone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span className="font-medium">1,000 messages/month FREE</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MessageSquare className="w-4 h-4 text-green-400" />
                        Bilingual messages (English + Hindi)
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Bell className="w-4 h-4 text-green-400" />
                        Instant alerts on your phone
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    <p>Configure WhatsApp in the <span className="text-green-400 font-medium">WhatsApp</span> tab. First 1,000 messages are free, then ~₹0.50-₹3.00 per message.</p>
                  </div>
                  <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-300">
                      <strong className="text-blue-400">💡 Tip:</strong> Use email for FREE unlimited notifications, add WhatsApp for urgent mobile alerts.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* In-App Notifications */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    In-App Notifications
                    <span className="ml-auto text-xs font-semibold bg-green-900 text-green-400 px-2 py-1 rounded">FREE Forever</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time alerts in the application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-green-400">ALWAYS FREE:</span> Real-time dashboard alerts with no limits
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </TabsContent>

          {/* Email Configuration */}
          <TabsContent value="email">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-400" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure email notifications - FREE forever
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Free Tier Banner */}
                <div className="p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Email Notifications are FREE Forever!</p>
                      <p className="text-xs text-slate-300 mt-1">
                        Email notifications are completely free. There are no message limits and no costs - forever.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Instructions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">Environment Configuration</h3>
                  <p className="text-xs text-slate-400">
                    Add these environment variables to your .env.local file to enable email notifications.
                  </p>
                  <div className="text-xs font-mono text-slate-300 bg-slate-900 p-4 rounded-lg overflow-x-auto">
                    <p># Email Configuration</p>
                    <p>SMTP_HOST=your-smtp-host</p>
                    <p>SMTP_PORT=587</p>
                    <p>SMTP_USER=your-email@example.com</p>
                    <p>SMTP_PASS=your-email-password</p>
                    <p>SMTP_FROM=noreply@yourdomain.com</p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-500">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-400" />
                    <p>Contact your server administrator or email service provider for SMTP credentials. After updating .env.local, restart the server.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Settings */}
          <TabsContent value="whatsapp">
            <WhatsAppSettings />
          </TabsContent>

          {/* Import Settings */}
          <TabsContent value="import">
            <TallyImporter />
          </TabsContent>
        </Tabs>

        {/* Why Choose DKS StockAlert */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-900/20 to-violet-900/20 rounded-xl border border-green-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Why DKS StockAlert?</h3>
              <p className="text-slate-400 mt-1 mb-4">
                We're the only inventory software in India with these killer features:
              </p>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-slate-300"><span className="text-green-400 font-semibold">WhatsApp Alerts</span> - Get instant low stock alerts on your phone (1,000 FREE/mo)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-slate-300"><span className="text-blue-400 font-semibold">Email Alerts</span> - FREE forever for 99.9% of businesses</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-slate-300"><span className="text-purple-400 font-semibold">1-Click Tally Import</span> - Migrate from Tally in seconds, not hours</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-slate-300"><span className="text-orange-400 font-semibold">Complete Hindi Support</span> - Manage your business in हिंदी</span>
                </div>
              </div>
              <p className="text-slate-400 mt-4 text-sm">
                Your data is securely stored in India with enterprise-grade encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
