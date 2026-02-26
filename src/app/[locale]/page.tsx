'use client'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
  Package, TrendingDown, AlertTriangle, Bell, MapPin, Truck, BarChart3, Shield, Zap, ArrowRight, CheckCircle,
  ChevronRight, Layers, Target, Sparkles, Cpu, Lock, Database, Code2, Globe, Server, Receipt, QrCode, FileText,
  IndianRupee, Building2, UserPlus, MessageSquare, Smartphone, Download, Languages, Star, TrendingUp, Check, Clock, Github, Heart, Menu, X
} from 'lucide-react'

// --- Data Constants ---
const stats = [
  { label: 'Products Tracked', value: '156', change: '+12 this week', color: 'from-blue-500 to-blue-600', Icon: Package },
  { label: 'Low Stock Items', value: '8', change: 'Action needed', color: 'from-yellow-500 to-orange-500', Icon: TrendingDown },
  { label: 'Out of Stock', value: '2', change: 'Restock ASAP', color: 'from-red-500 to-red-600', Icon: AlertTriangle },
  { label: 'Stock Value (₹)', value: '₹2.4L', change: '+₹45K', color: 'from-green-500 to-green-600', Icon: IndianRupee },
]

const alerts = [
  { name: 'Aashirvaad Atta (5kg)', stock: 4, reorder: 20, status: 'critical' },
  { name: 'Patanjali Honey (500g)', stock: 6, reorder: 50, status: 'warning' },
  { name: 'MDH Masala (100g)', stock: 15, reorder: 100, status: 'warning' },
]

const features = [
  {
    icon: Github,
    title: 'Open Source',
    description: 'Transparent, secure, and community-driven. Fork on GitHub, contribute, or host your own instance.',
    size: 'wide',
    glow: 'from-green-500/20 to-emerald-500/20',
    badge: 'FREE FOREVER'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Alerts',
    description: 'Coming Soon: Get instant low stock alerts on WhatsApp. Stay tuned for this feature!',
    size: 'wide',
    glow: 'from-green-500/20 to-emerald-500/20',
    badge: 'COMING SOON'
  },
  {
    icon: Download,
    title: '1-Click Tally Import',
    description: 'Migrate from Tally in seconds, not hours. Import products, stock levels, and GST details.',
    size: 'normal',
    glow: 'from-blue-500/20 to-cyan-500/20',
    badge: 'GAME CHANGER'
  },
  {
    icon: Package,
    title: 'Real-time Tracking',
    description: 'Track inventory levels across multiple warehouses in real-time.',
    size: 'normal',
    glow: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    icon: Languages,
    title: 'Multi-Language',
    description: 'Built with internationalization support for global growth.',
    size: 'normal',
    glow: 'from-orange-500/20 to-red-500/20',
    badge: 'I18N READY'
  },
  {
    icon: Receipt,
    title: 'GST Invoicing',
    description: 'Generate GST-compliant invoices automatically with HSN codes.',
    size: 'normal',
    glow: 'from-green-500/20 to-emerald-500/20'
  },
]

const competitorFeatures = [
  { name: 'DKS StockAlert', price: '₹0', whatsapp: 'coming', tally: true, free: true },
  { name: 'Zoho Inventory', price: '₹749/mo', whatsapp: false, tally: false, free: false },
  { name: 'Marg ERP', price: '₹18,000', whatsapp: false, tally: false, free: false },
  { name: 'Tally', price: '₹54,000', whatsapp: false, tally: false, free: false },
]

const howItWorksSteps = [
  { step: '01', title: 'Import Data', desc: 'Migrate Tally data in 1 click or add products manually.', icon: Download },
  { step: '02', title: 'Setup Alerts', desc: 'Configure notifications for low stock items.', icon: Bell },
  { step: '03', title: 'Track & Manage', desc: 'Monitor stock levels and generate invoices effortlessly.', icon: Languages },
]

