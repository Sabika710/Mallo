import {
  Controller, Post, Headers, Req, RawBodyRequest, BadRequestException, HttpCode,
} from '@nestjs/common'
import { Request } from 'express'
import Stripe from 'stripe'
import { OrdersService } from '../orders/orders.service'
import { BrandsService } from '../brands/brands.service'

@Controller('webhooks')
export class PaymentsController {
  private stripe: Stripe

  constructor(
    private ordersService: OrdersService,
    private brandsService: BrandsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as any,
  })
  }

  @Post('stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    console.log('[webhook] hit — sig:', !!sig, '| rawBody:', !!req.rawBody)

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody!,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      )
    } catch (err: any) {
      console.error('[webhook] signature error:', err.message)
      throw new BadRequestException(`Webhook signature error: ${err.message}`)
    }

    console.log('[webhook] event type:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[webhook] processing checkout session:', session.id)
        await this.ordersService.fulfillOrder(session, event.id)
        console.log('[webhook] fulfillOrder complete')
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        if (account.details_submitted) {
          await this.brandsService.markOnboardingComplete(account.id).catch(() => null)
        }
        break
      }

      default:
        break
    }

    return { received: true }
  }
}