









































































































/**
 * Elimina un item del carrito por id
 */
const eliminarItem = useCallback(async(itemId)=>{
    await carritoService.removeItem(itemId, isAuthenticated);
},[hydrate, isAuthenticated]);

/**
 * Vaciar el carrito completo
 */
const vaciarCarrito = useCallback(async () => {
    await carritoService.clearCarrito(isAuthenticated);
    await hydrate();
}, [hydrate, isAuthenticated]);

    /**
     * useMemo evita rcrear el objeto en cada render innecesario
     */
    const value= useMemo(() => ({
        items, // array de items normalizados
        totalItems, // Cantidad total de items en el carito
        total, // El precio total del carrito
        loading, // True mientras se carga el carrito
        refreshCarrito: hydrate, // Funcion para recargar al carrito, forzado
        agregarAlCarrito, // Funcion para agregar un item al carrito
        eliminarItem, // Funcion para eliminar un item del carrito
        vaciarCarrito, // Funcion para vaciar el carrito

    }), [items, totalItems, total, loading, hydrate, agregarAlCarrito, eliminarItem, vaciarCarrito]}
);

    return <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>;

    /**
     * HOOK
     * ============================
     * Simplifica el acceso al contexto y lanza un error descriptivo si se usa fuera del arbol del CarritoProvider
     */
    export function useCarrito() {
        const context = useContext(CarritoContext);
        if (!context) {
            throw new Error('useCarrito debe usarse dentro de un CarritoProvider');
        }
        
        return context;
    }
























