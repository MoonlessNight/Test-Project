/**
 * Unifica el manejo del carrito para dos escenarios.
 * Usuario sin sesion carrito local en asynStorage.
 * Usuario con sesion carrito remoto en backend.
 * Tambien normalmente la estructura de items y calcula totales para el contexto consuma siempre un formato consistente.
 */
import apiClient from '..api/apiClient';
import {STORAGE_KEYS} from '../utils/constants';
import {storageGetItem, storageSetItem, storageMultiSet} from '../utils/storage';

// Lee el carrito guardado en local. Si no existe o esta corrupto, devuelve [].
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

// Guarda el carrito local completo remplazando el valor anterior.
async function writeLocalCart(items) {
    await storageSetItem(STORAGE_KEYS.carritoLocal, JSON.stringify(items));
}

// Convierte en diferenctes formatos de items del backend /local a una estructura unica
function normalizeItems(item) {
    const producto = item.Producto || item.producto || item.productoId || {};
    const precio = Number(item.precio ?? item.precioUnitario ?? producto.precio ?? 0);
    const cantidad = Number(item.cantidad || 0 );

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

// Calcula resumen del carrito: items normalizados, total de items y precio total.
function summarize(items) {
    const normalized = items.map(normalizeItems);
    const totalItems = normalized.reduce((acc, item) => acc + item.cantidad, 0);
    const total = normalized.reduce((acc, item) => acc + item.subtotal, 0);
    return { items: normalized, totalItems, total };
}

const carritoService = {
    // Obtiene el carrito desde eñ backend p desde storage segun la sesion
    getCarrito: async (isAuthenticated) => {
        if (isAuthenticated){
            const response = await apiClient.get ('/cliente/carrito');
            const payload = response.data || response.data ||  {};
            const carrito = payload.carrito || [];
            const items = carrito.Items || carrito.items || [];
            return summarize(items);
        } 

        const localItems = await readLocalCart();
        return summarize(localItems);
    },

    // Agrega un producto al carrito, correspondiente 
    addToCarrito: async ({isAuthenticated, productoId, cantidad = 1}) => {
        if (isAuthenticated) {
            await apiClient.post('/cliente/carrito',{
                productoId: producto.id,
                cantidad,
            });
            return;
        }

        const localItems = await readLocalCart();
        const existing = localItems.find((item) => Number(item.productoId) === Number(producto.id));
        
        if (existing) {
            existing.cantidad += cantidad
        } else {
            localItems.push({
                id: Date.now(),
                productoId: producto.id,
                cantidad,
                nombre: producto.nombre,
                precio: Number(producto.precio) || 0,
            });
        }
        await writeLocalCart(localItems);
    },
    
    // Cambia la cantidad de un item ya existente
    updateCantidad: async([isAuthenticated, ItemId, cantidad]) => {
        if (isAuthenticated) {
            await apiClient.put(`/cliente/carrito${itemId}`, {cantidad,});
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

    // Elimina in item puntual del carrito
    removeItem: async ({isAuthenticated,itemId}) => {
        if (isAuthenticated) {
            await apiClient.delete(`/cliente/carrito/${itemId}`);
            return;
        }

        const localItems = await readLocalCart();
        const filtered = localItems.filter((it) => Number(it.id) !== Number(itemId));
        await writeLocalCart(filtered);
    },

    // Vaciar por completo el carrito local o remoto
    clearcarrito: async ({isAuthenticated}) => {
        if (isAuthenticated) {
            await apiClient.delete('/cliente/carrito');
            return;
        }

        await writeLocalCart([]);
    },

    // Migrar todos los items del carrito local al carrito remoto del bakend despues ue el usuario haya iniciado sesion.
    mergelocalToBackend: async () => {
        const localItems = await readLocalCart();
        
        if (localItems.length === 0) {
            return;
        }

        for (const item of localItems){
            try {
                await apiClient.post('/cliente/carrito' , {
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                });
            } catch{
                // Si in item flla "producto eliminado continua con el otro"
            }
        } 
        await writeLocalCart([]);
    },
};

export default carritoService;