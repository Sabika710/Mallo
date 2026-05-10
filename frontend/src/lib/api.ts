import { apiFetch } from './fetcher'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface Brand {
  id: string
  clerkOrgId: string
  stripeAccountId?: string
  stripeOnboardingComplete: boolean
  name: string
  returnPolicy: boolean
  createdAt: string
}

export interface Product {
  id: string
  brandId: string
  name: string
  description: string
  price: number        // cents
  imageUrl?: string
  stock: number
  brand?: Pick<Brand, 'id' | 'name' | 'returnPolicy'>
}

export type OrderStatus = 'PENDING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELED'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  product?: Pick<Product, 'id' | 'name' | 'imageUrl'>
}

export interface Order {
  id: string
  brandId: string
  customerId: string
  customerEmail?: string
  status: OrderStatus
  stripeIntentId: string
  totalAmount: number  // cents
  createdAt: string
  brand?: Pick<Brand, 'id' | 'name' | 'returnPolicy'>
  items?: OrderItem[]
}

// ── API namespaces ────────────────────────────────────────────────────────────

export const brandApi = {
  create: (data: { name: string; clerkOrgId: string }, token: string) =>
    apiFetch<Brand>('brands', { method: 'POST', body: data, token }),

  getMe: (token: string) =>
    apiFetch<Brand>('brands/me', { token }),

  updatePolicy: (returnPolicy: boolean, token: string) =>
    apiFetch<Brand>('brands/me/policy', { method: 'PATCH', body: { returnPolicy }, token }),

  getOnboardingLink: (token: string) =>
    apiFetch<{ url: string }>('brands/me/stripe-onboard', { method: 'POST', token }),
}

export const productApi = {
  list: (params?: { brandId?: string }) => {
    const qs = params?.brandId ? `?brandId=${params.brandId}` : ''
    return apiFetch<Product[]>(`products${qs}`)
  },

  create: (data: Omit<Product, 'id' | 'brandId' | 'brand'>, token: string) =>
    apiFetch<Product>('products', { method: 'POST', body: data, token }),

  update: (id: string, data: Partial<Product>, token: string) =>
    apiFetch<Product>(`products/${id}`, { method: 'PATCH', body: data, token }),

  delete: (id: string, token: string) =>
    apiFetch<void>(`products/${id}`, { method: 'DELETE', token }),
}

export const orderApi = {
  list: (token: string) =>
    apiFetch<Order[]>('orders', { token }),

  createCheckout: (productId: string, quantity: number, token: string) =>
    apiFetch<{ checkoutUrl: string }>('orders/checkout', {
      method: 'POST',
      body: { productId, quantity },
      token,
    }),

  updateStatus: (id: string, status: OrderStatus, token: string) =>
    apiFetch<Order>(`orders/${id}/status`, { method: 'PATCH', body: { status }, token }),
}

export const chatApi = {
  send: (
    message: string,
    history: Array<{ role: string; content: string }>,
    token: string,
    orderId?: string,
  ) =>
    apiFetch<{ response: string }>('ai/chat', {
      method: 'POST',
      body: { message, history, orderId },
      token,
    }),
}
