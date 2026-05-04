/**
 * Encapsula las operciones del panel administrativo sobre productos.
 * CRUD como tambien altera el estado del productos.
 * Todas las funciones usa el cliente htttps central par incluir el token y manejo de errores.
 */
import api from '../api/apiClient';

/**
 * CREA UN PRODUCTO NUEVO
 * ============================
 * En el backend usando el payload del formulario del admin
 */
export async function createProduct(data){
    const res = await api.post('/admin/productos', data);
    return res.data;
}

/**
 * ACTUALIZAR PRODUCTO
 * ============================= 
 * Cambia los datos del producto mediante del formulario del admin, mismo de crear producto pero con los datos del producto
 */
export async function updateProduct(id,data) {
    const res = await api.put(`/admin/productos/${id}`, data);
    return res.data;
}

/**
 * CAMBAIR ESTADO DEL PRODUCTO A INACTIVO
 * ============================
 * Cambia el estado de un producto como inactivo
 */
export async function desactivarProducto(id) {
    const res = await api.patch(`/admin/productos/${id}/desactivar` );
    return res.data;
}

/**
 * CAMBAIR ESTADO DEL PRODUCTO A ACTIVO
 * ============================
 * Cambia el estado de un producto como inactivo
 */
export async function activarProducto(id) {
    const res = await api.patch(`/admin/productos/${id}/activar` );
    return res.data;
}

/**
 * ELIMINAR PRODUCTO
 * ============================
 * Elimina un producto por su id
 */
export async function deleteProducto(id){
    const res = await api.delete(`/admin/productos/${id}`);
    return res.data;
}