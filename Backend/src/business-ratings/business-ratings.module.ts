import { Module } from '@nestjs/common';
import { BusinessRatingsController } from './business-ratings.controller';
import { BusinessRatingsService } from './business-ratings.service';

@Module({
  controllers: [BusinessRatingsController],
  providers: [BusinessRatingsService],
})
export class BusinessRatingsModule {}
