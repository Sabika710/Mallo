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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const products_dto_1 = require("./products.dto");
const clerk_guard_1 = require("../auth/clerk.guard");
const brands_service_1 = require("../brands/brands.service");
let ProductsController = class ProductsController {
    constructor(productsService, brandsService) {
        this.productsService = productsService;
        this.brandsService = brandsService;
    }
    findAll(brandId) {
        return this.productsService.findAll(brandId);
    }
    findOne(id) {
        return this.productsService.findById(id);
    }
    async findMine(user) {
        const key = user.org_id ?? user.sub;
        const brand = await this.brandsService.findByAnyKey(key);
        return this.productsService.findAll(brand.id);
    }
    async create(user, dto) {
        const key = user.org_id ?? user.sub;
        console.log('[products/create] using key:', key);
        const brand = await this.brandsService.findByAnyKey(key);
        return this.productsService.create(brand.id, dto);
    }
    async update(id, user, dto) {
        const key = user.org_id ?? user.sub;
        const brand = await this.brandsService.findByAnyKey(key);
        return this.productsService.update(id, brand.id, dto);
    }
    async remove(id, user) {
        const key = user.org_id ?? user.sub;
        const brand = await this.brandsService.findByAnyKey(key);
        return this.productsService.remove(id, brand.id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('brandId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('mine/list'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, products_dto_1.CreateProductDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, clerk_guard_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, products_dto_1.UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, clerk_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        brands_service_1.BrandsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map