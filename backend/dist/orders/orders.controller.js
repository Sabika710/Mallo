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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const orders_dto_1 = require("./orders.dto");
const clerk_guard_1 = require("../auth/clerk.guard");
const brands_service_1 = require("../brands/brands.service");
let OrdersController = class OrdersController {
    constructor(ordersService, brandsService) {
        this.ordersService = ordersService;
        this.brandsService = brandsService;
    }
    async findAll(user) {
        const key = user.org_id ?? user.sub;
        try {
            const brand = await this.brandsService.findByAnyKey(key);
            return this.ordersService.findAll({ brandId: brand.id });
        }
        catch {
            return this.ordersService.findAll({ customerId: user.sub });
        }
    }
    findOne(id) {
        return this.ordersService.findById(id);
    }
    checkoutCart(user, dto) {
        return this.ordersService.createMultiItemCheckout(user.sub, user.email ?? '', dto.items);
    }
    createCheckout(user, dto) {
        return this.ordersService.createCheckout(user.sub, user.email ?? '', dto);
    }
    async updateStatus(id, user, dto) {
        const key = user.org_id ?? user.sub;
        const brand = await this.brandsService.findByAnyKey(key);
        return this.ordersService.updateStatus(id, brand.id, dto);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('checkout/cart'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "checkoutCart", null);
__decorate([
    (0, common_1.Post)('checkout'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, orders_dto_1.CreateCheckoutDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createCheckout", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, clerk_guard_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, orders_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateStatus", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        brands_service_1.BrandsService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map