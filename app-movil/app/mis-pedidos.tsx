import { useEffect, useState, useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import pedidoService from '../src/services/pedidoService';

type Pedido = {
  id?: string;
  _id?: string;
  estado?: string;
  total?: number;
  createdAt?: string;
  detalles?: unknown[];
  DetallesPedido?: unknown[];
};

const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const routerPush    = (path: string) => (router as unknown as { push:    (p: string) => void }).push(path);

function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDate(value: unknown) {
  if (!value) return '-';
  return new Date(value as string).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapEstadoLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    pendiente : 'Pendiente',
    confirmado: 'Confirmado',
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return labels[value || ''] || value || 'Pendiente';
}

const getEstadoStyle = (estado: string) => {
  const est = (estado || 'pendiente').toLowerCase();
  switch(est) {
    case 'pendiente':
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    case 'confirmado':
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    case 'en_proceso':
    case 'procesando':
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    case 'enviado':
      return { bg: '#fdf4ff', text: '#c084fc', border: '#f5d0fe' };
    case 'entregado':
      return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
    case 'cancelado':
      return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' };
    default:
      return { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' };
  }
};

export default function MisPedidosScreen() {
  const { isAuthenticated } = useAuth();
  const [pedidos, setPedidos]           = useState<Pedido[]>([]);
  const [loading, setLoading]           = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Buscador y Toggle de Filtros
  const [busqueda, setBusqueda] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

  // Estados de Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [filtroTiempo, setFiltroTiempo] = useState<string>('all');
  const [filtroCantidad, setFiltroCantidad] = useState<string>('all');

  // Estados de los dropdowns (estilo index.tsx)
  const [dropdownEstadoOpen, setDropdownEstadoOpen] = useState(false);
  const [textoBuscarEstado, setTextoBuscarEstado] = useState('');
  const [dropdownTiempoOpen, setDropdownTiempoOpen] = useState(false);
  const [textoBuscarTiempo, setTextoBuscarTiempo] = useState('');
  const [dropdownCantidadOpen, setDropdownCantidadOpen] = useState(false);
  const [textoBuscarCantidad, setTextoBuscarCantidad] = useState('');

  const loadPedidos = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await pedidoService.getMisPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  useFocusEffect(
    useCallback(() => {
      loadPedidos();
    }, [loadPedidos])
  );

  // Funciones auxiliares para filtrado local
  const filterByDate = (createdAtStr: string | undefined, range: string) => {
    if (range === 'all') return true;
    if (!createdAtStr) return false;
    const createdAt = new Date(createdAtStr).getTime();
    const now = new Date().getTime();
    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (range === 'week') return diffDays <= 7;
    if (range === 'month') return diffDays <= 30;
    if (range === '3months') return diffDays <= 90;
    return true;
  };

  const filterByQuantity = (cantidad: number, range: string) => {
    if (range === 'all') return true;
    if (range === '1-3') return cantidad >= 1 && cantidad <= 3;
    if (range === '4-9') return cantidad >= 4 && cantidad <= 9;
    if (range === '10+') return cantidad >= 10;
    return true;
  };

  const filterByEstado = (estado: string | undefined, selectedState: string) => {
    if (selectedState === 'all') return true;
    if (!estado) return false;
    const estNormal = estado.toLowerCase();
    const selNormal = selectedState.toLowerCase();
    if (selNormal === 'en_proceso') {
      return estNormal === 'en_proceso' || estNormal === 'procesando';
    }
    return estNormal === selNormal;
  };

  const pedidosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return pedidos.filter((pedido) => {
      const idStr = String(pedido.id || pedido._id || '').toLowerCase();
      const coincideTexto = termino === '' || idStr.includes(termino);

      const totalCant = (pedido.detalles || pedido.DetallesPedido || []).reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0) || pedido.detalles?.length || pedido.DetallesPedido?.length || 0;
      const matchEstado = filterByEstado(pedido.estado, filtroEstado);
      const matchTiempo = filterByDate(pedido.createdAt, filtroTiempo);
      const matchCantidad = filterByQuantity(totalCant, filtroCantidad);
      return coincideTexto && matchEstado && matchTiempo && matchCantidad;
    });
  }, [pedidos, busqueda, filtroEstado, filtroTiempo, filtroCantidad]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={64} color="#d4956a" />
          <ThemedText style={styles.title}>Debes iniciar sesión</ThemedText>
          <Text style={styles.subtitle}>Inicia sesión para ver tu historial de pedidos.</Text>
          <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
            <Text style={styles.primaryButtonText}>Ir a Cuenta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d4956a" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>


        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {pedidos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#d4956a" />
            <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
            <Text style={styles.subtitle}>Cuando realices una compra, tu historial aparecerá aquí.</Text>
            <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
              <Text style={styles.primaryButtonText}>Ir a Tienda</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── BUSCADOR ────────────────────────────────────────────────────── */}
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>Busca pedidos o aplica filtros avanzados</Text>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#9e8879" />
                <TextInput
                  placeholder="Buscar pedidos por ID..."
                  value={busqueda}
                  onChangeText={setBusqueda}
                  style={styles.searchInput}
                  placeholderTextColor="#9ca3af"
                />
                {busqueda.length > 0 && (
                  <Pressable onPress={() => setBusqueda('')}>
                    <Ionicons name="close-circle" size={18} color="#9e8879" />
                  </Pressable>
                )}
              </View>
              <Pressable
                onPress={() => setShowFiltros(!showFiltros)}
                style={[styles.filterToggleBtn, showFiltros && styles.filterToggleBtnActive]}
              >
                <Ionicons name="filter-outline" size={18} color={showFiltros ? '#ffffff' : '#d4956a'} />
              </Pressable>
            </View>

            {/* Panel de Filtros Desplegable */}
            {showFiltros && (
              <View style={styles.filterPanel}>
                {/* Filtro: Estado */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Estado</Text>
                  <View style={styles.dropdownContainer}>
                    <View style={styles.filterSearchBox}>
                      <Ionicons name="flag-outline" size={14} color="#d4956a" />
                      <TextInput
                        placeholder="Buscar y seleccionar estado..."
                        placeholderTextColor="#9ca3af"
                        value={textoBuscarEstado}
                        onFocus={() => {
                          setDropdownEstadoOpen(true);
                          setDropdownTiempoOpen(false);
                          setDropdownCantidadOpen(false);
                        }}
                        onChangeText={(text) => {
                          setTextoBuscarEstado(text);
                          setDropdownEstadoOpen(true);
                          setFiltroEstado('all');
                        }}
                        style={styles.filterSearchInput}
                      />
                      {textoBuscarEstado.length > 0 || filtroEstado !== 'all' ? (
                        <Pressable onPress={() => {
                          setFiltroEstado('all');
                          setTextoBuscarEstado('');
                          setDropdownEstadoOpen(false);
                        }}>
                          <Ionicons name="close-circle" size={16} color="#9e8879" />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => setDropdownEstadoOpen(!dropdownEstadoOpen)}>
                          <Ionicons name={dropdownEstadoOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
                        </Pressable>
                      )}
                    </View>

                    {dropdownEstadoOpen && (
                      <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                          <Pressable
                            style={[styles.dropdownItem, filtroEstado === 'all' && styles.dropdownItemActive]}
                            onPress={() => {
                              setFiltroEstado('all');
                              setTextoBuscarEstado('');
                              setDropdownEstadoOpen(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, filtroEstado === 'all' && styles.dropdownItemTextActive]}>
                              Todo
                            </Text>
                          </Pressable>
                          {[
                            { key: 'pendiente', label: 'Pendiente' },
                            { key: 'en_proceso', label: 'En Proceso' },
                            { key: 'enviado', label: 'Enviado' },
                            { key: 'entregado', label: 'Entregado' },
                            { key: 'cancelado', label: 'Cancelado' },
                          ]
                            .filter(opt => opt.label.toLowerCase().includes(textoBuscarEstado.toLowerCase()))
                            .map((opt) => {
                              const isSelected = filtroEstado === opt.key;
                              return (
                                <Pressable
                                  key={opt.key}
                                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                  onPress={() => {
                                    setFiltroEstado(opt.key);
                                    setTextoBuscarEstado(opt.label);
                                    setDropdownEstadoOpen(false);
                                  }}
                                >
                                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                    {opt.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Filtro: Tiempo */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Tiempo</Text>
                  <View style={styles.dropdownContainer}>
                    <View style={styles.filterSearchBox}>
                      <Ionicons name="calendar-outline" size={14} color="#d4956a" />
                      <TextInput
                        placeholder="Buscar y seleccionar tiempo..."
                        placeholderTextColor="#9ca3af"
                        value={textoBuscarTiempo}
                        onFocus={() => {
                          setDropdownTiempoOpen(true);
                          setDropdownEstadoOpen(false);
                          setDropdownCantidadOpen(false);
                        }}
                        onChangeText={(text) => {
                          setTextoBuscarTiempo(text);
                          setDropdownTiempoOpen(true);
                          setFiltroTiempo('all');
                        }}
                        style={styles.filterSearchInput}
                      />
                      {textoBuscarTiempo.length > 0 || filtroTiempo !== 'all' ? (
                        <Pressable onPress={() => {
                          setFiltroTiempo('all');
                          setTextoBuscarTiempo('');
                          setDropdownTiempoOpen(false);
                        }}>
                          <Ionicons name="close-circle" size={16} color="#9e8879" />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => setDropdownTiempoOpen(!dropdownTiempoOpen)}>
                          <Ionicons name={dropdownTiempoOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
                        </Pressable>
                      )}
                    </View>

                    {dropdownTiempoOpen && (
                      <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                          <Pressable
                            style={[styles.dropdownItem, filtroTiempo === 'all' && styles.dropdownItemActive]}
                            onPress={() => {
                              setFiltroTiempo('all');
                              setTextoBuscarTiempo('');
                              setDropdownTiempoOpen(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, filtroTiempo === 'all' && styles.dropdownItemTextActive]}>
                              Todo
                            </Text>
                          </Pressable>
                          {[
                            { key: 'week', label: 'Últimos 7 días' },
                            { key: 'month', label: 'Últimos 30 días' },
                            { key: '3months', label: 'Últimos 90 días' },
                          ]
                            .filter(opt => opt.label.toLowerCase().includes(textoBuscarTiempo.toLowerCase()))
                            .map((opt) => {
                              const isSelected = filtroTiempo === opt.key;
                              return (
                                <Pressable
                                  key={opt.key}
                                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                  onPress={() => {
                                    setFiltroTiempo(opt.key);
                                    setTextoBuscarTiempo(opt.label);
                                    setDropdownTiempoOpen(false);
                                  }}
                                >
                                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                    {opt.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Filtro: Cantidad */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Cantidad de productos</Text>
                  <View style={styles.dropdownContainer}>
                    <View style={styles.filterSearchBox}>
                      <Ionicons name="cube-outline" size={14} color="#d4956a" />
                      <TextInput
                        placeholder="Buscar y seleccionar cantidad..."
                        placeholderTextColor="#9ca3af"
                        value={textoBuscarCantidad}
                        onFocus={() => {
                          setDropdownCantidadOpen(true);
                          setDropdownEstadoOpen(false);
                          setDropdownTiempoOpen(false);
                        }}
                        onChangeText={(text) => {
                          setTextoBuscarCantidad(text);
                          setDropdownCantidadOpen(true);
                          setFiltroCantidad('all');
                        }}
                        style={styles.filterSearchInput}
                      />
                      {textoBuscarCantidad.length > 0 || filtroCantidad !== 'all' ? (
                        <Pressable onPress={() => {
                          setFiltroCantidad('all');
                          setTextoBuscarCantidad('');
                          setDropdownCantidadOpen(false);
                        }}>
                          <Ionicons name="close-circle" size={16} color="#9e8879" />
                        </Pressable>
                      ) : (
                        <Pressable onPress={() => setDropdownCantidadOpen(!dropdownCantidadOpen)}>
                          <Ionicons name={dropdownCantidadOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
                        </Pressable>
                      )}
                    </View>

                    {dropdownCantidadOpen && (
                      <View style={styles.dropdownList}>
                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                          <Pressable
                            style={[styles.dropdownItem, filtroCantidad === 'all' && styles.dropdownItemActive]}
                            onPress={() => {
                              setFiltroCantidad('all');
                              setTextoBuscarCantidad('');
                              setDropdownCantidadOpen(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, filtroCantidad === 'all' && styles.dropdownItemTextActive]}>
                              Todo
                            </Text>
                          </Pressable>
                          {[
                            { key: '1-3', label: 'De 1 a 3 unidades' },
                            { key: '4-9', label: 'De 4 a 9 unidades' },
                            { key: '10+', label: '10 o más unidades' },
                          ]
                            .filter(opt => opt.label.toLowerCase().includes(textoBuscarCantidad.toLowerCase()))
                            .map((opt) => {
                              const isSelected = filtroCantidad === opt.key;
                              return (
                                <Pressable
                                  key={opt.key}
                                  style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                  onPress={() => {
                                    setFiltroCantidad(opt.key);
                                    setTextoBuscarCantidad(opt.label);
                                    setDropdownCantidadOpen(false);
                                  }}
                                >
                                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                    {opt.label}
                                  </Text>
                                </Pressable>
                              );
                            })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* Limpiar Filtros */}
                {(filtroEstado !== 'all' || filtroTiempo !== 'all' || filtroCantidad !== 'all' || textoBuscarEstado !== '' || textoBuscarTiempo !== '' || textoBuscarCantidad !== '') && (
                  <Pressable
                    style={styles.clearFiltersBtn}
                    onPress={() => {
                      setFiltroEstado('all');
                      setFiltroTiempo('all');
                      setFiltroCantidad('all');
                      setTextoBuscarEstado('');
                      setTextoBuscarTiempo('');
                      setTextoBuscarCantidad('');
                      setDropdownEstadoOpen(false);
                      setDropdownTiempoOpen(false);
                      setDropdownCantidadOpen(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={14} color="#e07070" />
                    <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                  </Pressable>
                )}
              </View>
            )}

            {pedidosFiltrados.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="funnel-outline" size={48} color="#9e8879" />
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.subtitle}>No hay pedidos que coincidan con los filtros o búsqueda seleccionados.</Text>
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: '#d4956a' }]}
                  onPress={() => {
                    setBusqueda('');
                    setFiltroEstado('all');
                    setTextoBuscarEstado('');
                    setFiltroTiempo('all');
                    setTextoBuscarTiempo('');
                    setFiltroCantidad('all');
                    setTextoBuscarCantidad('');
                    setDropdownEstadoOpen(false);
                    setDropdownTiempoOpen(false);
                    setDropdownCantidadOpen(false);
                  }}
                >
                  <Text style={styles.primaryButtonText}>Limpiar Filtros y Búsqueda</Text>
                </Pressable>
              </View>
            ) : (
              pedidosFiltrados.map((pedido) => {
                const estStyle = getEstadoStyle(pedido.estado || '');
                const totalCant = (pedido.detalles || pedido.DetallesPedido || []).reduce((acc: number, item: any) => acc + (item.cantidad || 0), 0) || pedido.detalles?.length || pedido.DetallesPedido?.length || 0;
                return (
                  <Pressable
                    key={pedido.id || pedido._id}
                    style={styles.card}
                    onPress={() => routerPush(`/pedidos/${pedido.id || pedido._id}`)}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={styles.cardTitle}>Pedido #{pedido.id || pedido._id}</Text>
                      <View style={[styles.badge, { backgroundColor: estStyle.bg, borderColor: estStyle.border }]}>
                        <Text style={[styles.badgeText, { color: estStyle.text }]}>
                          {mapEstadoLabel(pedido.estado)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.metaDate}>
                      <Ionicons name="calendar-outline" size={12} color="#9e8879" style={{ marginRight: 4 }} /> {formatDate(pedido.createdAt)}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.rowBetween}>
                      <Text style={styles.metaItems}>{totalCant} producto(s)</Text>
                      <Text style={styles.totalText}>{formatCOP(pedido.total)}</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdf8f4' },
  container: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#3d2c1e', marginTop: 12 },
  subtitle: { color: '#9e8879', textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: 20 },
  loadingText: { color: '#9e8879', fontSize: 14, fontWeight: '600' },
  error: { color: '#e07070', fontWeight: '600', textAlign: 'center', marginVertical: 8 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8ddd5',
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#3d2c1e' },

  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#e8ddd5', 
    padding: 32, 
    gap: 12, 
    marginTop: 20,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#3d2c1e' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 16,
    gap: 10,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#3d2c1e' },
  metaDate: { fontSize: 12, color: '#9e8879', fontWeight: '500', flexDirection: 'row', alignItems: 'center' },
  metaItems: { fontSize: 13, color: '#9e8879', fontWeight: '600' },
  totalText: { fontSize: 16, fontWeight: '800', color: '#192847' },
  divider: { height: 1, backgroundColor: '#f3ece6' },

  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192847',
    marginTop: 12,
    height: 48,
    shadowColor: '#192847',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  helperRow: {
    marginBottom: 8,
    marginTop: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#9e8879',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3d2c1e',
    padding: 0,
  },
  filterToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8ddd5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterToggleBtnActive: {
    backgroundColor: '#d4956a',
    borderColor: '#d4956a',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 16,
    gap: 14,
    marginBottom: 16,
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fce8e6',
    backgroundColor: '#fff5f5',
    marginTop: 4,
  },
  clearFiltersText: {
    color: '#e07070',
    fontSize: 13,
    fontWeight: '700',
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: '#9e8879',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownContainer: { position: 'relative', zIndex: 10, width: '100%' },
  filterSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 10, height: 38, gap: 6, marginBottom: 4 },
  filterSearchInput: { flex: 1, fontSize: 13, color: '#3d2c1e', padding: 0 },
  dropdownList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', marginTop: 4, shadowColor: '#c4a882', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fdf8f4' },
  dropdownItemActive: { backgroundColor: '#fff3e6' },
  dropdownItemText: { fontSize: 13, color: '#3d2c1e', fontWeight: '500' },
  dropdownItemTextActive: { color: '#d4956a', fontWeight: '700' },
});
