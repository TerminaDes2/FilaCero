"use client";
import React, { useState } from 'react';
import { api } from '../../../lib/api'; 

interface NewProductPanelProps {
  onClose: () => void;
  onProductCreated: () => void;
}

export const NewProductPanel: React.FC<NewProductPanelProps> = ({ onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precio: 0,
    stock: 0,
    codigo_barras: '', // Corresponde al SKU
    estado: 'activo',
    id_categoria: '1', // Conecta esto a tu <select> de Categoría
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsedValue = (name === 'precio' || name === 'stock') ? parseFloat(value) || 0 : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!formData.nombre || formData.precio <= 0) {
      setError('El nombre y el precio son obligatorios.');
      return;
    }
    try {
      await api.createProduct(formData);
      onProductCreated(); // Llama a la función del padre para refrescar
    } catch (err) {
      setError('Ocurrió un error al guardar el producto.');
      console.error(err);
    }
  };

  return (
    // Esqueleto de tu JSX con la lógica conectada
    <aside className="fixed right-0 top-0 h-screen w-[460px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">NUEVO Producto</h2>
            <button onClick={onClose} className="text-2xl">×</button>
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Precio</label>
                <input type="number" name="precio" value={formData.precio} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input type="text" name="codigo_barras" value={formData.codigo_barras} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Crear →</button>
        </div>
    </aside>
  );
};