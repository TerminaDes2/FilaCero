import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.serializeBigInt(data)),
    );
  }

  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'bigint') {
      return obj.toString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.serializeBigInt(item));
    }

    if (typeof obj === 'object') {
      const serialized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          serialized[key] = this.serializeBigInt(obj[key]);
        }
      }
      return serialized;
    }

    return obj;
  }
}
