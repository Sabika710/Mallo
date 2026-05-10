import { CanActivate, ExecutionContext } from '@nestjs/common';
export interface ClerkUser {
    sub: string;
    org_id?: string;
    org_role?: string;
    email?: string;
}
export declare class ClerkAuthGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): Promise<boolean>;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
