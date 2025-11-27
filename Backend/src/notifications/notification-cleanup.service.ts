import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// TODO: Implementar integración con S3/GCP cuando esté configurado
// import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
// import { Storage } from '@google-cloud/storage';

@Injectable()
export class NotificationCleanupService {
  private readonly logger = new Logger(NotificationCleanupService.name);
  private readonly RETENTION_DAYS = 30;
  private readonly ARCHIVE_DAYS = 365;
  private s3CircuitBreakerOpen = false;
  
  // TODO: Inicializar cliente S3/GCP cuando esté configurado
  // private s3Client: S3Client;
  // private gcpStorage: Storage;

  constructor(private readonly prisma: PrismaService) {
    // TODO: Configurar S3 con SSE-KMS
    // this.s3Client = new S3Client({
    //   region: process.env.AWS_REGION,
    //   credentials: {...},
    // });
  }

  /**
   * Ejecuta limpieza diaria a las 2:00 AM
   */
  @Cron('0 2 * * *') // 2:00 AM todos los días
  async runDailyCleanup(): Promise<void> {
    this.logger.log('Starting daily notification cleanup...');

    try {
      await this.archiveOldNotifications();
      await this.deleteArchivedNotifications();
      await this.generateMetrics();
      
      this.logger.log('Daily cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during daily cleanup:', error);
    }
  }

  /**
   * Archiva notificaciones > 30 días a S3/GCP con encriptación
   */
  async archiveOldNotifications(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

    try {
      // Obtener notificaciones a archivar
      const notificationsToArchive = await this.prisma.notificacion.findMany({
        where: {
          creado_en: {
            lt: cutoffDate,
          },
        },
        take: 1000, // Procesar en lotes de 1000
      });

      if (notificationsToArchive.length === 0) {
        this.logger.log('No notifications to archive');
        return;
      }

      this.logger.log(`Found ${notificationsToArchive.length} notifications to archive`);

      // TODO: Implementar archivado a S3 con SSE-KMS
      // Circuit breaker: Si S3 falla, registrar error y continuar
      if (this.s3CircuitBreakerOpen) {
        this.logger.warn('S3 circuit breaker is open, skipping archival');
        return;
      }

      try {
        // Agrupar notificaciones por mes para archivado eficiente
        const groupedByMonth = this.groupByMonth(notificationsToArchive);

        for (const [monthKey, notifications] of Object.entries(groupedByMonth)) {
          // TODO: Comprimir y subir a S3
          // const compressed = await this.compressToGzip(JSON.stringify(notifications));
          // const key = `notifications/${monthKey}.json.gz`;
          
          // await this.s3Client.send(new PutObjectCommand({
          //   Bucket: process.env.S3_NOTIFICATIONS_BUCKET,
          //   Key: key,
          //   Body: compressed,
          //   ServerSideEncryption: 'aws:kms',
          //   SSEKMSKeyId: process.env.AWS_KMS_KEY_ID,
          //   ContentType: 'application/json',
          //   ContentEncoding: 'gzip',
          // }));

          this.logger.log(`Archived ${notifications.length} notifications for ${monthKey}`);
        }

        // Eliminar notificaciones archivadas de la BD
        const idsToDelete = notificationsToArchive.map(n => n.id_notificacion);
        await this.prisma.notificacion.deleteMany({
          where: {
            id_notificacion: {
              in: idsToDelete,
            },
          },
        });

        this.logger.log(`Deleted ${idsToDelete.length} archived notifications from database`);
        
        // Resetear circuit breaker si tuvo éxito
        this.s3CircuitBreakerOpen = false;
      } catch (error) {
        this.logger.error('Error archiving to S3:', error);
        // Abrir circuit breaker
        this.s3CircuitBreakerOpen = true;
        // No lanzar error para permitir que el cron continúe
      }
    } catch (error) {
      this.logger.error('Error querying notifications for archival:', error);
      throw error;
    }
  }

  /**
   * Elimina archivos archivados > 1 año
   */
  async deleteArchivedNotifications(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.ARCHIVE_DAYS);

    this.logger.log(`Deleting archived notifications older than ${this.ARCHIVE_DAYS} days`);

    // TODO: Implementar eliminación de archivos en S3
    // const prefix = 'notifications/';
    // const listResponse = await this.s3Client.send(new ListObjectsV2Command({
    //   Bucket: process.env.S3_NOTIFICATIONS_BUCKET,
    //   Prefix: prefix,
    // }));

    // const objectsToDelete = listResponse.Contents?.filter(obj => {
    //   const objDate = obj.LastModified;
    //   return objDate && objDate < cutoffDate;
    // }) || [];

    // if (objectsToDelete.length > 0) {
    //   await this.s3Client.send(new DeleteObjectsCommand({
    //     Bucket: process.env.S3_NOTIFICATIONS_BUCKET,
    //     Delete: {
    //       Objects: objectsToDelete.map(obj => ({ Key: obj.Key })),
    //     },
    //   }));
    //   this.logger.log(`Deleted ${objectsToDelete.length} old archived files`);
    // }
  }

  /**
   * Recupera notificación archivada (para auditorías)
   */
  async retrieveArchivedNotification(id: bigint): Promise<any> {
    // TODO: Implementar recuperación desde S3 con desencriptación automática
    // La llave KMS se debe usar automáticamente por S3
    
    this.logger.log(`Attempting to retrieve archived notification ${id}`);
    
    // return await this.s3Client.send(new GetObjectCommand({
    //   Bucket: process.env.S3_NOTIFICATIONS_BUCKET,
    //   Key: key,
    // }));
    
    throw new Error('S3 archival not yet implemented');
  }

  /**
   * Genera métricas de uso de notificaciones
   */
  private async generateMetrics(): Promise<void> {
    try {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const stats = await this.prisma.notificacion.groupBy({
        by: ['tipo', 'canal'],
        _count: {
          id_notificacion: true,
        },
        where: {
          creado_en: {
            gte: last30Days,
          },
        },
      });

      const totalNotifications = await this.prisma.notificacion.count();
      const unreadNotifications = await this.prisma.notificacion.count({
        where: { leida: false },
      });

      this.logger.log('Notification Metrics:');
      this.logger.log(`Total notifications: ${totalNotifications}`);
      this.logger.log(`Unread notifications: ${unreadNotifications}`);
      this.logger.log(`Last 30 days breakdown:`, stats);
    } catch (error) {
      this.logger.error('Error generating metrics:', error);
    }
  }

  /**
   * Agrupa notificaciones por mes (YYYY-MM)
   */
  private groupByMonth(notifications: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};

    for (const notification of notifications) {
      const date = new Date(notification.creado_en);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(notification);
    }

    return grouped;
  }

  /**
   * Comprime datos a gzip
   */
  // private async compressToGzip(data: string): Promise<Buffer> {
  //   const zlib = require('zlib');
  //   return new Promise((resolve, reject) => {
  //     zlib.gzip(data, (err, buffer) => {
  //       if (err) reject(err);
  //       else resolve(buffer);
  //     });
  //   });
  // }
}
