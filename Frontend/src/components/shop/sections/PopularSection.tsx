import React, { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

type Product = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio?: number;
  imagen?: string | null;
  id_categoria?: number;
  estado?: string;
  cantidad_actual?: number;
};

export default function DesayunosSection() {
  const [breakfastProducts, setBreakfastProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreakfastProducts = async () => {
      try {
        setLoading(true);
        // Obtener productos de inventario (puedes filtrar por categoría de desayunos si existe)
        const inventoryData = await api.getInventory({ 
          limit: 6 // Obtener 6 productos para desayunos
        });
        
        // Filtrar o transformar los datos para productos de desayuno
        const breakfastItems = inventoryData
          .filter(item => item.cantidad_actual > 0) // Solo productos con stock
          .slice(0, 6) // Tomar los primeros 6
          .map(item => ({
            id_producto: item.id_producto,
            nombre: item.producto?.nombre || 'Producto sin nombre',
            descripcion: item.producto?.descripcion,
            precio: item.producto?.precio,
            imagen: item.producto?.imagen,
            id_categoria: item.producto?.id_categoria,
            estado: item.producto?.estado,
            cantidad_actual: item.cantidad_actual
          }));
        
        setBreakfastProducts(breakfastItems);
      } catch (err) {
        console.error('Error fetching breakfast products:', err);
        setBreakfastProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreakfastProducts();
  }, []);


}
