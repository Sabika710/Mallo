import { PrismaService } from '../common/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsGateway } from '../websocket/notifications.gateway';
export declare class AiService {
    private prisma;
    private ordersService;
    private gateway;
    private model;
    constructor(prisma: PrismaService, ordersService: OrdersService, gateway: NotificationsGateway);
    private buildTools;
    chat(userId: string, message: string, history?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>): Promise<string>;
}
