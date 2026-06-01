/**Archivo de contexto global de autenticacion
 * restaura la sesion guardada al iniciar la app (token, usuario)
 * expone las funciones de login, register, logout, actualizar perfil
 * cualquier componente que se necesite saber si es usuario esta logueado usa un hook useAuth() en lugar de leer el AsyncStorage directamente
*/

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authService from '../services/authService';

//valor inicial null; useAuth() valida que esta dentro del provider
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    //usuarrio autenticado objeto con id, nombrem rol o null
    const [user, setUser] = useState(null);
    //JWT recibido del backend; su precencia indica sesion activa
    const [token, setToken] = useState(null);
    //true mientras se lee asyncStorage al arrancar; evita redirigir antes de tiempo 
    const [isLoadingSession, setIsLoadingSession] = useState(true);

    /**
     * restoreSession
     * lee el token y el usuario guardados en AnsyncStorage al abrir la app
     * si no hay sesion guardada, deja los estados en null
     */

    const restoreSession = useCallback(async () => {
        try {
            const session = await authService.getSession ();
            setToken(session?.token || null);
            setUser(session?.user || null);
        } finally {
            //siempre marca la carga como terminada, aunque falle la lectura
            setIsLoadingSession(false);
        }
    }, []);

    //se ejecuta una sola vez al montar el provider (al iniciar la app)
    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    /**
     * login
     * llama el post /auth/login, guarda el token en asyncStorage y actualiza el estado
     * global para que toda la app sepa que el usuario esta logueado
     */

    const login = useCallback(async (email, password) => {
        const response = await authService.login(email, password);
        //el backend puede devolver el payload dentro de response.data o directo
        const payload = response.data || response;

        setToken(payload?.token || null);
        setUser(payload?.usuario || null);

        return response;
    }, []);

    /**
     * register 
     * delega el registro al servicio; no inicia sesion automaticamente 
     */

    const register = useCallback(async (data) => {
        return authService.register(data);
    }, []);

    /**
     * logout
     * Actualiza los datos de usuarios en el backend y sincroniza el estado actual
     */

    const logout = useCallback(async () => {
        await authService.logout();
        setToken(null);
        setUser(null);
    }, []);

    /**
     * updatePerfil
     * actualiza los datos del usuario en el backend y sincroniza el estado local
     */

    const updatePerfil = useCallback(async (data) => {
        const usuario = await authService.updatePerfil(data);
        if (usuario) setUser(usuario);
        return usuario;
    }, []);

    /**
     * valor de contexto
     * usememo evita recrear el objeto en cada render solo cambia si alguna de las dependencias cambia
     */

    const value = useMemo(
        () => ({
            user, //objeto del usuario autenticado o null
            token, //JWT o null
            isAuthenticated: Boolean(token), //Booleano derivado del token
            isLoadingSession, //true mientras se restaura la sesion
            login,
            register,
            logout,
            updatePerfil,
            refreshSession: restoreSession, //permite forzar una re-lectura del storage 
        }),
        [user, token, isLoadingSession, login, register, logout, updatePerfil, restoreSession]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}

/**
 * hook
 * simplifica el acceso al contexto y lasnza un error desciptivo si se usa fuera del arbol del provider
 */

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth debe usarse dentro de authProvider');
    }
    return context;
}