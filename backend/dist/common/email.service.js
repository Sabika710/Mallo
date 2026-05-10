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
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let EmailService = class EmailService {
    constructor() {
        this.logger = new common_1.Logger('EmailService');
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST ?? 'smtp.mailtrap.io',
            port: parseInt(process.env.SMTP_PORT ?? '2525'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendOrderConfirmation(params) {
        const shortId = params.orderId.slice(-8).toUpperCase();
        const itemRows = params.items
            .map(i => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #2e2b22;">${i.name}</td>
          <td style="padding:8px;border-bottom:1px solid #2e2b22;text-align:center;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #2e2b22;text-align:right;">$${(i.unitPrice / 100).toFixed(2)}</td>
        </tr>`)
            .join('');
        const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0d0c0b;color:#f0ebe2;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:linear-gradient(135deg,#dca04a,#875019);padding:12px 24px;border-radius:8px;">
            <span style="font-size:20px;font-weight:700;color:white;">Mallo</span>
          </div>
        </div>

        <h2 style="color:#e8bf7e;margin-bottom:4px;">Order Confirmed! 🎉</h2>
        <p style="color:#8a8070;margin-bottom:24px;">
          Hi ${params.toName}, your order from <strong style="color:#f0ebe2;">${params.brandName}</strong> has been confirmed.
        </p>

        <div style="background:#141310;border:1px solid #2e2b22;border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 4px;color:#8a8070;font-size:12px;">ORDER ID</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#e8bf7e;font-family:monospace;">#${shortId}</p>
          <p style="margin:8px 0 0;font-size:11px;color:#8a8070;">
            Save this ID — you'll need it if you want to cancel or track your order via our AI concierge.
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="background:#1c1a17;">
              <th style="padding:8px;text-align:left;color:#8a8070;font-size:12px;">Item</th>
              <th style="padding:8px;text-align:center;color:#8a8070;font-size:12px;">Qty</th>
              <th style="padding:8px;text-align:right;color:#8a8070;font-size:12px;">Price</th>
            </tr>
          </thead>
          <tbody style="color:#f0ebe2;">${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px;text-align:right;color:#8a8070;font-weight:600;">Total:</td>
              <td style="padding:8px;text-align:right;color:#e8bf7e;font-weight:700;font-size:16px;">
                $${(params.totalAmount / 100).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="background:#1c1a17;border:1px solid #2e2b22;border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 8px;color:#e8bf7e;font-weight:600;">Need to cancel or track your order?</p>
          <p style="margin:0;color:#8a8070;font-size:13px;line-height:1.6;">
            Visit the store and use the <strong style="color:#f0ebe2;">AI Concierge</strong> chat (bottom-left corner).
            Just say: <em style="color:#e8bf7e;">"Cancel order #${shortId}"</em> or <em style="color:#e8bf7e;">"Track order #${shortId}"</em>
          </p>
        </div>

        <p style="color:#8a8070;font-size:12px;text-align:center;margin:0;">
          Powered by Mallo · The AI-Managed SaaS Mall
        </p>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from: `"Mallo Mall" <${process.env.SMTP_FROM ?? 'noreply@mallo.com'}>`,
                to: params.toEmail,
                subject: `Order Confirmed #${shortId} — ${params.brandName}`,
                html,
            });
            this.logger.log(`Confirmation email sent to ${params.toEmail} for order ${shortId}`);
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${params.toEmail}: ${err.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map