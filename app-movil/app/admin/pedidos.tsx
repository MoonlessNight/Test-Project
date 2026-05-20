/**
 * Pantalla de lista de pedidos para el panel de administrador
 * Muestra tod los pedidos del sistema en una lista paginada (10)
 * Permite buscar pedidos por texto un tiempo real mientras se escribe 
 * Al presionar un pedido navega a /admon/pedidos/{id} para ver el detalle
 * Accesible para administradores y auxiliares
 */
import {
    ActivityIndicator,
    Flatlist,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import apiClient from '../../src/api/apiClient'
import { useEffect, useState } from 'react';

type Pedido = {
    _id: string;
    id?: string;
    estado?: string;
    total?: number;
    usuario?: {
        nombre?: string;
        apellido?: string;
    };};

export default function AdminPedidosScreen() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]); // Array del pedido actual
    const [loading, setLoading] = useState(true); // true mientras carga
    const [errorMessage, setErrorMessage] = useState(''); // Mensaje error si falla
    const [busqueda, setBusqueda] = useState(''); // Texto actual del campo de busqueda
    const [pagina, setPagina] = useState(1); // Numero de paginas actual (base 1)
    const [totalPaginas, setTotalPaginas] = useState(1); // Total de paginas devuelto por el backend

    /**
     * FUNCION: fetchPedido
     * ====================
     * Consulta el endpoint GET /admin/pedidos con parametros de busqeda y paginacion
     * Page: numero de pagina a cargar
     * search: texto de busqueda (default)
     */
    const fetchPedido = async (page = 1, search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            // COnstruye el query string dinamicamente
            const params: string[]=[];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`) // Codifica caracteres especiales
            params.push(`pagina=${page}`); // Numero de pagina
            params.push(`limite=10`); // 10 pedidos por pagina
            const url = `/admin/pedidos?${params.join('&')}`;
            const res =  await apiClient.get(url);
            const pedidosData: Pedido[] = res.data?.data?.pedidos || []; // Extraer el array de pedidos.
            setPedidos(pedidosData);
            setPagina(page);
            // Actuializar la pagina actual
            setTotalPaginas(res.data?.data?.paginacion?.totalPedidos || 1)

        } catch (error:unknown) {
            setErrorMessage((error as {message?: string})?.message || 'No se puede cargar pedidos.')
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cargar Inciail
     */
    useEffect(() => {
        fetchPedido(1, '');
    },[])

    /**
     * HandlePagina
     * Avanza p retroce a la pagina anterior
     * Next: si para siguienta pagina
     * Match.max y maht.min evitan ir mas alla de los limites 
     */
    const handlePagina = (next: Number) => (
        const nueva = Math.max(1, Math.min(totalPaginas, pagina + next));
        fetchPedido(nueva, busqueda); // Recargar con la nueva pagina conserve si filtro
    )
}