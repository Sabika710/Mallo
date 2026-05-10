import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../common/prisma.service'
import { CreateBrandDto, UpdatePolicyDto } from './brands.dto'
import Stripe from 'stripe'

@Injectable()
export class BrandsService {
  private stripe: Stripe

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
  })
  }

  async create(dto: CreateBrandDto) {
    return this.prisma.brand.upsert({
      where:  { clerkOrgId: dto.clerkOrgId },
      update: { name: dto.name },         
      create: { name: dto.name, clerkOrgId: dto.clerkOrgId },
    })
  }

  async findByOrgId(orgId: string) {
    console.log('[findByOrgId] orgId received:', orgId)

    if (!orgId) {
      throw new NotFoundException('No org_id in token')
    }

    const brand = await this.prisma.brand.findUnique({
      where: { clerkOrgId: orgId },
    })

    if (!brand) {
      // Log all brands so we can see what's actually in the DB
      const allBrands = await this.prisma.brand.findMany({
        select: { id: true, name: true, clerkOrgId: true }
      })
      console.log('[findByOrgId] NOT FOUND. All brands in DB:', JSON.stringify(allBrands))
      throw new NotFoundException(`No brand found for org: ${orgId}`)
    }

    console.log('[findByOrgId] found:', brand.name)
    return brand
  }

  async findById(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } })
    if (!brand) throw new NotFoundException('Brand not found')
    return brand
  }

  async findByAnyKey(key: string) {
    console.log('[findByAnyKey] key:', key)

    if (!key) throw new NotFoundException('No auth key provided')
  
    const direct = await this.prisma.brand.findUnique({
      where: { clerkOrgId: key },
    })
    if (direct) {
      console.log('[findByAnyKey] direct match:', direct.name)
      return direct
    }

    const all = await this.prisma.brand.findMany({
      select: { name: true, clerkOrgId: true }
    })
    console.log('[findByAnyKey] no match for:', key, '| DB has:', all.map(b => b.clerkOrgId))

    throw new NotFoundException(
      `No brand found. Key used: ${key}. Available clerkOrgIds: ${all.map(b => b.clerkOrgId).join(', ')}`
    )
  }

  async updatePolicy(key: string, dto: UpdatePolicyDto) {
    const brand = await this.findByAnyKey(key)
    return this.prisma.brand.update({
      where: { id: brand.id },
      data: { returnPolicy: dto.returnPolicy },
    })
  }

  async createStripeOnboardingLink(key: string) {
    const brand = await this.findByAnyKey(key)

    let accountId = brand.stripeAccountId

    if (!accountId) {
      // Create a new Stripe Express account for this brand
      const account = await this.stripe.accounts.create({
        type: 'express',
        business_profile: {
          name: brand.name,
        },
        metadata: {
          brandId: brand.id,
          clerkOrgId: brand.clerkOrgId,
        },
      })
      accountId = account.id

      await this.prisma.brand.update({
        where: { id: brand.id },
        data: { stripeAccountId: accountId },
      })
    }

    const frontendUrl = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${frontendUrl}/dashboard/settings?stripe=refresh`,
      return_url:  `${frontendUrl}/dashboard/settings?stripe=success`,
      type: 'account_onboarding',
    })

    return { url: link.url }
  }

  async checkStripeAccountStatus(stripeAccountId: string) {
    const account = await this.stripe.accounts.retrieve(stripeAccountId)

    const isComplete = account.details_submitted && 
                       account.charges_enabled && 
                       account.payouts_enabled

    if (isComplete) {
      await this.prisma.brand.update({
        where: { stripeAccountId },
        data: { stripeOnboardingComplete: true },
      })
    }

    return {
      synced: isComplete,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    }
  }

  async markOnboardingComplete(stripeAccountId: string) {
    return this.prisma.brand.update({
      where: { stripeAccountId },
      data:  { stripeOnboardingComplete: true },
    })
  }
}