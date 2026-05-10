import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from '../orders/orders.service';
import { BrandsService } from '../brands/brands.service';
export declare class PaymentsController {
    private ordersService;
    private brandsService;
    private stripe;
    constructor(ordersService: OrdersService, brandsService: BrandsService);
    handleStripeWebhook(req: RawBodyRequest<Request>, sig: string): Promise<{
        received: boolean;
    }>;
}
