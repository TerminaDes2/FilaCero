import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { envs } from 'src/config';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: envs.redisHost,
        port: envs.redisPort,
        password: envs.redisPassword || undefined,
      },
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailService, EmailProcessor],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule { }
