import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateCheckoutDto, UpdateOrderStatusDto } from './orders.dto'
import { ClerkAuthGuard, CurrentUser, ClerkUser } from '../auth/clerk.guard'
import { BrandsService } from '../brands/brands.service'

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly brandsService: BrandsService,
  ) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
  async findAll(@CurrentUser() user: ClerkUser) {
    const key = user.org_id ?? user.sub
    try {
      const brand = await this.brandsService.findByAnyKey(key)
      return this.ordersService.findAll({ brandId: brand.id })
    } catch {
      return this.ordersService.findAll({ customerId: user.sub })
    }
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id)
  }

  @Post('checkout/cart')
  @UseGuards(ClerkAuthGuard)
  checkoutCart(
    @CurrentUser() user: ClerkUser,
    @Body() dto: { items: Array<{ productId: string; quantity: number }> },
  ) {
    return this.ordersService.createMultiItemCheckout(
      user.sub,
      (user as any).email ?? '',
      dto.items,
    )
  }

  @Post('checkout')
  @UseGuards(ClerkAuthGuard)
  createCheckout(@CurrentUser() user: ClerkUser, @Body() dto: CreateCheckoutDto) {
    return this.ordersService.createCheckout(user.sub, (user as any).email ?? '', dto)
  }

  @Patch(':id/status')
  @UseGuards(ClerkAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: ClerkUser,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const key = user.org_id ?? user.sub
    const brand = await this.brandsService.findByAnyKey(key)
    return this.ordersService.updateStatus(id, brand.id, dto)
  }
}