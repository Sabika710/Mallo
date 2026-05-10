import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { OrdersModule } from '../orders/orders.module'
import { WebsocketModule } from '../websocket/websocket.module'

@Module({
  imports: [OrdersModule, WebsocketModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
