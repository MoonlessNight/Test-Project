import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '../../components/themed-text';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/apiClient';
import AdminToast from '../../components/admin-toast';

type Comment = {
  id: number;
  usuarioId: number;
  autor: string;
  email: string;
  productoId: number;
  producto: string;
  productoImagen: string | null;
  comentario: string;
  calificacion: number;
  estado: 'visible' | 'no_visible';
  fecha: string;
};

type AuthUser = { rol?: string; nombre?: string };

function useToast(duration = 2500) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ visible: true, message, type });
    timer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), duration);
  };
  
  return { toast, showToast };
}

export default function AdminComentariosScreen() {
  const { user, isAuthenticated, isLoadingSession } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean; isLoadingSession: boolean };
  const isAdmin = user?.rol === 'administrador';
  const isAuxiliar = user?.rol === 'auxiliar';

  const [comentarios, setComentarios] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'visible' | 'no_visible'>('todos');
  const [filtroCalificacion, setFiltroCalificacion] = useState<string>('all');
  const [filtroCliente, setFiltroCliente] = useState<string>('all');
  const [filtroProducto, setFiltroProducto] = useState<string>('all');
  const [ordenarPor, setOrdenarPor] = useState<'reciente' | 'antiguo' | 'calificacion_desc' | 'calificacion_asc'>('reciente');
  
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [productosComentados, setProductosComentados] = useState<any[]>([]);
  const [showFiltros, setShowFiltros] = useState(true);

  // Dropdowns opens
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownEstadoOpen, setDropdownEstadoOpen] = useState(false);
  const [dropdownCalificacionOpen, setDropdownCalificacionOpen] = useState(false);
  const [dropdownProductoOpen, setDropdownProductoOpen] = useState(false);
  const [dropdownOrdenOpen, setDropdownOrdenOpen] = useState(false);

  // Text inputs search within dropdowns
  const [textoBuscarUsuario, setTextoBuscarUsuario] = useState('');
  const [textoBuscarEstado, setTextoBuscarEstado] = useState('');
  const [textoBuscarCalificacion, setTextoBuscarCalificacion] = useState('');
  const [textoBuscarProducto, setTextoBuscarProducto] = useState('');
  const [textoBuscarOrden, setTextoBuscarOrden] = useState('');

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const { toast, showToast } = useToast();

  const fetchUsuarios = async () => {
    try {
      const res = await apiClient.get('/admin/comentarios/autores');
      if (res.data?.success && res.data?.data?.usuarios) {
        setUsuarios(res.data.data.usuarios);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProductosComentados = async () => {
    try {
      const res = await apiClient.get('/admin/comentarios/productos-comentados');
      if (res.data?.success && res.data?.data?.productos) {
        setProductosComentados(res.data.data.productos);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (isAdmin || isAuxiliar)) {
      fetchUsuarios();
      fetchProductosComentados();
    }
  }, [isAuthenticated, isAdmin, isAuxiliar]);

  const fetchComentarios = useCallback(async (isRefresh = false, pageNum = 1) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await apiClient.get('/admin/comentarios', {
        params: {
          buscar: busqueda,
          estado: filtroEstado,
          calificacion: filtroCalificacion,
          usuarioId: filtroCliente,
          productoId: filtroProducto,
          orden: ordenarPor,
          pagina: pageNum,
          limite: 15,
        },
      });

      const data = response.data?.data;
      const list = data?.comentarios || [];
      const pag = data?.paginacion;

      if (pageNum === 1) {
        setComentarios(list);
      } else {
        setComentarios((prev) => [...prev, ...list]);
      }

      setPagina(pageNum);
      setTotalPaginas(pag?.totalPaginas || 1);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar los comentarios', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [busqueda, filtroEstado, filtroCalificacion, filtroCliente, filtroProducto, ordenarPor]);

  // Ejecuta la búsqueda al cambiar filtros o texto
  useEffect(() => {
    if (isAuthenticated && (isAdmin || isAuxiliar)) {
      fetchComentarios(false, 1);
    }
  }, [fetchComentarios, isAuthenticated, isAdmin, isAuxiliar]);

  // Carga más comentarios (Paginación infinita)
  const handleLoadMore = () => {
    if (pagina < totalPaginas && !loading) {
      fetchComentarios(false, pagina + 1);
    }
  };

  // Alterna la visibilidad del comentario
  const handleToggleEstado = async (id: number) => {
    try {
      // Optimistic update en la interfaz
      setComentarios((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, estado: c.estado === 'visible' ? 'no_visible' : 'visible' } : c
        )
      );

      const response = await apiClient.patch(`/admin/comentarios/${id}/toggle`);
      const nuevoEstado = response.data?.data?.estado;
      
      showToast(
        `Comentario marcado como ${nuevoEstado === 'visible' ? 'Visible' : 'Oculto'} exitosamente`,
        'success'
      );
    } catch (err: any) {
      // Revertir cambio en caso de error
      setComentarios((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, estado: c.estado === 'visible' ? 'no_visible' : 'visible' } : c
        )
      );
      showToast(err.message || 'No se pudo actualizar el estado', 'error');
    }
  };

  // Renderiza las estrellas de calificación
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#d4956a"
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={s.starsContainer}>{stars}</View>;
  };

  // Si la sesión aún está cargando
  if (isLoadingSession) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color="#d4956a" />
        <ThemedText style={s.restrictedSub}>Verificando credenciales...</ThemedText>
      </View>
    );
  }

  // Si no está autenticado o no es admin/auxiliar
  if (!isAuthenticated || (!isAdmin && !isAuxiliar)) {
    return (
      <View style={s.centered}>
        <Ionicons name="lock-closed" size={60} color="#e07070" />
        <ThemedText style={s.restrictedTitle}>Acceso restringido</ThemedText>
        <ThemedText style={s.restrictedSub}>Solo Administradores y auxiliares</ThemedText>
        <Pressable style={s.backBtn} onPress={() => router.replace('/')}>
          <ThemedText style={s.backBtnText}>Ir al inicio</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      {/* Cabecera */}
      <View style={s.header}>
        <Pressable style={s.backIcon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#3d2c1e" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.headerTitle}>Moderación de Comentarios</ThemedText>
          <ThemedText style={s.headerSub}>Desactiva comentarios inapropiados</ThemedText>
        </View>
      </View>

      {/* Botón para expandir/colapsar filtros */}
      <View style={s.searchRow}>
        <Pressable
          style={[s.filterToggleBtn, showFiltros && s.filterToggleBtnActive, { flex: 1, flexDirection: 'row', gap: 8, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }]}
          onPress={() => setShowFiltros(v => !v)}
        >
          <Ionicons name="filter-outline" size={18} color={showFiltros ? '#fff' : '#d4956a'} />
          <ThemedText style={{ color: showFiltros ? '#fff' : '#d4956a', fontWeight: '700', fontSize: 14 }}>
            {showFiltros ? 'Ocultar Filtros y Búsqueda' : 'Mostrar Filtros y Búsqueda'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Panel de Filtros Desplegable */}
      {showFiltros && (
        <View style={s.filterPanelContainer}>
          <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
            <View style={{ gap: 12, paddingBottom: 16 }}>
              {/* Búsqueda por texto libre */}
              <View style={s.filterGroup}>
                <ThemedText style={s.filterLabel}>Buscar Comentario/Autor/Producto</ThemedText>
                <View style={s.filterSearchBox}>
                  <Ionicons name="search-outline" size={14} color="#d4956a" />
                  <TextInput
                    placeholder="Buscar palabra clave..."
                    placeholderTextColor="#b8a99a"
                    value={busqueda}
                    onChangeText={setBusqueda}
                    style={s.filterSearchInput}
                  />
                  {busqueda.length > 0 && (
                    <Pressable onPress={() => setBusqueda('')}>
                      <Ionicons name="close-circle" size={16} color="#b8a99a" />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Fila: Estado/Visibilidad */}
              <View style={s.filterGroup}>
                <ThemedText style={s.filterLabel}>Estado / Visibilidad</ThemedText>
                <View style={s.dropdownContainer}>
                  <View style={s.filterSearchBox}>
                    <Ionicons name="eye-outline" size={14} color="#d4956a" />
                    <TextInput
                      placeholder="Seleccionar visibilidad..."
                      placeholderTextColor="#b8a99a"
                      value={textoBuscarEstado}
                      onFocus={() => setDropdownEstadoOpen(true)}
                      onChangeText={(text) => {
                        setTextoBuscarEstado(text);
                        setDropdownEstadoOpen(true);
                        setFiltroEstado('todos');
                      }}
                      style={s.filterSearchInput}
                    />
                    {textoBuscarEstado.length > 0 || filtroEstado !== 'todos' ? (
                      <Pressable onPress={() => {
                        setTextoBuscarEstado('');
                        setFiltroEstado('todos');
                        setDropdownEstadoOpen(false);
                      }}>
                        <Ionicons name="close-circle" size={16} color="#b8a99a" />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setDropdownEstadoOpen(!dropdownEstadoOpen)}>
                        <Ionicons name={dropdownEstadoOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                      </Pressable>
                    )}
                  </View>

                  {dropdownEstadoOpen && (
                    <View style={s.dropdownList}>
                      <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 120 }} keyboardShouldPersistTaps="handled">
                        <Pressable
                          style={[s.dropdownItem, filtroEstado === 'todos' && s.dropdownItemActive]}
                          onPress={() => {
                            setFiltroEstado('todos');
                            setTextoBuscarEstado('');
                            setDropdownEstadoOpen(false);
                          }}
                        >
                          <ThemedText style={[s.dropdownItemText, filtroEstado === 'todos' && s.dropdownItemTextActive]}>
                            📋 Todos los comentarios
                          </ThemedText>
                        </Pressable>
                        {[
                          { key: 'visible', label: '🟢 Visibles / Activos' },
                          { key: 'no_visible', label: '🔴 Ocultos / Desactivados' }
                        ]
                          .filter(item => item.label.toLowerCase().includes(textoBuscarEstado.toLowerCase()))
                          .map((item) => {
                            const isSelected = filtroEstado === item.key;
                            return (
                              <Pressable
                                key={item.key}
                                style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                                onPress={() => {
                                  setFiltroEstado(item.key as any);
                                  setTextoBuscarEstado(item.label);
                                  setDropdownEstadoOpen(false);
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

              {/* Fila: Cliente */}
              <View style={s.filterGroup}>
                <ThemedText style={s.filterLabel}>Filtrar por Cliente</ThemedText>
                <View style={s.dropdownContainer}>
                  <View style={s.filterSearchBox}>
                    <Ionicons name="person-outline" size={14} color="#d4956a" />
                    <TextInput
                      placeholder="Buscar y seleccionar cliente..."
                      placeholderTextColor="#b8a99a"
                      value={textoBuscarUsuario}
                      onFocus={() => setDropdownOpen(true)}
                      onChangeText={(text) => {
                        setTextoBuscarUsuario(text);
                        setDropdownOpen(true);
                        setFiltroCliente('all');
                      }}
                      style={s.filterSearchInput}
                    />
                    {textoBuscarUsuario.length > 0 || filtroCliente !== 'all' ? (
                      <Pressable onPress={() => {
                        setTextoBuscarUsuario('');
                        setFiltroCliente('all');
                        setDropdownOpen(false);
                      }}>
                        <Ionicons name="close-circle" size={16} color="#b8a99a" />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setDropdownOpen(!dropdownOpen)}>
                        <Ionicons name={dropdownOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                      </Pressable>
                    )}
                  </View>

                  {dropdownOpen && (
                    <View style={s.dropdownList}>
                      <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                        <Pressable
                          style={[s.dropdownItem, filtroCliente === 'all' && s.dropdownItemActive]}
                          onPress={() => {
                            setFiltroCliente('all');
                            setTextoBuscarUsuario('');
                            setDropdownOpen(false);
                          }}
                        >
                          <ThemedText style={[s.dropdownItemText, filtroCliente === 'all' && s.dropdownItemTextActive]}>
                            👤 Todos los clientes
                          </ThemedText>
                        </Pressable>

                        {usuarios
                          .filter((user) => {
                            const fullName = `${user.nombre} ${user.email}`.toLowerCase();
                            return fullName.includes(textoBuscarUsuario.toLowerCase());
                          })
                          .map((user) => {
                            const isSelected = filtroCliente === String(user.id);
                            return (
                              <Pressable
                                key={user.id}
                                style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                                onPress={() => {
                                  setFiltroCliente(String(user.id));
                                  setTextoBuscarUsuario(user.nombre);
                                  setDropdownOpen(false);
                                }}
                              >
                                <View style={{ gap: 2 }}>
                                  <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                                    👤 {user.nombre}
                                  </ThemedText>
                                  <ThemedText style={{ fontSize: 11, color: '#9e8879' }}>
                                    {user.email}
                                  </ThemedText>
                                </View>
                              </Pressable>
                            );
                          })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Fila: Producto */}
              <View style={s.filterGroup}>
                <ThemedText style={s.filterLabel}>Filtrar por Producto Comentado</ThemedText>
                <View style={s.dropdownContainer}>
                  <View style={s.filterSearchBox}>
                    <Ionicons name="cube-outline" size={14} color="#d4956a" />
                    <TextInput
                      placeholder="Buscar y seleccionar producto..."
                      placeholderTextColor="#b8a99a"
                      value={textoBuscarProducto}
                      onFocus={() => setDropdownProductoOpen(true)}
                      onChangeText={(text) => {
                        setTextoBuscarProducto(text);
                        setDropdownProductoOpen(true);
                        setFiltroProducto('all');
                      }}
                      style={s.filterSearchInput}
                    />
                    {textoBuscarProducto.length > 0 || filtroProducto !== 'all' ? (
                      <Pressable onPress={() => {
                        setTextoBuscarProducto('');
                        setFiltroProducto('all');
                        setDropdownProductoOpen(false);
                      }}>
                        <Ionicons name="close-circle" size={16} color="#b8a99a" />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setDropdownProductoOpen(!dropdownProductoOpen)}>
                        <Ionicons name={dropdownProductoOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                      </Pressable>
                    )}
                  </View>

                  {dropdownProductoOpen && (
                    <View style={s.dropdownList}>
                      <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                        <Pressable
                          style={[s.dropdownItem, filtroProducto === 'all' && s.dropdownItemActive]}
                          onPress={() => {
                            setFiltroProducto('all');
                            setTextoBuscarProducto('');
                            setDropdownProductoOpen(false);
                          }}
                        >
                          <ThemedText style={[s.dropdownItemText, filtroProducto === 'all' && s.dropdownItemTextActive]}>
                            📦 Todos los productos
                          </ThemedText>
                        </Pressable>

                        {productosComentados
                          .filter((prod) => {
                            return prod.nombre.toLowerCase().includes(textoBuscarProducto.toLowerCase());
                          })
                          .map((prod) => {
                            const isSelected = filtroProducto === String(prod.id);
                            return (
                              <Pressable
                                key={prod.id}
                                style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                                onPress={() => {
                                  setFiltroProducto(String(prod.id));
                                  setTextoBuscarProducto(prod.nombre);
                                  setDropdownProductoOpen(false);
                                }}
                              >
                                <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                                  📦 {prod.nombre}
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Fila: Calificación */}
              <View style={s.filterGroup}>
                <ThemedText style={s.filterLabel}>Filtrar por Calificación</ThemedText>
                <View style={s.dropdownContainer}>
                  <View style={s.filterSearchBox}>
                    <Ionicons name="star-outline" size={14} color="#d4956a" />
                    <TextInput
                      placeholder="Seleccionar calificación..."
                      placeholderTextColor="#b8a99a"
                      value={textoBuscarCalificacion}
                      onFocus={() => setDropdownCalificacionOpen(true)}
                      onChangeText={(text) => {
                        setTextoBuscarCalificacion(text);
                        setDropdownCalificacionOpen(true);
                        setFiltroCalificacion('all');
                      }}
                      style={s.filterSearchInput}
                    />
                    {textoBuscarCalificacion.length > 0 || filtroCalificacion !== 'all' ? (
                      <Pressable onPress={() => {
                        setTextoBuscarCalificacion('');
                        setFiltroCalificacion('all');
                        setDropdownCalificacionOpen(false);
                      }}>
                        <Ionicons name="close-circle" size={16} color="#b8a99a" />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setDropdownCalificacionOpen(!dropdownCalificacionOpen)}>
                        <Ionicons name={dropdownCalificacionOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#b8a99a" />
                      </Pressable>
                    )}
                  </View>

                  {dropdownCalificacionOpen && (
                    <View style={s.dropdownList}>
                      <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                        <Pressable
                          style={[s.dropdownItem, filtroCalificacion === 'all' && s.dropdownItemActive]}
                          onPress={() => {
                            setFiltroCalificacion('all');
                            setTextoBuscarCalificacion('');
                            setDropdownCalificacionOpen(false);
                          }}
                        >
                          <ThemedText style={[s.dropdownItemText, filtroCalificacion === 'all' && s.dropdownItemTextActive]}>
                            ⭐ Todas las calificaciones
                          </ThemedText>
                        </Pressable>
                        {[
                          { key: '5', label: '⭐ 5 Estrellas' },
                          { key: '4', label: '⭐ 4 Estrellas' },
                          { key: '3', label: '⭐ 3 Estrellas' },
                          { key: '2', label: '⭐ 2 Estrellas' },
                          { key: '1', label: '⭐ 1 Estrella' }
                        ]
                          .filter(item => item.label.toLowerCase().includes(textoBuscarCalificacion.toLowerCase()))
                          .map((item) => {
                            const isSelected = filtroCalificacion === item.key;
                            return (
                              <Pressable
                                key={item.key}
                                style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                                onPress={() => {
                                  setFiltroCalificacion(item.key);
                                  setTextoBuscarCalificacion(item.label);
                                  setDropdownCalificacionOpen(false);
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
                      placeholder="Seleccionar orden..."
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
                      <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                        {[
                          { key: 'reciente', label: '📅 Más recientes primero' },
                          { key: 'antiguo', label: '📅 Más antiguos (Antigüedad)' },
                          { key: 'calificacion_desc', label: '⭐ Mayor calificación' },
                          { key: 'calificacion_asc', label: '⭐ Menor calificación' }
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

              {/* Botón de limpiar filtros */}
              {(busqueda !== '' || filtroEstado !== 'todos' || filtroCalificacion !== 'all' || filtroCliente !== 'all' || filtroProducto !== 'all' || ordenarPor !== 'reciente') && (
                <Pressable
                  style={s.clearFiltersBtn}
                  onPress={() => {
                    setBusqueda('');
                    setFiltroEstado('todos');
                    setFiltroCalificacion('all');
                    setFiltroCliente('all');
                    setFiltroProducto('all');
                    setOrdenarPor('reciente');
                    setTextoBuscarEstado('');
                    setTextoBuscarCalificacion('');
                    setTextoBuscarUsuario('');
                    setTextoBuscarProducto('');
                    setTextoBuscarOrden('');
                    setDropdownOpen(false);
                    setDropdownEstadoOpen(false);
                    setDropdownCalificacionOpen(false);
                    setDropdownProductoOpen(false);
                    setDropdownOrdenOpen(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color="#e07070" style={{ marginRight: 6 }} />
                  <ThemedText style={s.clearFiltersText}>Limpiar todos los filtros</ThemedText>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Listado */}
      {loading && pagina === 1 ? (
        <View style={s.loaderWrap}>
          <ActivityIndicator size="large" color="#d4956a" />
          <ThemedText style={s.loaderText}>Buscando comentarios...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={comentarios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchComentarios(true, 1)}
              colors={['#d4956a']}
              tintColor="#d4956a"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="chatbox-ellipses-outline" size={60} color="#e8ddd5" />
              <ThemedText style={s.emptyTitle}>No hay comentarios</ThemedText>
              <ThemedText style={s.emptySub}>Prueba cambiando la búsqueda o los filtros.</ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const isVisible = item.estado === 'visible';
            return (
              <View style={[s.commentCard, !isVisible && s.commentCardInactive]}>
                <View style={s.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={s.authorText}>{item.autor}</ThemedText>
                    <ThemedText style={s.emailText}>{item.email}</ThemedText>
                  </View>
                  <View style={s.statusTag}>
                    <ThemedText style={[s.statusTagText, isVisible ? s.statusVisible : s.statusHidden]}>
                      {isVisible ? 'Visible' : 'Oculto'}
                    </ThemedText>
                  </View>
                </View>

                {/* Nombre de Producto clicable para redirigir a detalle en Productos Admin */}
                <Pressable
                  style={s.productInfo}
                  onPress={() => router.push({ pathname: '/admin/productos', params: { productoId: String(item.productoId) } })}
                >
                  <Ionicons name="cube-outline" size={14} color="#d4956a" style={{ marginRight: 4 }} />
                  <ThemedText style={[s.productName, { color: '#d4956a', textDecorationLine: 'underline' }]} numberOfLines={1}>
                    {item.producto}
                  </ThemedText>
                </Pressable>

                <View style={s.ratingRow}>
                  {renderStars(item.calificacion)}
                  <ThemedText style={s.dateText}>
                    {new Date(item.fecha).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </View>

                <ThemedText style={s.commentText}>{item.comentario}</ThemedText>

                <View style={s.cardFooter}>
                  <View style={s.toggleLabelWrap}>
                    <Ionicons
                      name={isVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={16}
                      color={isVisible ? '#52b788' : '#e07070'}
                      style={{ marginRight: 6 }}
                    />
                    <ThemedText style={s.toggleLabel}>
                      {isVisible ? 'Comentario visible' : 'Comentario desactivado/oculto'}
                    </ThemedText>
                  </View>
                  <Switch
                    value={isVisible}
                    onValueChange={() => handleToggleEstado(item.id)}
                    trackColor={{ false: '#f0ede8', true: '#fde7d9' }}
                    thumbColor={isVisible ? '#d4956a' : '#b8a99a'}
                    ios_backgroundColor="#f0ede8"
                  />
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Toast Alert */}
      <AdminToast message={toast.message} type={toast.type} visible={toast.visible} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f4' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#fdf8f4' },
  restrictedTitle: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
  restrictedSub: { color: '#9e8879', fontSize: 14, textAlign: 'center' },
  backBtn: { marginTop: 16, backgroundColor: '#d4956a', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e8ddd5',
    gap: 12,
  },
  backIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf8f4',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3d2c1e' },
  headerSub: { fontSize: 12, color: '#9e8879' },

  // Filtros Panel
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  filterToggleBtn: { width: '100%', height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5', alignItems: 'center', justifyContent: 'center' },
  filterToggleBtnActive: { backgroundColor: '#d4956a', borderColor: '#d4956a' },
  filterPanelContainer: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#e8ddd5', padding: 14, marginHorizontal: 16, marginBottom: 12, gap: 10, shadowColor: '#c4a882', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#b8a99a', textTransform: 'uppercase', letterSpacing: 0.6 },
  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f0ede8', marginTop: 4 },
  clearFiltersText: { fontSize: 12, fontWeight: '700', color: '#e07070' },
  filterSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf8f4', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 10, height: 38, gap: 6, marginBottom: 4 },
  filterSearchInput: { flex: 1, fontSize: 13, color: '#3d2c1e', padding: 0 },
  dropdownContainer: { position: 'relative', zIndex: 10, width: '100%' },
  dropdownList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', marginTop: 4, shadowColor: '#c4a882', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fdf8f4' },
  dropdownItemActive: { backgroundColor: '#fff3e6' },
  dropdownItemText: { fontSize: 13, color: '#3d2c1e', fontWeight: '500' },
  dropdownItemTextActive: { color: '#d4956a', fontWeight: '700' },

  // List
  listContent: { padding: 16, paddingTop: 4, paddingBottom: 40, gap: 12 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 40 },
  loaderText: { fontSize: 13, color: '#9e8879' },
  
  // Card
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  commentCardInactive: {
    backgroundColor: '#faf8f5',
    borderColor: '#f0ede8',
    opacity: 0.8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  authorText: { fontSize: 14, fontWeight: '800', color: '#3d2c1e' },
  emailText: { fontSize: 11, color: '#9e8879', marginTop: 1 },
  statusTag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusTagText: { fontSize: 10, fontWeight: '700' },
  statusVisible: { color: '#52b788' },
  statusHidden: { color: '#e07070' },

  productInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf8f4', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 8 },
  productName: { fontSize: 12, fontWeight: '700', color: '#7c6455', flex: 1 },
  
  ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  starsContainer: { flexDirection: 'row' },
  dateText: { fontSize: 11, color: '#9e8879' },
  
  commentText: { fontSize: 13, lineHeight: 18, color: '#5c4d40', marginBottom: 12 },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#f5efe9',
    paddingTop: 10,
  },
  toggleLabelWrap: { flexDirection: 'row', alignItems: 'center' },
  toggleLabel: { fontSize: 12, fontWeight: '600', color: '#7c6455' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#7c6455', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#9e8879', textAlign: 'center', paddingHorizontal: 20 },
});
