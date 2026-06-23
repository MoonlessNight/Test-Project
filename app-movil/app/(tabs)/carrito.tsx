/**
 * Pantalla del carrito de compras y sus respectivas gestiones
 */

import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import catalogoService from '../../src/services/catalogoService';
import { useAuth } from '../../src/context/AuthContext';
import { useCarrito } from '../../src/context/CarritoContext';
import ConfirmModal from '../../components/confirm-modal';
import AdminToast from '../../components/admin-toast';

type CarritoCtx = {
    items: { id: string, nombre?: string, precio?: number, cantidad: number, imagen?: string, stock?: number }[];
    total: number;
    totalItems: number;
    loading: boolean;
    cambiarCantidad: (id: string, cantidad: number) => Promise<void>;
    eliminarItem: (id: string) => Promise<void>;
    vaciarCarrito: () => Promise<void>;
};

const routerPush = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);
const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

export default function CarritoScreen() {
    const { isAuthenticated } = useAuth() as { isAuthenticated: boolean };
    const { items, total, loading, cambiarCantidad, eliminarItem, vaciarCarrito } = useCarrito() as CarritoCtx;

    // Estado para guardar las IDs de los productos seleccionados
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Estado para la confirmación de diálogo personalizada
    const [confirmConfig, setConfirmConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        icon?: keyof typeof Ionicons.glyphMap;
        iconColor?: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel?: () => void;
        isDestructive?: boolean;
    }>({
        visible: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const hideConfirm = () => {
        setConfirmConfig(prev => ({ ...prev, visible: false }));
    };

    const showConfirm = (config: Omit<typeof confirmConfig, 'visible'>) => {
        setConfirmConfig({ ...config, visible: true });
    };

    // Estados para la notificación Toast personalizada
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
    const [toastVisible, setToastVisible] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
        setTimeout(() => {
            setToastVisible(false);
        }, 2200);
    };

    const handleEliminarItem = async (item: any) => {
        try {
            await eliminarItem(item.id);
            showToast(`"${item.nombre}" eliminado del carrito`, 'info');
        } catch (error) {
            showToast('No se pudo eliminar el producto', 'error');
        }
    };

    // Limpia la selección de items que ya no están en el carrito
    useEffect(() => {
        setSelectedItems(prev => prev.filter(id => items.some(item => item.id === id)));
    }, [items]);

    const toggleSelectItem = (id: string) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#d4956a"/>
                <Text style={styles.loadingText}>Cargando Carrito...</Text>
            </View>
        );
    }

    const handleIrACheckout = () => {
        if (!isAuthenticated) {
            showConfirm({
                title: 'Iniciar sesión',
                message: 'Debes iniciar sesión para proceder al pago.',
                icon: 'log-in-outline',
                iconColor: '#192847',
                confirmText: 'Iniciar Sesión',
                cancelText: 'Cancelar',
                onConfirm: () => {
                    hideConfirm();
                    routerReplace('/(tabs)/explore');
                },
                onCancel: hideConfirm,
            });
            return;
        }
        routerPush('/checkout');
    };

    const handleVaciarCarrito = () => {
        showConfirm({
            title: 'Vaciar Carrito',
            message: '¿Estás seguro de que quieres vaciar el carrito?',
            icon: 'trash-outline',
            iconColor: '#e07070',
            confirmText: 'Vaciar',
            cancelText: 'Cancelar',
            isDestructive: true,
            onConfirm: () => {
                hideConfirm();
                vaciarCarrito();
            },
            onCancel: hideConfirm,
        });
    };

    const handleEliminarSeleccionados = () => {
        if (selectedItems.length === 0) return;
        showConfirm({
            title: 'Eliminar seleccionados',
            message: `¿Estás seguro de que quieres eliminar los ${selectedItems.length} productos seleccionados del carrito?`,
            icon: 'trash-outline',
            iconColor: '#e07070',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            isDestructive: true,
            onConfirm: async () => {
                hideConfirm();
                const count = selectedItems.length;
                try {
                    for (const id of selectedItems) {
                        await eliminarItem(id);
                    }
                    setSelectedItems([]);
                    showToast(`${count} productos eliminados`, 'info');
                } catch (error) {
                    showConfirm({
                        title: 'Error',
                        message: 'No se pudieron eliminar algunos productos.',
                        icon: 'close-circle-outline',
                        iconColor: '#e07070',
                        confirmText: 'Aceptar',
                        onConfirm: hideConfirm,
                    });
                }
            },
            onCancel: hideConfirm,
        });
    };

    const handleIncrementar = (item: any) => {
        if (item.stock !== undefined && item.cantidad >= item.stock) {
            showConfirm({
                title: 'Límite de Stock',
                message: 'La cantidad deseada supera la cantidad total del producto en stock.',
                icon: 'alert-circle-outline',
                iconColor: '#d4956a',
                confirmText: 'Aceptar',
                onConfirm: hideConfirm,
            });
            return;
        }
        cambiarCantidad(item.id, item.cantidad + 1);
    };

    return(
        <View style={{ flex: 1, backgroundColor: '#fdf8f4' }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Encabezado */}
            <View style={styles.header}>
                <Ionicons name="cart" size={26} color="#d4956a" />
                <Text style={styles.headerTitle}>Mi Carrito</Text>      
            </View>

            {/* ── BANNER INFORMATIVO (solo para usuarios NO autenticados) ─────── */}
            {!isAuthenticated && (
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={18} color="#192847" />
                    <Text style={styles.infoBannerText}>
                        Puedes agregar productos sin iniciar sesión. Al momento de pagar deberás iniciar sesión.
                    </Text>
                </View>
            )}

            {/* ── RENDERIZADO CONDICIONAL: VACÍO vs CON PRODUCTOS ─────────────── */}
            {items.length === 0 ? (
                // ── CARRITO VACÍO ─────────────────────────────────────────────────
                <View style={styles.emptyContainer}>
                    <Ionicons name="cart-outline" size={80} color="#d4956a" />
                    <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
                    <Text style={styles.empty}>Agrega productos desde el catálogo para comenzar tu compra.</Text>
                    <Pressable style={styles.catalogBtn} onPress={() => routerReplace('/')}>
                        <Ionicons name="storefront-outline" size={16} color="#fff" />
                        <Text style={styles.catalogBtnText}>Ir al Catálogo</Text>
                    </Pressable>
                </View>
            ) : (
                // ── CARRITO CON PRODUCTOS ─────────────────────────────────────────
                <>
                    {/* ── TARJETA DE PRODUCTOS ────────────────────────────────────── */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Productos en tu carrito</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{items.length}</Text>
                            </View>
                        </View>

                        {/* Barra de Selección y Acciones en lote */}
                        <View style={styles.selectionBar}>
                            <Pressable 
                                style={styles.selectAllContainer}
                                onPress={() => {
                                    if (selectedItems.length === items.length) {
                                        setSelectedItems([]);
                                    } else {
                                        setSelectedItems(items.map(it => it.id));
                                    }
                                }}
                            >
                                <View style={[styles.checkbox, selectedItems.length === items.length && styles.checkboxSelected]}>
                                    {selectedItems.length === items.length && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                                <Text style={styles.selectAllText}>
                                    {selectedItems.length === items.length ? 'Desmarcar todos' : 'Seleccionar todo'}
                                </Text>
                            </Pressable>

                            <View style={styles.selectionActions}>
                                {selectedItems.length > 0 ? (
                                    <Pressable style={styles.eliminarVariosBtn} onPress={handleEliminarSeleccionados}>
                                        <Ionicons name="trash" size={14} color="#e07070" />
                                        <Text style={styles.eliminarVariosText}>Eliminar ({selectedItems.length})</Text>
                                    </Pressable>
                                ) : (
                                    <Pressable style={styles.vaciarBtn} onPress={handleVaciarCarrito}>
                                        <Ionicons name="trash-outline" size={14} color="#e07070" />
                                        <Text style={styles.vaciarText}>Vaciar carrito</Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>

                        {/* ── LISTA DE ÍTEMS ──────────────────────────────────────────── */}
                        {items.map((item, index) => {
                            const isSelected = selectedItems.includes(item.id);
                            return (
                                <View key={item.id}>
                                    {index > 0 && <View style={styles.itemDivider} />}
                                    <Pressable 
                                        style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                                        onPress={() => toggleSelectItem(item.id)}
                                    >
                                        <Image
                                            source={{ uri: catalogoService.buildImageUrl(item.imagen) }}
                                            style={styles.image}
                                        />
                                        <View style={styles.itemBody}>
                                            <View style={styles.itemHeaderRow}>
                                                <Text style={styles.itemName} numberOfLines={2}>{item.nombre}</Text>
                                            </View>
                                            
                                            {/* Tabla de Información de Producto */}
                                            <View style={styles.productDetailsGrid}>
                                                <View style={[styles.detailItem, { borderRightWidth: 1, borderColor: '#f3ece6' }]}>
                                                    <Text style={styles.detailLabel}>Por Unidad</Text>
                                                    <Text style={styles.detailValue}>{fmt(item.precio || 0)}</Text>
                                                </View>
                                                <View style={[styles.detailItem, { borderRightWidth: 1, borderColor: '#f3ece6' }]}>
                                                    <Text style={styles.detailLabel}>Stock Máx</Text>
                                                    <Text style={styles.detailValue}>{item.stock ?? 'N/A'}</Text>
                                                </View>
                                                <View style={styles.detailItem}>
                                                    <Text style={styles.detailLabel}>Por Subtotal</Text>
                                                    <Text style={[styles.detailValue, { color: '#d4956a', fontWeight: '800' }]}>
                                                        {fmt((item.precio || 0) * item.cantidad)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.itemFooterRow}>
                                                {/* Controles de Cantidad */}
                                                <View style={styles.qtySelector}>
                                                    <Pressable style={styles.qtyBtn} onPress={() => cambiarCantidad(item.id, Math.max(1, item.cantidad - 1))}>
                                                        <Ionicons name="remove" size={14} color="#192847" />
                                                    </Pressable>
                                                    <Text style={styles.qtyText}>{item.cantidad}</Text>
                                                    <Pressable style={styles.qtyBtn} onPress={() => handleIncrementar(item)}>
                                                        <Ionicons name="add" size={14} color="#192847" />
                                                    </Pressable>
                                                </View>

                                                {/* Botón de Basura en la Derecha */}
                                                <Pressable onPress={() => handleEliminarItem(item)} style={styles.trashBtn}>
                                                    <Ionicons name="trash-outline" size={18} color="#e07070" />
                                                </Pressable>
                                            </View>
                                        </View>
                                    </Pressable>
                                </View>
                            );
                        })}
                    </View>

                    {/* ── TARJETA DE RESUMEN DEL PEDIDO ───────────────────────────── */}
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Resumen del Pedido</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal:</Text>
                            <Text style={styles.summaryValue}>{fmt(total)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Envío:</Text>
                            <Text style={styles.summaryMuted}>A calcular</Text>
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total:</Text>
                            <Text style={styles.totalValue}>{fmt(total)}</Text>
                        </View>

                        <Pressable style={styles.checkoutBtn} onPress={handleIrACheckout}>
                            <Ionicons name="card-outline" size={18} color="#fff" />
                            <Text style={styles.checkoutText}>
                                {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
                            </Text>
                        </Pressable>

                        <Pressable style={styles.continueBtn} onPress={() => routerReplace('/')}>
                            <Ionicons name="arrow-back-outline" size={16} color="#9e8879" />
                            <Text style={styles.continueBtnText}>Seguir Comprando</Text>
                        </Pressable>
                    </View>
                </>
            )}
            </ScrollView>
            <ConfirmModal {...confirmConfig} />
            <AdminToast message={toastMessage} type={toastType} visible={toastVisible} />
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f4' },
  content: { padding: 20, gap: 16, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: '#fdf8f4', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#9e8879', fontSize: 14, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#3d2c1e' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff6f0',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8ddd5',
  },
  infoBannerText: { flex: 1, color: '#7c6455', fontSize: 13, lineHeight: 18 },

  emptyContainer: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
  empty: { color: '#9e8879', textAlign: 'center', fontSize: 14, lineHeight: 21, paddingHorizontal: 20 },
  catalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#192847',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  catalogBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    overflow: 'hidden',
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3ece6',
    backgroundColor: '#fff9f5',
    gap: 8,
  },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: '#3d2c1e' },
  badge: { backgroundColor: '#19284712', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#192847', fontSize: 11, fontWeight: '700' },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3ece6',
    backgroundColor: '#fffcf9',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllText: {
    color: '#7c6455',
    fontSize: 13,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eliminarVariosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  eliminarVariosText: { color: '#e07070', fontSize: 11, fontWeight: '700' },
  vaciarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#fbebeb',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  vaciarText: { color: '#e07070', fontSize: 11, fontWeight: '700' },
  itemDivider: { height: 1, backgroundColor: '#f3ece6', marginHorizontal: 16 },

  itemRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#ffffff',
  },
  itemRowSelected: {
    borderColor: '#e07070',
    backgroundColor: '#fff5f5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#e8ddd5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxSelected: {
    borderColor: '#192847',
    backgroundColor: '#192847',
  },
  image: { width: 68, height: 68, borderRadius: 12 },
  itemBody: { flex: 1, gap: 4 },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: { fontWeight: '700', fontSize: 14, color: '#3d2c1e', lineHeight: 18, flex: 1 },
  productDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#fffcf9',
    borderRadius: 10,
    paddingVertical: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#f3ece6',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 9,
    color: '#9e8879',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 12,
    color: '#3d2c1e',
    fontWeight: '700',
  },
  itemFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    backgroundColor: '#fff9f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { minWidth: 24, textAlign: 'center', fontWeight: '700', fontSize: 14, color: '#3d2c1e' },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subtotalItem: { fontWeight: '800', color: '#d4956a', fontSize: 14 },
  trashBtn: { padding: 4 },

  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 20,
    gap: 12,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryTitle: { fontWeight: '700', fontSize: 16, color: '#3d2c1e', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#9e8879', fontSize: 14, fontWeight: '500' },
  summaryValue: { color: '#3d2c1e', fontSize: 14, fontWeight: '700' },
  summaryMuted: { color: '#d4956a', fontSize: 14, fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#f3ece6', marginVertical: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#3d2c1e' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#192847' },

  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    backgroundColor: '#192847',
    paddingVertical: 14,
    marginTop: 6,
    height: 48,
  },
  checkoutText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e8ddd5',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    height: 44,
  },
  continueBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 14 },
});
