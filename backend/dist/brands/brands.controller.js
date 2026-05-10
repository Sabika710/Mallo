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
exports.BrandsController = void 0;
const common_1 = require("@nestjs/common");
const brands_service_1 = require("./brands.service");
const brands_dto_1 = require("./brands.dto");
const clerk_guard_1 = require("../auth/clerk.guard");
let BrandsController = class BrandsController {
    constructor(brandsService) {
        this.brandsService = brandsService;
    }
    create(dto) {
        return this.brandsService.create(dto);
    }
    getMe(user) {
        return this.brandsService.findByAnyKey(user.org_id ?? user.sub);
    }
    updatePolicy(user, dto) {
        return this.brandsService.updatePolicy(user.org_id ?? user.sub, dto);
    }
    stripeOnboard(user) {
        return this.brandsService.createStripeOnboardingLink(user.org_id ?? user.sub);
    }
    async stripeSync(user) {
        const key = user.org_id ?? user.sub;
        const brand = await this.brandsService.findByAnyKey(key);
        if (!brand.stripeAccountId) {
            return { synced: false, reason: 'No Stripe account linked yet' };
        }
        const account = await this.brandsService.checkStripeAccountStatus(brand.stripeAccountId);
        return account;
    }
};
exports.BrandsController = BrandsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [brands_dto_1.CreateBrandDto]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me/policy'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, brands_dto_1.UpdatePolicyDto]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "updatePolicy", null);
__decorate([
    (0, common_1.Post)('me/stripe-onboard'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "stripeOnboard", null);
__decorate([
    (0, common_1.Post)('me/stripe-sync'),
    (0, common_1.UseGuards)(clerk_guard_1.ClerkAuthGuard),
    __param(0, (0, clerk_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BrandsController.prototype, "stripeSync", null);
exports.BrandsController = BrandsController = __decorate([
    (0, common_1.Controller)('brands'),
    __metadata("design:paramtypes", [brands_service_1.BrandsService])
], BrandsController);
//# sourceMappingURL=brands.controller.js.map