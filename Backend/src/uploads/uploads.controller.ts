import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Controller('api/uploads')
export class UploadsController {

  constructor() {
    // Asegurar carpeta uploads/ en el arranque del controlador
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadPath = path.join(process.cwd(), 'uploads');

          // asegurar que exista (por si falla en windows/docker)
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          const name = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, name + ext);
        },
      }),
    })
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`, // URL pública
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
