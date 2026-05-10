import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common'
import { BrandsService } from './brands.service'
import { CreateBrandDto, UpdatePolicyDto } from './brands.dto'
import { ClerkAuthGuard, CurrentUser, ClerkUser } from '../auth/clerk.guard'

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto)
  }

  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getMe(@CurrentUser() user: ClerkUser) {
    return this.brandsService.findByAnyKey(user.org_id ?? user.sub)
  }

  @Patch('me/policy')
  @UseGuards(ClerkAuthGuard)
  updatePolicy(@CurrentUser() user: ClerkUser, @Body() dto: UpdatePolicyDto) {
    return this.brandsService.updatePolicy(user.org_id ?? user.sub, dto)
  }

  @Post('me/stripe-onboard')
  @UseGuards(ClerkAuthGuard)
  stripeOnboard(@CurrentUser() user: ClerkUser) {
    return this.brandsService.createStripeOnboardingLink(user.org_id ?? user.sub)
  }  

  @Post('me/stripe-sync')
  @UseGuards(ClerkAuthGuard)
  async stripeSync(@CurrentUser() user: ClerkUser) {
    const key = user.org_id ?? user.sub
    const brand = await this.brandsService.findByAnyKey(key)

    if (!brand.stripeAccountId) {
      return { synced: false, reason: 'No Stripe account linked yet' }
    }

    // Ask Stripe directly if onboarding is complete
    const account = await this.brandsService.checkStripeAccountStatus(brand.stripeAccountId)
    return account
  }
  }