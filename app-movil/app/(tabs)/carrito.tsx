/**
 * Pantalla del carrito de compras y sus respesticas gestiones no requiere que este autenticado solo para hacer compras
 */

/**
 * Importar componentes de React native para construir la pantalla
 * 
 * ActivityIndicator: spriner de carga circular 
 * Alert: dialogos emergentes nativos del sistema
 * Image: muestra las imagenes
 * Pressable: area tactil 
 * ScrollView: contenedor con scroll vertcical
 * StyleSheet: crea los estilos de forma optimizadas
 * Text: muestra texto plano en pantalla
 * View: contenedor generico equivale a un div html y css
 */
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from 'expo-router';
// Ionicons libreria de iconos para react native
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../src/context/AuthContext';
import { useCarrito } from '../../src/context/CarritoContext';

// carritoctx define la forma de los datos que devuelve useCarrito
// TypeScript necesita esto porque CarritoContext.js esta en JS
type CarritoCtx = {
    // Items lista de productos en el carrito
    items: { id: string, nombre: string, precio?: number, imagen?: string}[];
    // Totl summa totl en pesos colombianos de todos los items
    total: number;
    // Totla de items numero total de items del carrito
    totalItems: number;
    // loading true mientras el contexto carga los datos iniciales 
    loading: boolean;
    // Cambiar cantidad actualiza la cantidad de un producto
    cambiarCantidad: (id: string, cantidad: number) => Promise<void>;
    // Eliminar item elimina un producto del carrito
    eliminarItem: (id:string) => Promise<void>;
    // Vaciar carrito elimina todos los productos del carrito
    vaciarCarrito: () => Promise<void>;
};

// HELPERS DE NAVEGACION
// expo router tipifica router de forma extricta y expone .push/replace 
// Directamente en ts, se usa unknown as ... para forzr el tipo
// y poder llamar a las funciones de nagecacion sin errores de compilador

const routerPush = (path: string) => (router as unknown as {push:(p:string) => void}).push(path);
// routerReplace navega a una pantalla remplazando la actual recuerda que se puede volver hacia atras
const routerReplace = (path: string) => (router as unknown as {replace:(p:string) => void}).replace(path);

// fmt: formatea un numero como precio en pesos colombianos. Ej: 1000 = &1.000
const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

// Componente principal carrito Screen
export default function CarritoScreen() {
    // Obtiene el context de auth solo si rl usuario esta autenticado
    const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };

    // Obtiene del contexto del carrito los atos y funciones necesarias
    // Se usa as CarritoCtx porque el contexto de js y ts no infiera bien los tipos de datos
    const { items, total, loading, cambiarCantidad, eliminarItem, vaciarCarrito } = useCarrito() as CarritoCtx;

    //  Pantalla de Carga
    // Si el carrito aun esta cargado por ejemplo recuperando datos guardados
    // Se muestra un spriner centrado en lugar del contenido normal
    if (loading) {
        return (
            <view style= {styles.centered}>
                {/*Espiner circula color indigo*/}
                <ActivityIndicator size="large" color="#6366f1"/>
                <text style= {style.loadingText}>Cargando carrito...</text>
            </view>
        );
    }

    // Funcion handleIrACheckout o sea pagar
    // si el usuario no esta autenticado muestra el dialogo de inicio
    // si esta autenticado navega directamente a la pantalla de pagos
    const handleIrACheckout = () => {
        if (!isAuthenticated) {
            Alert.alert(
                'Inicias Sesion',
                'Debes iniciar sesion para procesar al pago',
            [
                // Boton cncelar cierra el dialogo sin hacer nada 
                { text: 'Cancelar', style: 'cancel' },
                // boton iniciar sesion lleva a pestaña cuenta explore.tsx
                { text: 'Iniciar Sesion', onPress: () => {routerReplace('/tabs/explore')} },
            ]
            );
            return; // Sale de la funcion
        }
        // Usuario autenticado navega a la pantalla de pagos
        routerPush('/chechkout');
    };

    // Funcion handlerVaciarCarrito
    // Muestra el dialogo de confirmacion de vaciar carrito
    const handlerVaciarCarrito = () => {
        Alert.alert(
            'Vaciar Carrito',
            '¿Estas seguero de que quieres vaciar el carrito?',
            [
                // Boton "Cancelar" cierre el dialogo sin hacer nada
                { text: 'cancelar', style: 'cancel'},
                // Boton "Iniciar Sesion" lleva a pestaña cuenta explore.tsx
                { text: 'vaciar', style: 'destructive', onPress: () => vaciarCarrito()},
            ]);};
    
    /**
     * Renderiza principal del carrito
     * style -> ocupa todo el alto disponible depende el celular ios, android
     * contentContainerStyle -> aplica padding y gad al contenido interno
     */
    return (
        <ScrollView style={styles.container} contentContinerStyle = {styles.content}>
            {/** Encabezado
            * fila horizontal: icono del carrito mas titulo "mi carrito" */}
        </ScrollView>
    )


}
























