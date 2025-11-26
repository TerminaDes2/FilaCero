"use client";
import React, { useState } from 'react';

// Implementaciones seguras locales para evitar dependencias faltantes
function safeGetTranslationCacheStats() {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('translation_cache') : null;
    const size = raw ? raw.length : 0;
    return { entries: 0, size, expiryDays: 0 };
  } catch {
    return { entries: 0, size: 0, expiryDays: 0 };
  }
}

function safeClearTranslationCache() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('translation_cache');
    }
  } catch {}
}

export default function CacheDebugPanel() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleRefreshStats = () => {
    try {
      const stat = safeGetTranslationCacheStats();
      setStats(stat);
    } catch (err) {
      console.error('Error fetching cache stats:', err);
    }
  };

  const handleClearCache = async () => {
    try {
      setLoading(true);
      safeClearTranslationCache();
      handleRefreshStats();
      console.log('Translation cache cleared');
    } catch (err) {
      console.error('Error clearing cache:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '12px', fontSize: '12px', border: '1px solid #ccc', borderRadius: '6px' }}>
      <div style={{ marginBottom: '8px' }}>
        <strong>Caché de Traducción (Debug)</strong>
      </div>
      {stats ? (
        <div style={{ marginBottom: '8px' }}>
          <div>Entradas: {stats.entries}</div>
          <div>Tamaño: {(stats.size / 1024).toFixed(2)} KB</div>
          <div>Expiración: {stats.expiryDays} días</div>
        </div>
      ) : (
        <div style={{ marginBottom: '8px', color: '#666' }}>Datos no disponibles</div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleRefreshStats}
          style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
        >
          Actualizar
        </button>
        <button
          onClick={handleClearCache}
          disabled={loading}
          style={{ padding: '4px 12px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Limpiando...' : 'Limpiar'}
        </button>
      </div>
    </div>
  );
}
