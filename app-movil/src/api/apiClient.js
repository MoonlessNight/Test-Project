// este archivo centraliza axios para todas las peticiones http al backend
//Configura la URL base y el tiempo maximo de espera desde las constantes
// intervceptor de peticion: adjunta automaticamente el toke JWT si existe
//interceptor de respuesta: normaliza los errores para que todo el codigo reciba
// siempre un objeto Error con un mensaje legible 

import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, STORAGE_KEYS } from '../utils/constants';
import { storageGetItem } from '../utils/storage';

// instancia de axios
const apiClient = axios.create({
    baseURL: API_BASE_URL, // la base de url q se conecta con el backend con puerto
    timeout: API_TIMEOUT_MS, // tiempo maximo se cancela si el server dura mas
});

// Interceptor de peticion
// se ejecuta antes de enviar cada request
// si hay token lo valida
// Authorizacio para el que el backend pueda autentucar al usuario

apiClient.interceptors.request.use(
    async (config) => {
        const token = await storageGetItem(STORAGE_KEYS.token);

        if (token) {
            //formato estandar bearer Authorization: Bearer <token>
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    // si el interceptos mismo falla (error de configuracion) rechaza la peticion
    (error) => Promise.reject(error)
);

// Interceptor de respuesta
//se ejecuta despues de recibir cda respuesta
// repuesta 2xx se devuelven sin modificar
// respuesta con error 4xx o 5xx /red extrae el mensaje del backend 
//si existen si no usa el mensaje de axios o un mensaje generico

appClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const backendMessage = error.response?.data?.message; //mensaje del server
        const message = backendMessage || error.message || 'Error de conexion';
        return Promise.reject(new Error(message));
    }
);

export default apiClient;

