'use client'

import { use } from 'react'
import LocationFormPage from '../../new/page'

export default function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  
  return <LocationFormPage editId={resolvedParams.id} />
}
