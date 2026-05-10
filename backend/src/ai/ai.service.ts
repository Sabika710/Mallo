import { Injectable } from '@nestjs/common'
import { ChatGroq } from "@langchain/groq";
import { tool } from '@langchain/core/tools'
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { PrismaService } from '../common/prisma.service'
import { OrdersService } from '../orders/orders.service'
import { NotificationsGateway } from '../websocket/notifications.gateway'

const SYSTEM_PROMPT = `You are the Mallo Concierge — an AI assistant for a multi-brand marketplace.

CANCELLATION FLOW — follow this exactly:
1. If customer provides an order ID (e.g. "OH17VO93" or full ID), call getOrderStatus with it.
2. getOrderStatus returns the full order ID — use THAT full ID when calling cancelOrder.
3. Check the status and returnPolicy from getOrderStatus result:
   - PENDING → always allowed, call cancelOrder with the full ID
   - DISPATCHED + returnPolicy true → allowed, call cancelOrder with the full ID  
   - DISPATCHED + returnPolicy false → say "I'm sorry, this brand does not accept returns once an item is dispatched." Do NOT call cancelOrder.
   - DELIVERED → say delivered orders cannot be canceled
   - CANCELED → say already canceled
4. If customer doesn't know their order ID, call listMyOrders first.

IMPORTANT: Always use the full "id" field from getOrderStatus when calling cancelOrder, not the shortId.`

