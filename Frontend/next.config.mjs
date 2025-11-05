/**
 * Next.js configuration focused on friendly URLs.
 * We leverage rewrites so that the public routes stay clean (SEO friendly)
 * while the application keeps its internal `app/` structure untouched.
 */
const nextConfig = {
  /**
   * Rewrites run both in development and in production (Vercel), ensuring that
   * navigation and direct requests to the prettified paths resolve the same
   * content as their internal counterparts.
   */
  async rewrites() {
    return [
      // Auth flows stay accessible with short URLs (e.g. /register -> /auth/register).
      { source: '/register', destination: '/auth/register' },
      { source: '/login', destination: '/auth/login' },

      // Legal pages keep marketing friendly slugs that map to the structured folders.
      { source: '/privacy', destination: '/legal/privacidad' },
      { source: '/terms', destination: '/legal/terminos' },

      // API consumers can use the friendly alias as well if needed.
      { source: '/api/register', destination: '/api/auth/register' },
      { source: '/api/login', destination: '/api/auth/login' },
    ];
  },
};

export default nextConfig;
