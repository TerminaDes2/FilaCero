"use client";
import React, { useState } from 'react';
import { ProductGrid } from './ProductGrid';
import { NewProductPanel } from './NewProductPanel'; // Asegúrate que este es el nombre de tu formulario

export const ProductsPage: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleProductCreated = () => {
    setRefreshKey(prevKey => prevKey + 1);
    setIsPanelOpen(false); // Cierra el panel después de crear
  };

  return (
    <div className="products-page-container p-4 md:p-6">
      
      <div className="flex justify-between items-center mb-4">
        {/* Aquí puedes poner un título si quieres */}
        <div/>
        <button 
          onClick={() => setIsPanelOpen(true)}
          className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        >
          Nuevo producto
        </button>
      </div>
      
      <div className="controls-bar mb-4">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full md:w-1/3"
        />
        {/* Aquí irían los demás filtros */}
      </div>

      <ProductGrid
        key={refreshKey} 
        search={searchTerm}
        category={activeCategory}
        view={viewMode}
      />
      
      {isPanelOpen && (
        <NewProductPanel 
          onClose={() => setIsPanelOpen(false)}
          onProductCreated={handleProductCreated}
        />
      )}
    </div>
  );
};