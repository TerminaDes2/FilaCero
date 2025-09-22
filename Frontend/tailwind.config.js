/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Escala "brand" basada en frambuesa / rojo suave
        // Uso recomendado:
        // 50-100 fondos sutiles, 200 badges, 300/400 bordes/acento claro, 500 texto/acento, 600 CTA principal, 700 hover CTA, 800 activo, 900 muy oscuro
        brand: {
          50:  '#FFF5F7', // fondo muy tenue
          100: '#FFE8ED', // hover soft / chips
          200: '#FFC9D6', // badges
          300: '#FF9EB4', // acento claro
          400: '#F8698A', // resaltado / borde acentuado
            500: '#E94A6F', // color principal texto/acento
          600: '#DE355F', // CTA primario
          700: '#C12249', // hover CTA
          800: '#931836', // pressed / dark accent
          900: '#5D0F23'  // extremo oscuro (raro uso)
        },
        // Escala cálida (acentos suaves / contraste de marca)
        sun: {
          50: '#FFFAF2',
          100: '#FFF3E0',
          200: '#FCE8B7', // referencia dada
          300: '#F9D98A',
          400: '#F5C65C',
          500: '#E8AE2E',
          600: '#C88716',
          700: '#9E6511',
          800: '#6B440E',
          900: '#3C2609'
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-grid': 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
      },
      animation: {
        'float-slow': 'float 12s ease-in-out infinite',
        'float-medium': 'float 8s ease-in-out infinite',
        'blob': 'blob 18s infinite',
        'fade-up': 'fadeUp 0.7s both',
        'spin-slow': 'spin 12s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(-8px)' },
          '50%': { transform: 'translateY(8px)' }
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      boxShadow: {
        'glow': '0 0 0 1px rgba(255,255,255,0.1), 0 4px 40px -8px rgba(233,74,111,0.45)'
      },
      borderRadius: {
        '3xl': '1.75rem'
      }
    },
  },
  plugins: [],
};
