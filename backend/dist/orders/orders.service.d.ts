import { PrismaService } from '../common/prisma.service';
import { CreateCheckoutDto, UpdateOrderStatusDto } from './orders.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { EmailService } from '@/common/email.service';
export declare class OrdersService {
    private prisma;
    private events;
    private emailService;
    private stripe;
    constructor(prisma: PrismaService, events: EventEmitter2, emailService: EmailService);
    findAll(filter: {
        brandId?: string;
        customerId?: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        brand: {
            name: string;
            clerkOrgId: string;
            returnPolicy: boolean;
            id: string;
            stripeAccountId: string | null;
            stripeOnboardingComplete: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                brandId: string;
                description: string;
                price: number;
                stock: number;
                imageUrl: string | null;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            unitPrice: number;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerId: string;
        customerEmail: string | null;
        stripeIntentId: string;
        totalAmount: number;
    })[]>;
    findById(id: string): Promise<{
        brand: {
            name: string;
            clerkOrgId: string;
            returnPolicy: boolean;
            id: string;
            stripeAccountId: string | null;
            stripeOnboardingComplete: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                name: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                brandId: string;
                description: string;
                price: number;
                stock: number;
                imageUrl: string | null;
            };
        } & {
            id: string;
            productId: string;
            quantity: number;
            unitPrice: number;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerId: string;
        customerEmail: string | null;
        stripeIntentId: string;
        totalAmount: number;
    }>;
    createMultiItemCheckout(customerId: string, customerEmail: string, items: Array<{
        productId: string;
        quantity: number;
    }>): Promise<{
        checkoutUrls: string[];
        totalSessions: number;
    }>;
    createCheckout(customerId: string, customerEmail: string, dto: CreateCheckoutDto): Promise<{
        checkoutUrl: string;
    }>;
    fulfillOrder(session: Stripe.Checkout.Session, stripeEventId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerId: string;
        customerEmail: string | null;
        stripeIntentId: string;
        totalAmount: number;
    }>;
    updateStatus(id: string, brandId: string, dto: UpdateOrderStatusDto): Promise<{
        brand: {
            name: string;
            clerkOrgId: string;
            returnPolicy: boolean;
            id: string;
            stripeAccountId: string | null;
            stripeOnboardingComplete: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        customerId: string;
        customerEmail: string | null;
        stripeIntentId: string;
        totalAmount: number;
    }>;
    cancelWithPolicyCheck(orderId: string): Promise<{
        success: boolean;
        reason?: string;
        refundId?: string;
    }>;
}
