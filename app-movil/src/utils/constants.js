import Constants from 'expo-constants';

// Expo proporciona la IP local de tu máquina en hostUri (ej: "192.168.1.15:8081")
const hostUri = Constants.expoConfig?.hostUri;
const localhost = hostUri ? hostUri.split(':')[0] : '10.0.2.2';

export const API_TIMEOUT_MS = 15000; //15 segundos

// El emulador de Android accede mediante 10.0.2.2 y el celular físico mediante la IP local de tu PC
export const API_ORIGIN_URL = `http://${localhost}:5000`;
export const API_BASE_URL = `${API_ORIGIN_URL}/api`;

export const STORAGE_KEYS = {
    token: 'token',
    user: 'user',
    carritoLocal: 'carritoLocal',
};