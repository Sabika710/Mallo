import { PrismaService } from '../common/prisma.service';
import { CreateProductDto, UpdateProductDto } from './products.dto';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findById(id: string): Promise<{
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
    create(brandId: string, dto: CreateProductDto): import(".prisma/client").Prisma.Prisma__ProductClient<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        brandId: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, brandId: string, dto: UpdateProductDto): Promise<{
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
    remove(id: string, brandId: string): Promise<{
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
