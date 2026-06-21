/**
 * Pantalla de gestión de usuarios — panel de administración.
 * Diseño pastel cálido • Toast • Modal de detalle • Sin botón eliminar
 * Solo administradores pueden activar/desactivar usuarios.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ConfirmModal from '../../components/confirm-modal';
import AdminToast from '../../components/admin-toast';
import apiClient from '../../src/api/apiClient';
import { activarUsuario, desactivarUsuario } from '../../src/services/usuarioAdminService';
import { useAuth } from '../../src/context/AuthContext';

const push = (path: string) =>
  (router as unknown as { push: (p: string) => void }).push(path);

const pushParams = (pathname: string, params: Record<string, string>) =>
  (router as unknown as { push: (p: { pathname: string; params: Record<string, string> }) => void }).push({ pathname, params });

type Usuario = {
  id?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  activo?: boolean;
  createdAt?: string;
};

type AuthUser = { rol?: string };

// Colores y emojis por rol
const ROL_STYLE: Record<string, { bg: string; text: string; emoji: string }> = {
  administrador: { bg: '#fde8e8', text: '#c0392b', emoji: '👑' },
  auxiliar:      { bg: '#e8f4fd', text: '#1a6b9e', emoji: '🛠️' },
  cliente:       { bg: '#d8f3dc', text: '#2d6a4f', emoji: '🙂' },
};
const getRol = (r?: string) => ROL_STYLE[r || ''] || { bg: '#f0ede8', text: '#7c6455', emoji: '👤' };

function useToast(duration = 2800) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ visible: true, message, type });
    timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), duration);
  };
  return { toast, showToast };
}

export default function AdminUsuariosScreen() {
  const { user } = useAuth() as { user: AuthUser | null };
  const isAdmin = user?.rol === 'administrador';

  const params = useLocalSearchParams<{ toastMessage?: string; toastType?: string }>();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [selected, setSelected] = useState<Usuario | null>(null);

  // Filtros adicionales
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'true' | 'false'>('all');
  const [dropdownActivoOpen, setDropdownActivoOpen] = useState(false);
  const [textoBuscarActivo, setTextoBuscarActivo] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('');
  const [dropdownRolOpen, setDropdownRolOpen] = useState(false);
  const [textoBuscarRol, setTextoBuscarRol] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'reciente' | 'antiguo'>('reciente');
  const [dropdownOrdenOpen, setDropdownOrdenOpen] = useState(false);
  const [textoBuscarOrden, setTextoBuscarOrden] = useState('');

  const [showConfirmToggle, setShowConfirmToggle] = useState(false);
  const [toggleUser, setToggleUser] = useState<Usuario | null>(null);

  const { toast, showToast } = useToast();

  const fetchUsuarios = async (
    search = '',
    isRefresh = false,
    activeFilter = filtroActivo,
    rolFilter = filtroRol,
    sortVal = ordenarPor
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');
    try {
      const params: string[] = [];
      if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
      if (activeFilter !== 'all') params.push(`activo=${activeFilter}`);
      if (rolFilter) params.push(`rol=${rolFilter}`);
      params.push('limite=1000');
      const res = await apiClient.get(`/admin/usuarios?${params.join('&')}`);
      let data: Usuario[] = res.data?.data?.usuarios || [];

      // Ordenar en el cliente (timestamps y nombre)
      if (sortVal === 'nombre') {
        data.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      } else if (sortVal === 'antiguo') {
        data.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else {
        // 'reciente'
        data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      setUsuarios(data);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (params.toastMessage) {
        showToast(params.toastMessage, (params.toastType as any) || 'success');
        router.setParams({ toastMessage: '', toastType: '' });
      }
      fetchUsuarios(busqueda);
    }, [params.toastMessage, params.toastType])
  );

  useEffect(() => {
    setPagina(1);
    fetchUsuarios(busqueda);
  }, [filtroActivo, filtroRol, ordenarPor]);

  const handleToggle = (item: Usuario) => {
    setToggleUser(item);
    setShowConfirmToggle(true);
  };

  const confirmToggle = async () => {
    if (!toggleUser) return;
    setShowConfirmToggle(false);
    const item = toggleUser;
    setToggleUser(null);
    try {
      if (item.activo) {
        await desactivarUsuario(item.id);
        showToast(`${item.nombre} desactivado`, 'success');
      } else {
        await activarUsuario(item.id);
        showToast(`${item.nombre} activado`, 'success');
      }
      fetchUsuarios(busqueda);
    } catch {
      showToast('No se pudo cambiar el estado', 'error');
    }
  };

  const totalPaginas = Math.ceil(usuarios.length / 10) || 1;
  const usuariosVisibles = usuarios.slice((pagina - 1) * 10, pagina * 10);

  const ListFooter = () => {
    if (loading || usuarios.length === 0 || totalPaginas <= 1) {
      return <View style={{ height: 24 }} />;
    }
    return (
      <View style={s.pagBarFooter}>
        <Pressable
          style={[s.pagCircleBtn, pagina <= 1 && s.pagCircleBtnOff]}
          onPress={() => setPagina((p) => Math.max(1, p - 1))}
          disabled={pagina <= 1}>
          <Ionicons name="chevron-back" size={16} color={pagina <= 1 ? '#d0c4bb' : '#d4956a'} />
        </Pressable>

        <View style={s.pagDots}>
          {Array.from({ length: totalPaginas }, (_, i) => (
            <View
              key={i}
              style={[
                s.pagDot,
                i + 1 === pagina && s.pagDotActive
              ]}
            />
          ))}
        </View>

        <Pressable
          style={[s.pagCircleBtn, pagina >= totalPaginas && s.pagCircleBtnOff]}
          onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          disabled={pagina >= totalPaginas}>
          <Ionicons name="chevron-forward" size={16} color={pagina >= totalPaginas ? '#d0c4bb' : '#d4956a'} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <ThemedText style={s.title}>👥 Usuarios</ThemedText>
        <ThemedText style={s.subtitle}>Gestiona las cuentas del sistema</ThemedText>
      </View>

      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={15} color="#b8a99a" />
          <TextInput
            placeholder="Buscar usuario..."
            placeholderTextColor="#b8a99a"
            value={busqueda}
            onChangeText={(t) => { setBusqueda(t); setPagina(1); fetchUsuarios(t); }}
            style={s.input}
          />
        </View>
        <Pressable
          style={[s.filterToggleBtn, showFiltros && s.filterToggleBtnActive]}
          onPress={() => setShowFiltros(v => !v)}
        >
          <Ionicons name="filter-outline" size={18} color={showFiltros ? '#fff' : '#d4956a'} />
        </Pressable>
        <Pressable style={s.createBtn} onPress={() => push('/admin/usuario-form')}>
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <ThemedText style={s.createBtnText}>Nuevo</ThemedText>
        </Pressable>
      </View>

      {/* Panel de Filtros Desplegable */}
      {showFiltros && (
        <View style={s.filterPanel}>
          {/* Fila: Estado */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Estado</ThemedText>
            <View style={s.dropdownContainer}>
              <View style={s.filterSearchBox}>
                <Ionicons name="toggle-outline" size={14} color="#d4956a" />
                <TextInput
                  placeholder="Buscar y seleccionar estado..."
                  placeholderTextColor="#b8a99a"
                  value={textoBuscarActivo}
                  onFocus={() => setDropdownActivoOpen(true)}
                  onChangeText={(text) => {
                    setTextoBuscarActivo(text);
                    setDropdownActivoOpen(true);
                    setFiltroActivo('all');
                  }}
                  style={s.filterSearchInput}
                />
                {textoBuscarActivo.length > 0 || filtroActivo !== 'all' ? (
                  <Pressable onPress={() => {
                    setTextoBuscarActivo('');
                    setFiltroActivo('all');
                    setDropdownActivoOpen(false);
                  }}>
                    <Ionicons name="close-circle" size={16} color="#b8a99a" />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setDropdownActivoOpen(!dropdownActivoOpen)}>
                    <Ionicons name={dropdownActivoOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                  </Pressable>
                )}
              </View>
              {dropdownActivoOpen && (
                <View style={s.dropdownList}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                    {[
                      { key: 'all', label: '📋 Todos' },
                      { key: 'true', label: '🟢 Activos' },
                      { key: 'false', label: '🔴 Inactivos' }
                    ]
                      .filter(item => item.label.toLowerCase().includes(textoBuscarActivo.toLowerCase()))
                      .map((item) => {
                        const isSelected = filtroActivo === item.key;
                        return (
                          <Pressable
                            key={item.key}
                            style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                            onPress={() => {
                              setFiltroActivo(item.key as any);
                              setTextoBuscarActivo(item.label);
                              setDropdownActivoOpen(false);
                            }}
                          >
                            <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                              {item.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Fila: Rol */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Rol</ThemedText>
            <View style={s.dropdownContainer}>
              <View style={s.filterSearchBox}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#d4956a" />
                <TextInput
                  placeholder="Buscar y seleccionar rol..."
                  placeholderTextColor="#b8a99a"
                  value={textoBuscarRol}
                  onFocus={() => setDropdownRolOpen(true)}
                  onChangeText={(text) => {
                    setTextoBuscarRol(text);
                    setDropdownRolOpen(true);
                    setFiltroRol('');
                  }}
                  style={s.filterSearchInput}
                />
                {textoBuscarRol.length > 0 || filtroRol !== '' ? (
                  <Pressable onPress={() => {
                    setTextoBuscarRol('');
                    setFiltroRol('');
                    setDropdownRolOpen(false);
                  }}>
                    <Ionicons name="close-circle" size={16} color="#b8a99a" />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setDropdownRolOpen(!dropdownRolOpen)}>
                    <Ionicons name={dropdownRolOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                  </Pressable>
                )}
              </View>

              {dropdownRolOpen && (
                <View style={s.dropdownList}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                    <Pressable
                      style={[s.dropdownItem, !filtroRol && s.dropdownItemActive]}
                      onPress={() => {
                        setFiltroRol('');
                        setTextoBuscarRol('');
                        setDropdownRolOpen(false);
                      }}
                    >
                      <ThemedText style={[s.dropdownItemText, !filtroRol && s.dropdownItemTextActive]}>
                        👥 Todos los roles
                      </ThemedText>
                    </Pressable>

                    {[
                      { key: 'administrador', label: '👑 Administrador' },
                      { key: 'auxiliar', label: '🛠️ Auxiliar' },
                      { key: 'cliente', label: '🙂 Cliente' }
                    ]
                      .filter(item => item.label.toLowerCase().includes(textoBuscarRol.toLowerCase()))
                      .map((item) => {
                        const isSelected = filtroRol === item.key;
                        return (
                          <Pressable
                            key={item.key}
                            style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                            onPress={() => {
                              setFiltroRol(item.key);
                              setTextoBuscarRol(item.label);
                              setDropdownRolOpen(false);
                            }}
                          >
                            <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                              {item.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Fila: Ordenamiento */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Ordenar por</ThemedText>
            <View style={s.dropdownContainer}>
              <View style={s.filterSearchBox}>
                <Ionicons name="swap-vertical-outline" size={14} color="#d4956a" />
                <TextInput
                  placeholder="Buscar y seleccionar orden..."
                  placeholderTextColor="#b8a99a"
                  value={textoBuscarOrden}
                  onFocus={() => setDropdownOrdenOpen(true)}
                  onChangeText={(text) => {
                    setTextoBuscarOrden(text);
                    setDropdownOrdenOpen(true);
                    setOrdenarPor('reciente');
                  }}
                  style={s.filterSearchInput}
                />
                {textoBuscarOrden.length > 0 || ordenarPor !== 'reciente' ? (
                  <Pressable onPress={() => {
                    setTextoBuscarOrden('');
                    setOrdenarPor('reciente');
                    setDropdownOrdenOpen(false);
                  }}>
                    <Ionicons name="close-circle" size={16} color="#b8a99a" />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setDropdownOrdenOpen(!dropdownOrdenOpen)}>
                    <Ionicons name={dropdownOrdenOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                  </Pressable>
                )}
              </View>
              {dropdownOrdenOpen && (
                <View style={s.dropdownList}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                    {[
                      { key: 'nombre', label: '🔤 Nombre A-Z' },
                      { key: 'reciente', label: '🕓 Más nuevos' },
                      { key: 'antiguo', label: '📅 Más antiguos' }
                    ]
                      .filter(item => item.label.toLowerCase().includes(textoBuscarOrden.toLowerCase()))
                      .map((item) => {
                        const isSelected = ordenarPor === item.key;
                        return (
                          <Pressable
                            key={item.key}
                            style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                            onPress={() => {
                              setOrdenarPor(item.key as any);
                              setTextoBuscarOrden(item.label);
                              setDropdownOrdenOpen(false);
                            }}
                          >
                            <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                              {item.label}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Botón limpiar */}
          {(filtroRol !== '' || filtroActivo !== 'all' || ordenarPor !== 'reciente' || textoBuscarRol !== '' || textoBuscarActivo !== '' || textoBuscarOrden !== '') && (
            <Pressable
              style={s.clearFiltersBtn}
              onPress={() => {
                setFiltroRol('');
                setFiltroActivo('all');
                setOrdenarPor('reciente');
                setTextoBuscarRol('');
                setTextoBuscarActivo('');
                setTextoBuscarOrden('');
                setDropdownRolOpen(false);
                setDropdownActivoOpen(false);
                setDropdownOrdenOpen(false);
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#c0392b" />
              <ThemedText style={s.clearFiltersText}>Limpiar filtros</ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {loading && <View style={s.centered}><ActivityIndicator size="large" color="#d4956a" /></View>}
      {!!errorMessage && <ThemedText style={s.error}>{errorMessage}</ThemedText>}

      <FlatList
        data={usuariosVisibles}
        keyExtractor={(item) => String(item.id)}
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setPagina(1); fetchUsuarios(busqueda, true); }} colors={['#d4956a']} tintColor="#d4956a" />
        }
        renderItem={({ item }) => {
          const rolStyle = getRol(item.rol);
          return (
            <Pressable style={s.card} onPress={() => setSelected(item)}>
              {/* Avatar con inicial */}
              <View style={[s.avatar, { backgroundColor: rolStyle.bg }]}>
                <ThemedText style={s.avatarText}>
                  {(item.nombre?.[0] || '?').toUpperCase()}
                </ThemedText>
              </View>

              <View style={s.cardBody}>
                <ThemedText style={s.cardName} numberOfLines={1}>
                  {item.nombre} {item.apellido}
                </ThemedText>
                <ThemedText style={s.cardEmail} numberOfLines={1}>{item.email}</ThemedText>
                <View style={s.row}>
                  <View style={[s.pill, { backgroundColor: rolStyle.bg }]}>
                    <ThemedText style={[s.pillText, { color: rolStyle.text }]}>
                      {rolStyle.emoji} {item.rol}
                    </ThemedText>
                  </View>
                  <View style={[s.pill, item.activo ? s.pillGreen : s.pillRose]}>
                    <ThemedText style={[s.pillText, item.activo ? s.pillTextGreen : s.pillTextRose]}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {isAdmin && (
                <Pressable
                  style={[s.eye, item.activo ? s.eyeGreen : s.eyeRose]}
                  onPress={() => handleToggle(item)}
                >
                  <Ionicons name={item.activo ? 'eye-outline' : 'eye-off-outline'} size={17} color={item.activo ? '#2d6a4f' : '#c0392b'} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={!loading && !errorMessage ? (
          <View style={s.empty}>
            <ThemedText style={s.emptyIcon}>👥</ThemedText>
            <ThemedText style={s.emptyText}>No hay usuarios aún</ThemedText>
          </View>
        ) : null}
        ListFooterComponent={<ListFooter />}
      />

      {/* Modal detalle */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalBody}>
                  {/* Avatar grande */}
                  <View style={[s.modalAvatar, { backgroundColor: getRol(selected.rol).bg }]}>
                    <ThemedText style={s.modalAvatarText}>
                      {(selected.nombre?.[0] || '?').toUpperCase()}
                    </ThemedText>
                  </View>

                  <ThemedText style={s.modalName}>{selected.nombre} {selected.apellido}</ThemedText>
                  <ThemedText style={s.modalEmail}>{selected.email}</ThemedText>

                  {/* Info grid */}
                  <View style={s.grid}>
                    <View style={s.infoCell}>
                      <ThemedText style={s.cellLabel}>Rol</ThemedText>
                      <View style={[s.pill, { backgroundColor: getRol(selected.rol).bg, alignSelf: 'flex-start', marginTop: 2 }]}>
                        <ThemedText style={[s.pillText, { color: getRol(selected.rol).text }]}>
                          {getRol(selected.rol).emoji} {selected.rol}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={s.infoCell}>
                      <ThemedText style={s.cellLabel}>Estado</ThemedText>
                      <View style={[s.pill, selected.activo ? s.pillGreen : s.pillRose, { alignSelf: 'flex-start', marginTop: 2 }]}>
                        <ThemedText style={[s.pillText, selected.activo ? s.pillTextGreen : s.pillTextRose]}>
                          {selected.activo ? '✅ Activo' : '🚫 Inactivo'}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={s.infoCell}>
                    <ThemedText style={s.cellLabel}>ID de usuario</ThemedText>
                    <ThemedText style={s.cellValue} numberOfLines={1}>{selected.id}</ThemedText>
                  </View>

                  {/* Solo admin: botones activar/desactivar y editar */}
                  {isAdmin && (
                    <View style={s.modalActions}>
                      <Pressable
                        style={[s.modalBtn, selected.activo ? s.btnRed : s.btnGreen]}
                        onPress={async () => { await handleToggle(selected); setSelected(null); }}
                      >
                        <Ionicons name={selected.activo ? 'eye-off-outline' : 'eye-outline'} size={17} color="#fff" />
                        <ThemedText style={s.modalBtnText}>
                          {selected.activo ? 'Desactivar' : 'Activar'}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[s.modalBtn, s.btnAmber]}
                        onPress={() => { setSelected(null); pushParams('/admin/usuario-form', { usuario: JSON.stringify(selected) }); }}
                      >
                        <Ionicons name="create-outline" size={17} color="#fff" />
                        <ThemedText style={s.modalBtnText}>Editar</ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
            <Pressable style={s.closeBtn} onPress={() => setSelected(null)}>
              <ThemedText style={s.closeBtnText}>Cerrar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AdminToast message={toast.message} type={toast.type} visible={toast.visible} />
      <ConfirmModal
        visible={showConfirmToggle}
        title={toggleUser?.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
        message={`¿Estás seguro de que deseas ${toggleUser?.activo ? 'desactivar' : 'activar'} la cuenta de ${toggleUser?.nombre} ${toggleUser?.apellido}?`}
        icon={toggleUser?.activo ? 'eye-off-outline' : 'eye-outline'}
        confirmText={toggleUser?.activo ? 'Desactivar' : 'Activar'}
        cancelText="Cancelar"
        isDestructive={toggleUser?.activo}
        onConfirm={confirmToggle}
        onCancel={() => {
          setShowConfirmToggle(false);
          setToggleUser(null);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f4', padding: 16, gap: 12 },
  header: { gap: 2, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#3d2c1e' },
  subtitle: { fontSize: 13, color: '#9e8879' },

  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#d4956a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9f5', borderRadius: 14, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 12, height: 44, gap: 8 },
  input: { flex: 1, fontSize: 14, color: '#3d2c1e' },

  centered: { alignItems: 'center', paddingVertical: 24 },
  error: { color: '#e07070', fontSize: 13 },
  list: { flex: 1 },

  // Tarjeta
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, shadowColor: '#c4a882', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
  cardBody: { flex: 1, gap: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#3d2c1e' },
  cardEmail: { fontSize: 12, color: '#9e8879' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },

  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  pillGreen: { backgroundColor: '#d8f3dc' },
  pillRose: { backgroundColor: '#fde8e8' },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillTextGreen: { color: '#2d6a4f' },
  pillTextRose: { color: '#c0392b' },

  eye: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyeGreen: { backgroundColor: '#d8f3dc', borderColor: '#b7e4c7' },
  eyeRose: { backgroundColor: '#fde8e8', borderColor: '#f4baba' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#b8a99a' },

  // Paginación minimalista en footer
  pagBarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pagCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c4a882',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pagCircleBtnOff: {
    backgroundColor: '#f5f0ec',
    shadowOpacity: 0,
    elevation: 0,
  },
  pagDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8ddd5',
  },
  pagDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4956a',
  },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(61,44,30,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '80%', paddingBottom: 16 },
  handle: { width: 40, height: 4, backgroundColor: '#e8ddd5', borderRadius: 4, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  modalBody: { padding: 20, gap: 14, alignItems: 'center' },
  modalAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  modalAvatarText: { fontSize: 32, fontWeight: '800', color: '#3d2c1e' },
  modalName: { fontSize: 20, fontWeight: '800', color: '#3d2c1e', textAlign: 'center' },
  modalEmail: { fontSize: 14, color: '#9e8879', textAlign: 'center' },
  grid: { flexDirection: 'row', gap: 8, width: '100%' },
  infoCell: { backgroundColor: '#fdf8f4', borderRadius: 14, padding: 12, flex: 1, gap: 4 },
  cellLabel: { fontSize: 11, color: '#b8a99a', fontWeight: '600', textTransform: 'uppercase' },
  cellValue: { fontSize: 13, fontWeight: '700', color: '#3d2c1e' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#b8a99a', textTransform: 'uppercase', letterSpacing: 0.8, alignSelf: 'flex-start' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6, width: '100%' },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnGreen: { backgroundColor: '#52b788' },
  btnRed: { backgroundColor: '#e07070' },
  btnAmber: { backgroundColor: '#d4956a' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  closeBtn: { marginHorizontal: 20, marginTop: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fdf8f4', alignItems: 'center' },
  closeBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 14 },

  // Panel de filtros
  filterToggleBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff9f5', borderWidth: 1, borderColor: '#e8ddd5', alignItems: 'center', justifyContent: 'center' },
  filterToggleBtnActive: { backgroundColor: '#d4956a', borderColor: '#d4956a' },
  filterPanel: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e8ddd5', padding: 14, gap: 10, shadowColor: '#c4a882', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#b8a99a', textTransform: 'uppercase', letterSpacing: 0.6 },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  scrollPillRow: { gap: 6, paddingRight: 12 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#fdf8f4', borderWidth: 1, borderColor: '#e8ddd5', flexDirection: 'row', alignItems: 'center' },
  filterPillActive: { backgroundColor: '#fff3e6', borderColor: '#d4956a' },
  filterPillText: { fontSize: 12, color: '#7c6455', fontWeight: '600' },
  filterPillTextActive: { color: '#d4956a', fontWeight: '700' },
  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0ede8', marginTop: 4 },
  clearFiltersText: { fontSize: 12, fontWeight: '700', color: '#c0392b' },
  filterSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf8f4', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 10, height: 38, gap: 6, marginBottom: 4 },
  filterSearchInput: { flex: 1, fontSize: 13, color: '#3d2c1e', padding: 0 },
  dropdownContainer: { position: 'relative', zIndex: 10, width: '100%' },
  dropdownList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', marginTop: 4, shadowColor: '#c4a882', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fdf8f4' },
  dropdownItemActive: { backgroundColor: '#fff3e6' },
  dropdownItemText: { fontSize: 13, color: '#3d2c1e', fontWeight: '500' },
  dropdownItemTextActive: { color: '#d4956a', fontWeight: '700' },
});
