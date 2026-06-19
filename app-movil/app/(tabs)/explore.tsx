/**
 * Pantalla de cuenta pestaña 3 tiene 2 metodos
 * no autenticado muestra formulario login registro
 * autenticado muestra perfil del usuario con opciones de editardatos
 * acceder al panel admin/aux ver pedidos segun rol
 */

/**importar componentes de React native para constuir la pantalla
 * ActivityIndicator, spiner de carga circular
 *  Alert, dialogos emergentes nativos del sistema 
 *  Image, muestra las imagenes 
 *  Pressable, area tactil 
 *  ScrollView, contenedor con scroll vertical
 *  StyleSheet, crea los estilos de forma optimatizada
 *  Text, muestra texto plano en pantalla
 *  View, contenedor generico equivale a un div en html
*/

//manejo de variables de estado local
import { useState, useEffect } from 'react';
//importar componentes 
import { ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { router } from "expo-router";
//Ionicons libreria de iconos vectoriales para react native 
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from '../../src/context/AuthContext';
//themedText : texto q aplica colores del tema del dispositivo de manera automatica claro u oscuro
import { ThemedText } from "../../components/themed-text";
import ConfirmModal from '../../components/confirm-modal';
import { ThemedView } from "../../components/themed-view";

/**
 * AuthCtx define la forma del objeto devuelto por useAuth es necesario
 * porque AuthContext.js esta en javascript no typescript y el compilador no los reconoce
 */
type AuthCtx = {
    //user datos del usuario autenticado. null si no inicio sesion
    user: { nombre?: string, email?: string, rol?: string } | null;
    //isAuthenticated: true si hay sesion activa
    isAuthenticated: boolean;
    // isLoading: true mientras se verifica si hay sesion guardada al abrir la app
    isLoading: boolean;
    //login: funcion que recibe el email y contraseña lanza error si falla
    login: (email: string, password: string)=> Promise<unknown>;
    //register funcion que registra un nuevo usuario lanza error si falla
    register: (data: {nombre: string, apellido: string, email: string, password: string, telefono?: string, direccion?: string }) => Promise<unknown>;
    //logout: funcion de cerrar la la sesion del usuario
    logout: () => Promise<void>;
    //updatePerfil: funcion que actualiza los datos del usuario
    updatePerfil: (data: { nombre?: string, email?: string, password?: string }) => Promise<unknown>;
};

//routerPush navega apilando la nueva pantalla permite volver atras con la opcion de atras
//se usa as unknown as para evitar errores de typescript con contextos router

const routerPush = (path: string) => (router as unknown as {push: (p: string) => void }).push(path);

//componente principal del tad de cuenta
export default function TabTwoScreen() {
    const { user, isAuthenticated, logout, login, register, isLoading, updatePerfil } = useAuth() as unknown as AuthCtx;
    //estado del formulario login y registro 
    //isRegisterMode true mostrar formulario de registro false mostrar login
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    //Campos del formulario de registro y login
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [telefono, setTelefono] = useState('');
    const [direccion, setDireccion] = useState('');
    //loadingSubmit true mientras se procesa el login o registro evita el doble envio
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    //mensajes de retroalimentacion al usuario (error o exito)
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccesMessage] = useState('');

    // Estados para mostrar u ocultar contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);

    //estado de edicion de perfil
    //editMode true mostrar campos editables false modo lectura
    const [editMode, setEditMode] = useState(false);
    //campos editables del perfil
    const [editNombre, setEditNombre] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPassword, setEditPassword] = useState('');
    //saving perfil true mientras se guarda el perfil en backend
    const [savingPerfil, setSavingPerfil] = useState(false);
    //mensajes del formulario de edicionm de perfil
    const [perfilError, setPerfilError] = useState('');
    const [perfilSuccess, setPerfilSuccess] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Sincronizar datos del perfil al cargar o cambiar el modo de edición
    useEffect(() => {
        if (user) {
            setEditNombre(user.nombre || '');
            setEditEmail(user.email || '');
        }
    }, [user, editMode]);

    //function resetFeedback
    //Limpia los mensajes de error y exito del formulario login y registro 
    const resetFeedback = () => {
        setErrorMessage('');
        setSuccesMessage('');
    };

    //funcion: handleLogout
    //abre la confirmacion
    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        setShowLogoutConfirm(false);
        await logout(); //llama el contexto de cerrar sesion 
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNombre('');
        setApellido('');
        setTelefono('');
        setDireccion('');
        setIsRegisterMode(false);
        setErrorMessage('');
        setSuccesMessage('');
    };
    
    //funcion handleSubmit
    //valida y envia el formulario de login o registro segun el modo activo
    const handleSubmit = async () => {
        resetFeedback(); //limpia mensajes anteriores de validar

        if (isRegisterMode) {
            //validaciones de registro 
            //todos los campos marcados con * son obligatorios
            if (!nombre || !apellido || !email || !password || !confirmPassword) {
                setErrorMessage('completa todos los campos obligatorios *.');
                return;
            }

            //las contraseñas deben coincidir
            if (password !== confirmPassword) {
                setErrorMessage('las contraseñas no coinsiden');
                return;
            }

            //la contraseña debe tener minimo 6 caracteres
            if (password.length < 6) {
                setErrorMessage('la contraseña debe tener al menos 6 caracteres');
                return;
            }

            //Telefono si se proporciona debe ser colombiano (10 digitos y debe empezar con 3)
            if (telefono && !/^3\d{9}$/.test(telefono)) {
                setErrorMessage('Telefono invalido: 10 digitos iniciando con 3');
                return;
            }
        } else {
            //validaciones de login
            if (!email || !password) {
                setErrorMessage('ingresa tu correo y contraseña');
                return;
            }
        }

        //activa el spiner y bloquea el boton para evitar multiples envios
        setLoadingSubmit(true);
        try {
            if (isRegisterMode) {
                //llama a register() del contexto con los datos del formulario
                //el operador spread condicional ... solo incluye telefono/direccion si no estan vacios
                await register({ nombre, apellido, email, password, 
                    ...(telefono ? { telefono } : {}),
                    ...(direccion ? { direccion } : {}),
                });
                setSuccesMessage('Registro exitoso! ahora inicia seison');
                setIsRegisterMode(false); //vuelve al modo login tras el registro exitoso
                //limpia los campos que no se comparten en el formulario login
                setPassword('');
                setConfirmPassword('');
                setNombre('');
                setApellido('');
                setTelefono('');
                setDireccion('');
            } else {
                //llama a login del contexto con el email y contraseña
                await login(email, password);
                setSuccesMessage('Sesion iniciada correctamente');
            }
        } catch (error: unknown) {
            //si el backend devuelve error muestra su mensaje. sino muestra uno generico
            setErrorMessage((error as { message?: string })?.message || 'No fue posible completar la accion');
        } finally {
            //siempre desactiva el spiner al terminar exito y error 
            setLoadingSubmit(false);
        }
    };

    /**
     * funcion handleGuardPerfil
     * valida y envia los cambios al perfil del usuario autenticado
     */

    const handleGuardarPerfil = async () => {
        setPerfilError('');
        setPerfilSuccess('');
        
        const nombreCambiado = editNombre.trim() !== (user?.nombre || '');
        const passwordCambiado = editPassword.trim().length > 0;

        if (!nombreCambiado && !passwordCambiado) {
            setPerfilError('Modifica al menos un campo para guardar');
            return;
        }

        setSavingPerfil(true);
        try {
            const data: { nombre?: string; password?: string } = {};
            if (nombreCambiado) data.nombre = editNombre.trim();
            if (passwordCambiado) data.password = editPassword.trim();

            await updatePerfil(data);
            setPerfilSuccess('perfil actualizado correctamente');
            setEditMode(false);
            setEditPassword('');
        } catch (error: unknown) {
            setPerfilError((error as { message?: string })?.message || 'no fue posible actualizar el perfil');
        } finally {
            setSavingPerfil(false);
        }
    };

    // ── PANTALLA DE CARGA DE SESIÓN ──────────────────────────────────────────
  // Se muestra brevemente al abrir la app mientras se verifica si hay
  // un token de sesión guardado en el almacenamiento local del dispositivo.
    if (isLoading) {
    return (
        <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <ThemedText>Cargando sesion...</ThemedText>
        </View>
    );
    }

  // ── MODO: NO AUTENTICADO → FORMULARIO DE LOGIN / REGISTRO ────────────────
  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView
        style={styles.scroll}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authContainer}>
            <ThemedView style={styles.formCard}>
              <ThemedText style={styles.authTitle}>
                {isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </ThemedText>
              <ThemedText style={styles.authSubtitle}>
                {isRegisterMode ? 'Regístrate para realizar tus pedidos' : 'Ingresa tus datos para continuar'}
              </ThemedText>

              {isRegisterMode ? (
                <>
                  <TextInput
                    placeholder="Nombre *"
                    placeholderTextColor="#b8a99a"
                    value={nombre}
                    onChangeText={setNombre}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Apellido *"
                    placeholderTextColor="#b8a99a"
                    value={apellido}
                    onChangeText={setApellido}
                    style={styles.input}
                  />
                </>
              ) : null}

              <TextInput
                placeholder="Correo *"
                placeholderTextColor="#b8a99a"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Contraseña *"
                  placeholderTextColor="#b8a99a"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  style={styles.passwordInput}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9e8879" />
                </Pressable>
              </View>

              {isRegisterMode ? (
                <>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      placeholder="Confirmar contraseña *"
                      placeholderTextColor="#b8a99a"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.passwordInput}
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9e8879" />
                    </Pressable>
                  </View>
                  <TextInput
                    placeholder="Teléfono (ej: 3001234567)"
                    placeholderTextColor="#b8a99a"
                    keyboardType="phone-pad"
                    value={telefono}
                    onChangeText={setTelefono}
                    maxLength={10}
                    style={styles.input}
                  />
                  <TextInput
                    placeholder="Dirección"
                    placeholderTextColor="#b8a99a"
                    value={direccion}
                    onChangeText={setDireccion}
                    style={styles.input}
                  />
                </>
              ) : null}

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={15} color="#e07070" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
              {successMessage ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={15} color="#2d6a4f" />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={loadingSubmit}>
                {loadingSubmit ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isRegisterMode ? 'Crear cuenta' : 'Entrar'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  resetFeedback();
                  setIsRegisterMode((prev) => !prev);
                }}
                style={styles.switchModeButton}
              >
                <Text style={styles.switchModeText}>
                  {isRegisterMode ? 'Ya tengo cuenta, iniciar sesión' : 'No tengo cuenta, registrarme'}
                </Text>
              </Pressable>
            </ThemedView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FUNCIONES AUXILIARES DEL PERFIL (solo se usan cuando el usuario está autenticado)
  // ─────────────────────────────────────────────────────────────────────────

  // rolColor: devuelve el color de fondo según el rol del usuario.
  const rolColor = (r?: string) =>
    r === 'administrador' ? '#192847' : r === 'auxiliar' ? '#c7984e' : '#f5c271';

  // rolLabel: devuelve el texto legible del rol.
  const rolLabel = (r?: string) =>
    r === 'administrador' ? 'Administrador' : r === 'auxiliar' ? 'Auxiliar' : 'Cliente';

  // rolIcon: devuelve el nombre del ícono Ionicons según el rol.
  const rolIcon = (r?: string): keyof typeof Ionicons.glyphMap =>
    r === 'administrador' ? 'shield-checkmark' : r === 'auxiliar' ? 'construct' : 'person';

  // ── MODO: AUTENTICADO → VISTA DE PERFIL ─────────────────────────────────
  return (
    <ScrollView 
      style={styles.scroll} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileContainer}>
        {/* ── ENCABEZADO DE PERFIL CENTRADO ── */}
        <View style={styles.profileCard}>
          {/* Avatar: círculo con el ícono del rol con un fondo translúcido y elegante */}
          <View style={[styles.avatarCircle, { backgroundColor: rolColor(user?.rol) + '12', borderColor: rolColor(user?.rol) + '30', borderWidth: 1 }]}>
            <Ionicons name={rolIcon(user?.rol)} size={32} color={rolColor(user?.rol)} />
          </View>
          <Text style={styles.profileName}>{user?.nombre || 'Usuario'}</Text>
          <Text style={styles.profileEmail}>{user?.email || '-'}</Text>
          
          <View style={[styles.roleBadge, { backgroundColor: rolColor(user?.rol) + '15' }]}>
            <Ionicons name={rolIcon(user?.rol)} size={12} color={rolColor(user?.rol)} />
            <Text style={[styles.roleBadgeText, { color: rolColor(user?.rol) }]}>{rolLabel(user?.rol)}</Text>
          </View>
        </View>

        {/* ── BANNER DE ÉXITO ── */}
        {perfilSuccess ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#2d6a4f" />
            <Text style={styles.successText}>{perfilSuccess}</Text>
          </View>
        ) : null}

        {/* ── SECCIÓN DE ACCIONES (MENÚ UNIFICADO) ── */}
        <View style={styles.menuContainer}>
          {/* Panel de administración */}
          {(user?.rol === 'administrador' || user?.rol === 'auxiliar') && (
            <Pressable 
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]} 
              onPress={() => routerPush('/admin/dashboard')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIconBox, { backgroundColor: '#19284710' }]}>
                  <Ionicons name="speedometer-outline" size={18} color="#192847" />
                </View>
                <Text style={styles.menuItemText}>Panel de Administración</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#b8a99a" />
            </Pressable>
          )}

          {/* Mis Pedidos */}
          <Pressable 
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]} 
            onPress={() => routerPush('/mis-pedidos')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#d4956a10' }]}>
                <Ionicons name="receipt-outline" size={18} color="#d4956a" />
              </View>
              <Text style={styles.menuItemText}>Mis Pedidos</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#b8a99a" />
          </Pressable>

          {/* Editar Perfil */}
          <Pressable 
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]} 
            onPress={() => { setEditMode(!editMode); setPerfilSuccess(''); }}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#9e887910' }]}>
                <Ionicons name="create-outline" size={18} color="#9e8879" />
              </View>
              <Text style={styles.menuItemText}>Editar Perfil</Text>
            </View>
            <Ionicons name={editMode ? "chevron-down" : "chevron-forward"} size={16} color="#b8a99a" />
          </Pressable>

          {/* Cerrar sesión */}
          <Pressable 
            style={({ pressed }) => [
              styles.menuItem, 
              styles.menuItemLast,
              pressed && styles.menuItemPressed
            ]} 
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: '#e0707010' }]}>
                <Ionicons name="log-out-outline" size={18} color="#e07070" />
              </View>
              <Text style={[styles.menuItemText, { color: '#e07070' }]}>Cerrar Sesión</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#e0707080" />
          </Pressable>
        </View>

        {/* ── FORMULARIO DE EDICIÓN DE PERFIL ── */}
        {editMode && (
          <View style={styles.editCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="create-outline" size={18} color="#d4956a" />
              <Text style={styles.cardTitle}>Editar mis datos</Text>
            </View>
            
            <TextInput
              placeholder={`Nombre: ${user?.nombre || ''}`}
              placeholderTextColor="#b8a99a"
              value={editNombre}
              onChangeText={setEditNombre}
              style={styles.input}
            />
            <TextInput
              placeholder={`Email: ${user?.email || ''}`}
              placeholderTextColor="#b8a99a"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              editable={false}
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Nueva contraseña (dejar vacío)"
                placeholderTextColor="#b8a99a"
                value={editPassword}
                onChangeText={setEditPassword}
                secureTextEntry={!showEditPassword}
                style={styles.passwordInput}
              />
              <Pressable onPress={() => setShowEditPassword(!showEditPassword)} style={styles.eyeButton}>
                <Ionicons name={showEditPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9e8879" />
              </Pressable>
            </View>

            {perfilError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={15} color="#e07070" />
                <Text style={styles.errorText}>{perfilError}</Text>
              </View>
            ) : null}

            <View style={styles.editActions}>
              <Pressable style={styles.btnSave} onPress={handleGuardarPerfil} disabled={savingPerfil}>
                {savingPerfil ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Guardar</Text>}
              </Pressable>
              <Pressable style={styles.btnCancel} onPress={() => { setEditMode(false); setPerfilError(''); }}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      <ConfirmModal
        visible={showLogoutConfirm}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar tu sesión actual?"
        icon="log-out-outline"
        iconColor="#e07070"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fdf8f4' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 60 },
  
  // Containers
  authContainer: { width: '100%', maxWidth: 440, alignSelf: 'center', paddingVertical: 20 },
  profileContainer: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: 16 },

  // Centered spinner
  centered: { flex: 1, backgroundColor: '#fdf8f4', alignItems: 'center', justifyContent: 'center', gap: 12 },

  // FORMULARIO DE LOGIN / REGISTRO
  formCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, gap: 14, borderWidth: 1, borderColor: '#e8ddd5', shadowColor: '#c4a882', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  authTitle: { fontSize: 24, fontWeight: '800', color: '#3d2c1e', textAlign: 'center' },
  authSubtitle: { fontSize: 13, color: '#9e8879', textAlign: 'center', marginBottom: 6, marginTop: -4 },
  primaryButton: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#192847', marginTop: 6, height: 48 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  switchModeButton: { paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  switchModeText: { color: '#d4956a', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  // PERFIL (usuario autenticado)
  profileCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e8ddd5', shadowColor: '#c4a882', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  avatarCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  profileName: { fontSize: 22, fontWeight: '800', color: '#3d2c1e', textAlign: 'center' },
  profileEmail: { fontSize: 14, color: '#9e8879', textAlign: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },

  // Menú de navegación
  menuContainer: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e8ddd5', shadowColor: '#c4a882', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3ece6' },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemPressed: { backgroundColor: '#fdfbf9' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuItemText: { fontSize: 14, fontWeight: '600', color: '#3d2c1e', marginLeft: 12 },

  // Tarjeta de edición
  editCard: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e8ddd5', padding: 20, gap: 12, shadowColor: '#c4a882', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardTitle: { fontWeight: '700', fontSize: 15, color: '#3d2c1e' },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 4 },

  // Botones edicion
  btnSave: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#192847', alignItems: 'center', justifyContent: 'center' },
  btnSaveText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnCancel: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  btnCancelText: { color: '#9e8879', fontWeight: '700', fontSize: 14 },

  // Banners de exito y error
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#d8f3dc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#b7e4c7', width: '100%' },
  successText: { color: '#2d6a4f', fontSize: 13, fontWeight: '600', flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde8e8', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f4baba', width: '100%' },
  errorText: { color: '#e07070', fontSize: 13, flex: 1 },

  // Inputs
  input: { borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#fff9f5', color: '#3d2c1e', fontSize: 14, height: 46 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 12, backgroundColor: '#fff9f5', height: 46 },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 11, color: '#3d2c1e', fontSize: 14 },
  eyeButton: { paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center' },
});
