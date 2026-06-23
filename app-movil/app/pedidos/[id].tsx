import { useState, useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, Text, Modal, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";
import catalogoService from '../../src/services/catalogoService';
import pedidoService from '../../src/services/pedidoService';
import ConfirmModal from '../../components/confirm-modal';

type ProductoDetalle = {
    nombre?: string;
    imagen?: string;
};

type Detalle = {
    id: number;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    Producto?: ProductoDetalle;
    producto?: ProductoDetalle;
};

type Pedido = {
    id: string;
    estado: string;
    createdAt: string;
    direccionEnvio?: string;
    telefono?: string;
    metodoPago?: string;
    total: number;
    detalles: Detalle[];
    DetallesPedido?: Detalle[];
};

function formatCOP(value: number | undefined): string {
    return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDate(value: string | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
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

export default function PedidoDetalleScreen() {
    const { id } = useLocalSearchParams();
    const pedidoId = Array.isArray(id) ? id[0] : id;

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [facturaVisible, setFacturaVisible] = useState(false);

    useEffect(() => {
        if (!pedidoId) {
            setLoading(false);
            setErrorMessage('Pedido inválido');
            return;
        }

        const loadPedido = async () => {
            setLoading(true);
            setErrorMessage('');

            try {
                const data = await pedidoService.getPedidoById(pedidoId);
                setPedido(data);
            } catch (error) {
                setErrorMessage((error as Error)?.message || 'No fue posible cargar el pedido');
            } finally {
                setLoading(false);
            }
        };
        loadPedido();
    }, [pedidoId]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#d4956a" />
                    <Text style={styles.loadingText}>Cargando pedido...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!pedido) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={64} color="#d4956a" />
                    <ThemedText style={styles.title}>No se encontró el pedido</ThemedText>
                    <Text style={styles.subtitle}>{errorMessage || 'Intenta de nuevo más tarde.'}</Text>
                    <Pressable style={styles.primaryButton} onPress={() => router.replace('/mis-pedidos')}>
                        <Text style={styles.primaryButtonText}>Volver a pedidos</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const detalles: Detalle[] = pedido.detalles || pedido.DetallesPedido || [];
    const isPendiente = String(pedido.estado || '').toLowerCase() === 'pendiente';
    const estStyle = getEstadoStyle(pedido.estado || '');

    const handleCancelarPedido = async () => {
        if (!pedido?.id || !isPendiente || isCancelling) {
            return;
        }

        setIsCancelling(true);
        setErrorMessage('');

        try {
            await pedidoService.cancelarPedido(pedido.id);
            
            // Actualizar la caché de estados en AsyncStorage para evitar que el notifier le lance modal de notificación
            try {
                const cacheRaw = await AsyncStorage.getItem('ORDER_STATES_CACHE');
                const cachedStates = cacheRaw ? JSON.parse(cacheRaw) : {};
                cachedStates[String(pedido.id)] = 'cancelado';
                await AsyncStorage.setItem('ORDER_STATES_CACHE', JSON.stringify(cachedStates));
            } catch (storageErr) {
                console.warn('No se pudo actualizar el estado de pedido cancelado en caché:', storageErr);
            }

            const actualizado = await pedidoService.getPedidoById(pedido.id);
            setPedido(actualizado);
        } catch (error) {
            setErrorMessage((error as Error)?.message || 'No fue posible cancelar el pedido.');
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>


                {/* ID & Status */}
                <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle}>Pedido #{pedido.id}</Text>
                    <View style={[styles.badge, { backgroundColor: estStyle.bg, borderColor: estStyle.border }]}>
                        <Text style={[styles.badgeText, { color: estStyle.text }]}>
                            {mapEstadoLabel(pedido.estado)}
                        </Text>
                    </View>
                </View>

                {/* General Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fecha</Text>
                        <Text style={styles.infoValue}>{formatDate(pedido.createdAt)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Dirección de envío</Text>
                        <Text style={styles.infoValue}>{pedido.direccionEnvio || '-'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Teléfono</Text>
                        <Text style={styles.infoValue}>{pedido.telefono || '-'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Método de pago</Text>
                        <Text style={[styles.infoValue, styles.capitalize]}>{pedido.metodoPago || 'efectivo'}</Text>
                    </View>
                </View>

                {/* Products Section */}
                <Text style={styles.sectionTitle}>Productos</Text>
                {detalles.map((detalle: Detalle) => {
                    const producto = detalle.producto || detalle.Producto || {};
                    const imagen = catalogoService.buildImageUrl(producto.imagen);

                    return (
                        <View key={detalle.id} style={styles.itemCard}>
                            <Image source={{ uri: imagen }} style={styles.image} />
                            <View style={styles.itemBody}>
                                <Text style={styles.itemTitle}>{producto.nombre || 'Producto'}</Text>
                                <Text style={styles.itemMeta}>
                                    {detalle.cantidad} x {formatCOP(detalle.precioUnitario)}
                                </Text>
                                <Text style={styles.itemSubtotal}>{formatCOP(detalle.subtotal)}</Text>
                            </View>
                        </View>
                    );
                })}

                {/* Total Paid Card */}
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total pagado</Text>
                    <Text style={styles.totalValue}>{formatCOP(pedido.total)}</Text>
                </View>

                {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

                {/* Actions */}
                <View style={styles.actionsRow}>
                    {isPendiente ? (
                        <Pressable
                            style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                            onPress={() => setShowCancelConfirm(true)}
                            disabled={isCancelling}>
                            <Text style={styles.cancelButtonText}>
                                {isCancelling ? 'Cancelando...' : 'Cancelar pedido'}
                            </Text>
                        </Pressable>
                    ) : null}

                    {/* Botón ver factura */}
                    {pedido && (
                        <Pressable style={styles.invoiceBtn} onPress={() => setFacturaVisible(true)}>
                            <Ionicons name="receipt-outline" size={18} color="#fff" />
                            <Text style={styles.invoiceBtnText}>Ver Factura (Recibo)</Text>
                        </Pressable>
                    )}

                    <View style={styles.buttonsRow}>
                        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/mis-pedidos')}>
                            <Text style={styles.secondaryButtonText}>Mis pedidos</Text>
                        </Pressable>

                        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
                            <Text style={styles.primaryButtonText}>Seguir comprando</Text>
                        </Pressable>
                    </View>
                </View>
            </ScrollView>

            <ConfirmModal
                visible={showCancelConfirm}
                title="¿Cancelar pedido?"
                message="¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer."
                icon="alert-circle-outline"
                iconColor="#e07070"
                confirmText="Sí, cancelar"
                cancelText="No, mantener"
                isDestructive
                onConfirm={async () => {
                    setShowCancelConfirm(false);
                    await handleCancelarPedido();
                }}
                onCancel={() => setShowCancelConfirm(false)}
            />

            {/* Modal Factura (Ticket) */}
            <Modal visible={facturaVisible} transparent animationType="fade" onRequestClose={() => setFacturaVisible(false)}>
                <View style={styles.invoiceOverlay}>
                    <View style={styles.invoiceContainer}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.invoiceScroll}>
                            
                            {/* Torn edge top */}
                            <Text style={styles.tornEdge}>- - - - - - - - - - - - - - - - - - - - - - - - - -</Text>
                            
                            {/* Header */}
                            <View style={styles.invoiceHeader}>
                                <Text style={styles.invoiceBrand}>MOONLESS NIGHT STORE</Text>
                                <Text style={styles.invoiceSub}>NIT: 900.123.456-7</Text>
                                <Text style={styles.invoiceSub}>Calle Falsa 123, Bogotá</Text>
                                <Text style={styles.invoiceSub}>Tel: 300 123 4567</Text>
                                <View style={styles.invoiceDivider} />
                                <Text style={styles.invoiceTitle}>FACTURA DE VENTA</Text>
                                <Text style={styles.invoiceNumber}>Nº PEDIDO: {String(pedido.id).slice(-8).toUpperCase()}</Text>
                            </View>

                            <View style={styles.invoiceDivider} />

                            {/* Invoice Meta */}
                            <View style={styles.invoiceMeta}>
                                <Text style={styles.invoiceText}><Text style={styles.boldText}>Fecha Pedido: </Text>{formatDate(pedido.createdAt)}</Text>
                                <Text style={styles.invoiceText}><Text style={styles.boldText}>Dirección: </Text>{pedido.direccionEnvio || '—'}</Text>
                                <Text style={styles.invoiceText}><Text style={styles.boldText}>Teléfono: </Text>{pedido.telefono || '—'}</Text>
                                <Text style={styles.invoiceText}><Text style={styles.boldText}>Método Pago: </Text>{pedido.metodoPago?.toUpperCase() || 'EFECTIVO'}</Text>
                                <Text style={styles.invoiceText}><Text style={styles.boldText}>Estado: </Text>{pedido.estado?.toUpperCase()}</Text>
                            </View>

                            <View style={styles.invoiceDivider} />

                            {/* Items Table */}
                            <View style={styles.invoiceItemsHeader}>
                                <Text style={[styles.invoiceItemText, styles.invoiceColQty, styles.boldText]}>Cant</Text>
                                <Text style={[styles.invoiceItemText, styles.invoiceColName, styles.boldText]}>Producto</Text>
                                <Text style={[styles.invoiceItemText, styles.invoiceColSub, styles.boldText, { textAlign: 'right' }]}>Total</Text>
                            </View>
                            <View style={styles.invoiceDividerDotted} />
                            
                            {detalles.map((det) => {
                                const prod = det.producto || det.Producto || {};
                                return (
                                    <View key={det.id} style={styles.invoiceItemRow}>
                                        <Text style={[styles.invoiceItemText, styles.invoiceColQty]}>{det.cantidad}</Text>
                                        <Text style={[styles.invoiceItemText, styles.invoiceColName]} numberOfLines={2}>
                                            {prod.nombre || 'Producto desconocido'}
                                        </Text>
                                        <Text style={[styles.invoiceItemText, styles.invoiceColSub, { textAlign: 'right' }]}>
                                            {formatCOP(det.subtotal)}
                                        </Text>
                                    </View>
                                );
                            })}

                            <View style={styles.invoiceDivider} />

                            {/* Financials */}
                            <View style={styles.invoiceTotals}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.invoiceText}>Subtotal (Base):</Text>
                                    <Text style={styles.invoiceText}>
                                        {formatCOP(Number(pedido.total || 0) / 1.19)}
                                    </Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.invoiceText}>IVA (19% Incluido):</Text>
                                    <Text style={styles.invoiceText}>
                                        {formatCOP(Number(pedido.total || 0) - (Number(pedido.total || 0) / 1.19))}
                                    </Text>
                                </View>
                                <View style={styles.invoiceDividerDotted} />
                                <View style={styles.totalRow}>
                                    <Text style={[styles.invoiceText, styles.boldText, { fontSize: 14 }]}>TOTAL NETO:</Text>
                                    <Text style={[styles.invoiceText, styles.boldText, { fontSize: 14 }]}>
                                        {formatCOP(pedido.total)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.invoiceDivider} />
                            
                            {/* Barcode */}
                            <View style={styles.barcodeContainer}>
                                <Barcode />
                                <Text style={styles.barcodeLabel}>*{pedido.id}*</Text>
                            </View>

                            {/* Signature Area */}
                            <View style={styles.signatureArea}>
                                <View style={styles.signatureLine} />
                                <Text style={styles.signatureText}>Firma del Cliente</Text>
                            </View>

                            {/* Thank you footer */}
                            <View style={styles.invoiceFooter}>
                                <Text style={styles.thanksText}>*** GRACIAS POR SU COMPRA ***</Text>
                                <Text style={styles.thanksText}>Moonless Night App</Text>
                            </View>

                            {/* Torn edge bottom */}
                            <Text style={styles.tornEdge}>- - - - - - - - - - - - - - - - - - - - - - - - - -</Text>

                        </ScrollView>

                        {/* Back button */}
                        <Pressable style={styles.invoiceCloseBtn} onPress={() => setFacturaVisible(false)}>
                            <Text style={styles.invoiceCloseBtnText}>Volver al Detalle</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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

    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#3d2c1e' },
    
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

    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e8ddd5',
        padding: 16,
        gap: 2,
        shadowColor: '#c4a882',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: { fontSize: 13, color: '#9e8879', fontWeight: '600' },
    infoValue: { fontSize: 13, color: '#3d2c1e', fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#f3ece6' },

    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#3d2c1e', marginTop: 10, paddingHorizontal: 2 },
    
    itemCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e8ddd5',
        padding: 12,
        flexDirection: 'row',
        gap: 12,
        shadowColor: '#c4a882',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    image: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#f9fafb' },
    itemBody: { flex: 1, justifyContent: 'center', gap: 4 },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#3d2c1e' },
    itemMeta: { fontSize: 12, color: '#9e8879', fontWeight: '500' },
    itemSubtotal: { fontSize: 14, fontWeight: '800', color: '#192847' },

    totalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e8ddd5',
        padding: 16,
        marginTop: 6,
        shadowColor: '#c4a882',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    totalLabel: { fontSize: 14, fontWeight: '800', color: '#3d2c1e' },
    totalValue: { fontSize: 18, fontWeight: '800', color: '#d4956a' },

    actionsRow: { flexDirection: 'column', gap: 12, marginTop: 12 },
    buttonsRow: { flexDirection: 'row', gap: 12 },

    primaryButton: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#192847',
        height: 48,
        shadowColor: '#192847',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

    secondaryButton: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#e8ddd5',
        height: 48,
        shadowColor: '#c4a882',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    secondaryButtonText: { color: '#9e8879', fontWeight: '700', fontSize: 14 },

    cancelButton: {
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#e07070',
        backgroundColor: 'transparent',
        height: 48,
    },
    cancelButtonDisabled: { opacity: 0.55 },
    cancelButtonText: { color: '#e07070', fontWeight: '700', fontSize: 14 },
    invoiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#d4956a', paddingVertical: 12, borderRadius: 14, marginTop: 8, height: 48 },
    invoiceBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    invoiceOverlay: { flex: 1, backgroundColor: 'rgba(61,44,30,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    invoiceContainer: { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxHeight: '90%', padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 5 },
    invoiceScroll: { paddingVertical: 10, paddingHorizontal: 4 },
    tornEdge: { fontSize: 12, color: '#c4b5a6', textAlign: 'center', letterSpacing: 2, marginVertical: 4 },
    invoiceHeader: { alignItems: 'center', gap: 4 },
    invoiceBrand: { fontSize: 18, fontWeight: '800', color: '#3d2c1e', letterSpacing: 1 },
    invoiceSub: { fontSize: 11, color: '#7c6455' },
    invoiceDivider: { height: 1, backgroundColor: '#3d2c1e', marginVertical: 10, borderStyle: 'dashed', borderWidth: 0.5, borderColor: '#3d2c1e' },
    invoiceDividerDotted: { height: 1, borderBottomWidth: 1, borderColor: '#3d2c1e', borderStyle: 'dotted', marginVertical: 8 },
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
    capitalize: { textTransform: 'capitalize' },
});
