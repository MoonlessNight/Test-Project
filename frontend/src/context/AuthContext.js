/**
 * ============================================
 * CONTEXT DE AUTENTICACIÓN
 * ============================================
 * Gestión del estado global del usuario autenticado
 */

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import authService from '../services/authService';
import carritoService from '../services/carritoService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);
    setUser(response.data.usuario);
    
    // Sincronizar carrito local con el servidor después de establecer el usuario
    setTimeout(async () => {
      try {
        const resultado = await carritoService.sincronizarCarritoLocal();
        if (resultado.sincronizados > 0) {
          console.log(`✅ ${resultado.sincronizados} productos sincronizados al carrito`);
        }
      } catch (error) {
        console.error('Error sincronizando carrito:', error);
      }
    }, 100);
    
    return response;
  }, []);

  // Register
  const register = useCallback(async (userData) => {
    const response = await authService.register(userData);
    setUser(response.data.usuario);
    
    // Sincronizar carrito local con el servidor después de establecer el usuario
    setTimeout(async () => {
      try {
        const resultado = await carritoService.sincronizarCarritoLocal();
        if (resultado.sincronizados > 0) {
          console.log(`✅ ${resultado.sincronizados} productos sincronizados al carrito`);
        }
      } catch (error) {
        console.error('Error sincronizando carrito:', error);
      }
    }, 100);
    
    return response;
  }, []);

  // Logout
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Actualizar perfil
  const updateProfile = useCallback(async (userData) => {
    const response = await authService.updateProfile(userData);
    setUser(response.data.usuario);
    return response;
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'administrador',
    isAuxiliar: user?.rol === 'auxiliar',
    isCliente: user?.rol === 'cliente',
  }), [user, loading, login, register, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
