/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Puedes ajustar esto si usas algo diferente

  // Configuración para permitir imágenes desde tu backend
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000', // El puerto de tu backend
        pathname: '/uploads/**', // Permite cualquier imagen en /uploads
      },
    ],
  },
};

module.exports = nextConfig;