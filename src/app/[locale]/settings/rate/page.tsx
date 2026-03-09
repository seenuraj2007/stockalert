import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Star, Heart, ThumbsUp, MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import SidebarLayout from '@/components/SidebarLayout'

export const metadata: Metadata = {
  title: 'Rate the App - DKS Stockox',
  description: 'Rate and review DKS Stockox',
}

export default async function RateAppPage(props: { params: Promise<{ locale: string }> }) {
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
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-12">Rate App</h1>
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
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Rate the App</h1>
          </div>
          <p className="text-gray-500">
            Share your feedback and help us improve
          </p>
        </div>

        {/* Mobile Content */}
        <div 
          className="sm:hidden mt-[calc(48px+env(safe-area-inset-top))] pb-8"
          style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
        >
          {/* Rating Section */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm mb-6">
            <div className="p-6 text-center border-b border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enjoying DKS Stockox?</h2>
              <p className="text-gray-500">Your feedback helps us improve and grow</p>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-700 text-center mb-4">Tap a star to rate</p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-all hover:bg-yellow-100"
                  >
                    <Star className="w-6 h-6 text-gray-400 hover:text-yellow-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div className="bg-white mx-4 rounded-xl overflow-hidden border border-gray-200/50 shadow-sm mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Send Feedback</h3>
                  <p className="text-sm text-gray-500">Tell us what you think</p>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Feedback</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  rows={4}
                  placeholder="Share your thoughts, suggestions, or report issues..."
                />
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Send className="w-4 h-4" />
                Submit Feedback
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mx-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Quick Actions</p>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200/50 shadow-sm">
              <button className="w-full flex items-center gap-3 px-4 py-4 border-b border-gray-100 active:bg-gray-50 transition-colors">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <span className="text-gray-900">Recommend to Friends</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50 transition-colors">
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-900">Write a Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="hidden sm:block px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid gap-6 max-w-2xl">
            {/* Rating Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-8 text-center border-b border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Enjoying DKS Stockox?</h2>
                <p className="text-gray-500">Your feedback helps us improve and serve you better</p>
              </div>
              <div className="p-8">
                <p className="text-sm font-medium text-gray-700 text-center mb-4">Click a star to rate your experience</p>
                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center hover:bg-yellow-100 transition-all hover:scale-105"
                    >
                      <Star className="w-7 h-7 text-gray-400 hover:text-yellow-500 transition-colors" />
                    </button>
                  ))}
                </div>
                <div className="h-px bg-gray-200 my-6" />
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Your Feedback</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={4}
                    placeholder="Share your thoughts, suggestions, or report any issues you've encountered..."
                  />
                  <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg">
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>

            {/* Share Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 shadow-lg shadow-gray-200/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Share the Love</h3>
                <p className="text-sm text-gray-500 mt-1">Help others discover DKS Stockox</p>
              </div>
              <div className="p-6 grid gap-4 sm:grid-cols-2">
                <button className="flex items-center justify-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Recommend to Friends</span>
                </button>
                <button className="flex items-center justify-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-gray-900">Write a Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
