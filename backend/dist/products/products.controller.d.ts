import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';
import { ClerkUser } from '../auth/clerk.guard';
import { BrandsService } from '../brands/brands.service';
export declare class ProductsController {
    private readonly productsService;
    private readonly brandsService;
    constructor(productsService: ProductsService, brandsService: BrandsService);
    findAll(brandId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        brand: {
            name: string;
            returnPolicy: boolean;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    })[]>;
    findOne(id: string): Promise<{
        brand: {
            name: string;
            clerkOrgId: string;
            returnPolicy: boolean;
            id: string;
            stripeAccountId: string | null;
            stripeOnboardingComplete: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    }>;
    findMine(user: ClerkUser): Promise<({
        brand: {
            name: string;
            returnPolicy: boolean;
            id: string;
        };
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    })[]>;
    create(user: ClerkUser, dto: CreateProductDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    }>;
    update(id: string, user: ClerkUser, dto: UpdateProductDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    }>;
    remove(id: string, user: ClerkUser): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    }>;
}
