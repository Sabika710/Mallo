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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(brandId) {
        return this.prisma.product.findMany({
            where: brandId ? { brandId } : {},
            include: { brand: { select: { id: true, name: true, returnPolicy: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const p = await this.prisma.product.findUnique({ where: { id }, include: { brand: true } });
        if (!p)
            throw new common_1.NotFoundException('Product not found');
        return p;
    }
    create(brandId, dto) {
        return this.prisma.product.create({ data: { ...dto, brandId } });
    }
    async update(id, brandId, dto) {
        const p = await this.findById(id);
        if (p.brandId !== brandId)
            throw new common_1.ForbiddenException('You do not own this product');
        return this.prisma.product.update({ where: { id }, data: dto });
    }
    async remove(id, brandId) {
        const p = await this.findById(id);
        if (p.brandId !== brandId)
            throw new common_1.ForbiddenException('You do not own this product');
        return this.prisma.product.delete({ where: { id } });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map