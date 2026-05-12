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
const routerPush = (path: string) => (router as unknown as {push:(p: string) => void }).push(path);

// Componente principal del tad de cuenta
export default function TabTwoScreen() {
    const {user, isAuthenticated, logout, login, register, isLoading, updatePerfil} = useAuth() as AuthCtx;
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
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    // Mensaje de retroalimentacion al usuario (error o exito)
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // Editar perfil
    const [editMode, setEditMode] = useState(false);
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
    const resetFeedback = () => {
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
        resetFeedback(); // Limpia mensajes anterior antes de validar
        
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
            if (telefono && !/^3\d{9}$/.test(telefono)) {
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
        setLoadingSubmit(true);
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
                setSuccessMessage('Sesion iniciada correctamente.');
            }
        } catch (error: unknown) {
            // Si el backend devuelve error muestra su mensaje, sino, muestra uno generico
                setErrorMessage((error as {message?: string})?.message || 'No fue posible completar la accion');
        } finally {
            // Siempre desactiva el spiner al terminar exito y error
            setLoadingSubmit(false);
            
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
        setSavingPerfil(true);
        try {
            // Solo envia los campos que tiene valor; los vacios los emiten
            const data: {nombre?:string,email?:string,password?:string} ={};
            if (editNombre.trim()) data.nombre = editNombre.trim();
            if (editEmail.trim()) data.email = editEmail.trim();
            if (editPassword.trim()) data.password = editPassword.trim();
            await updatePerfil(data); // Llamada al contexto que hace put /usuario/perfil
            setPerfilSuccess('Perfil actualizado correctamente.');
            setEditMode(false);
            setEditEmail('');
            setEditNombre('');
            setEditPassword('');
        } catch (error: unknown) {
            setPerfilError((error as {message?: String})?.message || 'No fue posible actualizar el perfil.');
        } finally {
            setSavingPerfil(false);
        }
    }

    
// ── PANTALLA DE CARGA DE SESIÓN ──────────────────────────────────────────
  // Se muestra) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemeText>Cargando sesion...</Theme
        <ActivityIndicator size="large" />
        <ThemedText>Cargando sesion...</ThemedText>
      </View>
    );
  }

  // ── MODO: NO AUTENTICADO → FORMULARIO DE LOGIN / REGISTRO ────────────────
  if (!isAuthenticated) {
    return (
      // KeyboardAvoidingView: cuando aparece el teclado virtual, mueve el
      // contenido hacia arriba para que los campos no queden tapados.
      // En iOS usa 'padding', en Android no es necesario (undefined).
      <KeyboardAvoidingView
        style={styles.container}
        behaviView style={styles.formCard}>
          {/* Título dinámico: "Registro" o "Iniciar sesion" según el modo */}
          <ThemeText type="title">{isRegisterMode ? 'Registro' : 'Iniciar sesion'}</Theme
          {/* Título dinámico: "Registro" o "Iniciar sesion" según el modo */}
          <ThemedText type="title">{isRegisterMode ? 'Registro' : 'Iniciar sesion'}</ThemedText>

          {/* Campos adicionales SOLO en modo registro */}
          {isRegisterMode ? (
            <>
              <TextInput
                placeholder="Nombre *"
                value={nombre}
                onChangeText={setNombre}
                style={styles.input}
              />
              <TextInput
                placeholder="Apellido *"
                value={apellido}
                onChangeText={setApellido}
                style={styles.input}
              />
            </>
          ) : null}

          {/* Campo de correo: compartido entre login y registro */}
          <TextInput
            placeholder="Correo *"
            autoCapitalize="none"        // No convierte a mayúsculas el primer caracter.
            keyboardType="email-address" // Muestra teclado con @ y .com fácilmente.
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          {/* Campo de contraseña: texto oculto con puntos */}
          <TextInput
            placeholder="Contrasena *"
            secureTextEntry               // Oculta el texto ingresado.
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          {/* Campos adicionales SOLO en modo registro */}
          {isRegisterMode ? (
            <>
              {/* Confirmar contraseña: debe coincidir con el campo anterior */}
              <TextInput
                placeholder="Confirmar contrasena *"
                secureTextEntrye
                value={confirmPassword}
                onChangeText={setConfirmePassword}
                style={styles.input}
              />
              {/* Teléfono: opcional, solo números, máximo 10 dígitos */}
              <TextInput
                placeholder="Telefono (ej: 3001234567)"
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
                maxLength={10}
                style={styles.input}
              />
              {/* Dirección: opcional */}
              <TextInput
                placeholder="Direccion"
                value={direccion}
                onChangeText={setDireccion}
                style={styles.input}
              />
            </>
          ) : null}
Text style={styles.error}>{errorMessage}</ThemeText> : null}
          {/* Mensaje de éxito (en verde) tras registro o login exitoso */}
          {successMessage ? <ThemeText style={styles.success}>{successMessage}</Theme: null}
          {/* Mensaje de éxito (en verde) tras registro o login exitoso */}
          {successMessage ? <ThemedText style={styles.success}>{successMessage}</ThemedText> : null}

          {/* Botón principal: "Crear cuenta" o "Entrar" según el modo.
              disabled durante el proceso para evitar envíos múltiples. */}
          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loadingSubmit}>
            {loadingSubmit ? (
              // Spinner mientras se procesa la solicitud.
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isRegisterMode ? 'Crear cuenta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          {/* Enlace para alternar entre login y registro */}
          <Pressable
            onPreRegisterMode((prev) => !prev);    // Alterna el modo.
            }}>
            <ThemeText type="link">
              {isRegisterMode ? 'Ya tengo cuenta, iniciar sesion' : 'No tengo cuenta, registrarme'}
            </Themeext type="link">
              {isRegisterMode ? 'Ya tengo cuenta, iniciar sesion' : 'No tengo cuenta, registrarme'}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIONES AUXILIARES DEL PERFIL (solo se usan cuando el usuario está autenticado)
  // Se definen aquí (no al inicio) porque solo se necesitan en el modo autenticado.
  // ─────────────────────────────────────────────────────────────────────────

  // rolColor: devuelve el color de fondo según el rol del usuario.
  //   administrador → índigo (#6366f1)
  //   auxiliar      → cian (#06b6d4)
  //   cliente       → verde (#10b981)
  const rolColor = (r?: string) =>
    r === 'administrador' ? '#6366f1' : r === 'auxiliar' ? '#06b6d4' : '#10b981';

  // rolLabel: devuelve el texto legible del rol.
  const rolLabel = (r?: string) =>
    r === 'administrador' ? 'Administrador' : r === 'auxiliar' ? 'Auxiliar' : 'Cliente';

  // rolIcon: devuelve el nombre del ícono Ionicons según el rol.
  //   keyof typeof Ionicons.glyphMap → tipo correcto para los nombres de íconos.
  const rolIcon = (r?: string): keyof typeof Ionicons.glyphMap =>
    r === 'administrador' ? 'shield-checkmark' : r === 'auxiliar' ? 'construct' : 'person';

  // ── MODO: AUTENTICADO → VISTA DE PERFIL ─────────────────────────────────
  return (
    // ScrollView con espacio de 12dp entre cada sección y padding inferior de 32dp.
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── ENCABEZADO DE PERFIL ────────────────────────────────────────── */}
      {/* El color de fondo cambia dinámicamente según el rol del usuario. */}
      <View style={[styles.profileHeader, { backgroundColor: rolColor(user?.rol) }]}>
        {/* Avatar: círculo blanco con el ícono del rol en el color del rol */}
        <View style={styles.avatarCircle}>
          <Ionicons name={rolIcon(user?.rol)} size={40} color={rolColor(user?.rol)} />
        </View>
        {/* Columna de datos: nombre, email y badge del rol */}
        <View style={{ flex: 1 }}>
          {/* Nombre del usuario en blanco negrita */}
          <Text style={styles.profileName}>{user?.nombre || 'Usuario'}</Text>
          {/* Email del usuario en blanco semitransparente */}
          <Text style={styles.profileEmail}>{user?.email || '-'}</Text>
          {/* Badge (pastilla) con ícono + etiqueta del rol */}
          <View style={styles.roleBadge}>
            <Ionicons name={rolIcon(user?.rol)} size={12} color="#fff" />
            <Text style={styles.roleBadgeText}>{rolLabel(user?.rol)}</Text>
          </View>
        </View>
      </View>

      {/* ── BANNER DE ÉXITO (tras actualizar perfil) ────────────────────── */}
      {/* Solo visible si perfilSuccess tiene texto */}
      {perfilSuccess ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.successText}>{perfilSuccess}</Text>
        </View>
      ) : null}

      {/* ── SECCIÓN: EDITAR PERFIL ──────────────────────────────────────── */}
      {editMode ? (
        // ── FORMULARIO DE EDICIÓN ──────────────────────────────────────────
        <View style={styles.card}>
          {/* Cabecera de la tarjeta con ícono de edición + título */}
          <View style={styles.cardHeader}>
            <Ionicons name="create-outline" size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>Editar perfil</Text>
          </View>
          {/* Campo de nombre: placeholder muestra el valor actual */}
          <TextInput
            placeholder={`Nombre actual: ${user?.nombre || ''}`}
            value={editNombre}
            onChangeText={setEditNombre}
            style={styles.input}
          />
          {/* Campo de email: teclado email, sin mayúsculas automáticas */}
          <TextInput
            placeholder={`Email actual: ${user?.email || ''}`}
            value={editEmail}
            onChangeText={setEditEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          {/* Campo de contraseña: dejar vacío = no cambiar */}
          <TextInput
            placeholder="Nueva contrasena (dejar vacio para no cambiar)"
            value={editPassword}
            onChangeText={setEditPassword}
            secureTextEntry
            style={styles.input}
          />
          {/* Banner de error si la actualización falla */}
          {perfilError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={15} color="#ef4444" />
              <Text style={styles.errorText}>{perfilError}</Text>
            </View>
          ) : null}
          {/* Fila de botones: "Guardar" (índigo) y "Cancelar" (outline) */}
          <View style={styles.editActions}>
            {/* Botón guardar: muestra spinner mientras guarda */}
            <Pressable style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={handleGuardarPerfil} disabled={savingPerfil}>
              {savingPerfil ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnTextWhite}>Guardar</Text>}
            </Pressable>
            {/* Botón cancelar: cierra el formulario sin guardar */}
            <Pressable style={[styles.btn, styles.btnOutline, { flex: 1 }]} onPress={() => { setEditMode(false); setPerfilError(''); }}>
              <Text style={styles.btnTextOutline}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        // ── BOTÓN PARA ABRIR EL FORMULARIO DE EDICIÓN ─────────────────────
        <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => { setEditMode(true); setPerfilSuccess(''); }}>
          <Ionicons name="create-outline" size={17} color="#6366f1" />
          <Text style={[styles.btnTextOutline, { color: '#6366f1' }]}>Editar perfil</Text>
        </Pressable>
      )}

      {/* ── BOTÓN: PANEL DE ADMINISTRACIÓN (solo admin y auxiliar) ─────── */}
      {/* La condición evalúa el rol del usuario antes de renderizar */}
      {user?.rol === 'administrador' || user?.rol === 'auxiliar' ? (
        <Pressable style={[styles.btn, { backgroundColor: '#6366f1' }]} onPress={() => routerPush('/admin/dashboard')}>
          <Ionicons name="speedometer-outline" size={17} color="#fff" />
          <Text style={styles.btnTextWhite}>Panel de Administración</Text>
        </Pressable>
      ) : null}

      {/* ── BOTÓN: MIS PEDIDOS (visible para todos los roles) ───────────── */}
      <Pressable style={[styles.btn, { backgroundColor: '#0a7ea4' }]} onPress={() => routerPush('/mis-pedidos')}>
        <Ionicons name="receipt-outline" size={17} color="#fff" />
        <Text style={styles.btnTextWhite}>Mis Pedidos</Text>
      </Pressable>

      {/* ── BOTÓN: CERRAR SESIÓN ────────────────────────────────────────── */}
      <Pressable style={[styles.btn, { backgroundColor: '#ef4444' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={17} color="#fff" />
        <Text style={styles.btnTextWhite}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── ESTILOS COMPARTIDOS ──────────────────────────────────────────────────
  scroll: { flex: 1 },              // ScrollView ocupa toda la pantalla.
  container: { flex: 1 },           // Contenedor del formulario de login/registro.
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, // Pantalla de carga centrada.

  // ── FORMULARIO DE LOGIN / REGISTRO ───────────────────────────────────────
  formCard: { borderRadius: 12, padding: 16, gap: 12, margin: 20 }, // Tarjeta con fondo temático.
  editSection: { borderRadius: 10, padding: 12, gap: 8, borderWidth: 1, borderColor: '#e0eaf3' }, // Sección de edición (no usada actualmente).
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },      // Fila de botones Guardar/Cancelar.
  editBtn: { borderRadius: 10, borderWidth: 1, borderColor: '#0a7ea4', paddingVertical: 10, alignItems: 'center' },
  editBtnText: { color: '#0a7ea4', fontWeight: '600' },
  meta: { color: '#666', fontSize: 13 },                             // Texto secundario pequeño.
  primaryButton: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a7ea4' }, // Botón "Entrar" / "Crear cuenta".
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#d5d5d5', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  logoutButton: { borderRadius: 10, backgroundColor: '#b93a32', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  ordersButton: { borderRadius: 10, backgroundColor: '#0a7ea4', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  adminBtn: { borderRadius: 10, backgroundColor: '#04566f', paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  adminBtnText: { color: '#fff', fontWeight: '700' },
  ordersText: { color: '#fff', fontWeight: '700' },
  logoutText: { color: '#fff', fontWeight: '700' },

  // ── PERFIL (usuario autenticado) ─────────────────────────────────────────
  // Espacio interno del ScrollView: 16dp de padding, 12dp entre hijos, 32dp al fondo.
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  // Encabezado de perfil: fila con avatar + datos. El color de fondo es dinámico (inline).
  profileHeader: {
    borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  // Círculo blanco de 70×70dp que contiene el ícono del rol.
  avatarCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },                    // Nombre del usuario.
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },      // Email semitransparente.
  // Badge del rol: pastilla translúcida blanca con ícono + etiqueta.
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  roleBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Tarjeta blanca con borde para el formulario de edición de perfil.
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e8e8e8', padding: 14, gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }, // Fila: ícono + título de la tarjeta.
  cardTitle: { fontWeight: '700', fontSize: 15, color: '#222' },

  // Botón base: fila centrada con ícono + texto y bordes redondeados.
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14,
  },
  btnPrimary: { backgroundColor: '#6366f1' },                          // Relleno índigo.
  btnOutline: { borderWidth: 2, borderColor: '#6366f1', backgroundColor: '#fff' }, // Solo borde índigo.
  btnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 15 },    // Texto blanco para botones rellenos.
  btnTextOutline: { color: '#6366f1', fontWeight: '700', fontSize: 15 }, // Texto índigo para botones outline.

  // Banner verde de éxito (perfil actualizado).
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ecfdf5', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#a7f3d0',
  },
  successText: { color: '#065f46', fontSize: 13, fontWeight: '500' },
  // Banner rojo de error (falló la actualización del perfil).
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fca5a5',
  },
  errorText: { color: '#b91c1c', fontSize: 13 },

  // Campo de texto genérico: borde gris, fondo blanco, bordes redondeados.
  input: {
    borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
  },
  error: { color: '#d64545' },   // Color rojo para mensajes de error inline (ThemedText).
  success: { color: '#218f4c' }, // Color verde para mensajes de éxito inline (ThemedText).
});