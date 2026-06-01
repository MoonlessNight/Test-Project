/**
 * administra las funciones de usuario 
 * activa desactiva y elimina desde el panel del admin
 */

import api from "../api/apiClient";

// activa o desactiva un usuario usando la ruta de toggle del backend
export async function activarUsuario(id) {
    const res = await api.patch(`/admin/usuarios/${id}/toggle`);
    return res.data;
}

export async function desactivarUsuario(id) {
    const res = await api.patch(`/admin/usuarios/${id}/toggle`);
    return res.data;
}

// elimina un usuario
export async function deleteUsuario(id) {
    const res = await api.delete(`/admin/usuarios/${id}`);
    return res.data;
}