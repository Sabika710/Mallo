import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdatePolicyDto } from './brands.dto';
import { ClerkUser } from '../auth/clerk.guard';
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
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
    getMe(user: ClerkUser): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePolicy(user: ClerkUser, dto: UpdatePolicyDto): Promise<{
        name: string;
        clerkOrgId: string;
        returnPolicy: boolean;
        id: string;
        stripeAccountId: string | null;
        stripeOnboardingComplete: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    stripeOnboard(user: ClerkUser): Promise<{
        url: string;
    }>;
    stripeSync(user: ClerkUser): Promise<{
        synced: boolean;
        detailsSubmitted: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
    } | {
        synced: boolean;
        reason: string;
    }>;
}
