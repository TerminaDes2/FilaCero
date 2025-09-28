import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function isPrismaDecimalLike(val: any): boolean {
  // True if it's the same Decimal class reference
  if (typeof Prisma?.Decimal !== 'undefined' && val instanceof (Prisma as any).Decimal) return true;
  // Fallback heuristic: decimal.js-light internal shape (s/e/d) + toString method
  return !!(
    val &&
    typeof val === 'object' &&
    typeof (val as any).toString === 'function' &&
    's' in val && 'e' in val && 'd' in val && Array.isArray((val as any).d)
  );
}

function convertScalars(value: any): any {
  // BigInt -> string
  if (typeof value === 'bigint') return value.toString();
  // Date -> ISO string
  if (value instanceof Date) return value.toISOString();
  // Prisma Decimal / Decimal-like -> string (mantiene precisión para dinero)
  if (isPrismaDecimalLike(value)) return value.toString();
  // Array / Object recursivo
  if (Array.isArray(value)) return value.map(convertScalars);
  if (value && typeof value === 'object') {
    const output: any = {};
    for (const key of Object.keys(value)) {
      output[key] = convertScalars(value[key]);
    }
    return output;
  }
  return value;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convertScalars(data)));
  }
}
