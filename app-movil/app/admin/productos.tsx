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
import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ConfirmModal from '../../components/confirm-modal';
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
  const [selected, setSelected] = useState<Producto | null>(null);

  // Filtros adicionales
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<'all' | 'true' | 'false'>('all');
  const [dropdownActivoOpen, setDropdownActivoOpen] = useState(false);
  const [textoBuscarActivo, setTextoBuscarActivo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [dropdownCatOpen, setDropdownCatOpen] = useState(false);
  const [textoBuscarCategoria, setTextoBuscarCategoria] = useState('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string>('');
  const [dropdownSubOpen, setDropdownSubOpen] = useState(false);
  const [textoBuscarSubcategoria, setTextoBuscarSubcategoria] = useState('');
  const [ordenarPor, setOrdenarPor] = useState<'nombre' | 'reciente' | 'antiguo'>('nombre');
  const [dropdownOrdenOpen, setDropdownOrdenOpen] = useState(false);
  const [textoBuscarOrden, setTextoBuscarOrden] = useState('');

  const [categorias, setCategorias] = useState<any[]>([]);
  const [subcategorias, setSubcategorias] = useState<any[]>([]);

  const params = useLocalSearchParams<{ toastMessage?: string; toastType?: string; productoId?: string }>();

  const [showConfirmToggle, setShowConfirmToggle] = useState(false);
  const [toggleProduct, setToggleProduct] = useState<Producto | null>(null);

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
      params.push('limite=1000');

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
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'Error al cargar productos');
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
      fetchProductos(busqueda);
    }, [params.toastMessage, params.toastType])
  );

  useEffect(() => {
    setPagina(1);
    fetchProductos(busqueda);
  }, [filtroActivo, filtroCategoria, filtroSubcategoria, ordenarPor]);

  const handleSelectCategoria = (id: string, nombreCat: string) => {
    setFiltroCategoria(id);
    setFiltroSubcategoria('');
    setTextoBuscarCategoria(nombreCat);
    setTextoBuscarSubcategoria('');
    setDropdownCatOpen(false);
  };

  const handleToggle = (item: Producto) => {
    setToggleProduct(item);
    setShowConfirmToggle(true);
  };

  const confirmToggle = async () => {
    if (!toggleProduct) return;
    setShowConfirmToggle(false);
    const item = toggleProduct;
    setToggleProduct(null);
    try {
      if (item.activo) {
        await desactivarProducto(item.id);
        showToast(`"${item.nombre}" desactivado`, 'success');
      } else {
        await activarProducto(item.id);
        showToast(`"${item.nombre}" activado`, 'success');
      }
      fetchProductos(busqueda);
    } catch {
      showToast('No se pudo cambiar el estado', 'error');
    }
  };

  const totalPaginas = Math.ceil(productos.length / 10) || 1;
  const productosVisibles = productos.slice((pagina - 1) * 10, pagina * 10);

  const ListFooter = () => {
    if (loading || productos.length === 0 || totalPaginas <= 1) {
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
      {/* Encabezado */}
      <View style={s.header}>
        <ThemedText style={s.title}>🛍️ Productos</ThemedText>
        <ThemedText style={s.subtitle}>Gestiona el catálogo de tu tienda</ThemedText>
      </View>

      {/* Búsqueda + Crear */}
      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={15} color="#b8a99a" />
          <TextInput
            placeholder="Buscar producto..."
            placeholderTextColor="#b8a99a"
            value={busqueda}
            onChangeText={(t) => { setBusqueda(t); setPagina(1); fetchProductos(t); }}
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
                    setOrdenarPor('nombre');
                  }}
                  style={s.filterSearchInput}
                />
                {textoBuscarOrden.length > 0 || ordenarPor !== 'nombre' ? (
                  <Pressable onPress={() => {
                    setTextoBuscarOrden('');
                    setOrdenarPor('nombre');
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

          {/* Fila: Categoría */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Categoría</ThemedText>
            <View style={s.dropdownContainer}>
              <View style={s.filterSearchBox}>
                <Ionicons name="folder-open-outline" size={14} color="#d4956a" />
                <TextInput
                  placeholder="Buscar y seleccionar categoría..."
                  placeholderTextColor="#b8a99a"
                  value={textoBuscarCategoria}
                  onFocus={() => setDropdownCatOpen(true)}
                  onChangeText={(text) => {
                    setTextoBuscarCategoria(text);
                    setDropdownCatOpen(true);
                    setFiltroCategoria('');
                    setFiltroSubcategoria('');
                    setTextoBuscarSubcategoria('');
                  }}
                  style={s.filterSearchInput}
                />
                {textoBuscarCategoria.length > 0 || filtroCategoria !== '' ? (
                  <Pressable onPress={() => {
                    handleSelectCategoria('', '');
                    setDropdownCatOpen(false);
                  }}>
                    <Ionicons name="close-circle" size={16} color="#b8a99a" />
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setDropdownCatOpen(!dropdownCatOpen)}>
                    <Ionicons name={dropdownCatOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                  </Pressable>
                )}
              </View>

              {dropdownCatOpen && (
                <View style={s.dropdownList}>
                  <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                    <Pressable
                      style={[s.dropdownItem, !filtroCategoria && s.dropdownItemActive]}
                      onPress={() => {
                        handleSelectCategoria('', '');
                      }}
                    >
                      <ThemedText style={[s.dropdownItemText, !filtroCategoria && s.dropdownItemTextActive]}>
                        📁 Todas las categorías
                      </ThemedText>
                    </Pressable>

                    {categorias
                      .filter((cat) => {
                        return (cat.nombre || '').toLowerCase().includes(textoBuscarCategoria.toLowerCase());
                      })
                      .map((cat) => {
                        const isSelected = filtroCategoria === String(cat.id);
                        return (
                          <Pressable
                            key={String(cat.id)}
                            style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                            onPress={() => {
                              handleSelectCategoria(String(cat.id), cat.nombre || '');
                            }}
                          >
                            <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                              📁 {cat.nombre}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Fila: Subcategoría */}
          {!!filtroCategoria && (
            <View style={s.filterGroup}>
              <ThemedText style={s.filterLabel}>Subcategoría</ThemedText>
              <View style={s.dropdownContainer}>
                <View style={s.filterSearchBox}>
                  <Ionicons name="pricetag-outline" size={14} color="#d4956a" />
                  <TextInput
                    placeholder="Buscar y seleccionar subcategoría..."
                    placeholderTextColor="#b8a99a"
                    value={textoBuscarSubcategoria}
                    onFocus={() => setDropdownSubOpen(true)}
                    onChangeText={(text) => {
                      setTextoBuscarSubcategoria(text);
                      setDropdownSubOpen(true);
                      setFiltroSubcategoria('');
                    }}
                    style={s.filterSearchInput}
                  />
                  {textoBuscarSubcategoria.length > 0 || filtroSubcategoria !== '' ? (
                    <Pressable onPress={() => {
                      setTextoBuscarSubcategoria('');
                      setFiltroSubcategoria('');
                      setDropdownSubOpen(false);
                    }}>
                      <Ionicons name="close-circle" size={16} color="#b8a99a" />
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => setDropdownSubOpen(!dropdownSubOpen)}>
                      <Ionicons name={dropdownSubOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                    </Pressable>
                  )}
                </View>

                {dropdownSubOpen && (
                  <View style={s.dropdownList}>
                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                      <Pressable
                        style={[s.dropdownItem, !filtroSubcategoria && s.dropdownItemActive]}
                        onPress={() => {
                          setFiltroSubcategoria('');
                          setTextoBuscarSubcategoria('');
                          setDropdownSubOpen(false);
                        }}
                      >
                        <ThemedText style={[s.dropdownItemText, !filtroSubcategoria && s.dropdownItemTextActive]}>
                          🏷️ Todas las subcategorías
                        </ThemedText>
                      </Pressable>

                      {subcategorias
                        .filter(sub => String(sub.categoriaId) === filtroCategoria)
                        .filter(sub => (sub.nombre || '').toLowerCase().includes(textoBuscarSubcategoria.toLowerCase()))
                        .map((sub) => {
                          const isSelected = filtroSubcategoria === String(sub.id);
                          return (
                            <Pressable
                              key={String(sub.id)}
                              style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                              onPress={() => {
                                setFiltroSubcategoria(String(sub.id));
                                setTextoBuscarSubcategoria(sub.nombre || '');
                                setDropdownSubOpen(false);
                              }}
                            >
                              <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                                🏷️ {sub.nombre}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Botón limpiar */}
          {(!!filtroCategoria || !!filtroSubcategoria || filtroActivo !== 'all' || ordenarPor !== 'nombre' || textoBuscarCategoria !== '' || textoBuscarSubcategoria !== '' || textoBuscarActivo !== '' || textoBuscarOrden !== '') && (
            <Pressable
              style={s.clearFiltersBtn}
              onPress={() => {
                setFiltroCategoria('');
                setFiltroSubcategoria('');
                setFiltroActivo('all');
                setOrdenarPor('nombre');
                setTextoBuscarCategoria('');
                setTextoBuscarSubcategoria('');
                setTextoBuscarActivo('');
                setTextoBuscarOrden('');
                setDropdownCatOpen(false);
                setDropdownSubOpen(false);
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

      {/* Lista */}
      <FlatList
        data={productosVisibles}
        keyExtractor={(item) => String(item.id)}
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setPagina(1); fetchProductos(busqueda, true); }} colors={['#d4956a']} tintColor="#d4956a" />
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
        ListFooterComponent={<ListFooter />}
      />

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
      <ConfirmModal
        visible={showConfirmToggle}
        title={toggleProduct?.activo ? 'Desactivar Producto' : 'Activar Producto'}
        message={`¿Estás seguro de que deseas ${toggleProduct?.activo ? 'desactivar' : 'activar'} el producto "${toggleProduct?.nombre}"?`}
        icon={toggleProduct?.activo ? 'eye-off-outline' : 'eye-outline'}
        confirmText={toggleProduct?.activo ? 'Desactivar' : 'Activar'}
        cancelText="Cancelar"
        isDestructive={toggleProduct?.activo}
        onConfirm={confirmToggle}
        onCancel={() => {
          setShowConfirmToggle(false);
          setToggleProduct(null);
        }}
      />
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
  filterSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf8f4', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 10, height: 38, gap: 6, marginBottom: 4 },
  filterSearchInput: { flex: 1, fontSize: 13, color: '#3d2c1e', padding: 0 },
  dropdownContainer: { position: 'relative', zIndex: 10, width: '100%' },
  dropdownList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', marginTop: 4, shadowColor: '#c4a882', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fdf8f4' },
  dropdownItemActive: { backgroundColor: '#fff3e6' },
  dropdownItemText: { fontSize: 13, color: '#3d2c1e', fontWeight: '500' },
  dropdownItemTextActive: { color: '#d4956a', fontWeight: '700' },
});
