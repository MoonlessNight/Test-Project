/**
 * unifiaca el manejo del carrtio para dos ecenarios 
 * usuario sin sesion carrito local en asyncStorage
 * usuario autenticado carrito persistido en el backend
 * tambien normaliza la estructura de items y calcula totales para el contexto consuma siempre un formato consistente
 */

import { isAxiosError } from 'axios';
import apiClient from '../api/apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import { storageGetItem, storageSetItem } from '../utils/storage';

//lee el carrito guardado localmente si no existe o esta corrupto devuelve [].

async function readLocalCart() {
    const raw = await storageGetItem(STORAGE_KEYS.carritoLocal);
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

//guarda el carrito local completo remplazando el valor anterior
async function writeLocalCart(items) {
    await storageSetItem(STORAGE_KEYS.carritoLocal, JSON.stringify(items));
}

//convierte en diferentes formatos de items del backend/local a una estructura unica
function normalizeItem(item) {
    const producto = item.Producto || item.producto || {};
    const precio = Number(item.precio ?? item.precioUnitario ?? producto.precio ?? 0);
    const cantidad = Number(item.cantidad || 0);

    return {
        id: item.id,
        productoId: item.productoId ?? producto.id,
        nombre: item.nombre ?? producto.nombre ?? 'producto',
        imagen: item.imagen ?? producto.imagen ?? '',
        precio,
        cantidad,
        subtotal: precio * cantidad,
    };
}

//calcula resumen del carrito: items normalizados, cantidad total y monto total
function summarize(items) {
    const normalized = items.map(normalizeItem);
    const totalItems = normalized.reduce((acc, item) => acc + item.cantidad, 0);
    const total = normalized.reduce((acc, item) => acc + item.subtotal, 0);

    return { items: normalized, totalItems, total };
}

const carritoService = {
    //obtiene el carrito desde el backend o desde storage segun la sesion
    getCarrito: async (isAuthenticated) => {
        if (isAuthenticated) {
            const response = await apiClient.get('/cliente/carrito');
            const payload = response.data?.data || response.data || {};
            const items = payload.items || [];
            return summarize(items);
        }

        const localItems = await readLocalCart();
        return summarize(localItems);
    },

    //agrega un producto al carrito correspondiente 
    addToCarrito: async ({ isAuthenticated, producto, cantidad = 1 }) => {
        if (isAuthenticated) {
            await apiClient.post('/cliente/carrito', {
                productoId: producto.id,
                cantidad,
            });
            return;
        }

        const localItems = await readLocalCart();
        const existing = localItems.find((item) => Number(item.productoId) === Number(producto.id));
        if (existing) {
            existing.cantidad += cantidad;
        } else {
            localItems.push({
                id: Date.now(),
                productoId: producto.id,
                nombre: producto.nombre,
                precio: Number(producto.precio || 0),
                cantidad,
            });
        }
        await writeLocalCart(localItems);
    },

    //cambia la cantidad de un item ya existente
    updateCantidad: async ({ isAuthenticated, itemId, cantidad }) => {
        if (isAuthenticated) {
            await apiClient.put(`/cliente/carrito/${itemId}`, { cantidad });
            return;
        }

        const localItems = await readLocalCart();
        const item = localItems.find((it) => Number(it.id) === Number(itemId));
        if (!item) {
            return;
        }

        item.cantidad = cantidad;
        await writeLocalCart(localItems);
    },

    //elimina un item puntual del carrito
    removeItem: async ({ isAuthenticated, itemId }) => {
        if (isAuthenticated) {
            await apiClient.delete(`/cliente/carrito/${itemId}`);
            return;
        }

        const localItems = await readLocalCart();
        const filtered = localItems.filter((it) => Number(it.id) !== Number(itemId));
        await writeLocalCart(filtered);
    },

    //vacia por completo el carrito local o rekmoto
    clearCarrito: async (isAuthenticated) => {
        if (isAuthenticated) {
            await apiClient.delete('/cliente/carrito');
            return;
        }

        await writeLocalCart([]);
    },

    //migrar todos los items guardados localmente al carrito del backend despues que el usuario inicia sesion

    mergeLocalToBackend: async () => {
        const localItems = await readLocalCart();
        if (localItems.length === 0) {
            return;
        }

        for (const item of localItems) {
            try {
                await apiClient.post('/cliente/carrito', {
                    productoId: item.productoId,
                    cantidad: item.cantidad
                });
            } catch {
                //si un item falla "producto eliminado continua con el otro"
            }
        }

        await writeLocalCart([]);
    },
};

export default carritoService;