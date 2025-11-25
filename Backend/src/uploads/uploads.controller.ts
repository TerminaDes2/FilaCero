import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UploadsService } from './uploads.service';

@Controller('api/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {
    // Ensure uploads directory exists so multer can write files there
    try {
      this.uploadsService.ensureUploadsDir();
    } catch (e) {
      // If directory creation fails, log and continue — multer will surface the error
      // Avoid throwing here to not break app bootstrap
      // eslint-disable-next-line no-console
      console.error('Failed to ensure uploads directory:', e);
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(process.cwd(), 'uploads');
          try {
            cb(null, dir);
          } catch (e) {
            cb(e, dir);
          }
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname) || '';
          const name = uuidv4() + ext;
          cb(null, name);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No se recibió archivo');
    const host = req.get('host');
    const protocol = req.protocol;
    const url = `${protocol}://${host}/uploads/${file.filename}`;
    return { url };
  }
}