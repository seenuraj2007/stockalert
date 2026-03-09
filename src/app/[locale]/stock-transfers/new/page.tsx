'use client'

import { useState, useEffect, useCallback, useMemo, use } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Save, ArrowUpDown, MapPin, Package, Plus, Trash2, 
  Search, AlertCircle, CheckCircle, Clock, Truck, FileSpreadsheet,
  X, GripVertical, Zap, ChevronDown, ArrowRight, RefreshCw, Edit
} from 'lucide-react'
import Link from 'next/link'

interface Location {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string | null
  current_quantity: number
}

interface StockLevel {
  productId: string
  quantity: number
}

interface TransferItem {
  id: string
  product_id: string
  quantity: number
  available?: number
}

interface SmartSuggestion {
  locationId: string
  transferCount?: number
  totalStock?: number
}

interface Props {
  params?: Promise<{ id?: string }>
}

export default function StockTransferFormPage({ params }: Props) {
  const resolvedParams = use(params || Promise.resolve({ id: undefined }))
  const router = useRouter()
  const isEdit = !!resolvedParams?.id
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Data
  const [locations, setLocations] = useState<Location[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [suggestions, setSuggestions] = useState<any>(null)
  
  // Search states
  const [sourceSearch, setSourceSearch] = useState('')
  const [destSearch, setDestSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showSourceDropdown, setShowSourceDropdown] = useState(false)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  
  // Drag and drop
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    from_location_id: '',
    to_location_id: '',
    priority: 'NORMAL' as 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW',
    notes: '',
    items: [] as TransferItem[]
  })

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [locRes, prodRes, transferRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/products'),
        fetch('/api/stock-transfers?limit=1')
      ])
      
      if (locRes.ok) {
        const locData = await locRes.json()
        setLocations(locData.locations || [])
      }
      
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData.products || [])
      }
      
      // Get suggestions from transfers API
      if (transferRes.ok) {
        const transferData = await transferRes.json()
        setSuggestions(transferData.suggestions)
      }
      
      // Fetch stock levels for all products
      const stockRes = await fetch('/api/stock-levels')
      if (stockRes.ok) {
        const stockData = await stockRes.json()
        setStockLevels(stockData.stockLevels || [])
      }

      // If editing, fetch existing transfer
      if (resolvedParams?.id) {
        const existingRes = await fetch(`/api/stock-transfers/${resolvedParams.id}`)
        if (existingRes.ok) {
          const existingData = await existingRes.json()
          const transfer = existingData.stock_transfer
          if (transfer) {
            // Get product details for each item
            const itemsWithProducts = await Promise.all(
              (transfer.items || []).map(async (item: any) => {
                const product = products.find(p => p.id === item.product_id) || { id: item.product_id, name: item.product_name || 'Unknown', sku: item.product_sku, current_quantity: 0 }
                const stock = stockLevels.find(s => s.productId === item.product_id)
                return {
                  id: item.id || `${item.product_id}-${Date.now()}`,
                  product_id: item.product_id,
                  quantity: item.quantity,
                  available: stock?.quantity || item.quantity
                }
              })
            )
            
            // Wait a bit for products to be loaded first
            // For now, use the API data directly
            setFormData({
              from_location_id: transfer.from_location_id,
              to_location_id: transfer.to_location_id,
              priority: transfer.priority || 'NORMAL',
              notes: transfer.notes || '',
              items: transfer.items?.map((item: any, idx: number) => ({
                id: item.id || `item-${idx}`,
                product_id: item.product_id,
                quantity: item.quantity,
                available: item.quantity // Will be updated after stock loads
              })) || []
            })
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setFetching(false)
    }
  }

  // Update items with stock info when stock levels load
  useEffect(() => {
    if (stockLevels.length > 0 && formData.items.length > 0) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => ({
          ...item,
          available: stockLevels.find(s => s.productId === item.product_id)?.quantity || item.available || 0
        }))
      }))
    }
  }, [stockLevels])

  // Filtered locations
  const filteredSourceLocations = useMemo(() => {
    if (!sourceSearch) return locations.filter(l => l.id !== formData.to_location_id)
    return locations.filter(l => 
      l.name.toLowerCase().includes(sourceSearch.toLowerCase()) && 
      l.id !== formData.to_location_id
    )
  }, [locations, sourceSearch, formData.to_location_id])

  const filteredDestLocations = useMemo(() => {
    if (!destSearch) return locations.filter(l => l.id !== formData.from_location_id)
    return locations.filter(l => 
      l.name.toLowerCase().includes(destSearch.toLowerCase()) && 
      l.id !== formData.from_location_id
    )
  }, [locations, destSearch, formData.from_location_id])

  // Filtered products based on source location
  const availableProducts = useMemo(() => {
    if (!formData.from_location_id) return products
    
    return products.filter(p => {
      const stock = stockLevels.find(s => s.productId === p.id)
      return stock && stock.quantity > 0
    }).map(p => {
      const stock = stockLevels.find(s => s.productId === p.id)
      return { ...p, current_quantity: stock?.quantity || 0 }
    })
  }, [products, stockLevels, formData.from_location_id])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return availableProducts
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    )
  }, [availableProducts, productSearch])

  // Get selected location names
  const fromLocationName = locations.find(l => l.id === formData.from_location_id)?.name
  const toLocationName = locations.find(l => l.id === formData.to_location_id)?.name

  // Validation
  const validationErrors = useMemo(() => {
    const errors: string[] = []
    
    if (formData.from_location_id && formData.to_location_id) {
      if (formData.from_location_id === formData.to_location_id) {
        errors.push('Source and destination must be different')
      }
    }
    
    if (formData.items.length === 0) {
      errors.push('Add at least one item')
    }
    
    formData.items.forEach((item, idx) => {
      const stock = stockLevels.find(s => s.productId === item.product_id)
      const available = stock?.quantity || item.available || 0
      if (item.quantity > available) {
        const product = products.find(p => p.id === item.product_id)
        errors.push(`Insufficient stock for "${product?.name || 'item ' + (idx + 1)}"`)
      }
    })
    
    return errors
  }, [formData, products, stockLevels])

  const isValid = validationErrors.length === 0 && formData.from_location_id && formData.to_location_id

  const addItem = (product: Product) => {
    const stock = stockLevels.find(s => s.productId === product.id)
    const newItem: TransferItem = {
      id: `${product.id}-${Date.now()}`,
      product_id: product.id,
      quantity: 1,
      available: stock?.quantity || 0
    }
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    })
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    })
  }

  const removeItem = (id: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== id)
    })
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedItem(productId)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedItem && formData.from_location_id) {
      const product = products.find(p => p.id === draggedItem)
      if (product && !formData.items.find(i => i.product_id === draggedItem)) {
        addItem(product)
      }
    }
    setDraggedItem(null)
  }

  // Quick quantity handlers
  const setAllQuantities = (quantity: number) => {
    setFormData({
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        quantity: Math.min(quantity, item.available || 0)
      }))
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!isValid) {
      setError(validationErrors.join(', '))
      setLoading(false)
      return
    }

    try {
      const payload = {
        from_location_id: formData.from_location_id,
        to_location_id: formData.to_location_id,
        priority: formData.priority,
        notes: formData.notes,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      }

      const url = isEdit 
        ? `/api/stock-transfers/${resolvedParams?.id}`
        : '/api/stock-transfers'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save transfer')
      }

      setSuccess(isEdit ? 'Transfer updated successfully!' : 'Transfer created successfully!')
      setTimeout(() => router.push('/stock-transfers'), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (isValid && !loading) {
          handleSubmit(e as any)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isValid, loading, formData])

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/stock-transfers" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
                <ArrowUpDown className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">StockAlert</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Press</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">⌘S</kbd>
              <span>to save</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <Link
            href="/stock-transfers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-all text-sm font-medium mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stock Transfers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              {isEdit ? <Edit className="w-6 h-6 text-purple-600" /> : <Plus className="w-6 h-6 text-purple-600" />}
            </div>
            {isEdit ? 'Edit Stock Transfer' : 'New Stock Transfer'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? 'Update transfer details' : 'Move inventory between locations with real-time validation'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transfer Route */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Transfer Route
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source Location */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  From Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    {fromLocationName || 'Select source location'}
                  </button>
                  {formData.from_location_id && (
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, from_location_id: '' }); setSourceSearch('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Source Dropdown */}
                {showSourceDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={sourceSearch}
                          onChange={(e) => setSourceSearch(e.target.value)}
                          placeholder="Search locations..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredSourceLocations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No locations found</div>
                    ) : (
                      filteredSourceLocations.map(location => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, from_location_id: location.id })
                            setShowSourceDropdown(false)
                            setSourceSearch('')
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-gray-900">{location.name}</span>
                          {suggestions?.recommendedSources?.some((s: SmartSuggestion) => s.locationId === location.id) && (
                            <Zap className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
                
                {/* Smart suggestion chips */}
                {suggestions?.recommendedSources && suggestions.recommendedSources.length > 0 && !formData.from_location_id && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500">Suggested:</span>
                    {suggestions.recommendedSources.slice(0, 2).map((s: SmartSuggestion) => {
                      const loc = locations.find(l => l.id === s.locationId)
                      return loc && (
                        <button
                          key={s.locationId}
                          type="button"
                          onClick={() => setFormData({ ...formData, from_location_id: s.locationId })}
                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          {loc.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Destination Location */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  To Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowDestDropdown(!showDestDropdown)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    {toLocationName || 'Select destination location'}
                  </button>
                  {formData.to_location_id && (
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, to_location_id: '' }); setDestSearch('') }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                
                {/* Destination Dropdown */}
                {showDestDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={destSearch}
                          onChange={(e) => setDestSearch(e.target.value)}
                          placeholder="Search locations..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredDestLocations.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No locations found</div>
                    ) : (
                      filteredDestLocations.map(location => (
                        <button
                          key={location.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, to_location_id: location.id })
                            setShowDestDropdown(false)
                            setDestSearch('')
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center justify-between transition-colors"
                        >
                          <span className="font-medium text-gray-900">{location.name}</span>
                          {suggestions?.receivingLocations?.some((r: SmartSuggestion) => r.locationId === location.id) && (
                            <Zap className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
              <div className="flex gap-2 flex-wrap">
                {(['URGENT', 'HIGH', 'NORMAL', 'LOW'] as const).map(priority => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority })}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      formData.priority === priority
                        ? priority === 'URGENT' ? 'bg-red-500 text-white' :
                          priority === 'HIGH' ? 'bg-orange-500 text-white' :
                          priority === 'NORMAL' ? 'bg-indigo-500 text-white' :
                          'bg-gray-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items Selection */}
          <div 
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Transfer Items
              </h2>
              
              {formData.items.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAllQuantities(1)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    All: 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllQuantities(Math.max(...formData.items.map(i => i.available || 0)))}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Max All
                  </button>
                </div>
              )}
            </div>

            {/* Product Search */}
            {formData.from_location_id ? (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-left text-gray-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex items-center justify-between"
                >
                  <span>Search and add products...</span>
                  <ChevronDown className="w-5 h-5" />
                </button>
                
                {/* Product Dropdown */}
                {showProductDropdown && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-auto">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by name or SKU..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {formData.from_location_id ? 'No products with stock' : 'Select source location first'}
                      </div>
                    ) : (
                      filteredProducts.map(product => (
                        <div
                          key={product.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, product.id)}
                          className={`px-4 py-3 flex items-center justify-between transition-colors cursor-grab active:cursor-grabbing ${
                            formData.items.find(i => i.product_id === product.id)
                              ? 'bg-green-50 opacity-50'
                              : 'hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              {product.sku && <p className="text-xs text-gray-500">{product.sku}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{product.current_quantity} available</span>
                            {!formData.items.find(i => i.product_id === product.id) && (
                              <button
                                type="button"
                                onClick={() => addItem(product)}
                                className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                            {formData.items.find(i => i.product_id === product.id) && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Select a source location first to see available products
              </div>
            )}

            {/* Items List */}
            {formData.items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No items added yet</p>
                <p className="text-sm text-gray-400 mt-1">Search and add products or drag them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.product_id) || { name: 'Loading...', sku: '' }
                  const stock = stockLevels.find(s => s.productId === item.product_id)
                  const available = stock?.quantity || item.available || 0
                  const isOverStock = item.quantity > available
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isOverStock 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          {product.sku && <p className="text-xs text-gray-500">{product.sku}</p>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {available} available
                          </span>
                          
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              className="px-3 py-1.5 hover:bg-gray-100 rounded-l-lg transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={available}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 py-1.5"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="px-3 py-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                          
                          {isOverStock && (
                            <span className="text-xs text-red-600 font-medium">
                              Exceeds stock!
                            </span>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Validation Summary */}
            {validationErrors.length > 0 && formData.items.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-medium text-red-700 mb-2">Please fix the following:</p>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes for this transfer..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <Link
              href="/stock-transfers"
              className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Transfer' : 'Create Transfer'}
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}


