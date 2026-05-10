"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const origin = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    app.enableCors({
        origin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    const port = process.env.PORT ?? 4000;
    await app.listen(port);
    console.log(`🚀 Mallo API → http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map