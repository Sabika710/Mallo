# Mallo — AI-Managed SaaS Mall

A production-grade multi-brand marketplace built on **Next.js 14.2.15 + NestJS + Clerk + Stripe Connect + LangChain**.

---

## Tech Stack (Pinned Versions)

### Frontend
| Package | Version |
|---------|---------|
| `next` | `14.2.15` |
| `react` / `react-dom` | `18.3.1` |
| `@clerk/nextjs` | `^5.7.5` |
| `@stripe/stripe-js` | `^4.5.0` |
| `socket.io-client` | `^4.7.5` |
| `axios` | `^1.7.7` |

### Backend
| Package | Version |
|---------|---------|
| `@nestjs/common` | `^10.4.1` |
| `@prisma/client` / `prisma` | `^5.19.1` |
| `stripe` | `^16.9.0` |
| `@langchain/anthropic` | `^0.3.1` |
| `@langchain/core` | `^0.3.1` |
| `socket.io` | `^4.7.5` |
| `jwks-rsa` | `^3.1.0` |

---

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (or Docker)
- Accounts: [Clerk](https://dashboard.clerk.com), [Stripe](https://dashboard.stripe.com), [Anthropic](https://console.anthropic.com)
- **Stripe CLI** for local webhook forwarding

---

## 1. Database

```bash
# Native PostgreSQL
createdb mallo_db

# Or Docker
docker run -d --name mallo-pg \
  -e POSTGRES_DB=mallo_db \
  -e POSTGRES_USER=mallo \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 postgres:16
```

---

## 2. Backend Setup

```bash
cd backend
cp .env 
# Edit .env — fill in all keys (see table below)

npm install
npx prisma generate
npx prisma db push      # dev: push schema directly
# npx prisma migrate dev  # production: use migrations

npm run start:dev       # → http://localhost:4000/api
```

### Backend `.env` Keys

| Key | Source |
|-----|--------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks (optional) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` output (see step 4) |
| `STRIPE_PLATFORM_FEE_PERCENT` | e.g. `10` |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `PORT` | `4000` |
| `FRONTEND_URL` | `http://localhost:3000` ← **no trailing slash** |

---

## 3. Frontend Setup

```bash
cd frontend
cp .env.local
# Fill in Clerk publishable key + Stripe publishable key

npm install
npm run dev             # → http://localhost:3000
```

### Frontend `.env.local` Keys

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk dashboard |
| `CLERK_SECRET_KEY` | From Clerk dashboard |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | From Stripe dashboard |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` ← **includes /api, no trailing slash** |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:4000` |

---

## 4. Stripe Webhooks (Local Dev)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

stripe listen --forward-to localhost:4000/api/webhooks/stripe
# Copy the "whsec_..." secret printed → paste into backend .env as STRIPE_WEBHOOK_SECRET
```

Events handled:
- `checkout.session.completed` → creates Order, decrements stock, sends WS notification
- `account.updated` → marks brand Stripe onboarding complete

---

## 5. Clerk Configuration

### Enable Organizations (required for multi-tenancy)
1. Clerk Dashboard → **Organizations** → Enable
2. Set default role to `org:member`
3. Add a custom role `org:admin`

### Redirect URLs (Clerk Dashboard → Paths)
```
Sign-in:   /sign-in
Sign-up:   /sign-up
After sign-in:  /dashboard
After sign-up:  /onboarding
```

### Optional: Clerk Webhook for user sync
1. Clerk Dashboard → **Webhooks** → Add endpoint
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Events: `user.created`, `organization.created`

---

## 6. Stripe Connect (Production)

1. Stripe Dashboard → **Connect** → Enable
2. Account type: **Express** (Stripe handles KYC)
3. Set platform name and branding
4. Add redirect URLs in Connect settings

---

## Architecture

```
frontend/                         Next.js 14.2.15
  src/
  ├── app/
  │   ├── layout.tsx              Server — ClerkProvider root
  │   ├── page.tsx                Server shell + <HomeNav> client island
  │   ├── middleware.ts           Sync auth().protect() — Next 14 pattern
  │   ├── store/page.tsx          'use client' — storefront
  │   ├── onboarding/page.tsx     'use client' — brand setup
  │   ├── sign-in/[[...]]/        Clerk <SignIn> component
  │   ├── sign-up/[[...]]/        Clerk <SignUp> component
  │   └── dashboard/
  │       ├── layout.tsx          Server — auth() guard + redirect
  │       ├── page.tsx            'use client' — stats overview
  │       ├── orders/page.tsx     'use client' — order management
  │       ├── products/page.tsx   'use client' — product CRUD
  │       └── settings/page.tsx   'use client' — Stripe + policy
  ├── components/
  │   ├── ui/
  │   │   ├── HomeNav.tsx         'use client' — Clerk UserButton island
  │   │   └── NotificationToasts.tsx
  │   ├── chat/AIChatWidget.tsx   'use client' — floating concierge
  │   └── layout/
  │       ├── DashboardSidebar.tsx
  │       └── DashboardHeader.tsx
  ├── hooks/
  │   ├── useApi.ts               Injects Clerk token into every fetch
  │   └── useSocket.ts            Authenticated Socket.io connection
  └── lib/
      ├── fetcher.ts              Base fetcher — /api prefix, credentials
      └── api.ts                  Typed API methods

backend/                          NestJS — port 4000, prefix /api
  src/
  ├── main.ts                     rawBody:true, CORS, setGlobalPrefix('api')
  ├── app.module.ts
  ├── common/
  │   ├── prisma.service.ts
  │   └── prisma.module.ts        Global
  ├── auth/
  │   ├── clerk.guard.ts          JWKS RS256 verification + @CurrentUser()
  │   └── auth.module.ts
  ├── brands/                     CRUD + Stripe Express onboarding
  ├── products/                   Brand-scoped product catalog
  ├── orders/
  │   └── orders.service.ts       Checkout + idempotent fulfillOrder()
  ├── payments/
  │   └── payments.controller.ts  Stripe webhook + ProcessedEvent dedup
  ├── ai/
  │   └── ai.service.ts           LangChain agent — 4 tools, strict policy gate
  └── websocket/
      └── notifications.gateway.ts  Socket.io — Clerk JWT auth per connection
  prisma/
  └── schema.prisma               Brand, Product, Order, OrderItem, ProcessedEvent
```

---

## Key Flows

### Brand Onboarding
```
Sign up → Create Org (Clerk) → /onboarding
→ POST /api/brands { name, clerkOrgId }
→ Dashboard → Settings → "Start Stripe Onboarding"
→ POST /api/brands/me/stripe-onboard
→ Redirected to Stripe Express onboarding
→ Stripe fires account.updated webhook
→ brand.stripeOnboardingComplete = true
```

### Customer Checkout (split payment)
```
/store → "Buy" button
→ POST /api/orders/checkout { productId, quantity }
→ Stripe Checkout Session created:
    totalAmount = $100
    application_fee_amount = $10  (10% to platform)
    transfer_data.destination = brand.stripeAccountId  ($90 to brand)
→ Customer pays on Stripe-hosted page
→ checkout.session.completed webhook
→ ProcessedEvent check (dedup) → Order created → stock decremented
→ EventEmitter fires → WebSocket pushes to customer:
    "Order confirmed! I've notified [Brand] to start preparing your items."
```

### AI Cancellation — strict policy enforcement
```
Customer: "Cancel order abc123def456"
→ Agent calls getOrderStatus("abc123def456")
  → status: "DISPATCHED", brandReturnPolicy: false
→ Agent responds (NO cancelOrder call):
  "I'm sorry, this brand does not accept returns once an item is dispatched."

Customer: "Cancel order xyz789"
→ Agent calls getOrderStatus("xyz789")
  → status: "PENDING", brandReturnPolicy: true
→ Agent calls cancelOrder("xyz789")
  → cancelWithPolicyCheck: status=PENDING → allowed
  → Stripe refund issued
  → DB status → CANCELED
  → WS notification sent
→ Agent responds: "Done. Your order has been canceled. Refund ID: re_..."
```

---

## Production Deployment Checklist

### Backend (Railway / Render / Fly.io)
- [ ] `npm run build` then `node dist/main`
- [ ] Use `prisma migrate deploy` (not `db push`) in production
- [ ] Set `FRONTEND_URL` without trailing slash
- [ ] Set real Stripe live keys (`sk_live_`, `pk_live_`)
- [ ] Register production webhook URL in Stripe dashboard

### Frontend (Vercel)
- [ ] Set all `NEXT_PUBLIC_*` env vars in Vercel dashboard
- [ ] Set `NEXT_PUBLIC_API_URL` to your deployed backend URL + `/api`
- [ ] Set `NEXT_PUBLIC_WS_URL` to your backend URL (no `/api`)
- [ ] Framework preset: **Next.js**

### Stripe Production Checklist
- [ ] Activate Stripe Connect live mode
- [ ] Complete platform profile
- [ ] Swap test keys for live keys everywhere
- [ ] Re-register webhook endpoint for live events

---

## Threats Reference

| Threat | Mitigation in this codebase |
|--------|----------------------------|
| Z-Index / Clerk modal hidden | `globals.css` — `.cl-rootBox { z-index: 9999 }` |
| Stripe popup hidden | Chat widget is `z-[9990]`, Stripe redirects in same tab |
| Environment drift (trailing slash) | `main.ts` and `brands.service.ts` both call `.replace(/\/$/, '')` |
| Clerk sync lag | `ProcessedEvent` + `stripeIntentId @unique` guard |
| Stripe webhook duplication | Level 1: `ProcessedEvent` table; Level 2: DB unique constraint |
| React 19 / Next 15 feature bleed | `package.json` pins `next: 14.2.15`, `react: 18.3.1` |
| Hydration mismatch from server/client mixing | All Clerk/Socket hooks isolated in `'use client'` components |
