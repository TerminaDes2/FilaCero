import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Example } from './schemas/example.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(Example.name) private exampleModel: Model<Example>) {}

  async getHealth() {
    const count = await this.exampleModel.estimatedDocumentCount().catch(() => -1);
    return {
      status: 'ok',
      framework: 'nest',
      mongo: count >= 0 ? 'connected' : 'error',
      exampleCount: count,
      time: new Date().toISOString(),
    };
  }
}
