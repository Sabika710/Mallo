"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_module_1 = require("./common/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const brands_module_1 = require("./brands/brands.module");
const products_module_1 = require("./products/products.module");
const orders_module_1 = require("./orders/orders.module");
const payments_module_1 = require("./payments/payments.module");
const ai_module_1 = require("./ai/ai.module");
const websocket_module_1 = require("./websocket/websocket.module");
const email_module_1 = require("./common/email.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            event_emitter_1.EventEmitterModule.forRoot(),
            prisma_module_1.PrismaModule,
            email_module_1.EmailModule,
            auth_module_1.AuthModule,
            brands_module_1.BrandsModule,
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            ai_module_1.AiModule,
            websocket_module_1.WebsocketModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map