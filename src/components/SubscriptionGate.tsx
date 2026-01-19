'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PlanLimitBanner from '@/components/PlanLimitBanner'

interface Usage {
  teamMembers: number
  products: number
  locations: number
}

interface Plan {
  name: string
  display_name: string
  max_team_members: number
  max_products: number
  max_locations: number
}

interface SubscriptionData {
  subscription: {
    status: string
    plan?: Plan
    trial_end_date?: string
  }
  usage: Usage
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<Usage>({ teamMembers: 0, products: 0, locations: 0 })
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      const res = await fetch('/api/dashboard/stats', {
        credentials: 'include',
        next: { revalidate: 0 }
      })

      if (res.status === 401) {
        router.push('/auth')
        return
      }

      const data: SubscriptionData = await res.json()
      
      setUsage(data.usage || { teamMembers: 0, products: 0, locations: 0 })
      setPlan(data.subscription?.plan || null)
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      <PlanLimitBanner usage={usage} plan={plan || undefined} />
      {children}
    </>
  )
}
