const backendOriginCache: { value?: string | null } = {};

function resolveBackendOrigin(): string | undefined {
  if (backendOriginCache.value !== undefined) {
    return backendOriginCache.value ?? undefined;
  }

  const envBaseRaw = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (envBaseRaw) {
    const sanitized = envBaseRaw.replace(/\/+$/, "");
    backendOriginCache.value = sanitized.replace(/\/api$/i, "");
    return backendOriginCache.value ?? undefined;
  }

  if (typeof window !== "undefined") {
    backendOriginCache.value = window.location.origin.replace(/\/+$/, "");
    return backendOriginCache.value ?? undefined;
  }

  backendOriginCache.value = null;
  return undefined;
}

function normalizePath(input: string): string {
  if (input.startsWith("/")) {
    return input;
  }
  return `/${input.replace(/^\/+/, "")}`;
}

export function resolveMediaUrl(input?: string | null): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  if (/^(data:|blob:|https?:\/\/)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const origin = resolveBackendOrigin();
  if (!origin) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed.replace(/^\/+/, "")}`;
  }

  const base = origin.replace(/\/+$/, "");
  const path = normalizePath(trimmed);
  return `${base}${path}`;
}

export function resolveProductImage(source: any): string | undefined {
  if (!source) return undefined;

  const mediaCandidates = Array.isArray(source.media)
    ? source.media
    : Array.isArray(source.producto_media)
    ? source.producto_media
    : undefined;

  if (Array.isArray(mediaCandidates) && mediaCandidates.length > 0) {
    const primary = mediaCandidates.find((item: any) => item && item.principal && item.url) ??
      mediaCandidates.find((item: any) => item && item.url);
    if (primary?.url) {
      const normalized = resolveMediaUrl(primary.url);
      if (normalized) {
        return normalized;
      }
    }
  }

  const directUrl =
    source.imagen_url ??
    source.imagen ??
    source.image ??
    source.cover_url ??
    source.cover ??
    source.thumbnail ??
    source.photo ??
    null;

  return resolveMediaUrl(directUrl);
}
