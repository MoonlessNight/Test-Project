/**
 * Pantalla de gestión de pedidos — panel de administración.
 * Diseño pastel cálido • Toast • Modal de detalle al tocar una tarjeta
 */

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import AdminToast from '../../components/admin-toast';
import apiClient from '../../src/api/apiClient';

type Producto = {
  id: string | number;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen?: string;
};

type DetallePedido = {
  id: number;
  cantidad: number;
  precioUnitario: string | number;
  subtotal: string | number;
  producto?: Producto;
};

type Pedido = {
  id: string;
  estado?: string;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  direccionEnvio?: string;
  telefono?: string;
  notas?: string;
  usuario?: { nombre?: string; apellido?: string; email?: string };
  detalles?: DetallePedido[];
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Barcode = () => {
  const bars = [2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 40, marginVertical: 12 }}>
      {bars.map((w, idx) => (
        <View key={idx} style={{ width: w, height: '100%', backgroundColor: '#3d2c1e', marginRight: idx % 3 === 0 ? 1 : 2 }} />
      ))}
    </View>
  );
};

// Colores por estado del pedido
const ESTADO_STYLE: Record<string, { bg: string; text: string; emoji: string }> = {
  pendiente:  { bg: '#fff3cd', text: '#856404', emoji: '⏳' },
  procesando: { bg: '#d1ecf1', text: '#0c5460', emoji: '⚙️' },
  enviado:    { bg: '#cce5ff', text: '#004085', emoji: '🚚' },
  entregado:  { bg: '#d8f3dc', text: '#2d6a4f', emoji: '✅' },
  cancelado:  { bg: '#fde8e8', text: '#c0392b', emoji: '❌' },
};
const getEstado = (e?: string) => ESTADO_STYLE[e?.toLowerCase() || ''] || { bg: '#f0ede8', text: '#7c6455', emoji: '📋' };

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

