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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma.service");
const stripe_1 = require("stripe");
let BrandsService = class BrandsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-01-27.acacia',
        });
    }
    async create(dto) {
        return this.prisma.brand.upsert({
            where: { clerkOrgId: dto.clerkOrgId },
            update: { name: dto.name },
            create: { name: dto.name, clerkOrgId: dto.clerkOrgId },
        });
    }
    async findByOrgId(orgId) {
        console.log('[findByOrgId] orgId received:', orgId);
        if (!orgId) {
            throw new common_1.NotFoundException('No org_id in token');
        }
        const brand = await this.prisma.brand.findUnique({
            where: { clerkOrgId: orgId },
        });
        if (!brand) {
            const allBrands = await this.prisma.brand.findMany({
                select: { id: true, name: true, clerkOrgId: true }
            });
            console.log('[findByOrgId] NOT FOUND. All brands in DB:', JSON.stringify(allBrands));
            throw new common_1.NotFoundException(`No brand found for org: ${orgId}`);
        }
        console.log('[findByOrgId] found:', brand.name);
        return brand;
    }
    async findById(id) {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        if (!brand)
            throw new common_1.NotFoundException('Brand not found');
        return brand;
    }
    async findByAnyKey(key) {
        console.log('[findByAnyKey] key:', key);
        if (!key)
            throw new common_1.NotFoundException('No auth key provided');
        const direct = await this.prisma.brand.findUnique({
            where: { clerkOrgId: key },
        });
        if (direct) {
            console.log('[findByAnyKey] direct match:', direct.name);
            return direct;
        }
        const all = await this.prisma.brand.findMany({
            select: { name: true, clerkOrgId: true }
        });
        console.log('[findByAnyKey] no match for:', key, '| DB has:', all.map(b => b.clerkOrgId));
        throw new common_1.NotFoundException(`No brand found. Key used: ${key}. Available clerkOrgIds: ${all.map(b => b.clerkOrgId).join(', ')}`);
    }
    async updatePolicy(key, dto) {
        const brand = await this.findByAnyKey(key);
        return this.prisma.brand.update({
            where: { id: brand.id },
            data: { returnPolicy: dto.returnPolicy },
        });
    }
    async createStripeOnboardingLink(key) {
        const brand = await this.findByAnyKey(key);
        let accountId = brand.stripeAccountId;
        if (!accountId) {
            const account = await this.stripe.accounts.create({
                type: 'express',
                business_profile: {
                    name: brand.name,
                },
                metadata: {
                    brandId: brand.id,
                    clerkOrgId: brand.clerkOrgId,
                },
            });
            accountId = account.id;
            await this.prisma.brand.update({
                where: { id: brand.id },
                data: { stripeAccountId: accountId },
            });
        }
        const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
        const link = await this.stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${frontendUrl}/dashboard/settings?stripe=refresh`,
            return_url: `${frontendUrl}/dashboard/settings?stripe=success`,
            type: 'account_onboarding',
        });
        return { url: link.url };
    }
    async checkStripeAccountStatus(stripeAccountId) {
        const account = await this.stripe.accounts.retrieve(stripeAccountId);
        const isComplete = account.details_submitted &&
            account.charges_enabled &&
            account.payouts_enabled;
        if (isComplete) {
            await this.prisma.brand.update({
                where: { stripeAccountId },
                data: { stripeOnboardingComplete: true },
            });
        }
        return {
            synced: isComplete,
            detailsSubmitted: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
        };
    }
    async markOnboardingComplete(stripeAccountId) {
        return this.prisma.brand.update({
            where: { stripeAccountId },
            data: { stripeOnboardingComplete: true },
        });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map