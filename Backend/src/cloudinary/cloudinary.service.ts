import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {}

  /**
   * Genera una firma (signature) para subidas autenticadas a Cloudinary.
   * @param timestamp - Unix timestamp en segundos
   * @param folder - Carpeta opcional en Cloudinary
   * @returns Objeto con signature, timestamp, api_key y cloud_name
   */
  generateSignature(timestamp?: number, folder?: string): {
    signature: string;
    timestamp: number;
    api_key: string;
    cloud_name: string;
    folder?: string;
  } {
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');

    if (!apiSecret || !apiKey || !cloudName) {
      throw new Error(
        'Faltan variables de entorno de Cloudinary en el backend (CLOUDINARY_API_SECRET, CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME)',
      );
    }

    const ts = timestamp || Math.floor(Date.now() / 1000);

    // Construir los parámetros a firmar (ordenados alfabéticamente)
    const paramsToSign: Record<string, string | number> = {
      timestamp: ts,
    };

    if (folder) {
      paramsToSign.folder = folder;
    }

    // Ordenar alfabéticamente y construir string
    const sortedKeys = Object.keys(paramsToSign).sort();
    const paramsString = sortedKeys
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join('&');

    // Generar signature con SHA-1
    const signature = crypto
      .createHash('sha1')
      .update(paramsString + apiSecret)
      .digest('hex');

    return {
      signature,
      timestamp: ts,
      api_key: apiKey,
      cloud_name: cloudName,
      ...(folder && { folder }),
    };
  }
}
