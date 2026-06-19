/**
 * gestiona las consultas publicas del catalogo
 * obtener categorias, productos con filtros
 * constuir la url validas para imagenes del backend
 */

import apiClient from '../api/apiClient';
import { API_ORIGIN_URL } from '../utils/constants';

const catalogoService = {
    //consulta la lista de categorias disponibles para filtros de navegacion
    getCategorias: async () => {
        const response = await apiClient.get('/catalogo/categorias');
        const payload = response.data?.data || response.data || {};
        return payload.categorias || [];
    },

    // Consulta la lista de subcategorías de una categoría específica
    getSubcategoriasByCategoria: async (categoriaId) => {
        const response = await apiClient.get(`/catalogo/categorias/${categoriaId}/subcategorias`);
        const payload = response.data?.data || response.data || {};
        return payload.subcategorias || [];
    },

    //consulta productos del catalogo y acepta filtros de busqueda
    getProductos: async (params = {}) => {
        const response = await apiClient.get('/catalogo/productos', { params });
        const payload = response.data?.data || response.data || {};
        const productos = payload.productos || [];
        return productos;
    },

    //convierte una ruta relativa del backend enurl completa usable para imagen
    
    buildImageUrl: (path) => {
        if (!path) {
            return 'https://via.placeholder.com/300/200.png?text=Producto';
        }

        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // Si la ruta del archivo no empieza con 'uploads/', lo agregamos para conectar con el backend
        const cleanPath = path.replace(/^\//, '');
        const finalPath = cleanPath.startsWith('uploads/') ? cleanPath : `uploads/${cleanPath}`;

        return `${API_ORIGIN_URL}/${finalPath}`;
    },
};

export default catalogoService;