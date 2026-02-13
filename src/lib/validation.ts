/**
 * Zod validation schemas for all API endpoints
 * Provides runtime type checking and validation
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================
export const idSchema = z.string().uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateSchema = z.string().datetime().or(z.date());

export const emailSchema = z.string().email('Invalid email format');

export const phoneSchema = z.string().regex(
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
  'Invalid phone number format'
);

// ============================================
// User Schemas
// ============================================
export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER']);

export const createUserSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
  displayName: z.string().max(100).optional().nullable(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ============================================
// Tenant/Organization Schemas
// ============================================
export const tenantSettingsSchema = z.object({
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  dateFormat: z.string().default('DD/MM/YYYY'),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional().nullable(),
  businessAddress: z.string().max(500).optional().nullable(),
  businessCity: z.string().max(100).optional().nullable(),
  businessState: z.string().max(100).optional().nullable(),
  businessPincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode').optional().nullable(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(200),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  email: emailSchema.optional().nullable(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional().nullable(),
});

// ============================================
// Product Schemas
// ============================================
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  sku: z.string().max(50).optional().nullable(),
  barcode: z.string().max(50).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  currentQuantity: z.number().int().min(0, 'Quantity cannot be negative').default(0),
  reorderPoint: z.number().int().min(0, 'Reorder point cannot be negative').default(0),
  unitCost: z.number().min(0, 'Unit cost cannot be negative').optional().nullable(),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  gstRate: z.number().min(0).max(28, 'GST rate must be between 0 and 28').optional().nullable(),
  hsnCode: z.string().max(20).optional().nullable(),
  unit: z.string().min(1, 'Unit is required').max(20),
  imageUrl: z.string().url().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const productFilterSchema = z.object({
  category: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// ============================================
// Location Schemas
// ============================================
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(200),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export const updateLocationSchema = createLocationSchema.partial();

// ============================================
// Stock Schemas
// ============================================
export const stockAdjustmentSchema = z.object({
  productId: idSchema,
  locationId: idSchema.optional(),
  quantity: z.number().int(),
  reason: z.string().min(1, 'Reason is required').max(500),
  notes: z.string().max(1000).optional().nullable(),
});

export const createStockTransferSchema = z.object({
  fromLocationId: idSchema,
  toLocationId: idSchema,
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(z.object({
    productId: idSchema,
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
});

export const updateStockTransferSchema = z.object({
  status: z.enum(['IN_TRANSIT', 'COMPLETED', 'CANCELLED']),
  notes: z.string().max(1000).optional().nullable(),
});

// ============================================
// Supplier Schemas
// ============================================
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(200),
  contactPerson: z.string().max(100).optional().nullable(),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============================================
// Invoice Schemas
// ============================================
export const invoiceItemSchema = z.object({
  productId: idSchema.optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  hsnCode: z.string().max(20).optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  discount: z.number().min(0).default(0),
  cgstRate: z.number().min(0).max(28).default(0),
  sgstRate: z.number().min(0).max(28).default(0),
  igstRate: z.number().min(0).max(28).default(0),
});

export const createInvoiceSchema = z.object({
  customerId: idSchema.optional().nullable(),
  customerName: z.string().min(1, 'Customer name is required').max(200),
  customerEmail: emailSchema.optional().nullable(),
  customerPhone: phoneSchema.optional().nullable(),
  customerAddress: z.string().max(500).optional().nullable(),
  customerCity: z.string().max(100).optional().nullable(),
  customerState: z.string().max(100).optional().nullable(),
  customerPincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode').optional().nullable(),
  customerGstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional().nullable(),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['ISSUED', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  ewayBillNumber: z.string().max(50).optional().nullable(),
  ewayBillDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const invoiceFilterSchema = z.object({
  status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  customerId: idSchema.optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ============================================
// Customer Schemas
// ============================================
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  email: emailSchema.optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode').optional().nullable(),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number').optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============================================
// Purchase Order Schemas
// ============================================
export const purchaseOrderItemSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
});

export const createPurchaseOrderSchema = z.object({
  supplierName: z.string().min(1, 'Supplier name is required').max(200),
  supplierEmail: emailSchema.optional().nullable(),
  supplierPhone: phoneSchema.optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

export const updatePurchaseOrderSchema = z.object({
  status: z.enum(['ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

// ============================================
// Team/Member Schemas
// ============================================
export const inviteTeamMemberSchema = z.object({
  email: emailSchema,
  role: userRoleSchema,
});

export const updateTeamMemberSchema = z.object({
  role: userRoleSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// ============================================
// Settings Schemas
// ============================================
export const whatsAppSettingsSchema = z.object({
  enabled: z.boolean(),
  phoneNumber: phoneSchema.optional().nullable(),
  apiKey: z.string().optional().nullable(),
  defaultMessage: z.string().max(500).optional().nullable(),
  autoSendInvoices: z.boolean().default(false),
  autoSendAlerts: z.boolean().default(false),
});

// ============================================
// Password Reset Schemas
// ============================================
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================
// Profile Schemas
// ============================================
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================
// Export Types from Schemas
// ============================================
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;

// ============================================
// Validation Helper Functions
// ============================================
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function validatePartial<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): { success: true; data: Partial<z.infer<z.ZodObject<T>>> } | { success: false; errors: z.ZodError } {
  const partialSchema = schema.partial();
  const result = partialSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  return formatted;
}
