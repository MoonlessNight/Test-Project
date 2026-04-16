/**
 * ============================================
 * SERVICIO DE CATÁLOGO (PÚBLICO)
 * ============================================
 * Funciones para ver productos, categorías (sin autenticación)
 */

import api from './api';

const catalogoService = {
  /**
   * Obtener productos con filtros
   */
  getProductos: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.categoriaId) params.append('categoriaId', filters.categoriaId);
      if (filters.subcategoriaId) params.append('subcategoriaId', filters.subcategoriaId);
      if (filters.buscar) params.append('buscar', filters.buscar);
      if (filters.precioMin) params.append('precioMin', filters.precioMin);
      if (filters.precioMax) params.append('precioMax', filters.precioMax);
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/catalogo/productos?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener un producto por ID
   */
  getProductoById: async (id) => {
    try {
      const response = await api.get(`/catalogo/productos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener todas las categorías activas
   */
  getCategorias: async () => {
    try {
      const response = await api.get('/catalogo/categorias');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener subcategorías por categoría
   */
  getSubcategoriasPorCategoria: async (categoriaId) => {
    try {
      const response = await api.get(`/catalogo/categorias/${categoriaId}/subcategorias`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener productos destacados
   */
  getProductosDestacados: async () => {
    try {
      const response = await api.get('/catalogo/destacados');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },
};

export default catalogoService;
