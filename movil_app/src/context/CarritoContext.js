/**
* Es el contexto global del carrito de compras
* Funciona en 2 modes según si el usuario esta autenticado
* Sin sesión lee y escribe en asyncStorage (carrito local)
* Con sesión lee y escribe en backend via api rest
* Al iniciar sesión funciona automáticamente el carrito local al backend para que el usuario no pierda los productos agregados sin cuenta+
* Expone ítems totales y las acciones: agregar, cambiar cantidad, eliminar y vaciar
*/

import { createContext, useCallback, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from './AuthContext';
import carritoService from '::/services/carritoService';

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
	// Lee isAuthenticated e isLoadingSession del ontexto de autenticación
	const { isAuthenticated, isLoadingSession } = useAuth();
	
	// Estado del carrito
	const [carrito, setItems] = useState([]); // Lista de productos en el carrito
	const [totalItems, setTotalItems] = useState(0); // Suma de cantidades
	const [total, setTotal] = useState(0); // Precio total
	const [loading, setLoading] = useState(true); 	// true mientras carga el carrito

	// Rastrea si el usuario estaba autenticado en el render anterior para detectar en el momento exacto de inicio de sesión
	const prevAuthenticated = useRef(false);

	/**
	* Hydrate
	* Carga o recarga el carrito desde el origen correcto local o backend 
	* Se llama al montar el provider y después de cada operación de escritura 
	*/
	const hydrate = useCallback(async () => {
		// Espera a que authcontext termine de restaurar la sesión guardada
		if (isLoadingSession) {
			return;
		}

		/**
		* Fusion al iniciar sesion
		* Si el usuario acaba de iniciar sesion pasa de false a true
		* Sube los items del carrito local al backend antes de leerlo
		* Asi no se pierden los productos agregados sin cuenta
		*/
		if (isAuthenticated && !prevAuthenticated.current) {
			try {
				await carritoService.mergeLocalToBackend();
			} catch {
				// Si la fusion falla continua sin bloquear
			}
		}

		// Actualizar la referencia para el proximo render
		prevAuthenticated.current = isAuthenticated;
		
		setLoading(true);
		try {
			// getCarrito decide internamente si consulta el backend o asyncStorage
			const snapshot = await carritoService.getCarrito(isAuthenticated);
			setItems(snapshot.items ?? snapshot.carrito ?? []);
			setTotalItems(snapshot.totalItems ?? 0);
			setTotal(snapshot.total ?? 0);
		} catch {
			// Si falla muestra carrito vacio sin productos
			setItems([]);
			setTotalItems(0);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [isAuthenticated, isLoadingSession]);

	// Se ejecuta cada vez que cambia isAutenticated o isLoadingSession
	useEffect(() => {
		hydrate();	
	}, [hydrate]);

	/**
	* Agregar producto
    * Si el producto ya existe en el carrito aumenta su cantidad
    * Si no existe lo agrega con cantidad 1
	*/
	const agregarProducto = useCallback(async (producto, cantidad = 1) => {
		await carritoService.addToCarrito({ isAuthenticated, producto, cantidad });
		await hydrate();
	}, [isAuthenticated, hydrate]);

	/**
	 * Cambiar Cantidad
	 * Modifica la cantidad de un item ya existente en el carrito
	 */
	const cambiarCantidad = useCallback(async (productoId, cantidad) => {
		await carritoService.updateCantidad({ isAuthenticated, productoId, cantidad });
		await hydrate();
	}, [isAuthenticated, hydrate]);

	/**
	 * Vaciar carrito
     * Elimina todos los items del carrito
     */
	const vaciarCarrito = useCallback(async () => {
		await carritoService.clearCarrito({ isAuthenticated });
		await hydrate();
	}, [isAuthenticated, hydrate]);

	const value = useMemo(() => ({
		carrito,
		totalItems,
		total,
		loading,
		agregarProducto,
		cambiarCantidad,
		vaciarCarrito,
	}), [carrito, totalItems, total, loading, agregarProducto, cambiarCantidad, vaciarCarrito]);

	return (
		<CarritoContext.Provider value={value}>
			{children}
		</CarritoContext.Provider>
	);
}

export function useCarrito() {
	return useContext(CarritoContext);
}
