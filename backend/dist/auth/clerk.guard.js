"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = exports.ClerkAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const jwksRsaModule = require("jwks-rsa");
const jwksRsa = jwksRsaModule.default ?? jwksRsaModule;
const CLERK_JWKS_URL = process.env.CLERK_JWKS_URL ?? 'https://valued-weevil-21.clerk.accounts.dev/.well-known/jwks.json';
const jwksClient = jwksRsa({
    jwksUri: CLERK_JWKS_URL,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
});
function getSigningKey(header, cb) {
    jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err)
            return cb(err);
        cb(null, key?.getPublicKey());
    });
}
let ClerkAuthGuard = class ClerkAuthGuard {
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        const token = auth.slice(7);
        return new Promise((resolve, reject) => {
            jwt.verify(token, getSigningKey, { algorithms: ['RS256'] }, (err, decoded) => {
                if (err)
                    return reject(new common_1.UnauthorizedException('Invalid or expired token'));
                req.clerkUser = decoded;
                resolve(true);
            });
        });
    }
};
exports.ClerkAuthGuard = ClerkAuthGuard;
exports.ClerkAuthGuard = ClerkAuthGuard = __decorate([
    (0, common_1.Injectable)()
], ClerkAuthGuard);
exports.CurrentUser = (0, common_1.createParamDecorator)((_, ctx) => ctx.switchToHttp().getRequest().clerkUser);
//# sourceMappingURL=clerk.guard.js.map