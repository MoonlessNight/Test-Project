/**
 * Administra la funciones de usuario
 * Activa y desactiva y elimina desde el panel del admin
 */

import api from '../api/apiClient';

const usuarioAdminService = {
    // Activar un usuario
    activarUsuario : async (id) => {
        const res = await apiCliente.put(`/admin/usuarios/${id}/activar`);
        return res.data;
    },

    // Desactivar un usuario
    desactivarUsuario : async (id) => {
        const res = await apiCliente.put(`/admin/usuarios/${id}/desactivar`);
        return res.data;
    },

    // Eliminar un usuario
    desactivarUsuario : async (id) => {
        const res = await apiCliente.delete(`/admin/usuarios/${id}`);
        return res.data;
    },


}

// Activar un usuario

// Desactivar un usuario
// Eliminar un usuario