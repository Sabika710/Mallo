export declare class EmailService {
    private transporter;
    private logger;
    constructor();
    sendOrderConfirmation(params: {
        toEmail: string;
        toName: string;
        orderId: string;
        brandName: string;
        items: Array<{
            name: string;
            quantity: number;
            unitPrice: number;
        }>;
        totalAmount: number;
    }): Promise<void>;
}
