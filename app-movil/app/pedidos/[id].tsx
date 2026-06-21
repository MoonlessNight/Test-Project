import { useState, useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
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

export default function PedidoDetalleScreen() {
    const { id } = useLocalSearchParams();
    const pedidoId = Array.isArray(id) ? id[0] : id;

    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
    capitalize: { textTransform: 'capitalize' },
});
