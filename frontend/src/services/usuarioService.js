/**
 * ============================================
 * SERVICIO DE USUARIOS
 * ============================================
 * Funciones para gestionar usuarios (ADMIN)
 */

import api from './api';

const usuarioService = {
  /**
   * Obtener todos los usuarios
   */
  obtenerUsuarios: async (params = '') => {
    try {
      const response = await api.get(`/admin/usuarios${params}`);
      return response.data.data?.usuarios || response.data.usuarios || [];
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Obtener usuario por ID
   */
  obtenerUsuarioPorId: async (id) => {
    try {
      const response = await api.get(`/admin/usuarios/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Crear nuevo usuario
   */
  crearUsuario: async (usuario) => {
    try {
      const response = await api.post('/admin/usuarios', usuario);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Actualizar usuario
   */
  actualizarUsuario: async (id, usuario) => {
    try {
      const response = await api.put(`/admin/usuarios/${id}`, usuario);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Eliminar usuario
   */
  eliminarUsuario: async (id) => {
    try {
      const response = await api.delete(`/admin/usuarios/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  },

  /**
   * Cambiar estado activo/inactivo
   */
  cambiarEstado: async (id, activo) => {
    try {
      const response = await api.put(`/admin/usuarios/${id}`, { activo });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Error de conexión' };
    }
  }
};

export default usuarioService;