/**
 * Formulario para crear o editar un usuario — panel de administración.
 * En creación: todos los campos (nombre, apellido, email, contraseña, teléfono, dirección, rol).
 * En edición: nombre, apellido, teléfono, dirección y rol (email y contraseña no se cambian aquí).
 * Solo el administrador puede usar este formulario (el backend lo restringe).
 * Inspirado en el formulario de registro de explore.tsx.
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import ConfirmModal from '../../components/confirm-modal';

type Usuario = {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
};

const ROLES: { value: string; label: string; emoji: string; desc: string; color: string }[] = [
  { value: 'cliente',       label: 'Cliente',       emoji: '🙂', desc: 'Compra productos',         color: '#d8f3dc' },
  { value: 'auxiliar',      label: 'Auxiliar',       emoji: '🛠️', desc: 'Gestiona pedidos y stock', color: '#dbeafe' },
  { value: 'administrador', label: 'Administrador',  emoji: '👑', desc: 'Acceso total al sistema',  color: '#fde8e8' },
];

export default function AdminUsuarioForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ usuario?: string }>();

  let usuario: Usuario | undefined;
  if (params.usuario) {
    try { usuario = JSON.parse(params.usuario) as Usuario; } catch { /* noop */ }
  }

  const editing = !!usuario;

  // Campos del formulario
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [apellido, setApellido] = useState(usuario?.apellido ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [direccion, setDireccion] = useState(usuario?.direccion ?? '');
  const [rol, setRol] = useState(usuario?.rol ?? 'cliente');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const validate = (): boolean => {
    setErrorMsg('');

    if (!nombre.trim()) { setErrorMsg('El nombre es obligatorio'); return false; }
    if (!apellido.trim()) { setErrorMsg('El apellido es obligatorio'); return false; }

    if (!editing) {
      if (!email.trim()) { setErrorMsg('El correo es obligatorio'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorMsg('Correo no válido'); return false; }
      if (!password) { setErrorMsg('La contraseña es obligatoria'); return false; }
      if (password.length < 6) { setErrorMsg('La contraseña debe tener al menos 6 caracteres'); return false; }
      if (password !== confirmPassword) { setErrorMsg('Las contraseñas no coinciden'); return false; }
    }

    if (telefono && !/^3\d{9}$/.test(telefono)) {
      setErrorMsg('Teléfono inválido: 10 dígitos iniciando con 3');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmSubmit(false);
    setLoading(true);
    try {
      if (editing && usuario?.id) {
        await apiClient.put(`/admin/usuarios/${usuario.id}`, {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          rol,
          ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
          ...(direccion.trim() ? { direccion: direccion.trim() } : {}),
        });
        router.replace({
          pathname: '/admin/usuarios',
          params: { toastMessage: 'Usuario actualizado exitosamente', toastType: 'success' }
        });
      } else {
        await apiClient.post('/admin/usuarios', {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          password,
          rol,
          ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
          ...(direccion.trim() ? { direccion: direccion.trim() } : {}),
        });
        router.replace({
          pathname: '/admin/usuarios',
          params: { toastMessage: 'Usuario creado exitosamente', toastType: 'success' }
        });
      }
    } catch (error) {
      const msg = (error as { response?: { data?: { mensaje?: string } }; message?: string })
        ?.response?.data?.mensaje || (error as Error)?.message || 'No se pudo guardar';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRol = ROLES.find(r => r.value === rol) || ROLES[0];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Encabezado ─────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerText}>
            <ThemedText style={s.title}>{editing ? '✏️ Editar Usuario' : '👤 Nuevo Usuario'}</ThemedText>
            <ThemedText style={s.subtitle}>
              {editing ? `Modificando a ${usuario?.nombre} ${usuario?.apellido}` : 'Completa los campos del formulario'}
            </ThemedText>
          </View>
        </View>

        {/* ── Avatar dinámico ────────────────────────────────── */}
        <View style={s.avatarSection}>
          <View style={[s.avatarCircle, { backgroundColor: selectedRol.color }]}>
            <ThemedText style={s.avatarEmoji}>{selectedRol.emoji}</ThemedText>
            <ThemedText style={s.avatarInitial}>
              {nombre ? nombre[0].toUpperCase() : '?'}
            </ThemedText>
          </View>
          <ThemedText style={s.avatarRole}>{selectedRol.label}</ThemedText>
          <ThemedText style={s.avatarRoleDesc}>{selectedRol.desc}</ThemedText>
        </View>

        {/* ── Sección: Información personal ─────────────────── */}
        <View style={s.section}>
          <ThemedText style={s.sectionTitle}>👤 Información personal</ThemedText>

          <View style={s.rowFields}>
            <View style={{ flex: 1 }}>
              <ThemedText style={s.label}>Nombre *</ThemedText>
              <TextInput
                style={s.input}
                placeholder="Nombre"
                placeholderTextColor="#b8a99a"
                value={nombre}
                onChangeText={setNombre}
                editable={!loading}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={s.label}>Apellido *</ThemedText>
              <TextInput
                style={s.input}
                placeholder="Apellido"
                placeholderTextColor="#b8a99a"
                value={apellido}
                onChangeText={setApellido}
                editable={!loading}
              />
            </View>
          </View>

          <ThemedText style={s.label}>Teléfono</ThemedText>
          <TextInput
            style={s.input}
            placeholder="3001234567"
            placeholderTextColor="#b8a99a"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
          />

          <ThemedText style={s.label}>Dirección</ThemedText>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Dirección completa"
            placeholderTextColor="#b8a99a"
            value={direccion}
            onChangeText={setDireccion}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* ── Sección: Credenciales (solo en creación) ──────── */}
        {!editing && (
          <View style={s.section}>
            <ThemedText style={s.sectionTitle}>🔐 Credenciales de acceso</ThemedText>

            <ThemedText style={s.label}>Correo electrónico *</ThemedText>
            <TextInput
              style={s.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#b8a99a"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <ThemedText style={s.label}>Contraseña *</ThemedText>
            <View style={s.passWrap}>
              <TextInput
                style={s.passInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#b8a99a"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#b8a99a" />
              </Pressable>
            </View>

            <ThemedText style={s.label}>Confirmar contraseña *</ThemedText>
            <View style={s.passWrap}>
              <TextInput
                style={s.passInput}
                placeholder="Repite la contraseña"
                placeholderTextColor="#b8a99a"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <Pressable onPress={() => setShowConfirmPassword(v => !v)} style={s.eyeBtn}>
                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#b8a99a" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Sección: Rol ───────────────────────────────────── */}
        <View style={s.section}>
          <ThemedText style={s.sectionTitle}>🎭 Rol del usuario</ThemedText>
          <ThemedText style={s.sectionSub}>Define qué puede hacer este usuario en el sistema</ThemedText>

          {ROLES.map(r => {
            const isActive = rol === r.value;
            return (
              <Pressable
                key={r.value}
                style={[s.rolCard, { backgroundColor: isActive ? r.color : '#fff' }, isActive && s.rolCardActive]}
                onPress={() => setRol(r.value)}
              >
                <View style={[s.rolIconBox, { backgroundColor: r.color }]}>
                  <ThemedText style={{ fontSize: 22 }}>{r.emoji}</ThemedText>
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[s.rolLabel, isActive && s.rolLabelActive]}>{r.label}</ThemedText>
                  <ThemedText style={s.rolDesc}>{r.desc}</ThemedText>
                </View>
                {isActive
                  ? <Ionicons name="checkmark-circle" size={22} color="#d4956a" />
                  : <Ionicons name="ellipse-outline" size={22} color="#d0c4bb" />
                }
              </Pressable>
            );
          })}
        </View>

        {/* ── Error ──────────────────────────────────────────── */}
        {!!errorMsg && (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color="#c0392b" />
            <ThemedText style={s.errorText}>{errorMsg}</ThemedText>
          </View>
        )}

        {/* ── Botones ────────────────────────────────────────── */}
        <View style={s.btnRow}>
          <Pressable style={s.cancelBtn} onPress={() => router.back()} disabled={loading}>
            <ThemedText style={s.cancelBtnText}>Cancelar</ThemedText>
          </Pressable>
          <Pressable
            style={[s.saveBtn, loading && s.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name={editing ? 'save-outline' : 'person-add-outline'} size={18} color="#fff" />
                  <ThemedText style={s.saveBtnText}>{editing ? 'Guardar cambios' : 'Crear usuario'}</ThemedText>
                </>
            }
          </Pressable>
        </View>

      </ScrollView>
      <ConfirmModal
        visible={showConfirmSubmit}
        title={editing ? 'Guardar Cambios' : 'Crear Usuario'}
        message={editing ? '¿Estás seguro de que deseas guardar los cambios realizados?' : '¿Estás seguro de que deseas crear este nuevo usuario con el rol de ' + selectedRol.label.toLowerCase() + '?'}
        icon={editing ? 'save-outline' : 'person-add-outline'}
        confirmText={editing ? 'Guardar' : 'Crear'}
        cancelText="Cancelar"
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: '#fdf8f4', padding: 16, paddingBottom: 48, gap: 4 },

  // Header
  header: { alignItems: 'center', marginBottom: 16, width: '100%' },
  headerText: { alignItems: 'center', width: '100%' },
  title: { fontSize: 21, fontWeight: '800', color: '#3d2c1e', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#9e8879', marginTop: 2, textAlign: 'center' },

  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarEmoji: { fontSize: 28, position: 'absolute', top: 6, right: 6 },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: '#3d2c1e' },
  avatarRole: { fontSize: 15, fontWeight: '700', color: '#3d2c1e' },
  avatarRoleDesc: { fontSize: 12, color: '#9e8879' },

  // Sections
  section: { backgroundColor: '#fff', borderRadius: 18, padding: 16, gap: 4, marginBottom: 12, shadowColor: '#c4a882', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#3d2c1e', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#9e8879', marginBottom: 8 },

  // Fields
  rowFields: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 12, fontWeight: '700', color: '#7c6455', marginTop: 10, marginBottom: 5 },
  input: { backgroundColor: '#fdf8f4', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#3d2c1e' },
  textArea: { height: 64, paddingTop: 12 },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf8f4', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 12, paddingHorizontal: 14 },
  passInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#3d2c1e' },
  eyeBtn: { padding: 6 },

  // Rol cards
  rolCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#e8ddd5' },
  rolCardActive: { borderColor: '#d4956a' },
  rolIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rolLabel: { fontSize: 14, fontWeight: '700', color: '#3d2c1e' },
  rolLabelActive: { color: '#d4956a' },
  rolDesc: { fontSize: 12, color: '#9e8879', marginTop: 1 },

  // Error
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde8e8', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f4baba' },
  errorText: { color: '#c0392b', fontSize: 13, fontWeight: '600', flex: 1 },

  // Buttons
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 14, backgroundColor: '#f0ede8', alignItems: 'center' },
  cancelBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, backgroundColor: '#d4956a' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
