import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { PrismaModule } from './common/prisma.module'
import { AuthModule } from './auth/auth.module'
import { BrandsModule } from './brands/brands.module'
import { ProductsModule } from './products/products.module'
import { OrdersModule } from './orders/orders.module'
import { PaymentsModule } from './payments/payments.module'
import { AiModule } from './ai/ai.module'
import { WebsocketModule } from './websocket/websocket.module'
import { EmailModule } from './common/email.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    BrandsModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    AiModule,
    WebsocketModule,
  ],
})
export class AppModule {}
