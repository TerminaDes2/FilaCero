import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';

@Module({
  providers: [TranslationService],
  controllers: [TranslationController],
  exports: [TranslationService]
})
export class TranslationModule {}
