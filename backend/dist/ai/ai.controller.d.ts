import { AiService } from './ai.service';
import { ClerkUser } from '../auth/clerk.guard';
declare class HistoryItem {
    role: 'user' | 'assistant';
    content: string;
}
declare class ChatDto {
    message: string;
    orderId?: string;
    history?: HistoryItem[];
}
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    chat(user: ClerkUser, dto: ChatDto): Promise<{
        response: string;
    }>;
}
export {};
