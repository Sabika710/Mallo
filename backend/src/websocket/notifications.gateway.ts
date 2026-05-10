import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { OnEvent } from '@nestjs/event-emitter'
import * as jwt from 'jsonwebtoken'
import * as jwksRsaModule from 'jwks-rsa'
const jwksRsa: typeof import('jwks-rsa') =
  (jwksRsaModule as any).default ?? jwksRsaModule

const jwksClient = jwksRsa({
  jwksUri: process.env.CLERK_JWKS_URL ?? 'https://valued-weevil-21.clerk.accounts.dev/.well-known/jwks.json',
  cache: true,
})

function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, (header, cb) => {
      jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err) return cb(err)
        cb(null, key?.getPublicKey())
      })
    }, { algorithms: ['RS256'] }, (err, decoded) => {
      err ? reject(err) : resolve(decoded)
    })
  })
}

@WebSocketGateway({
  cors: {
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private socketUser = new Map<string, string>() // socketId → userId

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token
      if (!token) throw new Error('no token')
      const decoded = await verifyToken(token)
      socket.data.userId = decoded.sub
      this.socketUser.set(socket.id, decoded.sub)
      socket.join(`user:${decoded.sub}`)
    } catch {
      socket.disconnect(true)
    }
  }

  handleDisconnect(socket: Socket) {
    this.socketUser.delete(socket.id)
  }

  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { userId: string }, @ConnectedSocket() socket: Socket) {
    socket.join(`user:${data.userId}`)
  }

  // ── Event listeners ──────────────────────────────────────────────────────

  @OnEvent('order.confirmed')
  onConfirmed(p: { order: any; customerId: string; brandName: string }) {
    this.server.to(`user:${p.customerId}`).emit('notification', {
      type: 'ORDER_CONFIRMED',
      message: `Order confirmed! I've notified ${p.brandName} to start preparing your items.`,
      orderId: p.order.id,
    })
  }

  @OnEvent('order.dispatched')
  onDispatched(p: { order: any; customerId: string }) {
    this.server.to(`user:${p.customerId}`).emit('notification', {
      type: 'ORDER_DISPATCHED',
      message: `Your order #${p.order.id.slice(-6).toUpperCase()} has been dispatched!`,
      orderId: p.order.id,
    })
  }

  @OnEvent('order.delivered')
  onDelivered(p: { order: any; customerId: string }) {
    this.server.to(`user:${p.customerId}`).emit('notification', {
      type: 'ORDER_DELIVERED',
      message: 'Your order has been delivered. Enjoy your purchase!',
      orderId: p.order.id,
    })
  }

  @OnEvent('order.canceled')
  onCanceled(p: { order: any; customerId: string }) {
    this.server.to(`user:${p.customerId}`).emit('notification', {
      type: 'ORDER_CANCELED',
      message: 'Your order has been canceled and a refund has been initiated.',
      orderId: p.order.id,
    })
  }

  sendAiMessage(userId: string, message: string, orderId?: string) {
    this.server.to(`user:${userId}`).emit('notification', {
      type: 'AI_MESSAGE', message, orderId,
    })
  }
}
