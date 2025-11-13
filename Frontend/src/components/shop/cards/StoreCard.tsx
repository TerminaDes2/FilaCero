"use client";
import Image from 'next/image';
import Link from 'next/link';

export type StoreCardProps = {
  href?: string;
  name: string;
  cover?: string;
  categories?: string[];
  eta?: string; // e.g. "20-30 min"
  rating?: number; // 4.7
  price?: string; // "$"
};

export default function StoreCard({ href = '#', name, cover, categories = [], eta, rating, price }: StoreCardProps) {
  return (
    <Link href={href} className="group block rounded-2xl overflow-hidden border border-[var(--fc-border-soft)] bg-white/80 hover:shadow-md transition">
      <div className="relative h-40 bg-slate-100">
        {cover ? (
          <Image src={cover} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-slate-400 text-sm">Sin imagen</div>
        )}
        {eta && (
          <span className="absolute left-3 top-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white bg-slate-900/80">
            {eta}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2">{name}</h3>
          {typeof rating === 'number' && (
            <span className="text-[13px] font-semibold text-slate-800">★ {rating.toFixed(1)}</span>
          )}
        </div>
        <div className="mt-1 text-[12px] text-slate-500 line-clamp-1">
          {[price, ...categories].filter(Boolean).join(' • ')}
        </div>
      </div>
    </Link>
  );
}
