import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { AiService } from './ai.service'
import { ClerkAuthGuard, CurrentUser, ClerkUser } from '../auth/clerk.guard'
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class HistoryItem {
  @IsString()
  role: 'user' | 'assistant'

  @IsString()
  content: string
}

class ChatDto {
  @IsString()
  message: string

  @IsOptional()
  @IsString()
  orderId?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryItem)
  history?: HistoryItem[]
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @UseGuards(ClerkAuthGuard)
  async chat(@CurrentUser() user: ClerkUser, @Body() dto: ChatDto) {
    // Prepend order context when the UI provides an orderId
    const message = dto.orderId
      ? `[Context: order ID is ${dto.orderId}] ${dto.message}`
      : dto.message

    const response = await this.aiService.chat(user.sub, message, dto.history ?? [])
    return { response }
  }
}
