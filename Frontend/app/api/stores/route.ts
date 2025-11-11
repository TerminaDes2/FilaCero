import { NextRequest, NextResponse } from 'next/server';

// Requiere que NEXT_PUBLIC_API_BASE esté definida para evitar apuntar a localhost.
const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE;
if (!RAW_API_BASE) {
  console.error('[Stores API] Falta NEXT_PUBLIC_API_BASE en el entorno');
}
const API_BASE = (RAW_API_BASE ?? '').replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (!API_BASE) {
    return NextResponse.json({ message: 'Config error: NEXT_PUBLIC_API_BASE no está definida' }, { status: 500 });
  }
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
