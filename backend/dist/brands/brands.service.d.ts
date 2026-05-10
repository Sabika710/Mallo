import { PrismaService } from '../common/prisma.service';
import { CreateBrandDto, UpdatePolicyDto } from './brands.dto';
export declare class BrandsService {
    private prisma;
    private stripe;
    constructor(prisma: PrismaService);
    create(dto: CreateBrandDto): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByOrgId(orgId: string): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findById(id: string): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByAnyKey(key: string): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePolicy(key: string, dto: UpdatePolicyDto): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createStripeOnboardingLink(key: string): Promise<{
        url: string;
    }>;
    checkStripeAccountStatus(stripeAccountId: string): Promise<{
        synced: boolean;
        detailsSubmitted: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
    }>;
    markOnboardingComplete(stripeAccountId: string): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
