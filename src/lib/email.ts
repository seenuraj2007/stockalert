import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"DKS StockAlert" <noreply@dksstockalert.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export function generateLowStockAlertEmail(
  productName: string,
  currentStock: number,
  reorderPoint: number,
  businessName: string
) {
  return {
    subject: `🚨 Low Stock Alert: ${productName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">DKS StockAlert</h1>
          <p style="color: #6B7280; margin-top: 8px;">${businessName}</p>
        </div>
        
        <div style="background: linear-gradient(to right, #F97316, #EF4444); border-radius: 12px; padding: 30px; margin-bottom: 30px; color: white;">
          <h2 style="margin: 0 0 16px 0;">⚠️ Low Stock Alert</h2>
          <p style="margin: 0; opacity: 0.9;">
            Product ${productName} is running low!
          </p>
        </div>
        
        <div style="background: #F9FAFB; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h3 style="color: #111827; margin: 0 0 16px 0;">Stock Details</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Product</p>
              <p style="color: #111827; font-weight: 600; margin: 0;">${productName}</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Current Stock</p>
              <p style="color: #EF4444; font-weight: 600; margin: 0;">${currentStock} units</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Reorder Point</p>
              <p style="color: #111827; font-weight: 600; margin: 0;">${reorderPoint} units</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Status</p>
              <p style="color: #F97316; font-weight: 600; margin: 0;">Low Stock</p>
            </div>
          </div>
          
          <p style="color: #4B5563; margin-top: 20px;">
            Please restock ${productName} soon to avoid running out.
          </p>
        </div>
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>DKS StockAlert - Inventory Management System</p>
          <p>© ${new Date().getFullYear()} DKS StockAlert. All rights reserved.</p>
        </div>
      </div>
    `,
  }
}

export function generateOutOfStockAlertEmail(
  productName: string,
  businessName: string
) {
  return {
    subject: `🔴 OUT OF STOCK: ${productName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">DKS StockAlert</h1>
          <p style="color: #6B7280; margin-top: 8px;">${businessName}</p>
        </div>
        
        <div style="background: linear-gradient(to right, #DC2626, #991B1B); border-radius: 12px; padding: 30px; margin-bottom: 30px; color: white;">
          <h2 style="margin: 0 0 16px 0;">🔴 OUT OF STOCK</h2>
          <p style="margin: 0; opacity: 0.9;">
            ${productName} is completely out of stock!
          </p>
        </div>
        
        <div style="background: #F9FAFB; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h3 style="color: #111827; margin: 0 0 16px 0;">Stock Details</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Product</p>
              <p style="color: #111827; font-weight: 600; margin: 0;">${productName}</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Current Stock</p>
              <p style="color: #DC2626; font-weight: 600; margin: 0;">0 units</p>
            </div>
          </div>
          
          <p style="color: #4B5563; margin-top: 20px;">
            This product cannot be sold until restocked. Please restock immediately!
          </p>
        </div>
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>DKS StockAlert - Inventory Management System</p>
          <p>© ${new Date().getFullYear()} DKS StockAlert. All rights reserved.</p>
        </div>
      </div>
    `,
  }
}

export function generatePurchaseOrderUpdateEmail(
  orderNumber: string,
  supplierName: string,
  status: string,
  estimatedDelivery?: string
) {
  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    approved: '#3B82F6',
    shipped: '#8B5CF6',
    delivered: '#10B981',
  }
  
  const color = statusColors[status] || '#6B7280'
  
  return {
    subject: `📦 Purchase Order ${orderNumber}: ${status}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">DKS StockAlert</h1>
          <p style="color: #6B7280; margin-top: 8px;">Inventory Management System</p>
        </div>
        
        <div style="background: ${color}15; border-radius: 12px; padding: 30px; margin-bottom: 30px; border-left: 4px solid ${color};">
          <h2 style="color: #111827; margin: 0 0 16px 0;">Purchase Order Updated</h2>
          <p style="color: #4B5563; margin: 0;">
            Order#${orderNumber} status has changed to: <strong style="color: ${color};">${status.toUpperCase()}</strong>
          </p>
        </div>
        
        <div style="background: #F9FAFB; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h3 style="color: #111827; margin: 0 0 16px 0;">Order Details</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Order Number</p>
              <p style="color: #111827; font-weight: 600; margin: 0;">${orderNumber}</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Supplier</p>
              <p style="color: #111827; font-weight: 600; margin: 0;">${supplierName}</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Status</p>
              <p style="color: ${color}; font-weight: 600; margin: 0; text-transform: uppercase;">${status}</p>
            </div>
            ${estimatedDelivery ? `
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Estimated Delivery</p>
              <p style="color: #111827; font-weight: 600; margin: 0;">${estimatedDelivery}</p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>DKS StockAlert - Inventory Management System</p>
          <p>© ${new Date().getFullYear()} DKS StockAlert. All rights reserved.</p>
        </div>
      </div>
    `,
  }
}

export function generateDailySummaryEmail(
  businessName: string,
  totalProducts: number,
  stockValue: number,
  lowStockCount: number,
  outOfStockCount: number
) {
  return {
    subject: `📊 Daily Inventory Summary - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4F46E5; margin: 0;">DKS StockAlert</h1>
          <p style="color: #6B7280; margin-top: 8px;">${businessName}</p>
        </div>
        
        <div style="background: linear-gradient(to right, #4F46E5, #7C3AED); border-radius: 12px; padding: 30px; margin-bottom: 30px; color: white;">
          <h2 style="margin: 0 0 16px 0;">📊 Daily Inventory Summary</h2>
          <p style="margin: 0; opacity: 0.9;">
            Your inventory overview as of ${new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div style="background: #F9FAFB; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h3 style="color: #111827; margin: 0 0 20px 0;">Overview</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Total Products</p>
              <p style="color: #111827; font-weight: 600; font-size: 24px; margin: 0;">${totalProducts}</p>
            </div>
            <div>
              <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">Stock Value</p>
              <p style="color: #10B981; font-weight: 600; font-size: 24px; margin: 0;">₹${stockValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div style="background: ${lowStockCount > 0 || outOfStockCount > 0 ? '#FEF2F2' : '#F0FDF4'}; border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid ${lowStockCount > 0 || outOfStockCount > 0 ? '#EF4444' : '#22C55E'};">
          <h3 style="color: #111827; margin: 0 0 12px 0;">📋 Alerts</h3>
          ${lowStockCount > 0 ? `
          <p style="color: #DC2626; margin: 0 0 4px 0;">
            • ${lowStockCount} ${lowStockCount === 1 ? 'product' : 'products'} low on stock
          </p>
          ` : ''}
          ${outOfStockCount > 0 ? `
          <p style="color: #DC2626; margin: 0 0 4px 0;">
            • ${outOfStockCount} ${outOfStockCount === 1 ? 'product' : 'products'} out of stock
          </p>
          ` : ''}
          ${lowStockCount === 0 && outOfStockCount === 0 ? `
          <p style="color: #166534; margin: 0;">✅ All products are in stock!</p>
          ` : ''}
        </div>
        
        <div style="text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>DKS StockAlert - Inventory Management System</p>
          <p>© ${new Date().getFullYear()} DKS StockAlert. All rights reserved.</p>
        </div>
      </div>
    `,
  }
}
