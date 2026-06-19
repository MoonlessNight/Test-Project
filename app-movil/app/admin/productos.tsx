/**
 * Pantalla de gestión de productos — panel de administración.
 * Diseño pastel cálido • Toast • Modal de detalle • Botón toggle circular
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import AdminToast from '../../components/admin-toast';
import apiClient from '../../src/api/apiClient';
import catalogoService from '../../src/services/catalogoService';
import { activarProducto, desactivarProducto } from '../../src/services/adminService';
import { useAuth } from '../../src/context/AuthContext';

type Producto = {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagen?: string;
  activo?: boolean;
  categoria?: { nombre?: string };
  subcategoria?: { nombre?: string };
};

type AuthUser = { rol?: string };

const push = (path: string) =>
  (router as unknown as { push: (p: string) => void }).push(path);

const pushParams = (pathname: string, params: Record<string, string>) =>
  (router as unknown as { push: (p: { pathname: string; params: Record<string, string> }) => void }).push({ pathname, params });

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

export default function AdminProductosScreen() {
  const { user } = useAuth() as { user: AuthUser | null };
  const isAdmin = user?.rol === 'administrador';

  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [selected, setSelected] = useState<Producto | null>(null);

  // Filtros adicionales
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'true' | 'false'>('all');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>('');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'reciente' | 'antiguo'>('nombre');

  const [categorias, setCategorias] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);

  const params = useLocalSearchParams<{ productoId?: string }>();

  const { toast, showToast } = useToast();

  useEffect(() => {
    if (params?.productoId) {
      apiClient.get(`/admin/productos/${params.productoId}`)
        .then(res => {
          if (res.data?.success && res.data?.data?.producto) {
            setSelected(res.data.data.producto);
          }
        })
        .catch(() => {});
    }
  }, [params?.productoId]);

  // Carga inicial de opciones de filtros
  useEffect(() => {
    apiClient.get('/admin/categorias')
      .then(res => setCategorias(res.data?.data?.categorias || []))
      .catch(() => {});
    apiClient.get('/admin/subcategorias')
      .then(res => setSubcategorias(res.data?.data?.subcategorias || []))
      .catch(() => {});
  }, []);

  const fetchProductos = async (
    page = 1,
    search = '',
    isRefresh = false,
    activeFilter = filtroActivo,
    catFilter = filtroCategoria,
    subFilter = filtroSubcategoria,
    sortVal = ordenarPor
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');
    try {
      const params: string[] = [];
      if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
      if (catFilter) params.push(`categoriaId=${catFilter}`);
      if (subFilter) params.push(`subcategoriaId=${subFilter}`);
      if (activeFilter !== 'all') params.push(`activo=${activeFilter}`);
      params.push(`pagina=${page}`);
      params.push('limite=10');

      const res = await apiClient.get(`/admin/productos?${params.join('&')}`);
      let data: Producto[] = res.data?.data?.productos || [];

      // Ordenar en el cliente (timestamps y nombre)
      if (sortVal === 'reciente') {
        data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      } else if (sortVal === 'antiguo') {
        data.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else {
        data.sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''));
      }

      setProductos(data);
      setPagina(page);
      setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProductos(1, busqueda);
  }, [filtroActivo, filtroCategoria, filtroSubcategoria, ordenarPor]);

  const handleSelectCategoria = (id: string) => {
    setFiltroCategoria(id);
    setFiltroSubcategoria('');
  };

  const handleToggle = async (item: Producto) => {
    try {
      if (item.activo) {
        await desactivarProducto(item.id);
        showToast(`"${item.nombre}" desactivado`, 'success');
      } else {
        await activarProducto(item.id);
        showToast(`"${item.nombre}" activado`, 'success');
      }
      fetchProductos(pagina, busqueda);
    } catch {
      showToast('No se pudo cambiar el estado', 'error');
    }
  };

  return (
    <View style={s.container}>
      {/* Encabezado */}
      <View style={s.header}>
        <ThemedText style={s.title}>🛍️ Productos</ThemedText>
        <ThemedText style={s.subtitle}>Gestiona el catálogo de tu tienda</ThemedText>
      </View>

      {/* Búsqueda + Crear */}
      {/* Búsqueda + Crear */}
      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={15} color="#b8a99a" />
          <TextInput
            placeholder="Buscar producto..."
            placeholderTextColor="#b8a99a"
            value={busqueda}
            onChangeText={(t) => { setBusqueda(t); fetchProductos(1, t); }}
            style={s.input}
          />
        </View>
        <Pressable
          style={[s.filterToggleBtn, showFiltros && s.filterToggleBtnActive]}
          onPress={() => setShowFiltros(v => !v)}
        >
          <Ionicons name="filter-outline" size={18} color={showFiltros ? '#fff' : '#d4956a'} />
        </Pressable>
        <Pressable style={s.createBtn} onPress={() => push('/admin/producto-form')}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <ThemedText style={s.createBtnText}>Nuevo</ThemedText>
        </Pressable>
      </View>

      {/* Panel de Filtros Desplegable */}
      {showFiltros && (
        <View style={s.filterPanel}>
          {/* Fila: Estado */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Estado</ThemedText>
            <View style={s.pillRow}>
              {(['all', 'true', 'false'] as const).map((st) => (
                <Pressable
                  key={st}
                  style={[s.filterPill, filtroActivo === st && s.filterPillActive]}
                  onPress={() => setFiltroActivo(st)}
                >
                  <ThemedText style={[s.filterPillText, filtroActivo === st && s.filterPillTextActive]}>
                    {st === 'all' ? 'Todos' : st === 'true' ? 'Activos' : 'Inactivos'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fila: Ordenamiento */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Ordenar por</ThemedText>
            <View style={s.pillRow}>
              {(['nombre', 'reciente', 'antiguo'] as const).map((ord) => (
                <Pressable
                  key={ord}
                  style={[s.filterPill, ordenarPor === ord && s.filterPillActive]}
                  onPress={() => setOrdenarPor(ord)}
                >
                  <ThemedText style={[s.filterPillText, ordenarPor === ord && s.filterPillTextActive]}>
                    {ord === 'nombre' ? 'Nombre A-Z' : ord === 'reciente' ? 'Más nuevos' : 'Más antiguos'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fila: Categoría */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Categoría</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollPillRow}>
              <Pressable
                style={[s.filterPill, !filtroCategoria && s.filterPillActive]}
                onPress={() => handleSelectCategoria('')}
              >
                <ThemedText style={[s.filterPillText, !filtroCategoria && s.filterPillTextActive]}>
                  Todas
                </ThemedText>
              </Pressable>
              {categorias.map((cat) => (
                <Pressable
                  key={String(cat.id)}
                  style={[s.filterPill, filtroCategoria === String(cat.id) && s.filterPillActive]}
                  onPress={() => handleSelectCategoria(String(cat.id))}
                >
                  <ThemedText style={[s.filterPillText, filtroCategoria === String(cat.id) && s.filterPillTextActive]}>
                    {cat.nombre}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Fila: Subcategoría */}
          {!!filtroCategoria && (
            <View style={s.filterGroup}>
              <ThemedText style={s.filterLabel}>Subcategoría</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollPillRow}>
                <Pressable
                  style={[s.filterPill, !filtroSubcategoria && s.filterPillActive]}
                  onPress={() => setFiltroSubcategoria('')}
                >
                  <ThemedText style={[s.filterPillText, !filtroSubcategoria && s.filterPillTextActive]}>
                    Todas
                  </ThemedText>
                </Pressable>
                {subcategorias
                  .filter(sub => String(sub.categoriaId) === filtroCategoria)
                  .map((sub) => (
                    <Pressable
                      key={String(sub.id)}
                      style={[s.filterPill, filtroSubcategoria === String(sub.id) && s.filterPillActive]}
                      onPress={() => setFiltroSubcategoria(String(sub.id))}
                    >
                      <ThemedText style={[s.filterPillText, filtroSubcategoria === String(sub.id) && s.filterPillTextActive]}>
                        {sub.nombre}
                      </ThemedText>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          )}

          {/* Botón limpiar */}
          {(!!filtroCategoria || !!filtroSubcategoria || filtroActivo !== 'all' || ordenarPor !== 'nombre') && (
            <Pressable
              style={s.clearFiltersBtn}
              onPress={() => {
                setFiltroCategoria('');
                setFiltroSubcategoria('');
                setFiltroActivo('all');
                setOrdenarPor('nombre');
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

      {/* Lista */}
      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id)}
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchProductos(1, busqueda, true)} colors={['#d4956a']} tintColor="#d4956a" />
        }
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => setSelected(item)}>
            <Image
              source={{ uri: catalogoService.buildImageUrl(item.imagen) }}
              style={s.cardImg}
            />
            <View style={s.cardBody}>
              <ThemedText style={s.cardName} numberOfLines={1}>{item.nombre}</ThemedText>
              <ThemedText style={s.cardDesc} numberOfLines={1}>{item.descripcion || 'Sin descripción'}</ThemedText>
              <ThemedText style={s.cardPrice}>${Number(item.precio || 0).toLocaleString('es-CO')}</ThemedText>
              <View style={s.row}>
                <View style={[s.pill, item.activo ? s.pillGreen : s.pillRose]}>
                  <ThemedText style={[s.pillText, item.activo ? s.pillTextGreen : s.pillTextRose]}>
                    {item.activo ? 'Activo' : 'Inactivo'}
                  </ThemedText>
                </View>
                <ThemedText style={s.stock}>📦 {item.stock}</ThemedText>
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
        )}
        ListEmptyComponent={!loading && !errorMessage ? (
          <View style={s.empty}>
            <ThemedText style={s.emptyIcon}>🛒</ThemedText>
            <ThemedText style={s.emptyText}>No hay productos aún</ThemedText>
          </View>
        ) : null}
      />

      {/* Paginación */}
      <View style={s.pagination}>
        <Pressable style={[s.pageBtn, pagina <= 1 && s.pageBtnOff]} onPress={() => pagina > 1 && fetchProductos(pagina - 1, busqueda)} disabled={pagina <= 1}>
          <Ionicons name="chevron-back" size={16} color={pagina <= 1 ? '#d0c4bb' : '#7c5c45'} />
        </Pressable>
        <ThemedText style={s.pageLabel}>Página {pagina} de {totalPaginas}</ThemedText>
        <Pressable style={[s.pageBtn, pagina >= totalPaginas && s.pageBtnOff]} onPress={() => pagina < totalPaginas && fetchProductos(pagina + 1, busqueda)} disabled={pagina >= totalPaginas}>
          <Ionicons name="chevron-forward" size={16} color={pagina >= totalPaginas ? '#d0c4bb' : '#7c5c45'} />
        </Pressable>
      </View>

      {/* Modal detalle */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {selected && (
                <>
                  <Image
                    source={{ uri: catalogoService.buildImageUrl(selected.imagen) }}
                    style={s.modalImg}
                    resizeMode="cover"
                  />
                  <View style={s.modalBody}>
                    <View style={s.modalTopRow}>
                      <ThemedText style={s.modalName}>{selected.nombre}</ThemedText>
                      <View style={[s.pill, selected.activo ? s.pillGreen : s.pillRose]}>
                        <ThemedText style={[s.pillText, selected.activo ? s.pillTextGreen : s.pillTextRose]}>
                          {selected.activo ? 'Activo' : 'Inactivo'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={s.modalPrice}>${Number(selected.precio || 0).toLocaleString('es-CO')}</ThemedText>
                    <ThemedText style={s.sectionLabel}>Descripción</ThemedText>
                    <ThemedText style={s.modalDesc}>{selected.descripcion || 'Sin descripción'}</ThemedText>
                    <View style={s.grid}>
                      <View style={s.infoCell}>
                        <ThemedText style={s.cellLabel}>Stock</ThemedText>
                        <ThemedText style={s.cellValue}>{selected.stock ?? '—'}</ThemedText>
                      </View>
                      <View style={s.infoCell}>
                        <ThemedText style={s.cellLabel}>Categoría</ThemedText>
                        <ThemedText style={s.cellValue}>{selected.categoria?.nombre || '—'}</ThemedText>
                      </View>
                      <View style={s.infoCell}>
                        <ThemedText style={s.cellLabel}>Subcategoría</ThemedText>
                        <ThemedText style={s.cellValue}>{selected.subcategoria?.nombre || '—'}</ThemedText>
                      </View>
                    </View>
                    <View style={s.modalActions}>
                      {isAdmin && (
                        <Pressable
                          style={[s.modalBtn, selected.activo ? s.btnRed : s.btnGreen]}
                          onPress={async () => { await handleToggle(selected); setSelected(null); }}
                        >
                          <Ionicons name={selected.activo ? 'eye-off-outline' : 'eye-outline'} size={17} color="#fff" />
                          <ThemedText style={s.modalBtnText}>{selected.activo ? 'Desactivar' : 'Activar'}</ThemedText>
                        </Pressable>
                      )}
                      <Pressable
                        style={[s.modalBtn, s.btnAmber]}
                        onPress={() => { setSelected(null); pushParams('/admin/producto-form', { producto: JSON.stringify(selected) }); }}
                      >
                        <Ionicons name="create-outline" size={17} color="#fff" />
                        <ThemedText style={s.modalBtnText}>Editar</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            <Pressable style={s.closeBtn} onPress={() => setSelected(null)}>
              <ThemedText style={s.closeBtnText}>Cerrar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AdminToast message={toast.message} type={toast.type} visible={toast.visible} />
    </View>
  );
}

const s = StyleSheet.create({
  // Contenedor principal
  container: { flex: 1, backgroundColor: '#fdf8f4', padding: 16, gap: 12 },
  header: { gap: 2, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#3d2c1e' },
  subtitle: { fontSize: 13, color: '#9e8879' },

  // Búsqueda
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9f5', borderRadius: 14, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 12, height: 44, gap: 8 },
  input: { flex: 1, fontSize: 14, color: '#3d2c1e' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#d4956a', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  centered: { alignItems: 'center', paddingVertical: 24 },
  error: { color: '#e07070', fontSize: 13 },
  list: { flex: 1 },

  // Tarjeta
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 10, shadowColor: '#c4a882', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cardImg: { width: 66, height: 66, borderRadius: 14, backgroundColor: '#f5ede5' },
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#3d2c1e' },
  cardDesc: { fontSize: 13, color: '#9e8879' },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#c47a3a' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  stock: { fontSize: 12, color: '#b8a99a' },

  // Badges/pills
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  pillGreen: { backgroundColor: '#d8f3dc' },
  pillRose: { backgroundColor: '#fde8e8' },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillTextGreen: { color: '#2d6a4f' },
  pillTextRose: { color: '#c0392b' },

  // Botón ojo
  eye: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  eyeGreen: { backgroundColor: '#d8f3dc', borderColor: '#b7e4c7' },
  eyeRose: { backgroundColor: '#fde8e8', borderColor: '#f4baba' },

  // Estado vacío
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#b8a99a' },

  // Paginación
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 6 },
  pageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff9f5', borderWidth: 1, borderColor: '#e8ddd5', alignItems: 'center', justifyContent: 'center' },
  pageBtnOff: { opacity: 0.4 },
  pageLabel: { fontSize: 13, fontWeight: '600', color: '#7c6455' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(61,44,30,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '90%', paddingBottom: 16 },
  handle: { width: 40, height: 4, backgroundColor: '#e8ddd5', borderRadius: 4, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  modalImg: { width: '100%', height: 210, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  modalBody: { padding: 20, gap: 10 },
  modalTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  modalName: { fontSize: 20, fontWeight: '800', color: '#3d2c1e', flex: 1 },
  modalPrice: { fontSize: 22, fontWeight: '800', color: '#c47a3a' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#b8a99a', textTransform: 'uppercase', letterSpacing: 0.8 },
  modalDesc: { fontSize: 14, color: '#7c6455', lineHeight: 20 },
  grid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoCell: { backgroundColor: '#fdf8f4', borderRadius: 14, padding: 12, flex: 1, minWidth: '28%', gap: 4 },
  cellLabel: { fontSize: 11, color: '#b8a99a', fontWeight: '600', textTransform: 'uppercase' },
  cellValue: { fontSize: 14, fontWeight: '700', color: '#3d2c1e' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 14 },
  btnGreen: { backgroundColor: '#52b788' },
  btnRed: { backgroundColor: '#e07070' },
  btnAmber: { backgroundColor: '#d4956a' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
});
