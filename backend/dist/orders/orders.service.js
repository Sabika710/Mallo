"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const event_emitter_1 = require("@nestjs/event-emitter");
const stripe_1 = require("stripe");
const email_service_1 = require("../common/email.service");
let OrdersService = class OrdersService {
    constructor(prisma, events, emailService) {
        this.prisma = prisma;
        this.events = events;
        this.emailService = emailService;
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia',
        });
    }
    findAll(filter) {
        return this.prisma.order.findMany({
            where: filter,
            include: { brand: true, items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { brand: true, items: { include: { product: true } } },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return order;
    }
    async createMultiItemCheckout(customerId, customerEmail, items) {
        if (!items.length)
            throw new common_1.BadRequestException('No items in cart');
        const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
        const feePercent = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '10');
        const products = await Promise.all(items.map(item => this.prisma.product.findUnique({
            where: { id: item.productId },
            include: { brand: true },
        })));
        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            if (!p)
                throw new common_1.NotFoundException(`Product not found: ${items[i].productId}`);
            if (p.stock < items[i].quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for: ${p.name}`);
            }
            if (!p.brand.stripeAccountId) {
                throw new common_1.BadRequestException(`Brand "${p.brand.name}" has not completed Stripe onboarding`);
            }
        }
        const brandGroups = new Map();
        products.forEach((p, i) => {
            const brandId = p.brandId;
            if (!brandGroups.has(brandId))
                brandGroups.set(brandId, []);
            brandGroups.get(brandId).push({ product: p, quantity: items[i].quantity });
        });
        const brandIds = [...brandGroups.keys()];
        if (brandIds.length === 1) {
            const group = brandGroups.get(brandIds[0]);
            const brand = group[0].product.brand;
            const total = group.reduce((s, g) => s + g.product.price * g.quantity, 0);
            const fee = Math.round(total * feePercent / 100);
            const session = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: group.map(g => ({
                    price_data: {
                        currency: 'usd',
                        unit_amount: g.product.price,
                        product_data: {
                            name: g.product.name,
                            description: g.product.description,
                            ...(g.product.imageUrl ? { images: [g.product.imageUrl] } : {}),
                        },
                    },
                    quantity: g.quantity,
                })),
                payment_intent_data: {
                    application_fee_amount: fee,
                    transfer_data: { destination: brand.stripeAccountId },
                    metadata: {
                        brandId: brand.id,
                        customerId,
                        cartItems: JSON.stringify(group.map(g => ({
                            productId: g.product.id,
                            quantity: g.quantity,
                            unitPrice: g.product.price,
                        }))),
                    },
                },
                customer_email: customerEmail || undefined,
                success_url: `${frontendUrl}/store?order=success`,
                cancel_url: `${frontendUrl}/store?order=canceled`,
            });
            return { checkoutUrls: [session.url], totalSessions: 1 };
        }
        const sessions = [];
        for (const [brandId, group] of brandGroups) {
            const brand = group[0].product.brand;
            const total = group.reduce((s, g) => s + g.product.price * g.quantity, 0);
            const fee = Math.round(total * feePercent / 100);
            const isLast = sessions.length === brandGroups.size - 1;
            const successUrl = isLast
                ? `${frontendUrl}/store?order=success`
                : `${frontendUrl}/store?order=pending&next=checkout`;
            const session = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                line_items: group.map(g => ({
                    price_data: {
                        currency: 'usd',
                        unit_amount: g.product.price,
                        product_data: {
                            name: g.product.name,
                            description: g.product.description,
                            ...(g.product.imageUrl ? { images: [g.product.imageUrl] } : {}),
                        },
                    },
                    quantity: g.quantity,
                })),
                payment_intent_data: {
                    application_fee_amount: fee,
                    transfer_data: { destination: brand.stripeAccountId },
                    metadata: {
                        brandId: brand.id,
                        customerId,
                        cartItems: JSON.stringify(group.map(g => ({
                            productId: g.product.id,
                            quantity: g.quantity,
                            unitPrice: g.product.price,
                        }))),
                    },
                },
                customer_email: customerEmail || undefined,
                success_url: successUrl,
                cancel_url: `${frontendUrl}/store?order=canceled`,
            });
            sessions.push(session.url);
        }
        return {
            checkoutUrls: sessions,
            totalSessions: sessions.length,
        };
    }
    async createCheckout(customerId, customerEmail, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
            include: { brand: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        if (product.stock < dto.quantity)
            throw new common_1.BadRequestException('Insufficient stock');
        if (!product.brand.stripeAccountId) {
            throw new common_1.BadRequestException('This brand has not completed Stripe onboarding');
        }
        const totalAmount = product.price * dto.quantity;
        const feePercent = parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? '10');
        const platformFee = Math.round(totalAmount * feePercent / 100);
        const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
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
            cancel_url: `${frontendUrl}/store?order=canceled`,
        });
        return { checkoutUrl: session.url };
    }
    async fulfillOrder(session, stripeEventId) {
        const alreadyProcessed = await this.prisma.processedEvent.findUnique({
            where: { id: stripeEventId },
        });
        if (alreadyProcessed) {
            console.log('[webhook] duplicate event skipped:', stripeEventId);
            return null;
        }
        const intentId = session.payment_intent;
        const paymentIntent = await this.stripe.paymentIntents.retrieve(intentId);
        const { brandId, customerId, cartItems, productId, quantity } = paymentIntent.metadata;
        const existingOrder = await this.prisma.order.findUnique({
            where: { stripeIntentId: intentId },
        });
        if (existingOrder) {
            await this.prisma.processedEvent.create({ data: { id: stripeEventId } });
            return existingOrder;
        }
        let orderItems;
        if (cartItems) {
            orderItems = JSON.parse(cartItems);
        }
        else {
            const product = await this.prisma.product.findUnique({ where: { id: productId } });
            if (!product)
                return null;
            orderItems = [{ productId, quantity: parseInt(quantity), unitPrice: product.price }];
        }
        const totalAmount = orderItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        const [order] = await this.prisma.$transaction([
            this.prisma.order.create({
                data: {
                    brandId,
                    customerId,
                    customerEmail: session.customer_email
                        ?? session.customer_details?.email
                        ?? undefined,
                    stripeIntentId: intentId,
                    totalAmount,
                    status: 'PENDING',
                    items: {
                        create: orderItems.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                        })),
                    },
                },
                include: { brand: true, items: { include: { product: true } } },
            }),
            this.prisma.processedEvent.create({ data: { id: stripeEventId } }),
            ...orderItems.map(i => this.prisma.product.update({
                where: { id: i.productId },
                data: { stock: { decrement: i.quantity } },
            })),
        ]);
        const emailTo = order.customerEmail ?? session.customer_details?.email;
        if (emailTo) {
            await this.emailService.sendOrderConfirmation({
                toEmail: emailTo,
                toName: session.customer_details?.name ?? emailTo.split('@')[0],
                orderId: order.id,
                brandName: order.brand.name,
                items: order.items.map(i => ({
                    name: i.product?.name ?? 'Item',
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                })),
                totalAmount: order.totalAmount,
            });
        }
        this.events.emit('order.confirmed', {
            order,
            customerId,
            brandName: order.brand.name,
        });
        return order;
    }
    async updateStatus(id, brandId, dto) {
        const order = await this.findById(id);
        if (order.brandId !== brandId)
            throw new common_1.ForbiddenException('Not your order');
        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: { brand: true },
        });
        this.events.emit(`order.${dto.status.toLowerCase()}`, { order: updated, customerId: order.customerId });
        return updated;
    }
    async cancelWithPolicyCheck(orderId) {
        const order = await this.findById(orderId);
        if (order.status === 'CANCELED')
            return { success: false, reason: 'This order has already been canceled.' };
        if (order.status === 'DELIVERED')
            return { success: false, reason: 'Delivered orders cannot be canceled.' };
        if (order.status === 'DISPATCHED' && !order.brand.returnPolicy) {
            return { success: false, reason: "I'm sorry, this brand does not accept returns once an item is dispatched." };
        }
        const intent = await this.stripe.paymentIntents.retrieve(order.stripeIntentId);
        if (intent.status !== 'succeeded') {
            return { success: false, reason: 'Payment has not been confirmed. Cannot issue a refund.' };
        }
        const refund = await this.stripe.refunds.create({ payment_intent: order.stripeIntentId });
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELED' },
            include: { brand: true },
        });
        this.events.emit('order.canceled', { order: updated, customerId: order.customerId });
        return { success: true, refundId: refund.id };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, event_emitter_1.EventEmitter2, email_service_1.EmailService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map