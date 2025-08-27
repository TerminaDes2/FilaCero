import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './products/product.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) {}

  async getHealth() {
    let productCount = -1;
    try {
      productCount = await this.productModel.estimatedDocumentCount();
    } catch (e) {
      // ignore
    }
    return {
      status: 'ok',
      framework: 'nest',
      mongo: productCount >= 0 ? 'connected' : 'error',
      products: productCount,
      time: new Date().toISOString(),
    };
  }
}
