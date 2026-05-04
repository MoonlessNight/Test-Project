/**
 * Centraliza todas las operaciones relacionadas con autenticación.
 * Inicia sesión, guarda token/usuario en almacenamiento local.
 * Cierra sesión, elimina los datos.
 * Restaura la sesión guardada.
 * Actualiza el perfil del usuario autenticado.
 */
import apiClient from "../api/apiClient";
import { STORAGE_KEY } from '../utils/constants';
import { storageGetItem, storageMultiSet, storageSetItem } from '../utils/storage';

const authService = {
    // Envía credenciales al backend y persiste el token + usuario si son válidos
    login: async ({ email, password }) => {
        const response = await apiClient.post('/auth/login', { email, password });
        const payload = response.data?.data || response.data;

        if (payload?.token) {
            await storageMultiSet(STORAGE_KEY.token, payload.token);
        }

        if (payload?.usuario) {
            await storageMultiSet(STORAGE_KEY.usuario, payload.usuario);
        }

        return response.data;
    },

    // Elimina token y datos del usuario para cerrar sesión
    logout: async () => {
        await storageMultiSet(STORAGE_KEY.token, null);
        await storageMultiSet(STORAGE_KEY.usuario, null);
    },

    // Registra un nuevo usuario en el sistema
    register: async ({ data }) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    // Lee el almacenamiento local la sesion previamente guardada
    getSession: async () => {
        const token = await storageGetItem(STORAGE_KEY.token);
        const userRaw = await storageGetItem(STORAGE_KEY.usuario);
        const user = userRaw ? JSON.parse(userRaw): null;
        return {token, user};
    },

    // Actualiza el perfil del usuario autenticado
    update: async (data) =>  {
        const response = await apiClient.put('/auth/me', data);
        const usuario = response.data?.usuario || response.data.usuario || null ;
        if (usuario) {
            await storageMultiSet(STORAGE_KEY.user, JSON.stringify(usuario));
        }
        return response.data;
    }
};
