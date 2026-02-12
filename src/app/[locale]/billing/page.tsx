'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Minus, Trash2, Search, X, 
  Package, Barcode, User, CheckCircle, ShoppingCart, 
  History, Percent, Receipt, Zap,
  ChevronRight, Save, ArrowLeft, IndianRupee,
  FileText, QrCode, Calculator
} from 'lucide-react'
import { SubscriptionGate } from '@/components/SubscriptionGate'
import QRCode from 'qrcode'

interface Product {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  category: string | null
  current_quantity: number
  reorder_point: number
  selling_price: number
  unit_cost: number | null
  unit: string
  image_url: string | null
  hsn_code?: string | null
  gst_rate?: number
}

interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  totalAmount: number
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  gstNumber?: string | null
}

interface SaleResult {
  success: boolean
  invoice?: {
    id: string
    invoiceNumber: string
    totalAmount: number
    invoiceDate: string
    qrCode?: string
  }
  error?: string
}

interface HeldSale {
  id: string
  cart: CartItem[]
  customer: Customer | null
  timestamp: Date
  total: number
}

interface GSTBreakdown {
  cgstRate: number
  sgstRate: number
  igstRate: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
}

interface OrganizationSettings {
  name?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  phone?: string
  email?: string
}

// GST Rate configurations
const GST_RATES = [0, 5, 12, 18, 28]

// Default state for intra-state transactions (CGST + SGST)
const DEFAULT_STATE = 'Karnataka'

