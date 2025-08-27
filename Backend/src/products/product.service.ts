import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(@InjectModel(Product.name) private model: Model<Product>) {}

  create(data: CreateProductDto) {
    return this.model.create(data);
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 }).lean();
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException('Producto no encontrado');
    return doc;
  }

  async update(id: string, data: UpdateProductDto) {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true, lean: true });
    if (!doc) throw new NotFoundException('Producto no encontrado');
    return doc;
  }

  async remove(id: string) {
    const doc = await this.model.findByIdAndDelete(id).lean();
    if (!doc) throw new NotFoundException('Producto no encontrado');
    return { deleted: true };
  }
}