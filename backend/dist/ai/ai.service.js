"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const groq_1 = require("@langchain/groq");
const tools_1 = require("@langchain/core/tools");
const messages_1 = require("@langchain/core/messages");
const zod_1 = require("zod");
const prisma_service_1 = require("../common/prisma.service");
const orders_service_1 = require("../orders/orders.service");
const notifications_gateway_1 = require("../websocket/notifications.gateway");
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

IMPORTANT: Always use the full "id" field from getOrderStatus when calling cancelOrder, not the shortId.`;
let AiService = class AiService {
    constructor(prisma, ordersService, gateway) {
        this.prisma = prisma;
        this.ordersService = ordersService;
        this.gateway = gateway;
        this.model = new groq_1.ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "llama-3.3-70b-versatile",
            temperature: 0,
        });
    }
    buildTools(userId) {
        const getOrderStatus = (0, tools_1.tool)(async ({ orderId }) => {
            try {
                let order = null;
                try {
                    order = await this.ordersService.findById(orderId);
                }
                catch {
                    const shortId = orderId.replace('#', '').toLowerCase();
                    const orders = await this.prisma.order.findMany({
                        where: { customerId: userId },
                        include: { brand: true, items: { include: { product: true } } },
                        orderBy: { createdAt: 'desc' },
                    });
                    order = orders.find(o => o.id.slice(-8).toLowerCase() === shortId) ?? null;
                }
                if (!order)
                    return JSON.stringify({ error: 'Order not found. Please check the order ID.' });
                return JSON.stringify({
                    id: order.id,
                    shortId: order.id.slice(-8).toUpperCase(),
                    status: order.status,
                    totalAmount: order.totalAmount,
                    createdAt: order.createdAt,
                    brandName: order.brand?.name,
                    brandReturnPolicy: order.brand?.returnPolicy,
                    items: order.items?.map((i) => ({
                        name: i.product?.name,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                });
            }
            catch {
                return JSON.stringify({ error: 'Order not found. Please check the order ID.' });
            }
        }, {
            name: 'getOrderStatus',
            description: 'Get order details by full or short order ID (last 8 characters). ' +
                'Always call this before attempting cancellation to get the full order ID.',
            schema: zod_1.z.object({
                orderId: zod_1.z.string().describe('The order ID — can be the full ID or just the last 8 characters (e.g. "OH17VO93")'),
            }),
        });
        const cancelOrder = (0, tools_1.tool)(async ({ orderId }) => {
            try {
                let fullOrderId = orderId;
                if (orderId.length <= 8) {
                    const allOrders = await this.ordersService.findAll({ customerId: userId });
                    const match = allOrders.find(o => o.id.slice(-8).toUpperCase() === orderId.toUpperCase());
                    if (!match)
                        return JSON.stringify({ error: `Order #${orderId} not found.` });
                    fullOrderId = match.id;
                }
                const result = await this.ordersService.cancelWithPolicyCheck(fullOrderId);
                if (result.success) {
                    this.gateway.sendAiMessage(userId, `Your order #${orderId.toUpperCase()} has been canceled. Refund ID: ${result.refundId}`, fullOrderId);
                }
                return JSON.stringify(result);
            }
            catch (err) {
                return JSON.stringify({ error: err.message ?? 'Failed to cancel order.' });
            }
        }, {
            name: 'cancelOrder',
            description: 'Cancel an order and issue a Stripe refund. Accepts full or short order ID. Enforces brand return policy. Always call getOrderStatus first to confirm the order exists.',
            schema: zod_1.z.object({
                orderId: zod_1.z.string().describe('Full order ID or short 8-character ID'),
            }),
        });
        const listMyOrders = (0, tools_1.tool)(async () => {
            try {
                const orders = await this.ordersService.findAll({ customerId: userId });
                if (!orders.length)
                    return JSON.stringify({ message: 'No orders found.' });
                return JSON.stringify({
                    orders: orders.map(o => ({
                        id: o.id,
                        shortId: `#${o.id.slice(-8).toUpperCase()}`,
                        status: o.status,
                        totalAmount: `$${(o.totalAmount / 100).toFixed(2)}`,
                        brandName: o.brand?.name,
                        createdAt: o.createdAt,
                    })),
                });
            }
            catch {
                return JSON.stringify({ error: 'Could not retrieve orders.' });
            }
        }, {
            name: 'listMyOrders',
            description: "List all orders for the current customer with their short IDs. Use this when the customer asks to see their orders or wants to cancel but doesn't provide an order ID.",
            schema: zod_1.z.object({}),
        });
        const getBrandPolicy = (0, tools_1.tool)(async ({ brandId }) => {
            try {
                const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
                if (!brand)
                    return JSON.stringify({ error: 'Brand not found' });
                return JSON.stringify({
                    brandName: brand.name,
                    returnPolicy: brand.returnPolicy,
                    policyText: brand.returnPolicy
                        ? 'This brand accepts returns and cancellations, even after an item is dispatched.'
                        : 'This brand does NOT accept returns once an item has been dispatched.',
                });
            }
            catch {
                return JSON.stringify({ error: 'Could not retrieve brand policy.' });
            }
        }, {
            name: 'getBrandPolicy',
            description: "Retrieve a brand's return policy by brand ID.",
            schema: zod_1.z.object({
                brandId: zod_1.z.string().describe('The brand ID to check'),
            }),
        });
        return [getOrderStatus, cancelOrder, listMyOrders, getBrandPolicy];
    }
    async chat(userId, message, history = []) {
        const tools = this.buildTools(userId);
        const modelWithTools = this.model.bindTools(tools);
        const messages = [
            new messages_1.SystemMessage(SYSTEM_PROMPT),
            ...history.map(m => m.role === 'user' ? new messages_1.HumanMessage(m.content) : new messages_1.AIMessage(m.content)),
            new messages_1.HumanMessage(message),
        ];
        let response = await modelWithTools.invoke(messages);
        messages.push(response);
        let iterations = 0;
        while (response.tool_calls && response.tool_calls.length > 0 && iterations < 10) {
            iterations++;
            for (const toolCall of response.tool_calls) {
                const selectedTool = tools.find(t => t.name === toolCall.name);
                if (!selectedTool)
                    continue;
                try {
                    const result = await selectedTool.invoke(toolCall.args);
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCall.id,
                        content: typeof result === 'string' ? result : JSON.stringify(result),
                    }));
                }
                catch (err) {
                    messages.push(new messages_1.ToolMessage({
                        tool_call_id: toolCall.id,
                        content: JSON.stringify({ error: err.message ?? 'Tool execution failed' }),
                    }));
                }
            }
            response = await modelWithTools.invoke(messages);
            messages.push(response);
        }
        const content = response.content;
        if (typeof content === 'string')
            return content;
        if (Array.isArray(content)) {
            return content
                .map((c) => {
                if (typeof c === 'string')
                    return c;
                if (c.type === 'text')
                    return c.text;
                return '';
            })
                .join('\n')
                .trim();
        }
        return 'I encountered an issue processing your request. Please try again.';
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        orders_service_1.OrdersService,
        notifications_gateway_1.NotificationsGateway])
], AiService);
//# sourceMappingURL=ai.service.js.map