export default function BillingPage() {
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)
  const customerSearchRef = useRef<HTMLInputElement>(null)
  const lastItemRef = useRef<HTMLDivElement>(null)
  
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<SaleResult | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [heldSales, setHeldSales] = useState<HeldSale[]>([])
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState(0)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showOrderType, setShowOrderType] = useState(false)
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in')
  const [recentItems, setRecentItems] = useState<CartItem[]>([])
  const [addedItems, setAddedItems] = useState<string[]>([])
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(true)
  const [organization, setOrganization] = useState<OrganizationSettings>({})
  const [isInterState, setIsInterState] = useState(false)
  const [showGstDetails, setShowGstDetails] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  const categories = useMemo(() => 
    Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])),
    [products]
  )

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/products')
      if (res.status === 401) {
        router.push('/auth')
        return
      }
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
        setFilteredCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }, [])

  const fetchOrganization = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/organization')
      if (res.ok) {
        const data = await res.json()
        setOrganization(data.organization || {})
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCustomers()
    fetchOrganization()
    searchInputRef.current?.focus()
  }, [fetchProducts, fetchCustomers, fetchOrganization])

  // Check if transaction is inter-state when customer changes
  useEffect(() => {
    if (selectedCustomer?.state && organization.state) {
      setIsInterState(selectedCustomer.state.toLowerCase() !== organization.state.toLowerCase())
    } else {
      setIsInterState(false)
    }
  }, [selectedCustomer, organization.state])

  useEffect(() => {
    if (showCustomerSelect && customerSearchRef.current) {
      setTimeout(() => customerSearchRef.current?.focus(), 100)
    }
  }, [showCustomerSelect])

  useEffect(() => {
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
    )
    setFilteredCustomers(filtered)
  }, [customerSearch, customers])

  useEffect(() => {
    if (showScanner && barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }, [showScanner])

  useEffect(() => {
    if (showScanner && scannedBarcode) {
      const product = products.find(p => p.barcode === scannedBarcode || p.sku === scannedBarcode)
      if (product) {
        addToCart(product)
        setScannedBarcode('')
        setShowScanner(false)
      }
    }
  }, [scannedBarcode, products, showScanner])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          setShowCompleteModal(false)
          setShowCustomerSelect(false)
          setShowHoldModal(false)
          setShowDiscountModal(false)
          setShowOrderType(false)
          setShowGstDetails(false)
        }
        return
      }

      if (e.key === 'Escape') {
        setShowScanner(false)
        return
      }

      if (e.key === 'F8') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'F9') {
        e.preventDefault()
        setShowScanner(true)
      }
      if (e.key === 'F1') {
        e.preventDefault()
        clearCart()
      }
      if (e.key === 'F10' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault()
        if (cart.length > 0) setShowCompleteModal(true)
      }
      if (e.key === '+' && !e.ctrlKey && cart.length > 0) {
        e.preventDefault()
        const firstItem = cart[0]
        updateQuantity(firstItem.product.id, firstItem.quantity + 1)
      }
      if (e.key === '-' && !e.ctrlKey && cart.length > 0) {
        e.preventDefault()
        const firstItem = cart[0]
        updateQuantity(firstItem.product.id, firstItem.quantity - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length])

  // Calculate GST for a cart item
  const calculateGST = (item: CartItem, interState: boolean): GSTBreakdown => {
    const gstRate = item.product.gst_rate || 0
    const taxableAmount = (item.unitPrice * item.quantity) - item.discount
    
    if (interState) {
      // Inter-state: IGST only
      const igstAmount = (taxableAmount * gstRate) / 100
      return {
        cgstRate: 0,
        sgstRate: 0,
        igstRate: gstRate,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount
      }
    } else {
      // Intra-state: CGST + SGST (50% each)
      const halfRate = gstRate / 2
      const cgstAmount = (taxableAmount * halfRate) / 100
      const sgstAmount = (taxableAmount * halfRate) / 100
      return {
        cgstRate: halfRate,
        sgstRate: halfRate,
        igstRate: 0,
        cgstAmount,
        sgstAmount,
        igstAmount: 0
      }
    }
  }

  const addToCart = (product: Product) => {
    if (product.current_quantity <= 0) return

    const unitPrice = product.selling_price
    const quantity = 1
    const discount = 0
    const taxableAmount = (unitPrice * quantity) - discount
    const gstRate = product.gst_rate || 0
    const halfRate = gstRate / 2
    
    let cgstAmount = 0
    let sgstAmount = 0
    let igstAmount = 0
    
    if (isInterState) {
      igstAmount = (taxableAmount * gstRate) / 100
    } else {
      cgstAmount = (taxableAmount * halfRate) / 100
      sgstAmount = (taxableAmount * halfRate) / 100
    }

    const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.current_quantity) return prev
        const newQuantity = existing.quantity + 1
        const newTaxable = (existing.unitPrice * newQuantity) - existing.discount
        const newGST = calculateGST({ ...existing, quantity: newQuantity }, isInterState)
        
        return prev.map(item =>
          item.product.id === product.id
            ? { 
                ...item, 
                quantity: newQuantity,
                taxableAmount: newTaxable,
                cgstAmount: newGST.cgstAmount,
                sgstAmount: newGST.sgstAmount,
                igstAmount: newGST.igstAmount,
                totalAmount: newTaxable + newGST.cgstAmount + newGST.sgstAmount + newGST.igstAmount
              }
            : item
        )
      }
      return [...prev, {
        product,
        quantity,
        unitPrice,
        discount,
        taxableAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount
      }]
    })

    setAddedItems(prev => [...prev.slice(-5), product.id])
    setTimeout(() => {
      setAddedItems(prev => prev.filter(id => id !== product.id))
    }, 300)

    setRecentItems(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ).slice(0, 6)
      }
      return [{ product, quantity: 1, unitPrice, discount, taxableAmount, cgstAmount, sgstAmount, igstAmount, totalAmount }, ...prev].slice(0, 6)
    })

    lastItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  const updateQuantity = useCallback((productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
      return
    }

    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item
      
      const taxableAmount = (item.unitPrice * newQuantity) - item.discount
      const gstBreakdown = calculateGST({ ...item, quantity: newQuantity }, isInterState)
      
      return {
        ...item,
        quantity: newQuantity,
        taxableAmount,
        cgstAmount: gstBreakdown.cgstAmount,
        sgstAmount: gstBreakdown.sgstAmount,
        igstAmount: gstBreakdown.igstAmount,
        totalAmount: taxableAmount + gstBreakdown.cgstAmount + gstBreakdown.sgstAmount + gstBreakdown.igstAmount
      }
    }))
  }, [isInterState])

  const updateDiscount = (productId: string, discount: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item
      
      const maxDiscount = item.unitPrice * item.quantity
      const newDiscount = Math.max(0, Math.min(discount, maxDiscount))
      const taxableAmount = (item.unitPrice * item.quantity) - newDiscount
      const gstBreakdown = calculateGST({ ...item, discount: newDiscount }, isInterState)
      
      return {
        ...item,
        discount: newDiscount,
        taxableAmount,
        cgstAmount: gstBreakdown.cgstAmount,
        sgstAmount: gstBreakdown.sgstAmount,
        igstAmount: gstBreakdown.igstAmount,
        totalAmount: taxableAmount + gstBreakdown.cgstAmount + gstBreakdown.sgstAmount + gstBreakdown.igstAmount
      }
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setGlobalDiscount(0)
    setCashReceived(0)
  }

  const holdSale = () => {
    if (cart.length === 0) return
    
    const total = cart.reduce((sum, item) => sum + item.totalAmount, 0)
    
    const heldSale: HeldSale = {
      id: Date.now().toString(),
      cart: [...cart],
      customer: selectedCustomer,
      timestamp: new Date(),
      total
    }
    setHeldSales(prev => [heldSale, ...prev])
    clearCart()
    setShowHoldModal(false)
  }

  const recallSale = (held: HeldSale) => {
    setCart(held.cart)
    setSelectedCustomer(held.customer)
    setShowHoldModal(false)
  }

  const deleteHeldSale = (id: string) => {
    setHeldSales(prev => prev.filter(h => h.id !== id))
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0)
  const globalDiscAmount = ((subtotal - itemDiscounts) * globalDiscount) / 100
  const totalDiscount = itemDiscounts + globalDiscAmount
  const totalTaxableAmount = cart.reduce((sum, item) => sum + item.taxableAmount, 0)
  const totalCgst = cart.reduce((sum, item) => sum + item.cgstAmount, 0)
  const totalSgst = cart.reduce((sum, item) => sum + item.sgstAmount, 0)
  const totalIgst = cart.reduce((sum, item) => sum + item.igstAmount, 0)
  const totalGst = totalCgst + totalSgst + totalIgst
  const total = cart.reduce((sum, item) => sum + item.totalAmount, 0) - globalDiscAmount
  const change = Math.max(0, cashReceived - total)

  // Update cart GST when inter-state status changes
  useEffect(() => {
    if (cart.length > 0) {
      setCart(prev => prev.map(item => {
        const gstBreakdown = calculateGST(item, isInterState)
        return {
          ...item,
          cgstAmount: gstBreakdown.cgstAmount,
          sgstAmount: gstBreakdown.sgstAmount,
          igstAmount: gstBreakdown.igstAmount,
          totalAmount: item.taxableAmount + gstBreakdown.cgstAmount + gstBreakdown.sgstAmount + gstBreakdown.igstAmount
        }
      }))
    }
  }, [isInterState])

  useEffect(() => {
    if (cart.length > 0 && paymentMethod === 'cash' && cashReceived === 0) {
      setCashReceived(Math.ceil(total))
    }
    if (cart.length > 0) {
      setIsMobileCartOpen(true)
    }
  }, [cart.length, paymentMethod, total, cashReceived])

  // Generate QR Code for e-invoicing
  const generateQRCode = async (invoiceData: any) => {
    try {
      const qrData = {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        totalAmount: invoiceData.totalAmount,
        gstNumber: organization.gstNumber,
        items: invoiceData.items.length
      }
      const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData))
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0 || (paymentMethod === 'cash' && cashReceived < total)) return

    setProcessing(true)

    try {
      const items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        hsn_code: item.product.hsn_code,
        gst_rate: item.product.gst_rate || 0,
        cgst_amount: item.cgstAmount,
        sgst_amount: item.sgstAmount,
        igst_amount: item.igstAmount,
        taxable_amount: item.taxableAmount,
        total_amount: item.totalAmount
      }))

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id,
          items,
          payment_method: paymentMethod,
          global_discount: globalDiscount,
          is_inter_state: isInterState,
          total_cgst: totalCgst,
          total_sgst: totalSgst,
          total_igst: totalIgst,
          total_gst: totalGst,
          subtotal: totalTaxableAmount,
          total_amount: total,
          notes: `Order Type: ${orderType}`
        })
      })

      const data = await res.json()

      if (res.ok) {
        await generateQRCode(data.invoice)
        setLastSale({ 
          success: true, 
          invoice: {
            ...data.invoice,
            qrCode: qrCodeDataUrl
          }
        })
        setShowReceipt(true)
        clearCart()
        fetchProducts()
      } else {
        setLastSale({ success: false, error: data.error || 'Sale failed'})
      }
    } catch (error) {
      console.error('Error completing sale:', error)
      setLastSale({ success: false, error: 'Network error' })
    } finally {
      setProcessing(false)
      setShowCompleteModal(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.includes(searchTerm) ||
      product.hsn_code?.includes(searchTerm)
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleBarcodeScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const barcode = e.target.value
    if (barcode.length >= 8) {
      const product = products.find(p => p.barcode === barcode || p.sku === barcode)
      if (product) {
        addToCart(product)
        setSearchTerm('')
      }
    }
    setSearchTerm(barcode)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <SubscriptionGate>
      <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Point of Sale</h1>
                <p className="text-xs sm:text-sm text-gray-500">GST-Ready Billing</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {organization.gstNumber && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">GST: {organization.gstNumber}</span>
                </div>
              )}
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    const cartSection = document.getElementById('cart-section')
                    cartSection?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="lg:hidden flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="text-sm font-semibold">{cart.length}</span>
                </button>
              )}
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Barcode className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <span className="hidden sm:inline font-medium text-gray-700">Scan</span>
              </button>
              <button
                onClick={() => setShowHoldModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <span className="hidden sm:inline font-medium text-gray-700">Hold</span>
                {heldSales.length > 0 && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs sm:text-sm font-bold">
                    {heldSales.length}
                  </span>
                )}
              </button>
              <button
                onClick={clearCart}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                <span className="hidden sm:inline font-medium text-red-600">Clear</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
          {/* Product Grid */}
          <div className="flex-1 flex flex-col overflow-hidden order-2 lg:order-1">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, SKU, barcode, or HSN..."
                    className="w-full pl-11 pr-11 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    !selectedCategory 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Items
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {recentItems.length > 0 && !searchTerm && !selectedCategory && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 text-sm font-semibold">Quick add:</span>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {recentItems.map(item => (
                    <button
                      key={item.product.id}
                      onClick={() => addToCart(item.product)}
                      className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow whitespace-nowrap"
                    >
                      <span className="text-gray-900 font-medium">{item.product.name}</span>
                      <span className="text-gray-400">×{item.quantity}</span>
                      {item.product.gst_rate ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{item.product.gst_rate}% GST</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Package className="w-20 h-20 mb-4" />
                  <p className="text-xl font-medium text-gray-600">No products found</p>
                  <p className="text-sm">Add products to start selling</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredProducts.map(product => {
                    const isAdded = addedItems.includes(product.id)
                    const isLowStock = product.current_quantity <= 5 && product.current_quantity > 0
                    const isOutOfStock = product.current_quantity <= 0
                    
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-xl hover:-translate-y-1 ${
                          isOutOfStock 
                            ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                            : isAdded
                              ? 'bg-green-50 border-green-400 shadow-lg'
                              : 'bg-white border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {isAdded && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                        )}
                        
                        {/* GST Badge */}
                        {product.gst_rate ? (
                          <div className="absolute -top-2 -left-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full shadow-md">
                            {product.gst_rate}%
                          </div>
                        ) : null}
                        
                        <div className={`aspect-square rounded-xl mb-3 flex items-center justify-center ${
                          isOutOfStock ? 'bg-gray-100' : 'bg-gray-50'
                        }`}>
                          {product.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package className="w-12 h-12 text-gray-300" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                          {product.name}
                        </h3>
                        
                        {/* HSN Code */}
                        {product.hsn_code && (
                          <p className="text-xs text-gray-500 mb-1">HSN: {product.hsn_code}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-indigo-600">
                            ₹{Number(product.selling_price || 0).toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-600' 
                              : isLowStock 
                                ? 'bg-amber-100 text-amber-600' 
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isOutOfStock ? 'Out' : isLowStock ? `Low: ${product.current_quantity}` : product.current_quantity}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div id="cart-section" className="w-full sm:w-80 md:w-96 lg:flex-1 xl:w-96 bg-white shadow-xl flex flex-col border-l border-gray-200 order-1 lg:order-2 fixed lg:relative bottom-0 left-0 right-0 z-40 lg:z-auto lg:h-auto">
            {/* Mobile Cart Toggle */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-semibold">{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
                {cart.length > 0 && (
                  <span className="text-indigo-200">₹{total.toFixed(2)}</span>
                )}
              </div>
              <button
                onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
                className="flex items-center gap-2 text-sm bg-indigo-700 px-3 py-1.5 rounded-lg"
              >
                <span>{isMobileCartOpen ? 'Hide' : 'Show'} cart</span>
                {isMobileCartOpen ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4 -rotate-90" />}
              </button>
            </div>

            {/* Cart Content */}
            <div className={`flex-1 flex flex-col lg:flex overflow-hidden transition-all duration-300 ${isMobileCartOpen ? 'h-[calc(100vh-140px)] lg:h-auto' : 'h-0 lg:h-auto overflow-visible'}`}>
              {/* Desktop header */}
              <div className="p-4 border-b border-gray-100 hidden lg:block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Current Sale</h2>
                      <p className="text-sm text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderType(true)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      orderType === 'dine-in' ? 'bg-green-100 text-green-700' :
                      orderType === 'takeaway' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {orderType === 'dine-in' ? '🍽️ Dine In' : orderType === 'takeaway' ? '🥡 Takeaway' : '🚗 Delivery'}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                    <ShoppingCart className="w-16 h-16 mb-4 text-gray-200" />
                    <p className="text-lg font-medium text-gray-500">Your cart is empty</p>
                    <p className="text-sm text-gray-400">Tap products to add them</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {cart.map((item, index) => (
                      <div 
                        key={item.product.id} 
                        ref={index === cart.length - 1 ? lastItemRef : null}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-3">
                            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">
                              ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                              {item.product.hsn_code && (
                                <span className="ml-2 text-xs text-blue-600">HSN: {item.product.hsn_code}</span>
                              )}
                            </p>
                            {item.product.gst_rate ? (
                              <p className="text-xs text-blue-600">
                                GST {item.product.gst_rate}% 
                                {!isInterState ? (
                                  <span className="text-gray-500"> (CGST {(item.product.gst_rate/2).toFixed(1)}% + SGST {(item.product.gst_rate/2).toFixed(1)}%)</span>
                                ) : (
                                  <span className="text-gray-500"> (IGST {item.product.gst_rate}%)</span>
                                )}
                              </p>
                            ) : null}
                            {item.discount > 0 && (
                              <p className="text-green-600 text-xs">Discount: -₹{item.discount.toFixed(2)}</p>
                            )}
                          </div>
                          <p className="font-bold text-gray-900 text-lg">
                            ₹{item.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <input
                            ref={quantityInputRef}
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center py-2 bg-gray-100 rounded-lg font-semibold"
                            min="1"
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="ml-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Cart Footer with GST Breakdown */}
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <Percent className="w-4 h-4" />
                      Discount
                    </span>
                    <span className="font-medium">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Amount</span>
                  <span className="font-medium">₹{totalTaxableAmount.toFixed(2)}</span>
                </div>
                
                {/* GST Breakdown */}
                {totalCgst > 0 && (
                  <div className="flex justify-between text-blue-600 text-sm">
                    <span>CGST</span>
                    <span className="font-medium">₹{totalCgst.toFixed(2)}</span>
                  </div>
                )}
                {totalSgst > 0 && (
                  <div className="flex justify-between text-blue-600 text-sm">
                    <span>SGST</span>
                    <span className="font-medium">₹{totalSgst.toFixed(2)}</span>
                  </div>
                )}
                {totalIgst > 0 && (
                  <div className="flex justify-between text-blue-600 text-sm">
                    <span>IGST</span>
                    <span className="font-medium">₹{totalIgst.toFixed(2)}</span>
                  </div>
                )}
                
                {totalGst > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold text-sm border-t border-gray-200 pt-1">
                    <span>Total GST</span>
                    <span>₹{totalGst.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                
                {/* GST Badge */}
                {totalGst > 0 && (
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      <FileText className="w-3 h-3" />
                      GST Invoice
                      {isInterState && <span className="text-blue-500">(Inter-State)</span>}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowCustomerSelect(true)}
                  className="py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  {selectedCustomer ? selectedCustomer.name.split(' ')[0] : 'Customer'}
                </button>
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className={`py-3 border-2 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    globalDiscount > 0 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Percent className="w-5 h-5" />
                  {globalDiscount > 0 ? `${globalDiscount}% Off` : 'Discount'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['cash', 'card', 'upi'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      paymentMethod === method
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {method === 'cash' && '💵 Cash'}
                    {method === 'card' && '💳 Card'}
                    {method === 'upi' && '📱 UPI'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'cash' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={cashReceived || ''}
                        onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                        placeholder="Cash received"
                        className="w-full py-3 pl-10 pr-3 bg-white border-2 border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => setCashReceived(Math.ceil(total))}
                      className="px-4 py-3 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Exact
                    </button>
                  </div>
                  {cashReceived > 0 && (
                    <div className="flex justify-between p-4 bg-green-100 rounded-xl border-2 border-green-200">
                      <span className="text-green-700 font-semibold flex items-center gap-2">
                        <IndianRupee className="w-5 h-5" />
                        Change Due
                      </span>
                      <span className="text-2xl font-bold text-green-700">₹{change.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={cart.length === 0 || processing}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {processing ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Pay ₹{total.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showScanner && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Barcode className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Scan Barcode</h3>
                    <p className="text-sm text-gray-500">Point scanner at barcode</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowScanner(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <input
                ref={barcodeInputRef}
                type="text"
                value={searchTerm}
                onChange={handleBarcodeScan}
                placeholder="Type or scan barcode..."
                className="w-full px-4 py-4 bg-gray-100 border-0 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-3 text-center">
                Or use a barcode scanner to automatically detect products
              </p>
            </div>
          </div>
        )}

        {showCustomerSelect && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Select Customer</h3>
                <button
                  onClick={() => setShowCustomerSelect(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={customerSearchRef}
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No customers found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setShowCustomerSelect(false)
                        }}
                        className="w-full p-4 text-left rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-lg">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            {(customer.email || customer.phone) && (
                              <p className="text-sm text-gray-500">
                                {customer.email} {customer.phone && `• ${customer.phone}`}
                              </p>
                            )}
                            {customer.gstNumber && (
                              <p className="text-xs text-blue-600 font-medium">GST: {customer.gstNumber}</p>
                            )}
                            {customer.state && (
                              <p className="text-xs text-gray-400">{customer.state}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showCompleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Complete Sale</h3>
                  <p className="text-gray-500">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              {/* GST Summary */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">GST Invoice Summary</span>
                </div>
                <div className="space-y-1 text-sm">
                  {organization.gstNumber && (
                    <p className="text-blue-700">Seller GST: {organization.gstNumber}</p>
                  )}
                  {selectedCustomer?.gstNumber && (
                    <p className="text-blue-700">Customer GST: {selectedCustomer.gstNumber}</p>
                  )}
                  <p className="text-blue-600">
                    Transaction Type: {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3 py-4 border-t border-b border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxable Amount</span>
                  <span className="font-semibold">₹{totalTaxableAmount.toFixed(2)}</span>
                </div>
                
                {/* GST Details */}
                {totalCgst > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>CGST</span>
                    <span>₹{totalCgst.toFixed(2)}</span>
                  </div>
                )}
                {totalSgst > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>SGST</span>
                    <span>₹{totalSgst.toFixed(2)}</span>
                  </div>
                )}
                {totalIgst > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>IGST</span>
                    <span>₹{totalIgst.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-blue-700 font-semibold">
                  <span>Total GST</span>
                  <span>₹{totalGst.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
              
              {paymentMethod === 'cash' && cashReceived > 0 && (
                <>
                  <div className="flex justify-between p-4 bg-green-50 rounded-xl mt-4">
                    <span className="text-green-700 font-semibold">Cash Received</span>
                    <span className="font-bold text-green-700">₹{cashReceived.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-green-100 rounded-xl mt-2">
                    <span className="text-green-800 font-bold">Change</span>
                    <span className="text-2xl font-bold text-green-800">₹{change.toFixed(2)}</span>
                  </div>
                </>
              )}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-4 bg-gray-100 rounded-xl font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteSale}
                  disabled={processing}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Generate GST Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showHoldModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Held Sales</h3>
                <button
                  onClick={() => setShowHoldModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {heldSales.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">No held sales</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {heldSales.map(held => (
                      <div key={held.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex justify-between mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{held.cart.length} items</span>
                            <p className="text-sm text-gray-500">
                              {new Date(held.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xl font-bold text-indigo-600">₹{held.total.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => recallSale(held)}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                          >
                            Recall
                          </button>
                          <button
                            onClick={() => deleteHeldSale(held.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showDiscountModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Apply Discount</h3>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[5, 10, 15, 20, 25, 50].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setGlobalDiscount(pct)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      globalDiscount === pct
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                placeholder="Custom percentage"
                className="w-full px-4 py-4 bg-gray-100 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setShowDiscountModal(false)}
                className="w-full py-4 mt-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Apply Discount
              </button>
            </div>
          </div>
        )}

        {showOrderType && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Order Type</h3>
                <button
                  onClick={() => setShowOrderType(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'dine-in', icon: '🍽️', label: 'Dine In', desc: 'Customer eats at the restaurant' },
                  { type: 'takeaway', icon: '🥡', label: 'Takeaway', desc: 'Customer picks up the order' },
                  { type: 'delivery', icon: '🚗', label: 'Delivery', desc: 'Order delivered to customer' }
                ].map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setOrderType(opt.type as any)
                      setShowOrderType(false)
                    }}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      orderType === opt.type
                        ? 'bg-indigo-50 border-2 border-indigo-300'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{opt.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-sm text-gray-500">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GST Invoice Receipt */}
        {showReceipt && lastSale && lastSale.success && lastSale.invoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                {/* Success Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">GST Invoice Generated!</h3>
                    <p className="text-gray-500">{lastSale.invoice.invoiceNumber}</p>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="border-2 border-gray-200 rounded-xl p-4 space-y-4">
                  {/* Business Info */}
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h4 className="font-bold text-lg text-gray-900">{organization.name || 'Your Business'}</h4>
                    {organization.address && <p className="text-sm text-gray-600">{organization.address}</p>}
                    {organization.city && organization.state && (
                      <p className="text-sm text-gray-600">{organization.city}, {organization.state} {organization.pincode}</p>
                    )}
                    {organization.gstNumber && (
                      <p className="text-sm font-semibold text-blue-600 mt-1">GSTIN: {organization.gstNumber}</p>
                    )}
                  </div>

                  {/* Invoice Info */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Invoice No:</span>
                    <span className="font-semibold">{lastSale.invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span>{new Date(lastSale.invoice.invoiceDate).toLocaleString()}</span>
                  </div>
                  {selectedCustomer && (
                    <>
                      <div className="border-t border-gray-200 pt-2">
                        <span className="text-gray-600 text-sm">Bill To:</span>
                        <p className="font-semibold">{selectedCustomer.name}</p>
                        {selectedCustomer.gstNumber && (
                          <p className="text-sm text-blue-600">GSTIN: {selectedCustomer.gstNumber}</p>
                        )}
                        {selectedCustomer.address && (
                          <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
                        )}
                        {selectedCustomer.state && (
                          <p className="text-sm text-gray-600">{selectedCustomer.state}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Items */}
                  <div className="border-t border-gray-200 pt-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-600 border-b border-gray-200">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-2">
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                {item.product.hsn_code && (
                                  <p className="text-xs text-gray-500">HSN: {item.product.hsn_code}</p>
                                )}
                                {item.product.gst_rate && (
                                  <p className="text-xs text-blue-600">GST {item.product.gst_rate}%</p>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">₹{item.unitPrice.toFixed(2)}</td>
                            <td className="text-right py-2 font-medium">₹{item.totalAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount</span>
                        <span>-₹{totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxable Amount</span>
                      <span>₹{totalTaxableAmount.toFixed(2)}</span>
                    </div>
                    
                    {/* GST Breakdown */}
                    {totalCgst > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>CGST</span>
                        <span>₹{totalCgst.toFixed(2)}</span>
                      </div>
                    )}
                    {totalSgst > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>SGST</span>
                        <span>₹{totalSgst.toFixed(2)}</span>
                      </div>
                    )}
                    {totalIgst > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>IGST</span>
                        <span>₹{totalIgst.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm font-semibold text-blue-700">
                      <span>Total GST</span>
                      <span>₹{totalGst.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Grand Total</span>
                      <span className="text-indigo-600">₹{total.toFixed(2)}</span>
                    </div>
                    
                    {/* GST Badge */}
                    <div className="flex justify-center pt-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <FileText className="w-3 h-3" />
                        GST Invoice Generated
                      </span>
                    </div>
                  </div>

                  {/* QR Code for E-Invoicing */}
                  {qrCodeDataUrl && (
                    <div className="border-t border-gray-200 pt-4 flex flex-col items-center">
                      <p className="text-sm text-gray-600 mb-2">Scan for E-Invoice</p>
                      <img src={qrCodeDataUrl} alt="E-Invoice QR Code" className="w-32 h-32" />
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-semibold capitalize">{paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => {
                      window.print()
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-5 h-5" />
                    Print Invoice
                  </button>
                  <button
                    onClick={() => {
                      setShowReceipt(false)
                      setQrCodeDataUrl('')
                    }}
                    className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SubscriptionGate>
  )
}
