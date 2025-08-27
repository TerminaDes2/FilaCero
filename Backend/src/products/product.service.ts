import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  create(data: CreateProductDto) {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const product = await this.repo.findOneBy({ id });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, data: UpdateProductDto) {
    const product = await this.findOne(id);
    this.repo.merge(product, data);
    return this.repo.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.repo.remove(product);
    return { deleted: true };
  }
}