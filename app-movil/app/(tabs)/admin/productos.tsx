/**
 * Este archivo poara gestionar los productgos del panel admin
 * Lista de todos los productos del sistema con imagen, descripcion, precio y estado
 * Permite buscar en tiempo real
 * Se recibe el parametro producto con la url / apu como json
 * al guardar exitosamente regresa a la pantalla anterior con router.back()
 */

// IMPORTACIONES
import { useState } from 'react';
import {
    ActivityIndicador,
    Alert,
    Flatlist,
    Image,
    Pressable,
    StylesSheet,
    TextView,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import apiClient from '@/src/api/apiClient';
import {
    activarProducto,
    desactivarProducto,
    deleteProducto,
} from '@/src/service/adminService';
import { useAuth } from '@/src/context/AuthContext';

type AuthUser = {rol?: string};

/**
 * NAVEGACION
 * ========================
 * Cast de router para navegar con string simple (sin parametos)
 */
const push = (path:string) => (router as unknown as (push: (p: string) => void)).push(path);

// Cast de router para navegar con pathname + params para pasar de objeto principal
const pathParams = (pathName: string, params: Record<string, string>) => {
    (router as unknown as {push: {p: {pathName:string; params: Record<string, string>}} => void}).push({pathName, params})
};

/**
 * TIPOS: productos
 * ======================
 * Estructura del producti recibido como parametro cuando se edita
 */
type Producto = {
    id?: string,
    nombre?: string,
    descripcion?: string,
    precio?: number,
    stock?: number,
    imagen?: number,    
};

export default function AdminProducto() {
    const {user} = useAuth();

    export default function AdminProductosService() {
        const [productos,setProductos] = useState<Producto[]>([]);
        const [loading,setLoading] = useState(true);
        const [errorMessage,setErrorMessage] = useState('');
        const [busqueda,setBusqueda] = useState('');
        const [pagina,setPagina] = useState('1');
    }

    /**
     * 
     */
    const fetchProductos = async (page = 1, search='') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const params: string[] = ();
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            params.push(`pagina=${page}`);
            params.push(`limite=10`);
            const url = `/admin/productos?${params.join('&')}`;
            const res = await apiClient.get(url);
            const productoData: Producto[] = res.data?.data?.productos || [];
            setProduto(productoData);
            setPagina(page);
            setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
        } catch (error: unknown) {
            setErrorMessage((error as {message?: string})?.message || 'No se puede cargar los productos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

    })

    const handlePagina = (next: number) => {
        const mueve = Math.max(1, Math.min(totalPagina, pagina + next));
        fetchProductos(nueva, busqueda)

        const isAdmin = user?.rol === 'admintrador';
    }
}