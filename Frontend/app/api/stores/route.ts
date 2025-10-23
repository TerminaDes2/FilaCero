import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const backendUrl = new URL('businesses', API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`);

  const search = searchParams.get('search');
  const limit = searchParams.get('limit');

  if (search) backendUrl.searchParams.set('search', search);
  if (limit) backendUrl.searchParams.set('limit', limit);

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    return NextResponse.json(payload ?? { message: 'No se pudo obtener la lista de negocios' }, {
      status: response.status,
    });
  } catch (error) {
    console.error('[Stores API] Error comunicando con backend', error);
    return NextResponse.json({ message: 'Servicio de negocios no disponible' }, { status: 503 });
  }
}