@Injectable()
export class AiService {
  private model: ChatGroq; // Changed type

  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private gateway: NotificationsGateway,
  ) {
    this.model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });
  }

  private buildTools(userId: string) {
    const getOrderStatus = tool(
      async ({ orderId }: { orderId: string }) => {
        try {
          let order = null

          // Try exact match first
          try {
            order = await this.ordersService.findById(orderId)
          } catch {
            // Try short ID match (last 8 chars, case-insensitive)
            const shortId = orderId.replace('#', '').toLowerCase()
            const orders = await this.prisma.order.findMany({
              where: { customerId: userId },
              include: { brand: true, items: { include: { product: true } } },
              orderBy: { createdAt: 'desc' },
            })
            order = orders.find(o =>
              o.id.slice(-8).toLowerCase() === shortId
            ) ?? null
          }

          if (!order) return JSON.stringify({ error: 'Order not found. Please check the order ID.' })

          return JSON.stringify({
            id: order.id,  // full ID — needed for cancelOrder
            shortId: order.id.slice(-8).toUpperCase(),
            status: order.status,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt,
            brandName: (order as any).brand?.name,
            brandReturnPolicy: (order as any).brand?.returnPolicy,
            items: (order as any).items?.map((i: any) => ({
              name: i.product?.name,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          })
        } catch {
          return JSON.stringify({ error: 'Order not found. Please check the order ID.' })
        }
      },
      {
        name: 'getOrderStatus',
        description:
          'Get order details by full or short order ID (last 8 characters). ' +
          'Always call this before attempting cancellation to get the full order ID.',
        schema: z.object({
          orderId: z.string().describe(
            'The order ID — can be the full ID or just the last 8 characters (e.g. "OH17VO93")'
          ),
        }),
      },
    )    

    const cancelOrder = tool(
      async ({ orderId }: { orderId: string }) => {
        try {
          // Resolve short ID to full ID if needed
          let fullOrderId = orderId
    
          if (orderId.length <= 8) {
            const allOrders = await this.ordersService.findAll({ customerId: userId })
            const match = allOrders.find(
              o => o.id.slice(-8).toUpperCase() === orderId.toUpperCase()
            )
            if (!match) return JSON.stringify({ error: `Order #${orderId} not found.` })
            fullOrderId = match.id
          }
    
          const result = await this.ordersService.cancelWithPolicyCheck(fullOrderId)
    
          if (result.success) {
            this.gateway.sendAiMessage(
              userId,
              `Your order #${orderId.toUpperCase()} has been canceled. Refund ID: ${result.refundId}`,
              fullOrderId,
            )
          }

          return JSON.stringify(result)
        } catch (err: any) {
          return JSON.stringify({ error: err.message ?? 'Failed to cancel order.' })
        }
      },
      {
        name: 'cancelOrder',
        description:
          'Cancel an order and issue a Stripe refund. Accepts full or short order ID. Enforces brand return policy. Always call getOrderStatus first to confirm the order exists.',
        schema: z.object({
          orderId: z.string().describe('Full order ID or short 8-character ID'),
        }),
      },
    )

    const listMyOrders = tool(
      async () => {
        try {
          const orders = await this.ordersService.findAll({ customerId: userId })
          if (!orders.length) return JSON.stringify({ message: 'No orders found.' })
          return JSON.stringify({
            orders: orders.map(o => ({
              id: o.id,
              shortId: `#${o.id.slice(-8).toUpperCase()}`,
              status: o.status,
              totalAmount: `$${(o.totalAmount / 100).toFixed(2)}`,
              brandName: o.brand?.name,
              createdAt: o.createdAt,
            })),
          })
        } catch {
          return JSON.stringify({ error: 'Could not retrieve orders.' })
        }
      },
      {
        name: 'listMyOrders',
        description: "List all orders for the current customer with their short IDs. Use this when the customer asks to see their orders or wants to cancel but doesn't provide an order ID.",
        schema: z.object({}),
      },
    )

    const getBrandPolicy = tool(
      async ({ brandId }: { brandId: string }) => {
        try {
          const brand = await this.prisma.brand.findUnique({ where: { id: brandId } })
          if (!brand) return JSON.stringify({ error: 'Brand not found' })
          return JSON.stringify({
            brandName: brand.name,
            returnPolicy: brand.returnPolicy,
            policyText: brand.returnPolicy
              ? 'This brand accepts returns and cancellations, even after an item is dispatched.'
              : 'This brand does NOT accept returns once an item has been dispatched.',
          })
        } catch {
          return JSON.stringify({ error: 'Could not retrieve brand policy.' })
        }
      },
      {
        name: 'getBrandPolicy',
        description: "Retrieve a brand's return policy by brand ID.",
        schema: z.object({
          brandId: z.string().describe('The brand ID to check'),
        }),
      },
    )

    return [getOrderStatus, cancelOrder, listMyOrders, getBrandPolicy]
  }

  async chat(
    userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<string> {
    const tools = this.buildTools(userId);
    const modelWithTools = this.model.bindTools(tools);

    const messages: any[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...history.map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
      ),
      new HumanMessage(message),
    ];

    // 1. Initial invocation
    let response = await modelWithTools.invoke(messages);
    messages.push(response);

    let iterations = 0;
    while (response.tool_calls && response.tool_calls.length > 0 && iterations < 10) {
      iterations++;

      for (const toolCall of response.tool_calls) {
        const selectedTool = tools.find(t => t.name === toolCall.name);
        if (!selectedTool) continue;

        try {
          // Cast to 'any' to stop the TypeScript red squiggles on .invoke()
          const result = await (selectedTool as any).invoke(toolCall.args);
          
          messages.push(new ToolMessage({
            tool_call_id: toolCall.id!,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          }));
        } catch (err: any) {
          messages.push(new ToolMessage({
            tool_call_id: toolCall.id!,
            content: JSON.stringify({ error: err.message ?? 'Tool execution failed' }),
          }));
        }
      }

      // Re-invoke the model with tool results
      response = await modelWithTools.invoke(messages);
      messages.push(response);
    }

    // Extraction logic — Gemini often returns an array of content parts
    const content = response.content;
    if (typeof content === 'string') return content;
    
    if (Array.isArray(content)) {
      return content
        .map((c: any) => {
          if (typeof c === 'string') return c;
          if (c.type === 'text') return c.text;
          return '';
        })
        .join('\n')
        .trim();
    }

    return 'I encountered an issue processing your request. Please try again.';
  }
}