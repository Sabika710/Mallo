import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto, UpdateProductDto } from './products.dto'
import { ClerkAuthGuard, CurrentUser, ClerkUser } from '../auth/clerk.guard'
import { BrandsService } from '../brands/brands.service'

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly brandsService: BrandsService,
  ) {}

  // Public — storefront browsing (all products or filter by brandId)
  @Get()
  findAll(@Query('brandId') brandId?: string) {
    return this.productsService.findAll(brandId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id)
  }

  // Dashboard — only returns THIS brand's products
  @Get('mine/list')
  @UseGuards(ClerkAuthGuard)
  async findMine(@CurrentUser() user: ClerkUser) {
    const key   = user.org_id ?? user.sub
    const brand = await this.brandsService.findByAnyKey(key)
    return this.productsService.findAll(brand.id)
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  async create(@CurrentUser() user: ClerkUser, @Body() dto: CreateProductDto) {
    const key   = user.org_id ?? user.sub
    console.log('[products/create] using key:', key)
    const brand = await this.brandsService.findByAnyKey(key)
    return this.productsService.create(brand.id, dto)
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: ClerkUser,
    @Body() dto: UpdateProductDto,
  ) {
    const key   = user.org_id ?? user.sub
    const brand = await this.brandsService.findByAnyKey(key)
    return this.productsService.update(id, brand.id, dto)
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: ClerkUser) {
    const key   = user.org_id ?? user.sub
    const brand = await this.brandsService.findByAnyKey(key)
    return this.productsService.remove(id, brand.id)
  }
}