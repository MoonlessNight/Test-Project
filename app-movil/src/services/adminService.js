/**
 * Encapsula las operaciones del panel administrativo sobre productos
 * crea, edita, elimina, activa/desactiva productos
 * todas las funciones usan el cliente http central para incluir el token y manejo de errores 
 */

import apiClient from '../api/apiClient';

const buildFormData = (data) => {
    if (data instanceof FormData) {
        return data;
    }

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });
    return formData;
};

//crea un producto en el backend usando el payload del formulario del admin
export async function createProduct(data) {
    const formData = buildFormData(data);
    const res = await apiClient.post('/admin/productos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

//actualiza un producto
export async function updateProduct(id, data) {
    const formData = buildFormData(data);
    const res = await apiClient.put(`/admin/productos/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

//elimina un producto
export async function deleteProduct(id) {
    const res = await apiClient.delete(`/admin/productos/${id}`);
    return res.data;
}

// Nuevo: usa el endpoint toggle del backend
export async function toggleProducto(id) {
  const res = await apiClient.patch(`/admin/productos/${id}/toggle`);
  return res.data;
}

// Opcionales: mantener las funciones antiguas delegando en toggle
export async function activarProducto(id) {
  return toggleProducto(id);
}

export async function desactivarProducto(id) {
  return toggleProducto(id);
}