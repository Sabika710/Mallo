import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreateProductDto, UpdateProductDto } from './products.dto'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(brandId?: string) {
    return this.prisma.product.findMany({
      where: brandId ? { brandId } : {},
      include: { brand: { select: { id: true, name: true, returnPolicy: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id }, include: { brand: true } })
    if (!p) throw new NotFoundException('Product not found')
    return p
  }

  create(brandId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, brandId } })
  }

  async update(id: string, brandId: string, dto: UpdateProductDto) {
    const p = await this.findById(id)
    if (p.brandId !== brandId) throw new ForbiddenException('You do not own this product')
    return this.prisma.product.update({ where: { id }, data: dto })
  }

  async remove(id: string, brandId: string) {
    const p = await this.findById(id)
    if (p.brandId !== brandId) throw new ForbiddenException('You do not own this product')
    return this.prisma.product.delete({ where: { id } })
  }
}
