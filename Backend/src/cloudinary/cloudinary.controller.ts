import { Controller, Post, Body } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller('api/cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('signature')
  generateSignature(
    @Body() body: { timestamp?: number; folder?: string },
  ): {
    signature: string;
    timestamp: number;
    api_key: string;
    cloud_name: string;
    folder?: string;
  } {
    return this.cloudinaryService.generateSignature(body.timestamp, body.folder);
  }
}
