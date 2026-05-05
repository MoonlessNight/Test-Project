/**
 * ============================================
 * AUTHENTICATION CONTEXT
 * ============================================
 * Global state management for authenticated user
 */

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import authService from '../services/authService';
import carritoService from '../services/carritoService';

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  // Authenticated user object with id, name, role or null
  const [user, setUser] = useState(null);
  // JWT received from backend; its presence indicates active session
  const [token, setToken] = useState(null);
  // True while reading asyncStorage on startup; avoids redirecting too early
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  /**
   * restoreSession
   * Reads the token and user saved in AsyncStorage when the app starts.
   * If there is no saved session, leaves the states as null
   */
   const restoreSession = useCallback(async () => {
	try {
		const session = await authService.getSession();
		setUser(session?.user || null);
		setToken(session?.token || null);
	} finally {
		// Always marks loading as finished, even if reading fails
		setIsLoadingSession(false);	
		}
   }, []);

   // Runs only once when the provider mounts (when the app starts)
   useEffect(() => {
   	restoreSession();
   }, [restoreSession]);

   /**
    * Login
    * Calls POST /auth/login, saves the token in asyncStorage and updates the
    * global state so the entire app knows the user is logged in
    */
    const login = useCallback(async (email, password) => {
		const response = await authService.login(email, password);
		// The backend can return the payload inside response.data or directly
		const payload = response.data || response;

		setToken(payload.token);
		setUser(payload?.user || null);

		return response;
	}, []);

/**
* Register
* Delegates registration to the service; no automatic session start
*/
const register = useCallback(async (data) => {
	return authService.register(data);
}, []);

/**
* Logout
* Updates user data in the backend and synchronizes the current state
*/
const logout = useCallback(async () => {
	await authService.logout();
	setToken(null);
	setUser(null);
}, []);

/**
* updateProfile
* Updates user data in the backend and synchronizes the local state
*/
const updatePerfil = useCallback(async (data) => {
	const usuario = await authService.updatePerfil(data);
	if (usuario) setUser(usuario);
	return usuario;
}, []);

/**
* Context value
* useMemo prevents recreating the object on each render, only changes if dependencies change
*/
const value = useMemo(
	() => ({
		user, // Authenticated user object or null
		token, // User JWT or null
		isAuthenticated: Boolean(token), // Boolean derived from token
		isLoadingSession, // true while restoring session on app startup
		login,
		register,
		logout,
		updatePerfil,
		refreshSession: restoreSession, // Allows forcing a re-read of storage
	}), [user, token, isLoadingSession, login, register, logout, updatePerfil, restoreSession]
);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
/**
* Hook
* Simplifies access to context and throws a descriptive error if used outside the provider tree
*/

export function useAuth() {
	const context = useContext(AuthContext);
	
	if (!context) {
		throw new Error('useAuth must be used within an AuthContextProvider');
	}
	
	return context;
}