const techStack = [
  { name: 'Next.js 16', icon: Code2, color: 'text-white' },
  { name: 'React 19', icon: Globe, color: 'text-cyan-400' },
  { name: 'Prisma ORM', icon: Database, color: 'text-indigo-400' },
  { name: 'Neon PostgreSQL', icon: Server, color: 'text-green-400' },
  { name: 'TypeScript', icon: Cpu, color: 'text-blue-400' },
  { name: 'Tailwind CSS', icon: Sparkles, color: 'text-teal-400' },
  { name: 'Framer Motion', icon: Zap, color: 'text-pink-400' },
  { name: 'WhatsApp API', icon: MessageSquare, color: 'text-green-400' },
]

// --- Sub-Components ---

function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={`group relative border border-white/10 bg-white/5 overflow-hidden rounded-3xl ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(139, 92, 246, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function Marquee({ items }: { items: typeof techStack }) {
  return (
    <div className="relative flex overflow-hidden">
      <motion.div
        className="flex gap-8 pr-8"
        animate={{ x: [0, -1500] }}
        transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 40, ease: "linear" } }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <div key={`${item.name}-${i}`} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-violet-500/30 transition-colors">
            <item.icon className={`w-5 h-5 ${item.color}`} />
            <span className="text-white/80 font-medium whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-14 sm:h-16 bg-slate-950/80 backdrop-blur-xl rounded-2xl border transition-all duration-300 px-4 sm:px-6 ${scrolled ? 'border-white/20 shadow-lg shadow-violet-500/10' : 'border-white/10'}`}>
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-all group-hover:scale-110">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent leading-tight">DKS StockAlert</span>
              <span className="text-[10px] text-emerald-400 font-medium hidden sm:block">Free & Open Source</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {['Features', 'Comparison', 'Pricing', 'How It Works'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-white/60 hover:text-white transition-colors cursor-pointer font-medium text-sm">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth" className="hidden md:block text-white/70 hover:text-white font-medium transition-colors px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer text-sm">Sign In</Link>
            <Link href="/auth" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 text-xs sm:text-sm whitespace-nowrap border border-white/20">
              Get Started
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 rounded-xl bg-white hover:bg-white/90 transition-all border border-white/30 flex items-center justify-center shadow-lg">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-950" /> : <Menu className="w-5 h-5 text-slate-950" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden absolute top-full left-4 right-4 mt-2 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50 p-4">
          <div className="flex flex-col gap-2">
            {['Features', 'Comparison', 'Pricing', 'How It Works'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/5 transition-all rounded-xl font-medium">
                {item}
              </a>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              <Link href="/auth" className="block w-full text-center py-3 bg-white/5 rounded-xl text-white font-medium" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

function HeroSection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const y = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, 50]), { stiffness: 50, damping: 20 })

  // 3D Tilt Effect for Dashboard
  const x = useMotionValue(0)
  const yTilt = useMotionValue(0)
  const rotateX = useTransform(yTilt, [-100, 100], [5, -5])
  const rotateY = useTransform(x, [-100, 100], [-5, 5])

  function handleMouse(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct * 200)
    yTilt.set(yPct * 200)
  }

  return (
    <section ref={ref} className="pt-40 pb-24 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[100px] -z-10" />

      <motion.div className="max-w-7xl mx-auto relative" style={{ opacity, scale, y }}>
        <motion.div className="text-center max-w-4xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <motion.div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 text-green-300 rounded-full text-sm font-semibold mb-8 hover:border-green-500/40 transition-colors cursor-default">
            <Github className="w-4 h-4" />
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded">OPEN SOURCE</span>
            Free & transparent — Contribute on GitHub
          </motion.div>

          <motion.h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight px-2">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Inventory Management</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent relative inline-block mt-2">
              Built for Modern Businesses.
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-violet-500/30" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C28.5003 3.49997 171.5 -2.50003 198.001 2.49997" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
            </span>
          </motion.h1>

          <motion.p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            The only <span className="text-green-400 font-semibold">open source</span> inventory software with
            <span className="text-amber-400 font-semibold"> WhatsApp alerts</span>,
            <span className="text-blue-400 font-semibold"> 1-click Tally import</span>, and
            <span className="text-green-400 font-semibold"> in-app notifications</span>.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-violet-700 hover:via-fuchsia-700 hover:to-violet-800 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-lg text-white border-2 border-white/10 hover:border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all flex items-center justify-center gap-2 cursor-pointer">
              See Features
            </a>
          </motion.div>
        </motion.div>

        {/* 3D Dashboard Preview */}
        <motion.div
          className="max-w-5xl mx-auto mt-20 perspective-1000"
          onMouseMove={handleMouse}
          onMouseLeave={() => { x.set(0); yTilt.set(0) }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        >
          <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl transform transition-transform duration-100 ease-out">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            
            {/* Window Controls */}
            <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 text-center text-xs text-white/40 font-mono">DKS StockAlert Dashboard</div>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <stat.Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </motion.div>
              ))}
            </div>
            
            <div className="px-6 pb-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400" /> Low Stock Alerts</h3>
                  <span className="text-xs text-violet-400 font-medium cursor-pointer hover:text-violet-300">View All</span>
                </div>
                <div className="space-y-3">
                  {alerts.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                          <Package className="w-4 h-4 text-white/60" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{item.name}</p>
                          <p className="text-xs text-white/60">{item.stock} left</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${item.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                        {item.status === 'critical' ? 'Critical' : 'Low'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-3 block">Features</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Everything You Need</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">Stop juggling Excel sheets. Get real-time visibility into your stock.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <SpotlightCard key={i} className={`${feature.size === 'wide' ? 'md:col-span-2' : ''} p-8 group`}>
              <div className="relative h-full flex flex-col">
                {feature.badge && (
                  <span className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold rounded-full shadow-lg shadow-violet-500/20">
                    {feature.badge}
                  </span>
                )}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed flex-grow">{feature.description}</p>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  )
}

function ComparisonSection() {
  return (
    <section id="comparison" className="py-24 px-4 relative bg-slate-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-3 block">Why Choose Us</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">See Why We're Better</span>
          </h2>
        </div>
        
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-6 px-6 text-white font-semibold bg-white/5">Features</th>
                <th className="py-6 px-6 text-center bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border-x border-white/10 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="text-violet-300 text-sm font-medium mb-1">Recommended</div>
                    <div className="text-white font-bold text-lg">DKS StockAlert</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 to-transparent" />
                </th>
                <th className="py-6 px-6 text-center text-white/60">Zoho</th>
                <th className="py-6 px-6 text-center text-white/60">Marg ERP</th>
                <th className="py-6 px-6 text-center text-white/60">Tally</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { label: 'Price', dks: '₹0', others: ['₹749/mo', '₹18,000', '₹54,000'] },
                { label: 'WhatsApp Alerts', dks: 'Coming Soon', others: [false, false, false] },
                { label: 'Tally Import', dks: '1-Click', others: ['Manual', '—', '—'] },
                { label: 'Free Trial', dks: 'Free Forever', others: ['14 days', '—', '—'] },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-white font-medium">{row.label}</td>
                  <td className="py-4 px-6 text-center bg-white/5 border-x border-white/10">
                    <span className="text-green-400 font-bold">{row.dks}</span>
                  </td>
                  {row.others.map((val, j) => (
                    <td key={j} className="py-4 px-6 text-center text-white/60">
                      {typeof val === 'boolean' ? (val ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />) : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-green-400 font-semibold text-sm uppercase tracking-wider mb-3 block">Open Source</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Free Now. Limited Features.</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <SpotlightCard className="p-8 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border-violet-500/50">
            <div className="relative h-full flex flex-col">
              <div className="absolute top-4 right-4 px-4 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-sm font-semibold rounded-full shadow-lg shadow-violet-500/50 animate-pulse">
                Popular
              </div>
              <div className="mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Open Source Plan</h3>
                <p className="text-white/60 mb-4">Free tier — Limited features, no vendor lock-in</p>
                <div className="mb-6"><span className="text-5xl font-bold text-white">₹0</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Up to 50 products', '5 locations/godowns', '3 team members', 'GST invoicing', '📊 Tally import', 'Email support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="block w-full py-4 px-6 text-center font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white hover:from-violet-600 hover:to-fuchsia-700 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40">
                Get Started Free
              </Link>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-8">
            <div className="relative h-full flex flex-col">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-white/60 mb-4">For large businesses with custom needs</p>
                <div className="mb-6"><span className="text-5xl font-bold text-white">Custom</span></div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Unlimited products', 'Unlimited locations', 'Unlimited team members', 'Priority support', 'Custom integrations', 'Dedicated account manager'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="block w-full py-4 px-6 text-center font-semibold rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
                Contact Sales
              </Link>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-slate-950/50 backdrop-blur-sm border-t border-white/5 text-white/60 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DKS StockAlert</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4 max-w-sm">
              Open source inventory management software built for businesses. Track stock, generate invoices, and manage multiple locations with ease.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <a href="https://github.com/seenuraj2007/stockalert" target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full hover:bg-green-500/30 transition-colors flex items-center gap-1">
                <Github className="w-3 h-3" /> Star on GitHub
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-sm">
              {['Features', 'Comparison', 'Pricing', 'Get Started'].map((item) => (
                <li key={item}><a href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-white transition-colors cursor-pointer">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="https://github.com/seenuraj2007/stockalert" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</a></li>
              <li><Link href="/about" className="hover:text-white transition-colors cursor-pointer">About</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-white/50">
            <p>© {new Date().getFullYear()} DKS StockAlert. Open source — MIT License.</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg cursor-pointer">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
            </a>
            <a href="#" className="hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg cursor-pointer">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- Main Page Component ---

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden selection:bg-violet-500/30">
      {/* Grain Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {/* Beta Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-2 sm:px-4 text-center text-xs sm:text-sm font-medium">
        <span>🚀 OPEN SOURCE:</span>
        <span className="hidden sm:inline ml-2"> This project is open source —</span>
        <a href="https://github.com/seenuraj2007/stockalert" target="_blank" rel="noopener noreferrer" className="underline ml-1 hover:text-white whitespace-nowrap">Star on GitHub →</a>
      </div>

      <Navbar />
      
      <main>
        <HeroSection />
        
        <section className="py-12 border-y border-white/5 bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-white/60 mb-6 font-medium text-sm">Built with modern, secure technologies</p>
            <Marquee items={techStack} />
          </div>
        </section>

        <FeaturesSection />
        <ComparisonSection />
        
        <section id="how-it-works" className="py-24 px-4 relative bg-slate-900/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-3 block">How It Works</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Setup in 5 Minutes</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {howItWorksSteps.map((item, i) => (
                <div key={i} className="relative group">
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-violet-500/50 transition-all duration-300 relative overflow-hidden h-full">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-violet-500/30 shadow-xl shadow-violet-500/10 mx-auto md:mx-0">
                      <item.icon className="w-8 h-8 text-violet-400" />
                    </div>
                    <span className="text-6xl font-bold text-white/10 absolute top-4 right-6">{item.step}</span>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection />

        <section className="py-24 px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-violet-600/90 to-fuchsia-600/90 backdrop-blur-xl rounded-3xl p-12 relative overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to Stop Using Excel?</h2>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">Join thousands of businesses managing their inventory smarter with DKS StockAlert.</p>
                <Link href="/auth" className="inline-flex items-center gap-2 bg-white text-violet-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer">
                  Get Free Access Now <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}