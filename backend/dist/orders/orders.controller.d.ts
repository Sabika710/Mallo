import { OrdersService } from './orders.service';
import { CreateCheckoutDto, UpdateOrderStatusDto } from './orders.dto';
import { ClerkUser } from '../auth/clerk.guard';
import { BrandsService } from '../brands/brands.service';
export declare class OrdersController {
    private readonly ordersService;
    private readonly brandsService;
    constructor(ordersService: OrdersService, brandsService: BrandsService);
    findAll(user: ClerkUser): Promise<({
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
    findOne(id: string): Promise<{
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
    checkoutCart(user: ClerkUser, dto: {
        items: Array<{
            productId: string;
            quantity: number;
        }>;
    }): Promise<{
        checkoutUrls: string[];
        totalSessions: number;
    }>;
    createCheckout(user: ClerkUser, dto: CreateCheckoutDto): Promise<{
        checkoutUrl: string;
    }>;
    updateStatus(id: string, user: ClerkUser, dto: UpdateOrderStatusDto): Promise<{
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
}
