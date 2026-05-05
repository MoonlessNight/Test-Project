/**
 * Gestiona las consultas ublicas del catalogo
 * Obtener categorias, productos con filtros
 * Caonstruir la irl validas para imagen del backend
 */
import apiClient from '../api/apiClient';

const catalogoService = {
    // COnsulta la lista de categorias disponibles para filtros de navegacion
    getCategorias: async () => {
        const response = await apiClient.get('/catalogo/categorias');
        const payload = response.data?.data || response.data || {};
        return payload.categorias || [];
    },

    // Consultar productos del catalogo y acepta filtros de busqueda
    getProductos: async (params = {}) => {
        const response = await apiClient.get('/catalogo/productos', {params});
        const payload = response.data?.data || response.data || {};
        const productos = response.productos || [];
        return productos;
    },

    // Convierte una ruta relativa del backend en url completa usable para imagen
    buildImagenUrl: (path) => {
        if (!path) {return 'https://via.placeholder.com/300/200/.png?text=Producto';}
        
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        const origin = 'htttps://10.0.2.2:5000'; // Cambia esto por la URL de tu backend
        return `${origin}/${path.replace(/^\//, '')}`;
    },

    // 
} 