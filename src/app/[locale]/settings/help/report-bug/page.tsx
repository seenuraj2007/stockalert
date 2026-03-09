'use client'

import { useState, useRef } from 'react'
import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { 
  Bug, 
  ChevronLeft, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Upload,
  X,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface BugReportFormData {
  bugTitle: string
  description: string
  stepsToReproduce: string
  expectedBehavior: string
  actualBehavior: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  screenshot: File | null
}

export default function ReportBugPage() {
  const t = useTranslations('bugReport')
  const params = useParams()
  const locale = params.locale as string
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<BugReportFormData>({
    bugTitle: '',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    priority: 'medium',
    screenshot: null,
  })
  
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [githubUrl, setGithubUrl] = useState<string | null>(null)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed')
        return
      }

      setFormData(prev => ({ ...prev, screenshot: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeScreenshot = () => {
    setFormData(prev => ({ ...prev, screenshot: null }))
    setScreenshotPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.bugTitle.trim() || !formData.description.trim()) {
      setErrorMessage('Please fill in all required fields')
      setSubmitStatus('error')
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      // Get browser info
      const userAgent = navigator.userAgent
      const screenResolution = `${window.screen.width}x${window.screen.height}`

      // Create FormData for submission
      const submitData = new FormData()
      submitData.append('bugTitle', formData.bugTitle)
      submitData.append('description', formData.description)
      submitData.append('stepsToReproduce', formData.stepsToReproduce)
      submitData.append('expectedBehavior', formData.expectedBehavior)
      submitData.append('actualBehavior', formData.actualBehavior)
      submitData.append('priority', formData.priority)
      submitData.append('userAgent', userAgent)
      submitData.append('screenResolution', screenResolution)
      
      if (formData.screenshot) {
        submitData.append('screenshot', formData.screenshot)
      }

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        body: JSON.stringify({
          bugTitle: formData.bugTitle,
          description: formData.description,
          stepsToReproduce: formData.stepsToReproduce,
          expectedBehavior: formData.expectedBehavior,
          actualBehavior: formData.actualBehavior,
          priority: formData.priority,
          userAgent,
          screenResolution,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bug report')
      }

      setSubmitStatus('success')
      setGithubUrl(data.githubUrl)
      
      // Reset form
      setFormData({
        bugTitle: '',
        description: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        priority: 'medium',
        screenshot: null,
      })
      setScreenshotPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error submitting bug report:', error)
      setSubmitStatus('error')
      setErrorMessage('Failed to submit bug report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div 
          className="sm:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center px-4 py-3 min-h-[48px]">
            <Link href={`/${locale}/settings/help`} className="text-indigo-600 font-medium">
              ← Back
            </Link>
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-12">{t('title')}</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto pt-20 sm:pt-8 px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('thankYou')}</h2>
            <p className="text-gray-500 mb-6">{t('success')}</p>
            
            {/* GitHub Issue Link */}
            {githubUrl && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  A GitHub issue has been created for this bug:
                </p>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 break-all"
                >
                  {githubUrl}
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                </a>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href={`/${locale}/settings/help`}
                className="block w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                Back to Help Center
              </Link>
              <button
                onClick={() => {
                  setSubmitStatus('idle')
                  setGithubUrl(null)
                }}
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Submit Another Bug
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div 
        className="sm:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center px-4 py-3 min-h-[48px]">
          <Link href={`/${locale}/settings/help`} className="text-indigo-600 font-medium">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-8">{t('title')}</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:block bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link 
            href={`/${locale}/settings/help`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Help Center
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Bug className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-gray-500 text-sm">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">{t('error')}</p>
              {errorMessage && <p className="text-sm text-red-600 mt-1">{errorMessage}</p>}
            </div>
          </div>
        )}

        {/* Bug Report Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bug Title */}
          <div>
            <label htmlFor="bugTitle" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('bugTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bugTitle"
              name="bugTitle"
              value={formData.bugTitle}
              onChange={handleInputChange}
              placeholder={t('bugTitlePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('description')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('descriptionPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label htmlFor="stepsToReproduce" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('stepsToReproduce')}
            </label>
            <textarea
              id="stepsToReproduce"
              name="stepsToReproduce"
              value={formData.stepsToReproduce}
              onChange={handleInputChange}
              placeholder={t('stepsToReproducePlaceholder')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Expected and Actual Behavior */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('expectedBehavior')}
              </label>
              <textarea
                id="expectedBehavior"
                name="expectedBehavior"
                value={formData.expectedBehavior}
                onChange={handleInputChange}
                placeholder={t('expectedBehaviorPlaceholder')}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
            <div>
              <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('actualBehavior')}
              </label>
              <textarea
                id="actualBehavior"
                name="actualBehavior"
                value={formData.actualBehavior}
                onChange={handleInputChange}
                placeholder={t('actualBehaviorPlaceholder')}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('priority')}
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
              <option value="low">{t('priorityLow')}</option>
              <option value="medium">{t('priorityMedium')}</option>
              <option value="high">{t('priorityHigh')}</option>
              <option value="critical">{t('priorityCritical')}</option>
            </select>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('screenshot')}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {screenshotPreview ? (
              <div className="relative inline-block">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="max-w-full h-auto max-h-48 rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">{t('uploadScreenshot')}</span>
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('submitting')}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('submit')}
              </>
            )}
          </button>
        </form>

        {/* Privacy Note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Your bug report will help us improve the app. We collect minimal information needed to reproduce and fix the issue.
        </p>
      </div>
    </div>
  )
}
