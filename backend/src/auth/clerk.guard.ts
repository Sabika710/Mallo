import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException, createParamDecorator,
} from '@nestjs/common'
import { Request } from 'express'
import * as jwt from 'jsonwebtoken'

// FIX: ESM/CJS interop for jwks-rsa on Node 24.
// `import * as jwksRsa` gives us the module namespace, not the callable.
// We reach into .default and fall back to the namespace itself so this
// works regardless of how the bundler resolves the export.
import * as jwksRsaModule from 'jwks-rsa'
const jwksRsa: typeof import('jwks-rsa') =
  (jwksRsaModule as any).default ?? jwksRsaModule

export interface ClerkUser {
  sub: string
  org_id?: string
  org_role?: string
  email?: string
}

const CLERK_JWKS_URL =
  process.env.CLERK_JWKS_URL ?? 'https://valued-weevil-21.clerk.accounts.dev/.well-known/jwks.json'

// Instantiate once at module load — the .default interop is resolved above
const jwksClient = jwksRsa({
  jwksUri: CLERK_JWKS_URL,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
})

function getSigningKey(
  header: jwt.JwtHeader,
  cb: jwt.SigningKeyCallback,
): void {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return cb(err)
    cb(null, key?.getPublicKey())
  })
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>()
    const auth = req.headers.authorization

    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token')
    }

    const token = auth.slice(7)

    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getSigningKey,
        { algorithms: ['RS256'] },
        (err, decoded) => {
          if (err) return reject(new UnauthorizedException('Invalid or expired token'))
          ;(req as any).clerkUser = decoded as ClerkUser
          resolve(true)
        },
      )
    })
  }
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ClerkUser =>
    ctx.switchToHttp().getRequest().clerkUser,
)