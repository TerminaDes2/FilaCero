import { Module } from '@nestjs/common';
import { BusinessesController } from 'src/businesses/businesses.controller';
import { BusinessesService } from 'src/businesses/businesses.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
