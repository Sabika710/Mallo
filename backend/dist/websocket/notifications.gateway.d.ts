import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private socketUser;
    handleConnection(socket: Socket): Promise<void>;
    handleDisconnect(socket: Socket): void;
    handleJoin(data: {
        userId: string;
    }, socket: Socket): void;
    onConfirmed(p: {
        order: any;
        customerId: string;
        brandName: string;
    }): void;
    onDispatched(p: {
        order: any;
        customerId: string;
    }): void;
    onDelivered(p: {
        order: any;
        customerId: string;
    }): void;
    onCanceled(p: {
        order: any;
        customerId: string;
    }): void;
    sendAiMessage(userId: string, message: string, orderId?: string): void;
}
