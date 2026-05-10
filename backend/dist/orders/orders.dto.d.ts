import { OrderStatus } from '@prisma/client';
export declare class CreateCheckoutDto {
    productId: string;
    quantity: number;
}
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
}
