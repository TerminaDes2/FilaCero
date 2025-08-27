import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Example, ExampleSchema } from './schemas/example.schema';
import { ExampleModule } from './example/example.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Connection string desde MONGO_URI o por defecto a mongodb://mongo:27017/filacero
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongo:27017/filacero'),
  MongooseModule.forFeature([{ name: Example.name, schema: ExampleSchema }]),
  ExampleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
