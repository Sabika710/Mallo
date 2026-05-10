import { IsString, IsNumber, IsEnum, Min } from 'class-validator'
import { OrderStatus } from '@prisma/client'

export class CreateCheckoutDto {
  @IsString()
  productId: string

  @IsNumber()
  @Min(1)
  quantity: number
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus
}
