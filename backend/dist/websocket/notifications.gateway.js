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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const event_emitter_1 = require("@nestjs/event-emitter");
const jwt = require("jsonwebtoken");
const jwksRsaModule = require("jwks-rsa");
const jwksRsa = jwksRsaModule.default ?? jwksRsaModule;
const jwksClient = jwksRsa({
    jwksUri: process.env.CLERK_JWKS_URL ?? 'https://valued-weevil-21.clerk.accounts.dev/.well-known/jwks.json',
    cache: true,
});
function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, (header, cb) => {
            jwksClient.getSigningKey(header.kid, (err, key) => {
                if (err)
                    return cb(err);
                cb(null, key?.getPublicKey());
            });
        }, { algorithms: ['RS256'] }, (err, decoded) => {
            err ? reject(err) : resolve(decoded);
        });
    });
}
let NotificationsGateway = class NotificationsGateway {
    constructor() {
        this.socketUser = new Map();
    }
    async handleConnection(socket) {
        try {
            const token = socket.handshake.auth?.token;
            if (!token)
                throw new Error('no token');
            const decoded = await verifyToken(token);
            socket.data.userId = decoded.sub;
            this.socketUser.set(socket.id, decoded.sub);
            socket.join(`user:${decoded.sub}`);
        }
        catch {
            socket.disconnect(true);
        }
    }
    handleDisconnect(socket) {
        this.socketUser.delete(socket.id);
    }
    handleJoin(data, socket) {
        socket.join(`user:${data.userId}`);
    }
    onConfirmed(p) {
        this.server.to(`user:${p.customerId}`).emit('notification', {
            type: 'ORDER_CONFIRMED',
            message: `Order confirmed! I've notified ${p.brandName} to start preparing your items.`,
            orderId: p.order.id,
        });
    }
    onDispatched(p) {
        this.server.to(`user:${p.customerId}`).emit('notification', {
            type: 'ORDER_DISPATCHED',
            message: `Your order #${p.order.id.slice(-6).toUpperCase()} has been dispatched!`,
            orderId: p.order.id,
        });
    }
    onDelivered(p) {
        this.server.to(`user:${p.customerId}`).emit('notification', {
            type: 'ORDER_DELIVERED',
            message: 'Your order has been delivered. Enjoy your purchase!',
            orderId: p.order.id,
        });
    }
    onCanceled(p) {
        this.server.to(`user:${p.customerId}`).emit('notification', {
            type: 'ORDER_CANCELED',
            message: 'Your order has been canceled and a refund has been initiated.',
            orderId: p.order.id,
        });
    }
    sendAiMessage(userId, message, orderId) {
        this.server.to(`user:${userId}`).emit('notification', {
            type: 'AI_MESSAGE', message, orderId,
        });
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleJoin", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.confirmed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "onConfirmed", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.dispatched'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "onDispatched", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.delivered'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "onDelivered", null);
__decorate([
    (0, event_emitter_1.OnEvent)('order.canceled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "onCanceled", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
            credentials: true,
        },
    })
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map