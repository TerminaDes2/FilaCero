// Frontend/app/stores/crear/page.tsx

'use client'; 

// 1. Importa los tipos de evento
import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../src/lib/api';

export default function CrearNegocioPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [logo, setLogo] = useState('');
  const [hero_image_url, setHeroImageUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Añade el tipo 'FormEvent' al evento 'e'
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const nuevoNegocio = await api.createBusiness({
        nombre,
        direccion,
        telefono,
        correo,
        logo,
        hero_image_url,
      });
      
      console.log('Negocio creado:', nuevoNegocio);
      alert('¡Negocio creado con éxito!');
      
      router.push('/stores');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* 3. Añade el tipo al 'onSubmit' (aunque 'handleSubmit' ya lo infiere) */}
      <form 
        onSubmit={handleSubmit} 
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px', margin: 'auto' }}
      >
        <h2>Crear Nuevo Negocio</h2>

        <div>
          <label htmlFor="nombre">Nombre del Negocio *</label>
          <input 
            id="nombre"
            type="text" 
            value={nombre} 
            // 4. Añade el tipo 'ChangeEvent' a todos los 'onChange'
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)} 
            required 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label htmlFor="direccion">Dirección</label>
          <input 
            id="direccion"
            type="text" 
            value={direccion} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDireccion(e.target.value)} 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label htmlFor="telefono">Teléfono</label>
          <input 
            id="telefono"
            type="tel" 
            value={telefono} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTelefono(e.target.value)} 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label htmlFor="correo">Correo</label>
          <input 
            id="correo"
            type="email" 
            value={correo} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCorreo(e.target.value)} 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label htmlFor="logo">URL del Logo</label>
          <input 
            id="logo"
            type="url" 
            value={logo} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLogo(e.target.value)} 
            placeholder="https://ejemplo.com/logo.png"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

         <div>
          <label htmlFor="hero">URL de Imagen Principal (Hero)</label>
          <input 
            id="hero"
            type="url" 
            value={hero_image_url} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setHeroImageUrl(e.target.value)} 
            placeholder="https://ejemplo.com/hero.png"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: '12px', background: isLoading ? '#aaa' : '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
        >
          {isLoading ? 'Creando...' : 'Crear Negocio'}
        </button>
      </form>
    </div>
  );
}