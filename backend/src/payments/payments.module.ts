import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { OrdersModule } from '../orders/orders.module'
import { BrandsModule } from '../brands/brands.module'

@Module({
  imports: [OrdersModule, BrandsModule],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
