'use client'

import { ReactNode } from 'react'
import { ToastProvider, useUpgradeToast } from '@/components/UpgradeNotification'
import { UserProvider } from '@/lib/UserContext'

export { useUpgradeToast }

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </ToastProvider>
  )
}
