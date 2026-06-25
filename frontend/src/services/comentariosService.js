/**
 * ============================================
 * SERVICIO DE COMENTARIOS
 * ============================================
 * Funciones para gestión de comentarios (cliente, admin y público)
 */

import api from './api';

const comentariosService = {
  // ==========================================
  // CLIENTE
  // ==========================================
  
  /**
   * Crear un nuevo comentario
   * POST /api/cliente/comentarios
   */
  crearComentario: async (productoId, calificacion, comentario) => {
    try {
      const response = await api.post('/cliente/comentarios', {
        productoId,
        calificacion,
        comentario
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Editar comentario propio
   * PUT /api/cliente/comentarios/:comentarioId
   */
  editarComentario: async (comentarioId, calificacion, comentario) => {
    try {
      const response = await api.put(`/cliente/comentarios/${comentarioId}`, {
        calificacion,
        comentario
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Eliminar comentario propio
   * DELETE /api/cliente/comentarios/:comentarioId
   */
  eliminarComentarioPropio: async (comentarioId) => {
    try {
      const response = await api.delete(`/cliente/comentarios/${comentarioId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // PÚBLICO
  // ==========================================
  
  /**
   * Obtener comentarios de un producto
   * GET /api/catalogo/productos/:productoId/comentarios
   */
  obtenerComentariosProducto: async (productoId, pagina = 1, limite = 10) => {
    try {
      const response = await api.get(`/catalogo/productos/${productoId}/comentarios`, {
        params: { pagina, limite }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  // ==========================================
  // ADMIN
  // ==========================================
  
  /**
   * Obtener todos los comentarios (admin)
   * GET /api/admin/comentarios
   */
  obtenerTodosComentarios: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.pagina) params.append('pagina', filters.pagina);
      if (filters.limite) params.append('limite', filters.limite);
      
      const response = await api.get(`/admin/comentarios?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Moderar un comentario (mostrar/ocultar)
   * PUT /api/admin/comentarios/:comentarioId/moderar
   */
  moderarComentario: async (comentarioId, visible) => {
    try {
      const response = await api.put(`/admin/comentarios/${comentarioId}/moderar`, {
        visible
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Alternar visibilidad de comentario
   * PATCH /api/admin/comentarios/:comentarioId/toggle
   */
  toggleComentario: async (comentarioId) => {
    try {
      const response = await api.patch(`/admin/comentarios/${comentarioId}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Eliminar comentario (admin)
   * DELETE /api/admin/comentarios/:comentarioId
   */
  eliminarComentario: async (comentarioId) => {
    try {
      const response = await api.delete(`/admin/comentarios/${comentarioId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener comentarios por usuario (admin)
   * GET /api/admin/comentarios/usuario/:usuarioId
   */
  obtenerComentariosPorUsuario: async (usuarioId, pagina = 1, limite = 10) => {
    try {
      const response = await api.get(`/admin/comentarios/usuario/${usuarioId}`, {
        params: { pagina, limite }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default comentariosService;
