/**
 * Agrupa todas las operaciones del cliente sobre pedidos.
 * CRUD con consultar detalle de un pedido y cancelar el pedido. Nada de borrar pedido. 
 */
import apiClient from '../api/apiClient';

const pedidoService ={
    // Crear un pedido nuevo con los datos capturados en chechout
    crearPedido: async ({ dirreccionEnvio, metodoPago = 'efectivo', telefono, notasAdicionales = '', total }) => {
        const response = await apiClient.post('/cliente/pedidos', {
            dirreccionEnvio,
            metodoPago,
            telefono,
            notasAdicionales,
            total,
        });
        return response.data?.data?.pedidos || response.data?.pedidos || [];
    },
    
    // Devuelve el historial de pedidos del cliente autenticado
    getPedidoMe: async () => {
        const response = await apiClient.get('/cliente/pedidos');
        return response.data?.data?.pedidos || response.data?.pedidos || [];
    },

    // Obtiene el detalle completo de un pedido por id
    getPedidoId: async (id) => {
        const response = await apiClient.get(`/cliente/pedidos/${id}`);
        return response.data?.data?.pedidos || response.data?.pedidos || [];
    },

    // Cancela un pedido siempre que el backend permita el cambio del estado
    getPedidoMe: async (id) => {
        const response = await apiClient.put(`/cliente/pedidos/${id}/cancelar`);
        return response.data;
    },
}