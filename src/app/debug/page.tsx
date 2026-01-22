'use client'

import { useEffect, useState } from 'react'
import { get } from '@/lib/fetch'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await get('/api/auth/me')
      const data = await res.json()
      setUser(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      
      <div className="bg-white p-4 rounded-lg shadow">
        <pre className="text-sm">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <button 
        onClick={checkAuth}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
      >
        Refresh
      </button>
    </div>
  )
}
