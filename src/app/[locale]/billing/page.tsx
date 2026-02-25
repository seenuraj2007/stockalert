
'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { 
  Plus, Minus, Trash2, Search, X, 
  Package, Barcode, User, CheckCircle, ShoppingCart, 
  History, Percent, Receipt, Zap, Clock, CreditCard,
  Wallet, IndianRupee, QrCode, Calculator, RefreshCw,
  ArrowLeft, Save, FolderOpen, Tag, Grid, List,
  ChevronDown, Move, Edit3, Star, AlertCircle,
  Loader2, Info, Scale, Camera, Smartphone, Shield, Keyboard
} from 'lucide-react'
import QRCode from 'qrcode'
import { memo } from 'react'

// Dynamic import for barcode scanner to avoid SSR issues
const BarcodeScanner = dynamic(() => import('@/components/BarcodeScanner'), {
  ssr: false,
  loading: () => <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
})

// Memoized Product Card Component
const ProductCard = memo(({
  product,
  viewMode,
  onClick
}: {
  product: Product
  viewMode: 'grid' | 'list'
  onClick: (product: Product) => void
}) => {
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    if (product.current_quantity === 0) return
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
    onClick(product)
  }

  const isOutOfStock = product.current_quantity === 0
  const isLowStock = product.current_quantity <= product.reorder_point && !isOutOfStock

  if (viewMode === 'list') {
    return (
      <button
        onClick={handleClick}
        disabled={isOutOfStock}
        className={`w-full p-3 flex items-center gap-3 bg-white rounded-xl border transition-all text-left ${
          isOutOfStock 
            ? 'border-gray-100 opacity-50 cursor-not-allowed' 
            : 'border-gray-200 hover:border-indigo-400 hover:shadow-md active:scale-[0.99]'
        }`}
      >
        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-7 h-7 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{product.name}</p>
          <p className="text-xs text-gray-500">{product.sku || 'No SKU'}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-indigo-600">₹{product.selling_price.toFixed(0)}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isOutOfStock ? 'bg-red-100 text-red-700' : 
            isLowStock ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
          }`}>
            {product.current_quantity}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isOutOfStock}
      className={`relative bg-white rounded-xl border-2 transition-all text-left h-full flex flex-col ${
        isOutOfStock 
          ? 'border-gray-100 opacity-60 cursor-not-allowed' 
          : isLowStock
          ? 'border-orange-200 hover:border-orange-400 hover:shadow-md'
          : 'border-gray-200 hover:border-indigo-400 hover:shadow-lg'
      } ${isClicked ? 'scale-95 bg-indigo-50' : ''}`}
    >
      <div className="aspect-square w-full bg-gray-50 rounded-t-lg flex items-center justify-center relative overflow-hidden">
        <Package className="w-12 h-12 text-gray-300" />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">SOLD OUT</span>
          </div>
        )}
        {isLowStock && !isOutOfStock && (
           <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">LOW</span>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1 flex-1">
          {product.name}
        </p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
          <p className="font-bold text-indigo-600 text-lg">₹{product.selling_price.toFixed(0)}</p>
          <div className="flex items-center gap-1">
            {product.requires_imei && <Smartphone className="w-3 h-3 text-cyan-600" />}
            {product.requires_serial && <Barcode className="w-3 h-3 text-indigo-600" />}
          </div>
        </div>
      </div>
    </button>
  )
})

ProductCard.displayName = 'ProductCard'

// Types (Keeping existing types for brevity, assume they are present)
interface Product {
  id: string; name: string; sku: string | null; barcode: string | null; category: string | null;
  current_quantity: number; reorder_point: number; selling_price: number; unit_cost: number | null;
  unit: string; image_url: string | null; hsn_code?: string | null; gst_rate?: number;
  is_favorite?: boolean; is_perishable?: boolean; expiry_date?: string | null; weight_per_unit?: number;
  min_weight?: number | null; requires_imei?: boolean; requires_serial?: boolean; warranty_months?: number | null;
}

interface CartItem {
  product: Product; quantity: number; unitPrice: number; discount: number;
  taxableAmount: number; cgstAmount: number; sgstAmount: number; igstAmount: number; totalAmount: number;
  serialNumbers?: string[]; weightKg?: number;
}

interface SerialNumberInfo { id: string; serialNumber: string; status: string; warrantyExpiry: string | null; }
interface Customer { id: string; name: string; email: string | null; phone: string | null; address?: string | null; city?: string | null; state?: string | null; pincode?: string | null; gstNumber?: string | null; }
interface SaleResult { success: boolean; invoice?: { id: string; invoiceNumber: string; totalAmount: number; invoiceDate: string; qrCode?: string; }; error?: string; }
interface HeldSale { id: string; cart: CartItem[]; customer: Customer | null; timestamp: Date; total: number; note?: string; }
interface PaymentSplit { method: 'cash' | 'card' | 'upi' | 'credit'; amount: number; reference?: string; }
interface OrganizationSettings { name?: string; address?: string; city?: string; state?: string; pincode?: string; gstNumber?: string; phone?: string; email?: string; upiId?: string; }

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Wallet, color: 'bg-emerald-500' },
  { id: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-500' },
  { id: 'credit', label: 'Credit', icon: CreditCard, color: 'bg-orange-500' },
]

export default function POSPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [showCameraScanner, setShowCameraScanner] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [globalDiscountType, setGlobalDiscountType] = useState<'percent' | 'amount'>('percent')
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [holdNote, setHoldNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState(0)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [organization, setOrganization] = useState<OrganizationSettings>({})
  const [isInterState, setIsInterState] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState<string | null>(null)
  
  // Serial/Weight specific state
  const [showSerialModal, setShowSerialModal] = useState(false)
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false)
  const [selectedProductForSerial, setSelectedProductForSerial] = useState<Product | null>(null)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [selectedProductForWeight, setSelectedProductForWeight] = useState<Product | null>(null)
  const [enteredWeight, setEnteredWeight] = useState('')
  const [availableSerials, setAvailableSerials] = useState<SerialNumberInfo[]>([])
  const [selectedSerials, setSelectedSerials] = useState<string[]>([])
  const [loadingSerials, setLoadingSerials] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showUpiQrModal, setShowUpiQrModal] = useState(false)
  const [upiQrDataUrl, setUpiQrDataUrl] = useState('')
  const [upiPaymentStatus, setUpiPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending')

  // Derived state
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])), [products])
  
  const filteredProducts = useMemo(() => {
    let filtered = products
    if (selectedCategory) filtered = filtered.filter(p => p.category === selectedCategory)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.barcode?.includes(term)
      )
    }
    return filtered
  }, [products, searchTerm, selectedCategory])

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.taxableAmount, 0), [cart])
  const totalDiscount = useMemo(() => globalDiscountType === 'percent' ? subtotal * (globalDiscount / 100) : Math.min(globalDiscount, subtotal), [subtotal, globalDiscount, globalDiscountType])
  const totalGST = useMemo(() => cart.reduce((sum, item) => sum + item.cgstAmount + item.sgstAmount + item.igstAmount, 0), [cart])
  const total = useMemo(() => subtotal - totalDiscount + totalGST, [subtotal, totalDiscount, totalGST])
  const change = useMemo(() => Math.max(0, cashReceived - total), [cashReceived, total])

  // API Calls
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/billing/products?t=${Date.now()}`, { credentials: 'include' })
      if (res.status === 401) { router.push('/auth'); return }
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) { setError('Failed to load products') }
    finally { setLoading(false) }
  }, [router])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers', { credentials: 'include' })
      if (res.ok) { const data = await res.json(); setCustomers(data.customers || []) }
    } catch (err) { console.error(err) }
  }, [])

  const fetchOrganization = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/organization', { credentials: 'include' })
      if (res.ok) { const data = await res.json(); setOrganization(data.organization || {}) }
    } catch (err) { console.error(err) }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchOrganization()
  }, [fetchProducts, fetchCustomers, fetchOrganization])

  useEffect(() => {
    if (selectedCustomer?.state && organization.state) {
      setIsInterState(selectedCustomer.state.toLowerCase() !== organization.state.toLowerCase())
    }
  }, [selectedCustomer, organization])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchInputRef.current?.focus(); }
      if (e.key === 'F3') { e.preventDefault(); setShowScanner(prev => !prev); }
      if (e.key === 'Escape') { 
        setShowMobileCart(false); 
        setShowCustomerSelect(false);
        setShowCompleteModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Helpers
  const calculateItemPrice = (product: Product, qty: number = 1, discount: number = 0) => {
    const taxableAmount = product.selling_price * qty * (1 - discount / 100)
    const gstRate = product.gst_rate || 0
    const gstAmount = taxableAmount * (gstRate / 100)
    if (isInterState) return { taxableAmount, cgstAmount: 0, sgstAmount: 0, igstAmount: gstAmount, totalAmount: taxableAmount + gstAmount }
    return { taxableAmount, cgstAmount: gstAmount / 2, sgstAmount: gstAmount / 2, igstAmount: 0, totalAmount: taxableAmount + gstAmount }
  }

  const addToCart = async (product: Product) => {
    const isWeightBased = product.weight_per_unit && product.weight_per_unit > 0
    if (isWeightBased) {
      setSelectedProductForWeight(product)
      setEnteredWeight('')
      setShowWeightModal(true)
      return
    }

    // Check serials asynchronously
    try {
      const res = await fetch(`/api/serial-numbers?productId=${product.id}&status=IN_STOCK`)
      if (res.ok) {
        const data = await res.json()
        if (data.serialNumbers && data.serialNumbers.length > 0) {
          setSelectedProductForSerial(product)
          setSelectedSerials([])
          setAvailableSerials(data.serialNumbers)
          setShowSerialModal(true)
          return
        }
      }
    } catch (e) { console.error(e) }

    // Standard add
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, ...calculateItemPrice(item.product, item.quantity + 1, item.discount) }
          : item
        )
      }
      return [...prev, { product, quantity: 1, unitPrice: product.selling_price, discount: 0, ...calculateItemPrice(product) }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item
      const newQty = Math.max(0, item.quantity + delta)
      if (newQty === 0) return null
      return { ...item, quantity: newQty, ...calculateItemPrice(item.product, newQty, item.discount) }
    }).filter(Boolean) as CartItem[])
  }

  const clearCart = () => { if (cart.length > 0) setShowClearCartConfirm(true) }
  const performClearCart = () => {
    setCart([]); setGlobalDiscount(0); setSelectedCustomer(null); setCashReceived(0); setShowMobileCart(false); setShowClearCartConfirm(false);
  }

  const holdSale = () => {
    if (cart.length === 0) return
    setHeldSales(prev => [{ id: Date.now().toString(), cart: [...cart], customer: selectedCustomer, timestamp: new Date(), total, note: holdNote }, ...prev])
    performClearCart()
    setShowHoldModal(false); setHoldNote('')
  }

  const recallSale = (held: HeldSale) => {
    setCart(held.cart); setSelectedCustomer(held.customer); setHeldSales(prev => prev.filter(h => h.id !== held.id))
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) return
    if (paymentMethod === 'cash' && cashReceived < total) { setError('Insufficient cash'); return }
    
    setProcessing(true)
    try {
      const items = cart.map(item => ({
        product_id: item.product.id, quantity: item.quantity, unit_price: item.unitPrice, discount: item.discount,
        taxable_amount: item.taxableAmount, cgst_amount: item.cgstAmount, sgst_amount: item.sgstAmount, igst_amount: item.igstAmount,
        total_amount: item.totalAmount, hsn_code: item.product.hsn_code, gst_rate: item.product.gst_rate, serial_numbers: item.serialNumbers,
        description: item.product.name
      }))
      const res = await fetch('/api/invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: selectedCustomer?.id, items, payment_method: paymentMethod, global_discount: globalDiscount, global_discount_type: globalDiscountType })
      })
      const data = await res.json()
      if (data.invoice) {
        setReceiptData({ cart: [...cart], customer: selectedCustomer, subtotal, totalDiscount, totalGST, paymentMethod, cashReceived, change })
        setLastSale({ success: true, invoice: data.invoice })
        setShowReceipt(true)
        performClearCart()
        fetchProducts() // Refresh stock
      } else { setError(data.error || 'Sale failed') }
    } catch (e) { setError('Failed to complete sale') }
    finally { setProcessing(false); setShowCompleteModal(false) }
  }

  const handleUpiPayment = async () => {
    if (!organization.upiId) return
    setShowCompleteModal(false)
    setUpiPaymentStatus('pending')
    setShowUpiQrModal(true)
    const upiUrl = `upi://pay?pa=${organization.upiId}&pn=${encodeURIComponent(organization.name || 'Merchant')}&am=${total.toFixed(2)}&cu=INR`
    try { setUpiQrDataUrl(await QRCode.toDataURL(upiUrl, { width: 250 })) } catch (e) { console.error(e) }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-white border-b flex items-center px-4 gap-4 flex-shrink-0 z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600"/></button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-lg">Point of Sale</h1>
          <p className="text-xs text-gray-500 hidden sm:block">{organization.name || 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 border rounded px-2 py-1">
            <Keyboard className="w-3 h-3"/> F2 Search
          </div>
          <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-2 hover:bg-gray-100 rounded-lg hidden md:block">
            {viewMode === 'grid' ? <List className="w-5 h-5 text-gray-600"/> : <Grid className="w-5 h-5 text-gray-600"/>}
          </button>
          <button onClick={() => setShowHoldModal(true)} className="p-2 hover:bg-gray-100 rounded-lg relative">
            <FolderOpen className="w-5 h-5 text-gray-600"/>
            {heldSales.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] rounded-full flex items-center justify-center">{heldSales.length}</span>}
          </button>
          <button onClick={clearCart} className="p-2 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-500"/>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Products */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {/* Search & Filters */}
          <div className="p-4 bg-white border-b space-y-3 flex-shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                <input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search products... (F2)"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <button onClick={() => setShowCameraScanner(true)} className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600"><Camera className="w-5 h-5"/></button>
              <button onClick={() => fetchProducts()} className="p-2.5 bg-gray-100 rounded-xl"><RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}/></button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setSelectedCategory(null)} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${!selectedCategory ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Barcode Input Toggle */}
          {showScanner && (
            <div className="p-2 bg-indigo-50 border-b flex items-center gap-2">
              <Barcode className="w-5 h-5 text-indigo-600"/>
              <input
                value={scannedBarcode}
                onChange={e => { setScannedBarcode(e.target.value); if(e.target.value.length >= 8) { const p = products.find(p => p.barcode === e.target.value); if(p) addToCart(p); setScannedBarcode(''); }}}
                className="flex-1 bg-white border border-indigo-200 rounded px-3 py-1 text-sm"
                placeholder="Scan barcode..."
                autoFocus
              />
              <button onClick={() => setShowScanner(false)}><X className="w-4 h-4"/></button>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
            {loading ? (
              <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3" 
                : "flex flex-col gap-2"
              }>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} onClick={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart (Desktop) */}
        <div className="hidden lg:flex w-[400px] xl:w-[450px] flex-col border-l bg-white shadow-lg">
          {/* Cart Header */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600"/>
              <h2 className="font-bold text-lg">Current Sale</h2>
            </div>
            <span className="text-sm text-gray-500">{cart.length} items</span>
          </div>

          {/* Customer Selection */}
          <div className="p-3 border-b flex-shrink-0">
            <button onClick={() => setShowCustomerSelect(true)} className="w-full flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-left">
              <User className="w-4 h-4 text-gray-500"/>
              <span className="text-sm font-medium text-gray-800">{selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto"/>
            </button>
          </div>

          {/* Cart Items - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package className="w-12 h-12 mb-2 opacity-50"/>
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.product.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100 group">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm text-gray-800 line-clamp-1">{item.product.name}</p>
                      <p className="font-bold text-sm text-gray-900">₹{item.totalAmount.toFixed(0)}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-white rounded border px-1">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-gray-100 rounded"><Minus className="w-3 h-3"/></button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-3 h-3"/></button>
                      </div>
                      <button onClick={() => setCart(prev => prev.filter(i => i.product.id !== item.product.id))} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity">
                        <Trash2 className="w-3.5 h-3.5 text-red-500"/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer - Totals & Actions */}
          <div className="border-t bg-white p-4 space-y-3 flex-shrink-0">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-₹{totalDiscount.toFixed(0)}</span></div>}
            <div className="flex justify-between text-sm text-gray-600"><span>Tax (GST)</span><span>₹{totalGST.toFixed(0)}</span></div>
            
            <div className="flex gap-2 pt-2">
              <input 
                value={globalDiscount || ''} 
                onChange={e => setGlobalDiscount(Number(e.target.value))} 
                placeholder="Discount" 
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <button onClick={() => setGlobalDiscountType(t => t === 'percent' ? 'amount' : 'percent')} className="px-3 py-2 bg-gray-100 rounded text-xs font-medium">
                {globalDiscountType === 'percent' ? '%' : '₹'}
              </button>
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-indigo-600">₹{total.toFixed(0)}</span>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-colors ${paymentMethod === m.id ? m.color + ' text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <m.icon className="w-4 h-4"/>
                  {m.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input value={cashReceived || ''} onChange={e => setCashReceived(Number(e.target.value))} placeholder="Cash Received" className="w-full pl-8 pr-3 py-2 border rounded text-sm"/>
                </div>
                {cashReceived >= total && <div className="flex justify-between bg-green-50 text-green-700 text-sm p-2 rounded"><span>Change</span><span className="font-bold">₹{change.toFixed(0)}</span></div>}
                {cashReceived > 0 && cashReceived < total && <div className="flex justify-between bg-red-50 text-red-700 text-sm p-2 rounded"><span>Balance</span><span className="font-bold">₹{(total - cashReceived).toFixed(0)}</span></div>}
              </div>
            )}

            <button 
              onClick={() => paymentMethod === 'upi' && organization.upiId ? handleUpiPayment() : setShowCompleteModal(true)}
              disabled={cart.length === 0 || processing || (paymentMethod === 'cash' && cashReceived < total)}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
              Charge ₹{total.toFixed(0)}
            </button>
          </div>
        </div>

        {/* Mobile Cart Toggle */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t flex justify-between items-center z-40">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600"/>
            <span className="font-bold">{cart.length} items</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-indigo-600">₹{total.toFixed(0)}</span>
            <button onClick={() => setShowMobileCart(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">View Cart</button>
          </div>
        </div>

        {/* Mobile Cart Drawer */}
        {showMobileCart && (
          <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setShowMobileCart(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-bold text-lg">Cart</h2>
                <button onClick={() => setShowMobileCart(false)}><X className="w-6 h-6"/></button>
              </div>
              {/* Re-use the Desktop Cart Structure for the mobile drawer content */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.map(item => (
                   <div key={item.product.id} className="flex justify-between items-center mb-3 pb-3 border-b">
                     <div className="flex-1">
                       <p className="font-medium text-sm">{item.product.name}</p>
                       <div className="flex items-center gap-2 mt-1">
                         <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"><Minus className="w-3 h-3"/></button>
                         <span className="text-sm font-bold">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center"><Plus className="w-3 h-3"/></button>
                       </div>
                     </div>
                     <p className="font-bold">₹{item.totalAmount.toFixed(0)}</p>
                   </div>
                ))}
              </div>
              <div className="p-4 border-t bg-gray-50 space-y-3">
                 <div className="flex justify-between font-bold text-lg">
                   <span>Total</span>
                   <span>₹{total.toFixed(0)}</span>
                 </div>
                 <button 
                   onClick={() => { setShowMobileCart(false); setShowCompleteModal(true); }}
                   className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold"
                 >
                   Proceed to Pay
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals (Customer, Complete, Receipt, etc.) - Logic remains similar, styling updated for consistency */}
      
      {/* Customer Selection Modal */}
      {showCustomerSelect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Select Customer</h3>
              <button onClick={() => setShowCustomerSelect(false)}><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <button onClick={() => { setSelectedCustomer(null); setShowCustomerSelect(false); }} className="w-full p-3 text-left hover:bg-gray-50 rounded-lg mb-2 border border-dashed">
                Walk-in Customer
              </button>
              {customers.map(c => (
                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSelect(false); }} className="w-full p-3 text-left hover:bg-gray-50 rounded-lg mb-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Complete Sale Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="p-4 border-b">
              <h3 className="font-bold text-lg text-center">Confirm Payment</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-4xl font-bold text-gray-900 mb-2">₹{total.toFixed(0)}</p>
              <p className="text-gray-500 mb-4">{cart.length} items via {paymentMethod.toUpperCase()}</p>
              
              {paymentMethod === 'cash' && (
                <div className="bg-gray-50 p-3 rounded-lg text-left mb-4">
                  <div className="flex justify-between text-sm mb-1"><span>Cash</span><span>₹{cashReceived.toFixed(0)}</span></div>
                  <div className="flex justify-between text-sm font-bold text-green-600"><span>Change</span><span>₹{change.toFixed(0)}</span></div>
                </div>
              )}

              <button 
                onClick={handleCompleteSale}
                disabled={processing}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5"/>}
                {processing ? 'Processing...' : 'Complete Sale'}
              </button>
              <button onClick={() => setShowCompleteModal(false)} className="w-full mt-2 py-2 text-gray-500 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600"/>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Success!</h2>
            <p className="text-gray-500 mb-4">Invoice #{lastSale.invoice?.invoiceNumber}</p>
            <p className="text-3xl font-bold text-indigo-600 mb-6">₹{lastSale.invoice?.totalAmount.toFixed(0)}</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowReceipt(false); setCart([]); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium">New Sale</button>
              <button onClick={() => window.print()} className="flex-1 py-2 border border-gray-300 rounded-lg font-medium">Print</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Camera Scanner */}
      {showCameraScanner && <BarcodeScanner onDetected={code => { const p = products.find(p => p.barcode === code); if(p) addToCart(p); setShowCameraScanner(false); }} onClose={() => setShowCameraScanner(false)} />}

      {/* Weight Modal */}
      {showWeightModal && selectedProductForWeight && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-xs p-6">
             <h3 className="font-bold mb-4 text-center">{selectedProductForWeight.name}</h3>
             <input 
               type="number" value={enteredWeight} onChange={e => setEnteredWeight(e.target.value)}
               placeholder="Weight in Kg" className="w-full border rounded p-2 text-center text-xl mb-2" autoFocus
             />
             <p className="text-center text-sm text-gray-500 mb-4">Price: ₹{(parseFloat(enteredWeight || '0') * selectedProductForWeight.selling_price).toFixed(0)}</p>
             <div className="flex gap-2">
                <button onClick={() => setShowWeightModal(false)} className="flex-1 py-2 border rounded">Cancel</button>
                <button 
                  onClick={() => {
                     const w = parseFloat(enteredWeight);
                     if(w > 0) {
                       setCart(prev => [...prev, {
                         product: selectedProductForWeight, quantity: 1, unitPrice: selectedProductForWeight.selling_price, discount: 0,
                         weightKg: w, taxableAmount: w * selectedProductForWeight.selling_price, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalAmount: w * selectedProductForWeight.selling_price
                       }])
                       setShowWeightModal(false)
                     }
                  }}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded"
                >Add</button>
             </div>
           </div>
         </div>
      )}

       {/* Clear Cart Confirm */}
       {showClearCartConfirm && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl w-full max-w-xs p-6 text-center">
             <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3"/>
             <h3 className="font-bold mb-2">Clear Cart?</h3>
             <p className="text-sm text-gray-500 mb-4">Remove all {cart.length} items?</p>
             <div className="flex gap-2">
               <button onClick={() => setShowClearCartConfirm(false)} className="flex-1 py-2 border rounded">Cancel</button>
               <button onClick={performClearCart} className="flex-1 py-2 bg-red-600 text-white rounded">Clear</button>
             </div>
           </div>
         </div>
       )}
    </div>
  )
}
