import { Body, Controller, Post } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslateDto } from './dto/translate.dto';

@Controller('api/translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  async translate(@Body() dto: TranslateDto) {
    const translations = await this.translationService.translateArray(dto.texts, dto.to);
    return { translations, locale: dto.to };
  }
}
