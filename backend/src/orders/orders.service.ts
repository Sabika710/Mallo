import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreateCheckoutDto, UpdateOrderStatusDto } from './orders.dto'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { OrderStatus } from '@prisma/client'
import Stripe from 'stripe'
import { EmailService } from '@/common/email.service'

@Injectable()
export class OrdersService {
  private stripe: Stripe

  constructor(private prisma: PrismaService, private events: EventEmitter2, private emailService: EmailService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
  })
  }

  findAll(filter: { brandId?: string; customerId?: string }) {
    return this.prisma.order.findMany({
      where: filter,
      include: { brand: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { brand: true, items: { include: { product: true } } },
    })
    if (!order) throw new NotFoundException('Order not found')
    return order
  }

  async createMultiItemCheckout(
    customerId: string,
    customerEmail: string,
    items: Array<{ productId: string; quantity: number }>,
  ) {
    if (!items.length) throw new BadRequestException('No items in cart')

    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '')
    const feePercent  = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '10')

    // Load all products with their brands
    const products = await Promise.all(
      items.map(item =>
        this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { brand: true },
        })
      )
    )

  // Validate all products exist and have stock
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      if (!p) throw new NotFoundException(`Product not found: ${items[i].productId}`)
      if (p.stock < items[i].quantity) {
        throw new BadRequestException(`Insufficient stock for: ${p.name}`)
      }
      if (!p.brand.stripeAccountId) {
        throw new BadRequestException(
          `Brand "${p.brand.name}" has not completed Stripe onboarding`
        )
      }
    }

    // Group items by brand
    const brandGroups = new Map<string, Array<{ product: typeof products[0]; quantity: number }>>()

    products.forEach((p, i) => {
      const brandId = p!.brandId
      if (!brandGroups.has(brandId)) brandGroups.set(brandId, [])
      brandGroups.get(brandId)!.push({ product: p, quantity: items[i].quantity })
    })

    const brandIds = [...brandGroups.keys()]

    // Single brand — one checkout session
    if (brandIds.length === 1) {
      const group    = brandGroups.get(brandIds[0])!
      const brand    = group[0].product!.brand
      const total    = group.reduce((s, g) => s + g.product!.price * g.quantity, 0)
      const fee      = Math.round(total * feePercent / 100)

      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: group.map(g => ({
          price_data: {
            currency: 'usd',
            unit_amount: g.product!.price,
            product_data: {
              name: g.product!.name,
              description: g.product!.description,
              ...(g.product!.imageUrl ? { images: [g.product!.imageUrl] } : {}),
            },
          },
          quantity: g.quantity,
        })),
        payment_intent_data: {
          application_fee_amount: fee,
          transfer_data: { destination: brand.stripeAccountId! },
          metadata: {
            brandId: brand.id,
            customerId,
            cartItems: JSON.stringify(
              group.map(g => ({
                productId: g.product!.id,
                quantity:  g.quantity,
                unitPrice: g.product!.price,
              }))
            ),
          },
        },
        customer_email: customerEmail || undefined,
        success_url: `${frontendUrl}/store?order=success`,
        cancel_url:  `${frontendUrl}/store?order=canceled`,
      })

      return { checkoutUrls: [session.url!], totalSessions: 1 }
    }

  // Stripe Connect handles the split automatically for each session
    const sessions: string[] = []

    for (const [brandId, group] of brandGroups) {
      const brand = group[0].product!.brand
      const total = group.reduce((s, g) => s + g.product!.price * g.quantity, 0)
      const fee   = Math.round(total * feePercent / 100)

      const isLast      = sessions.length === brandGroups.size - 1
      const successUrl  = isLast
        ? `${frontendUrl}/store?order=success`
        : `${frontendUrl}/store?order=pending&next=checkout`
  
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: group.map(g => ({
          price_data: {
            currency: 'usd',
            unit_amount: g.product!.price,
            product_data: {
              name: g.product!.name,
              description: g.product!.description,
              ...(g.product!.imageUrl ? { images: [g.product!.imageUrl] } : {}),
            },
          },
          quantity: g.quantity,
        })),
        payment_intent_data: {
          application_fee_amount: fee,
          transfer_data: { destination: brand.stripeAccountId! },
          metadata: {
            brandId: brand.id,
            customerId,
            cartItems: JSON.stringify(
              group.map(g => ({
                productId: g.product!.id,
                quantity:  g.quantity,
                unitPrice: g.product!.price,
              }))
            ),
          },
        },
        customer_email: customerEmail || undefined,
        success_url: successUrl,
        cancel_url:  `${frontendUrl}/store?order=canceled`,
      })

      sessions.push(session.url!)
    }

    return {
      checkoutUrls: sessions,
      totalSessions: sessions.length,
    }
  }

  async createCheckout(customerId: string, customerEmail: string, dto: CreateCheckoutDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { brand: true },
    })
    if (!product) throw new NotFoundException('Product not found')
    if (product.stock < dto.quantity) throw new BadRequestException('Insufficient stock')
    if (!product.brand.stripeAccountId) {
      throw new BadRequestException('This brand has not completed Stripe onboarding')
    }

    const totalAmount = product.price * dto.quantity
    const feePercent  = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '10')
    const platformFee = Math.round(totalAmount * feePercent / 100)
    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.description,
            ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
          },
        },
        quantity: dto.quantity,
      }],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: { destination: product.brand.stripeAccountId },
        metadata: { productId: product.id, brandId: product.brandId, customerId, quantity: dto.quantity.toString() },
      },
      customer_email: customerEmail || undefined,
      success_url: `${frontendUrl}/store?order=success`,
      cancel_url:  `${frontendUrl}/store?order=canceled`,
    })

    return { checkoutUrl: session.url! }
  }

  async fulfillOrder(session: Stripe.Checkout.Session, stripeEventId: string) {
    const alreadyProcessed = await this.prisma.processedEvent.findUnique({
      where: { id: stripeEventId },
    })
    if (alreadyProcessed) {
      console.log('[webhook] duplicate event skipped:', stripeEventId)
      return null
    }

    const intentId      = session.payment_intent as string
    const paymentIntent = await this.stripe.paymentIntents.retrieve(intentId)
    const { brandId, customerId, cartItems, productId, quantity } = paymentIntent.metadata

    const existingOrder = await this.prisma.order.findUnique({
      where: { stripeIntentId: intentId },
    })
    if (existingOrder) {
      await this.prisma.processedEvent.create({ data: { id: stripeEventId } })
      return existingOrder
    }

    let orderItems: Array<{ productId: string; quantity: number; unitPrice: number }>

    if (cartItems) {
      orderItems = JSON.parse(cartItems)
    } else {
      const product = await this.prisma.product.findUnique({ where: { id: productId } })
      if (!product) return null
      orderItems = [{ productId, quantity: parseInt(quantity), unitPrice: product.price }]
    }

    const totalAmount = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

    const [order] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          brandId,
          customerId,
          customerEmail: session.customer_email
            ?? (session.customer_details as any)?.email
            ?? undefined,
          stripeIntentId: intentId,
          totalAmount,
          status: 'PENDING',
          items: {
            create: orderItems.map(i => ({
              productId: i.productId,
              quantity:  i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: { brand: true, items: { include: { product: true } } },
      }),
      this.prisma.processedEvent.create({ data: { id: stripeEventId } }),
      // Decrement stock for all items
      ...orderItems.map(i =>
        this.prisma.product.update({
          where: { id: i.productId },
          data:  { stock: { decrement: i.quantity } },
        })
      ),
    ])

    // Send confirmation email
    const emailTo = order.customerEmail ?? (session.customer_details as any)?.email
    if (emailTo) {
      await this.emailService.sendOrderConfirmation({
        toEmail:     emailTo,
        toName:      (session.customer_details as any)?.name ?? emailTo.split('@')[0],
        orderId:     order.id,
        brandName:   order.brand.name,
        items:       order.items.map(i => ({
          name:      i.product?.name ?? 'Item',
          quantity:  i.quantity,
          unitPrice: i.unitPrice,
        })),
        totalAmount: order.totalAmount,
      })
    }

    this.events.emit('order.confirmed', {
      order,
      customerId,
      brandName: order.brand.name,
    })

    return order
  }

  async updateStatus(id: string, brandId: string, dto: UpdateOrderStatusDto) {
    const order   = await this.findById(id)
    if (order.brandId !== brandId) throw new ForbiddenException('Not your order')
    const updated = await this.prisma.order.update({
      where: { id },
      data:  { status: dto.status },
      include: { brand: true },
    })
    this.events.emit(`order.${dto.status.toLowerCase()}`, { order: updated, customerId: order.customerId })
    return updated
  }

  async cancelWithPolicyCheck(orderId: string): Promise<{ success: boolean; reason?: string; refundId?: string }> {
    const order = await this.findById(orderId)

    if (order.status === 'CANCELED') return { success: false, reason: 'This order has already been canceled.' }
    if (order.status === 'DELIVERED') return { success: false, reason: 'Delivered orders cannot be canceled.' }

    if (order.status === 'DISPATCHED' && !order.brand.returnPolicy) {
      return { success: false, reason: "I'm sorry, this brand does not accept returns once an item is dispatched." }
    }

    const intent = await this.stripe.paymentIntents.retrieve(order.stripeIntentId)
    if (intent.status !== 'succeeded') {
      return { success: false, reason: 'Payment has not been confirmed. Cannot issue a refund.' }
    }

    const refund  = await this.stripe.refunds.create({ payment_intent: order.stripeIntentId })
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: 'CANCELED' },
      include: { brand: true },
    })

    this.events.emit('order.canceled', { order: updated, customerId: order.customerId })
    return { success: true, refundId: refund.id }
  }
}
