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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = require("stripe");
const orders_service_1 = require("../orders/orders.service");
const brands_service_1 = require("../brands/brands.service");
let PaymentsController = class PaymentsController {
    constructor(ordersService, brandsService) {
        this.ordersService = ordersService;
        this.brandsService = brandsService;
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia',
        });
    }
    async handleStripeWebhook(req, sig) {
        console.log('[webhook] hit — sig:', !!sig, '| rawBody:', !!req.rawBody);
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            console.error('[webhook] signature error:', err.message);
            throw new common_1.BadRequestException(`Webhook signature error: ${err.message}`);
        }
        console.log('[webhook] event type:', event.type);
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                console.log('[webhook] processing checkout session:', session.id);
                await this.ordersService.fulfillOrder(session, event.id);
                console.log('[webhook] fulfillOrder complete');
                break;
            }
            case 'account.updated': {
                const account = event.data.object;
                if (account.details_submitted) {
                    await this.brandsService.markOnboardingComplete(account.id).catch(() => null);
                }
                break;
            }
            default:
                break;
        }
        return { received: true };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('stripe'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleStripeWebhook", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        brands_service_1.BrandsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map