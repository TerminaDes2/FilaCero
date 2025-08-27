import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products/product.schema';

@Injectable()
export class AppService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async getHealth() {
    let productCount = -1;
    let db = 'error';
    try {
      productCount = await this.repo.count();
      db = 'connected';
    } catch {
      // ignore
    }
    return {
      status: 'ok',
      framework: 'nest',
      db,
      products: productCount,
      time: new Date().toISOString(),
    };
  }
}
