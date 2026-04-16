/**
 * ============================================
 * SERVICIO DE ADMINISTRACIÓN
 * ============================================
 * Funciones para gestión administrativa (admin y auxiliar)
 */

import api from './api';

const adminService = {
  // ==========================================
  // CATEGORÍAS
  // ==========================================
  getCategorias: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.incluirStats) params.append('incluirStats', filters.incluirStats);
      
      const response = await api.get(`/admin/categorias?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  getCategoriaById: async (id) => {
    try {
      const response = await api.get(`/admin/categorias/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  crearCategoria: async (data) => {
    try {
      const response = await api.post('/admin/categorias', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  actualizarCategoria: async (id, data) => {
    try {
      const response = await api.put(`/admin/categorias/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  toggleCategoria: async (id) => {
    try {
      const response = await api.patch(`/admin/categorias/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  eliminarCategoria: async (id) => {
    try {
      const response = await api.delete(`/admin/categorias/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // SUBCATEGORÍAS
  // ==========================================
  getSubcategorias: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.categoriaId) params.append('categoriaId', filters.categoriaId);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.incluirCategoria) params.append('incluirCategoria', filters.incluirCategoria);
      
      const response = await api.get(`/admin/subcategorias?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  crearSubcategoria: async (data) => {
    try {
      const response = await api.post('/admin/subcategorias', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  actualizarSubcategoria: async (id, data) => {
    try {
      const response = await api.put(`/admin/subcategorias/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  eliminarSubcategoria: async (id) => {
    try {
      const response = await api.delete(`/admin/subcategorias/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // PRODUCTOS
  // ==========================================
  getProductos: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.categoriaId) params.append('categoriaId', filters.categoriaId);
      if (filters.subcategoriaId) params.append('subcategoriaId', filters.subcategoriaId);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.conStock) params.append('conStock', filters.conStock);
      if (filters.buscar) params.append('buscar', filters.buscar);
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/admin/productos?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  getProductoById: async (id) => {
    try {
      const response = await api.get(`/admin/productos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  crearProducto: async (formData) => {
    try {
      const response = await api.post('/admin/productos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  actualizarProducto: async (id, formData) => {
    try {
      const response = await api.put(`/admin/productos/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  actualizarStock: async (id, cantidad, operacion) => {
    try {
      const response = await api.patch(`/admin/productos/${id}/stock`, {
        cantidad,
        operacion,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  toggleProducto: async (id) => {
    try {
      const response = await api.patch(`/admin/productos/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  eliminarProducto: async (id) => {
    try {
      const response = await api.delete(`/admin/productos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // USUARIOS
  // ==========================================
  getUsuarios: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.rol) params.append('rol', filters.rol);
      if (filters.activo !== undefined) params.append('activo', filters.activo);
      if (filters.buscar) params.append('buscar', filters.buscar);
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/admin/usuarios?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  getUsuarioById: async (id) => {
    try {
      const response = await api.get(`/admin/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  crearUsuario: async (data) => {
    try {
      const response = await api.post('/admin/usuarios', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  actualizarUsuario: async (id, data) => {
    try {
      const response = await api.put(`/admin/usuarios/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  toggleUsuario: async (id) => {
    try {
      const response = await api.patch(`/admin/usuarios/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  eliminarUsuario: async (id) => {
    try {
      const response = await api.delete(`/admin/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // PEDIDOS (ADMIN)
  // ==========================================
  getAllPedidos: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.usuarioId) params.append('usuarioId', filters.usuarioId);
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/admin/pedidos?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  getPedidoById: async (id) => {
    try {
      const response = await api.get(`/admin/pedidos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  actualizarEstadoPedido: async (id, estado) => {
    try {
      const response = await api.put(`/admin/pedidos/${id}/estado`, {
        estado,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  getEstadisticasPedidos: async () => {
    try {
      const response = await api.get('/admin/pedidos/estadisticas');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },
};

export default adminService;
