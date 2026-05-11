/**
 * Pantalla de cuenta pestaña 3 tiene 2 metodos 
 * No autenticado muestra formulario login y register
 * Autenticado muestra perfil de usuario con opciones de editar datos
 * Acceder al panel admin/aux ver pedidos segun id
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
// Manejo de variables de estado local
import {useState} from 'react';
// Importar componentes de 
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from 'expo-router';
// Ionicons libreria de iconos para react native
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../src/context/AuthContext';
import { useCarrito } from '../../src/context/CarritoContext';
// themedText: texto que aplica colores del tema del dispositivo de manera automatica claro o oscuro
import { ThemeText } from '@/components/themed/themed-text'
// themedViewn: color de fondo automatico segin el tema del dispositivo
import { ThemeView } from '@/components/themed/themed-view'

/**
 * AuthCtx define la forma del objeto devuelta por AuthContex por useAuth es necesario
 * porque AuthContext.js esta en JS no TSX y el compilador no los reconoce 
 */
type AuthCtx = {
    // Usar datos del usuario autenticado. Null si no inicia sesion
    user :{ nombre?: string, email?: string, rol?: string, } | null;
    // isAuthenticated: true si hay sesion activa
    isAuthenticated: boolean;
    // isLoading: true mientras se verfica el estado de autenticacion, si esta guardada, mientras se abre la app
    isLoading: boolean;
    // login: funcion para iniciar sesion en caso de IsAutenticated este en false
    login: (email?:string, password?:string) => Promise<void>;
    // register: funcio para registartse en caso de que el usuario no tenga un usuario registrado
    register: (data:{nombre?:string, apellido?:string, email?:string, telefono?:string, direccion?:string, password?:string}) => Promise<unknown>;
    // logout: funcion para cerrar inicio de sesion
    logout: () => Promise<void>;
    // updatePerfil: funcion que actualiza los datos del usuario
    updatePerfil: (data: {nombre?:string, email?:string, password?:string}) => Promise<unknown>;
};

// routerPush navega apilando la nueva pantalla permite volver atras con la opcion de atras
// Se usa as unknown as para evtar errores de TSX con contextos router
const routerOush = (path: string) => (router as unknown as {push:(p: string) => void }).push(path);

// Componente principal del tad de cuenta
export default function TabTwoScreen() {
    const {user,isAuthenticated, logout, login, register, isLoading, updatePerfil} = useAuth() as AuthCtx;
    // Estado del formulario login y registro 
    // isRegisterMode: true muestra el formulario de registro de sesion | false mostra el formulario de iniciar sesion
    const [isRegisterMode, setRegisterMode] = useState(false);
    // Campos de formulario de register y login
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmePassword] = useState('');
    // loadingSubmit true mientras se procesa e login o register evitando el doble envio
    const [loadingSubmite,setLoadingSubmite] = useState('');
    // Mensaje de retroalimentacion al usuario (error o exito)
    const [errorMessage,setErrorMessage] = useState('');
    const [successMessage,setSuccessMessage] = useState('');
    // Editar perfil
    const [editMode,setEditMode] = useState(false);
    // Campos de editables del pefil
    const [editNombre, setEditNombre] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    // SavingPerfil true mientras se guarda el perfil en backend
    const [savingPerfil, setSavingPerfil] = useState(false);
    // Mesanjes de retroalimentacion para el usuario sobre el formulario de edit perfil
    const [perfilError, setPerfilError] = useState('');
    const [perfilSuccess, setPerfilSuccess] = useState('');

    // Funtion resetFeeback
    // Limpia los mensajes de error y exito del formulario login y register
    const resetFeeback = () => {
        setErrorMessage('');
        setSuccessMessage('');
    };

    // Funcion: handleLogout
    // Cierra la sesion y resetea todos los campos del formulario para que la pantalla quede limpia cuando el usuario vuelva a ver formulario
    const handleLogout = async () => {
        await logout(); // Llama el contexto de cerrar session
        setEmail('');
        setPassword('');
        setDireccion('');
        setApellido('');
        setNombre('');
        setConfirmePassword('');
        setTelefono('');
        setSuccessMessage('');
        setErrorMessage('');
    }
    
    // Funcion handlSubmit
    // Valida y envia el formulario de login o registro segundo el modo
    const handleSubmit = async () => {
        resetFeeback(); // Limpia mensajes anterior antes de validar
        
        if (isRegisterMode) {
            // Validaciones de registro
            // Todos los campos marcados con * son obligatorios
            if (!nombre || !apellido || !email || !password || !confirmPassword) {
                setErrorMessage('Completa todos los campos obligatorios, los que tiene * a lado.');
                return;
            }

            // Las contraseñas debe coincider
            if (password !== confirmPassword) {
                setErrorMessage('Verifica que las contraseña y confirmar contraseña debe conincider.');
                return;
            }

            // Las contraseñas debe tener minimo 6 caracteres
            if (password.length < 6) {
                setErrorMessage('La contraseña debe ser más larga, más de 6 caracteres.');
                return;
            }

            // Numero telefonico debe seguir al formato de Colombia (10 digitos y debe empezar en 3)
            if (telefono && /!^3\d{9}$/.test(telefono)) {
                setErrorMessage('El telefono es invalido, debe comenzar con 3 y tener 10 digitos.');
                return;
            }
        } else {
            // Validaciones de login
            if (!email || !password) {
                setErrorMessage('Ingresa tu correo y contraseña.');
                return;
            }
        }

        // Activar el spiner y bloquea el boton para evitar multiples envios
        setLoadingSubmite(true);
        try {
            if (isRegisterMode) {
                // Llamar al register() del contexto con los datos del formulario
                // El operador spread condicional ... solo incluye teléfono/dirección si no están vacíos
                await register({
                    nombre, 
                    apellido, 
                    email, 
                    password, 
                    ...(telefono ? { telefono } : {}), 
                    ...(direccion ? { direccion } : {})
                });
                setRegisterMode(false); // Vuelve al modo login tras el registro exitoso
                // Limpia los campos que no se comparten en el formulario login
                setApellido('');            
                setPassword('');            
                setConfirmePassword('');            
                setTelefono('');            
                setDireccion('');            
            } else {
                // Lalama a login del contexto con el email y contraseña
                await login(email,password);
                setSuccessMessage('Sesion iniciada correctamente.')
            }
        } catch (error: unknown) {
            // Si el backend devuelve error muestra su mensaje, sino, muestra uno generico
                setErrorMessage((error as {message?: string})?.message || 'No fue posible completar la accion');
        } finally {
            // Siempre desactiva el spiner al terminar exito y error
            setLoadingSubmite(false);
            
        };   
    };

    /**
     * Funcion handleGuardarPerfil
     * Validad y envia los cambios al perfil  del usuario autenticado
     */
    const handleGuardarPerfil = async () => {
        setPerfilError('');
        setPerfilSuccess('');
        // Al menos uno de los tres campos debe estar modficado
        if (!editNombre.trim() && !editEmail.trim() && !editPassword.trim())  {
            setPerfilError('Modifica al menos un campo para guardar cambios.');
            return;
        }
    }
}