export default function AdminPedidoScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [selected, setSelected] = useState<Pedido | null>(null);

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detallePedido, setDetallePedido] = useState<Pedido | null>(null);
  const [facturaVisible, setFacturaVisible] = useState(false);

  // Filtros adicionales
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('all');
  const [ordenarPor, setOrdenarPor] = useState<'reciente' | 'antiguo' | 'totalDesc' | 'totalAsc'>('reciente');

  const { toast, showToast } = useToast();

  useEffect(() => {
    if (selected?.id) {
      const fetchDetalles = async () => {
        setLoadingDetails(true);
        try {
          const res = await apiClient.get(`/admin/pedidos/${selected.id}`);
          if (res.data?.success && res.data?.data?.pedido) {
            setDetallePedido(res.data.data.pedido);
          } else {
            showToast('No se pudieron obtener los detalles', 'error');
          }
        } catch (error: any) {
          showToast(error.message || 'Error al obtener detalles', 'error');
        } finally {
          setLoadingDetails(false);
        }
      };
      fetchDetalles();
    } else {
      setDetallePedido(null);
    }
  }, [selected]);

  const fetchPedidos = async (
    page = 1,
    search = '',
    isRefresh = false,
    estFilter = filtroEstado,
    sortVal = ordenarPor
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMessage('');
    try {
      const params: string[] = [];
      if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
      if (estFilter !== 'all') params.push(`estado=${estFilter}`);
      params.push(`pagina=${page}`);
      params.push('limite=10');
      const res = await apiClient.get(`/admin/pedidos?${params.join('&')}`);
      let data: Pedido[] = res.data?.data?.pedidos || [];

      // Ordenar en el cliente (timestamps y monto total)
      if (sortVal === 'antiguo') {
        data.sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      } else if (sortVal === 'totalDesc') {
        data.sort((a, b) => (b.total || 0) - (a.total || 0));
      } else if (sortVal === 'totalAsc') {
        data.sort((a, b) => (a.total || 0) - (b.total || 0));
      } else {
        // 'reciente'
        data.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      setPedidos(data);
      setPagina(page);
      setTotalPaginas(res.data?.data?.paginacion?.totalPaginas || 1);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar pedidos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPedidos(1, busqueda);
  }, [filtroEstado, ordenarPor]);

  const handleEstadoChange = async (pedido: Pedido, nuevoEstado: string) => {
    try {
      await apiClient.put(`/admin/pedidos/${pedido.id}/estado`, { estado: nuevoEstado });
      showToast(`Pedido #${pedido.id} → ${nuevoEstado}`, 'success');
      fetchPedidos(pagina, busqueda);
      setSelected(null);
    } catch {
      showToast('No se pudo actualizar el estado', 'error');
    }
  };

  const ESTADOS = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

  return (
    <View style={s.container}>
      <View style={s.header}>
        <ThemedText style={s.title}>📦 Pedidos</ThemedText>
        <ThemedText style={s.subtitle}>Seguimiento de todos los pedidos</ThemedText>
      </View>

      <View style={s.searchRow}>
        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={15} color="#b8a99a" />
          <TextInput
            placeholder="Buscar pedido..."
            placeholderTextColor="#b8a99a"
            value={busqueda}
            onChangeText={(t) => { setBusqueda(t); fetchPedidos(1, t); }}
            style={s.input}
          />
        </View>
        <Pressable
          style={[s.filterToggleBtn, showFiltros && s.filterToggleBtnActive]}
          onPress={() => setShowFiltros(v => !v)}
        >
          <Ionicons name="filter-outline" size={18} color={showFiltros ? '#fff' : '#d4956a'} />
        </Pressable>
      </View>

      {/* Panel de Filtros Desplegable */}
      {showFiltros && (
        <View style={s.filterPanel}>
          {/* Fila: Estado */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Estado del pedido</ThemedText>
            <View style={s.pillRow}>
              {([
                { key: 'all', label: 'Todos' },
                { key: 'pendiente', label: '⏳ Pendiente' },
                { key: 'procesando', label: '⚙️ Procesando' },
                { key: 'enviado', label: '🚚 Enviado' },
                { key: 'entregado', label: '✅ Entregado' },
                { key: 'cancelado', label: '❌ Cancelado' }
              ]).map((est) => (
                <Pressable
                  key={est.key}
                  style={[s.filterPill, filtroEstado === est.key && s.filterPillActive]}
                  onPress={() => setFiltroEstado(est.key)}
                >
                  <ThemedText style={[s.filterPillText, filtroEstado === est.key && s.filterPillTextActive]}>
                    {est.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fila: Ordenamiento */}
          <View style={s.filterGroup}>
            <ThemedText style={s.filterLabel}>Ordenar por</ThemedText>
            <View style={s.pillRow}>
              {([
                { key: 'reciente', label: 'Más nuevos' },
                { key: 'antiguo', label: 'Más antiguos' },
                { key: 'totalDesc', label: 'Total: Mayor a menor' },
                { key: 'totalAsc', label: 'Total: Menor a mayor' }
              ]).map((ord) => (
                <Pressable
                  key={ord.key}
                  style={[s.filterPill, ordenarPor === ord.key && s.filterPillActive]}
                  onPress={() => setOrdenarPor(ord.key as any)}
                >
                  <ThemedText style={[s.filterPillText, ordenarPor === ord.key && s.filterPillTextActive]}>
                    {ord.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Botón limpiar */}
          {(filtroEstado !== 'all' || ordenarPor !== 'reciente') && (
            <Pressable
              style={s.clearFiltersBtn}
              onPress={() => {
                setFiltroEstado('all');
                setOrdenarPor('reciente');
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
        data={pedidos}
        keyExtractor={(item) => String(item.id)}
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPedidos(1, busqueda, true)} colors={['#d4956a']} tintColor="#d4956a" />
        }
        renderItem={({ item }) => {
          const est = getEstado(item.estado);
          return (
            <Pressable style={s.card} onPress={() => setSelected(item)}>
              <View style={[s.estadoBadge, { backgroundColor: est.bg }]}>
                <ThemedText style={s.estadoEmoji}>{est.emoji}</ThemedText>
              </View>
              <View style={s.cardBody}>
                <ThemedText style={s.cardId}>Pedido #{String(item.id).slice(-8)}</ThemedText>
                <ThemedText style={s.cardCliente} numberOfLines={1}>
                  {item.usuario?.nombre} {item.usuario?.apellido}
                </ThemedText>
                <View style={s.row}>
                  <View style={[s.pill, { backgroundColor: est.bg }]}>
                    <ThemedText style={[s.pillText, { color: est.text }]}>{item.estado || 'desconocido'}</ThemedText>
                  </View>
                  <ThemedText style={s.cardTotal}>${Number(item.total || 0).toLocaleString('es-CO')}</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d0c4bb" />
            </Pressable>
          );
        }}
        ListEmptyComponent={!loading && !errorMessage ? (
          <View style={s.empty}>
            <ThemedText style={s.emptyIcon}>📦</ThemedText>
            <ThemedText style={s.emptyText}>No hay pedidos aún</ThemedText>
          </View>
        ) : null}
      />

      {/* Paginación */}
      <View style={s.pagination}>
        <Pressable style={[s.pageBtn, pagina <= 1 && s.pageBtnOff]} onPress={() => pagina > 1 && fetchPedidos(pagina - 1, busqueda)} disabled={pagina <= 1}>
          <Ionicons name="chevron-back" size={16} color={pagina <= 1 ? '#d0c4bb' : '#7c5c45'} />
        </Pressable>
        <ThemedText style={s.pageLabel}>Página {pagina} de {totalPaginas}</ThemedText>
        <Pressable style={[s.pageBtn, pagina >= totalPaginas && s.pageBtnOff]} onPress={() => pagina < totalPaginas && fetchPedidos(pagina + 1, busqueda)} disabled={pagina >= totalPaginas}>
          <Ionicons name="chevron-forward" size={16} color={pagina >= totalPaginas ? '#d0c4bb' : '#7c5c45'} />
        </Pressable>
      </View>

      {/* Modal detalle */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.modalBody}>
                  {/* Header del modal */}
                  <View style={s.modalHeader}>
                    <View style={[s.modalIconBig, { backgroundColor: getEstado(selected.estado).bg }]}>
                      <ThemedText style={{ fontSize: 36 }}>{getEstado(selected.estado).emoji}</ThemedText>
                    </View>
                    <ThemedText style={s.modalTitle}>Pedido #{String(selected.id).slice(-8)}</ThemedText>
                  </View>

                  {/* Info del cliente */}
                  <ThemedText style={s.sectionLabel}>Cliente</ThemedText>
                  <View style={s.infoCell}>
                    <ThemedText style={s.cellValue}>{selected.usuario?.nombre} {selected.usuario?.apellido}</ThemedText>
                    <ThemedText style={s.cellSub}>{selected.usuario?.email || '—'}</ThemedText>
                  </View>

                  {/* Info del pedido */}
                  <View style={s.grid}>
                    <View style={s.infoCell}>
                      <ThemedText style={s.cellLabel}>Total</ThemedText>
                      <ThemedText style={[s.cellValue, { color: '#c47a3a' }]}>${Number(selected.total || 0).toLocaleString('es-CO')}</ThemedText>
                    </View>
                    <View style={s.infoCell}>
                      <ThemedText style={s.cellLabel}>Estado actual</ThemedText>
                      <View style={[s.pill, { backgroundColor: getEstado(selected.estado).bg, alignSelf: 'flex-start', marginTop: 2 }]}>
                        <ThemedText style={[s.pillText, { color: getEstado(selected.estado).text }]}>{selected.estado}</ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Fechas del pedido */}
                  <ThemedText style={s.sectionLabel}>Fechas del pedido</ThemedText>
                  <View style={s.grid}>
                    <View style={s.infoCell}>
                      <ThemedText style={s.cellLabel}>Creado el</ThemedText>
                      <ThemedText style={s.cellValueTime}>{formatDate(selected.createdAt)}</ThemedText>
                    </View>
                    <View style={s.infoCell}>
                      <ThemedText style={s.cellLabel}>Último cambio</ThemedText>
                      <ThemedText style={s.cellValueTime}>
                        {detallePedido ? formatDate(detallePedido.updatedAt) : 'Cargando...'}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Productos en el Pedido */}
                  <ThemedText style={s.sectionLabel}>Productos</ThemedText>
                  {loadingDetails ? (
                    <View style={s.loadingWrap}>
                      <ActivityIndicator size="small" color="#d4956a" />
                      <ThemedText style={s.loadingText}>Cargando productos...</ThemedText>
                    </View>
                  ) : detallePedido?.detalles && detallePedido.detalles.length > 0 ? (
                    <View style={s.productsList}>
                      {detallePedido.detalles.map((det) => (
                        <View key={det.id} style={s.productItem}>
                          <View style={s.productInfo}>
                            <ThemedText style={s.productName}>{det.producto?.nombre || 'Producto desconocido'}</ThemedText>
                            <ThemedText style={s.productQty}>
                              {det.cantidad} x ${Number(det.precioUnitario).toLocaleString('es-CO')}
                            </ThemedText>
                          </View>
                          <ThemedText style={s.productSubtotal}>
                            ${Number(det.subtotal || 0).toLocaleString('es-CO')}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <ThemedText style={s.noProducts}>No hay detalles de productos disponibles</ThemedText>
                  )}

                  {/* Botón ver factura */}
                  {detallePedido && (
                    <Pressable style={s.invoiceBtn} onPress={() => setFacturaVisible(true)}>
                      <Ionicons name="receipt-outline" size={18} color="#fff" />
                      <ThemedText style={s.invoiceBtnText}>Ver Factura (Recibo)</ThemedText>
                    </Pressable>
                  )}

                  {/* Cambiar estado */}
                  <ThemedText style={s.sectionLabel}>Cambiar estado</ThemedText>
                  <View style={s.estadosGrid}>
                    {ESTADOS.map(e => {
                      const est = getEstado(e);
                      const isActive = selected.estado === e;
                      return (
                        <Pressable
                          key={e}
                          style={[s.estadoBtn, { backgroundColor: est.bg, opacity: isActive ? 0.5 : 1 }]}
                          onPress={() => !isActive && handleEstadoChange(selected, e)}
                          disabled={isActive}
                        >
                          <ThemedText style={{ fontSize: 16 }}>{est.emoji}</ThemedText>
                          <ThemedText style={[s.estadoBtnText, { color: est.text }]}>{e}</ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            )}
            <Pressable style={s.closeBtn} onPress={() => setSelected(null)}>
              <ThemedText style={s.closeBtnText}>Cerrar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal Factura (Ticket) */}
      <Modal visible={facturaVisible} transparent animationType="fade" onRequestClose={() => setFacturaVisible(false)}>
        <View style={s.invoiceOverlay}>
          <View style={s.invoiceContainer}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.invoiceScroll}>
              
              {/* Torn edge top */}
              <ThemedText style={s.tornEdge}>- - - - - - - - - - - - - - - - - - - - - - - - - -</ThemedText>
              
              {/* Header */}
              <View style={s.invoiceHeader}>
                <ThemedText style={s.invoiceBrand}>MOONLESS NIGHT STORE</ThemedText>
                <ThemedText style={s.invoiceSub}>NIT: 900.123.456-7</ThemedText>
                <ThemedText style={s.invoiceSub}>Calle Falsa 123, Bogotá</ThemedText>
                <ThemedText style={s.invoiceSub}>Tel: 300 123 4567</ThemedText>
                <View style={s.divider} />
                <ThemedText style={s.invoiceTitle}>FACTURA DE VENTA</ThemedText>
                {detallePedido && (
                  <ThemedText style={s.invoiceNumber}>Nº PEDIDO: {String(detallePedido.id).slice(-8).toUpperCase()}</ThemedText>
                )}
              </View>

              <View style={s.divider} />

              {/* Invoice Meta */}
              {detallePedido && (
                <View style={s.invoiceMeta}>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Fecha Pedido: </ThemedText>{formatDate(detallePedido.createdAt)}</ThemedText>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Fecha Estado: </ThemedText>{formatDate(detallePedido.updatedAt)}</ThemedText>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Cliente: </ThemedText>{detallePedido.usuario?.nombre} {detallePedido.usuario?.apellido}</ThemedText>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Email: </ThemedText>{detallePedido.usuario?.email}</ThemedText>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Teléfono: </ThemedText>{detallePedido.telefono || '—'}</ThemedText>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Dirección: </ThemedText>{detallePedido.direccionEnvio || '—'}</ThemedText>
                  <ThemedText style={s.invoiceText}><ThemedText style={s.boldText}>Estado: </ThemedText>{detallePedido.estado?.toUpperCase()}</ThemedText>
                </View>
              )}

              <View style={s.divider} />

              {/* Items Table */}
              <View style={s.invoiceItemsHeader}>
                <ThemedText style={[s.invoiceItemText, s.invoiceColQty, s.boldText]}>Cant</ThemedText>
                <ThemedText style={[s.invoiceItemText, s.invoiceColName, s.boldText]}>Producto</ThemedText>
                <ThemedText style={[s.invoiceItemText, s.invoiceColSub, s.boldText, { textAlign: 'right' }]}>Total</ThemedText>
              </View>
              <View style={s.dividerDotted} />
              
              {detallePedido?.detalles?.map((det) => (
                <View key={det.id} style={s.invoiceItemRow}>
                  <ThemedText style={[s.invoiceItemText, s.invoiceColQty]}>{det.cantidad}</ThemedText>
                  <ThemedText style={[s.invoiceItemText, s.invoiceColName]} numberOfLines={2}>
                    {det.producto?.nombre || 'Producto desconocido'}
                  </ThemedText>
                  <ThemedText style={[s.invoiceItemText, s.invoiceColSub, { textAlign: 'right' }]}>
                    ${Number(det.subtotal || 0).toLocaleString('es-CO')}
                  </ThemedText>
                </View>
              ))}

              <View style={s.divider} />

              {/* Financials */}
              {detallePedido && (
                <View style={s.invoiceTotals}>
                  <View style={s.totalRow}>
                    <ThemedText style={s.invoiceText}>Subtotal (Base):</ThemedText>
                    <ThemedText style={s.invoiceText}>
                      ${Number(Number(detallePedido.total || 0) / 1.19).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </ThemedText>
                  </View>
                  <View style={s.totalRow}>
                    <ThemedText style={s.invoiceText}>IVA (19% Incluido):</ThemedText>
                    <ThemedText style={s.invoiceText}>
                      ${Number(Number(detallePedido.total || 0) - (Number(detallePedido.total || 0) / 1.19)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </ThemedText>
                  </View>
                  <View style={s.dividerDotted} />
                  <View style={s.totalRow}>
                    <ThemedText style={[s.invoiceText, s.boldText, { fontSize: 14 }]}>TOTAL NETO:</ThemedText>
                    <ThemedText style={[s.invoiceText, s.boldText, { fontSize: 14 }]}>
                      ${Number(detallePedido.total || 0).toLocaleString('es-CO')}
                    </ThemedText>
                  </View>
                </View>
              )}

              <View style={s.divider} />
              
              {/* Barcode */}
              <View style={s.barcodeContainer}>
                <Barcode />
                {detallePedido && (
                  <ThemedText style={s.barcodeLabel}>*{detallePedido.id}*</ThemedText>
                )}
              </View>

              {/* Signature Area */}
              <View style={s.signatureArea}>
                <View style={s.signatureLine} />
                <ThemedText style={s.signatureText}>Firma del Cajero / Entregador</ThemedText>
              </View>

              {/* Thank you footer */}
              <View style={s.invoiceFooter}>
                <ThemedText style={s.thanksText}>*** GRACIAS POR SU COMPRA ***</ThemedText>
                <ThemedText style={s.thanksText}>Moonless Night App</ThemedText>
              </View>

              {/* Torn edge bottom */}
              <ThemedText style={s.tornEdge}>- - - - - - - - - - - - - - - - - - - - - - - - - -</ThemedText>

            </ScrollView>

            {/* Back button */}
            <Pressable style={s.invoiceCloseBtn} onPress={() => setFacturaVisible(false)}>
              <ThemedText style={s.invoiceCloseBtnText}>Volver al Detalle</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AdminToast message={toast.message} type={toast.type} visible={toast.visible} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f4', padding: 16, gap: 12 },
  header: { gap: 2, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', color: '#3d2c1e' },
  subtitle: { fontSize: 13, color: '#9e8879' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9f5', borderRadius: 14, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 12, height: 44, gap: 8 },
  input: { flex: 1, fontSize: 14, color: '#3d2c1e' },

  centered: { alignItems: 'center', paddingVertical: 24 },
  error: { color: '#e07070', fontSize: 13 },
  list: { flex: 1 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, shadowColor: '#c4a882', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  estadoBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  estadoEmoji: { fontSize: 22 },
  cardBody: { flex: 1, gap: 4 },
  cardId: { fontSize: 14, fontWeight: '700', color: '#3d2c1e' },
  cardCliente: { fontSize: 13, color: '#9e8879' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTotal: { fontSize: 13, fontWeight: '700', color: '#c47a3a' },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  pillText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#b8a99a' },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 6 },
  pageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff9f5', borderWidth: 1, borderColor: '#e8ddd5', alignItems: 'center', justifyContent: 'center' },
  pageBtnOff: { opacity: 0.4 },
  pageLabel: { fontSize: 13, fontWeight: '600', color: '#7c6455' },

  overlay: { flex: 1, backgroundColor: 'rgba(61,44,30,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '88%', paddingBottom: 16 },
  handle: { width: 40, height: 4, backgroundColor: '#e8ddd5', borderRadius: 4, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  modalBody: { padding: 20, gap: 14 },
  modalHeader: { alignItems: 'center', gap: 8 },
  modalIconBig: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#b8a99a', textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', gap: 8 },
  infoCell: { backgroundColor: '#fdf8f4', borderRadius: 14, padding: 12, flex: 1, gap: 4 },
  cellLabel: { fontSize: 11, color: '#b8a99a', fontWeight: '600', textTransform: 'uppercase' },
  cellValue: { fontSize: 14, fontWeight: '700', color: '#3d2c1e' },
  cellSub: { fontSize: 13, color: '#9e8879' },
  estadosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  estadoBtnText: { fontSize: 13, fontWeight: '700' },
  closeBtn: { marginHorizontal: 20, marginTop: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fdf8f4', alignItems: 'center' },
  closeBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 14 },

  // Nuevos estilos
  loadingWrap: { padding: 20, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13, color: '#9e8879' },
  productsList: { gap: 8, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e8ddd5' },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f5ebe0', paddingVertical: 6 },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontSize: 14, fontWeight: '700', color: '#3d2c1e' },
  productQty: { fontSize: 12, color: '#9e8879' },
  productSubtotal: { fontSize: 13, fontWeight: '700', color: '#c47a3a' },
  noProducts: { fontSize: 13, color: '#b8a99a', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  
  invoiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#d4956a', paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  invoiceBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  cellValueTime: { fontSize: 13, fontWeight: '700', color: '#3d2c1e' },

  invoiceOverlay: { flex: 1, backgroundColor: 'rgba(61,44,30,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  invoiceContainer: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: '90%', padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 },
  invoiceScroll: { paddingVertical: 10, paddingHorizontal: 4 },
  tornEdge: { fontSize: 12, color: '#c4b5a6', textAlign: 'center', letterSpacing: 2, marginVertical: 4 },
  invoiceHeader: { alignItems: 'center', gap: 4 },
  invoiceBrand: { fontSize: 18, fontWeight: '800', color: '#3d2c1e', letterSpacing: 1 },
  invoiceSub: { fontSize: 11, color: '#7c6455' },
  divider: { height: 1, backgroundColor: '#3d2c1e', marginVertical: 10, borderStyle: 'dashed', borderWidth: 0.5, borderColor: '#3d2c1e' },
  dividerDotted: { height: 1, borderBottomWidth: 1, borderColor: '#3d2c1e', borderStyle: 'dotted', marginVertical: 8 },
  invoiceTitle: { fontSize: 14, fontWeight: '700', color: '#3d2c1e', letterSpacing: 2, marginVertical: 4 },
  invoiceNumber: { fontSize: 12, fontWeight: '700', color: '#3d2c1e' },
  invoiceMeta: { gap: 4 },
  invoiceText: { fontSize: 12, color: '#3d2c1e', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  boldText: { fontWeight: '700' },
  invoiceItemsHeader: { flexDirection: 'row', gap: 6 },
  invoiceColQty: { width: 40 },
  invoiceColName: { flex: 1 },
  invoiceColSub: { width: 80 },
  invoiceItemText: { fontSize: 12, color: '#3d2c1e', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  invoiceItemRow: { flexDirection: 'row', gap: 6, marginVertical: 4 },
  invoiceTotals: { gap: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barcodeContainer: { alignItems: 'center', marginVertical: 12 },
  barcodeLabel: { fontSize: 11, color: '#3d2c1e', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3 },
  signatureArea: { alignItems: 'center', marginTop: 24, marginBottom: 12 },
  signatureLine: { width: 160, height: 1, backgroundColor: '#7c6455' },
  signatureText: { fontSize: 10, color: '#7c6455', marginTop: 4 },
  invoiceFooter: { alignItems: 'center', gap: 4, marginVertical: 12 },
  thanksText: { fontSize: 11, fontWeight: '700', color: '#3d2c1e' },
  invoiceCloseBtn: { backgroundColor: '#fdf8f4', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  invoiceCloseBtnText: { color: '#d4956a', fontWeight: '700', fontSize: 14 },

  // Panel de filtros
  searchRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
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
