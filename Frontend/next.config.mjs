/**
 * Next.js configuration focused on friendly URLs.
 * We leverage rewrites so that the public routes stay clean (SEO friendly)
 * while the application keeps its internal `app/` structure untouched.
 */

// Base de la API externa a la que se debe proxyar. Se obtiene de la variable de entorno.
// Se eliminan barras finales para evitar dobles // al componer rutas.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/+$/, '');
const IS_EXTERNAL_API = /^https?:\/\//i.test(API_BASE);

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3000' },
      // Permite /uploads cuando el frontend y backend comparten host a través de proxy
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  /**
   * Rewrites run both in development and in production (Vercel), ensuring that
   * navigation and direct requests to the prettified paths resolve the same
   * content as their internal counterparts.
   */
  async rewrites() {
    // Si no está definida la base de la API, no reescribimos /api hacia fuera.
    // Esto permite que en entornos sin la variable (p.ej. desarrollo puntual)
    // los endpoints locales de Next sigan funcionando si existieran.
    // Only create rewrites when API_BASE is an absolute external URL.
    // This prevents accidental self-rewrite loops like /api -> /api.
    const apiRewrites = IS_EXTERNAL_API
      ? [
          // Catch-all para cualquier llamada a /api/* que deba ir al backend.
          { source: '/api/:path*', destination: `${API_BASE}/:path*` },
        ]
      : [];

    return [
      // Auth flows stay accessible with short URLs (e.g. /register -> /auth/register).
      { source: '/register', destination: '/auth/register' },
      { source: '/login', destination: '/auth/login' },

      // Legal pages keep marketing friendly slugs that map to the structured folders.
      { source: '/privacy', destination: '/legal/privacidad' },
      { source: '/terms', destination: '/legal/terminos' },
      // API: proxy a la base definida por NEXT_PUBLIC_API_BASE (si existe).
      ...apiRewrites,
    ];
  },
};

export default nextConfig;
