// Dynamic translation utilities using backend Azure service.
// Base language assumed Spanish (es-MX). If locale is es-MX no translation occurs.

export async function translateDynamic(fields: string[], locale: string): Promise<string[]> {
  if (locale.startsWith('es')) return fields; // No translate needed
  // Call backend translation API
  try {
    const res = await fetch('/api/translation/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: fields, to: locale })
    });
    if (!res.ok) return fields;
    const json = await res.json();
    return json.translations || fields;
  } catch {
    return fields;
  }
}

// Helper to translate an array of objects by certain field names
export async function translateObjects<T extends Record<string, any>>(items: T[], locale: string, fieldNames: string[]): Promise<T[]> {
  if (locale.startsWith('es')) return items;
  const collected: string[] = [];
  for (const item of items) {
    for (const f of fieldNames) {
      if (typeof item[f] === 'string' && item[f].trim()) collected.push(item[f]);
    }
  }
  if (collected.length === 0) return items;
  const translated = await translateDynamic(collected, locale);
  let idx = 0;
  const cloned = items.map(i => ({ ...i }));
  for (const item of cloned) {
    for (const f of fieldNames) {
      if (typeof item[f] === 'string' && item[f].trim()) {
        (item as any)[f] = translated[idx++] || (item as any)[f];
      }
    }
  }
  return cloned;
}
