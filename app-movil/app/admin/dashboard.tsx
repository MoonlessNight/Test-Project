/**
 * Pantalla principal del panel del administrador y auxiliar.
 * Diseño pastel cálido • Tarjetas con sombras suaves • Accesos rápidos • Info sistema
 */

import { useState, useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';
import { API_ORIGIN_URL } from '../../src/utils/constants';
import { ThemedText } from '../../components/themed-text';

type AuthUser = { rol?: string; nombre?: string };

const push = (path: string) => (router as unknown as { push: (p: string) => void }).push(path);

type StatCard = {
    title: string;
    value: number | string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    emoji: string;
    route: string;
    show: boolean;
};

export default function AdminDashboardScreen() {
    const { user, isAuthenticated } = useAuth() as { user: AuthUser | null; isAuthenticated: boolean };
    const isAdmin = user?.rol === 'administrador';
    const isAuxiliar = user?.rol === 'auxiliar';

    const [stats, setStats] = useState({
        categorias: 0,
        subcategorias: 0,
        productos: 0,
        usuarios: 0,
        pedidos: 0,
        ventas: 0,
    });

    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                setLoading(true);
                try {
                    const [cats, subs, prods, orders] = await Promise.all([
                        apiClient.get('/admin/categorias'),
                        apiClient.get('/admin/subcategorias'),
                        apiClient.get('/admin/productos?limite=1'),
                        apiClient.get('/admin/pedidos/estadisticas'),
                    ]);

                    const userStats = isAdmin ? await apiClient.get('/admin/usuarios/stats') : null;

                    const catsData = cats?.data?.data?.categorias || [];
                    const subsData = subs?.data?.data?.subcategorias || [];
                    const ordStats = orders.data?.data || {};

                    setStats({
                        categorias: Array.isArray(catsData) ? catsData.length : 0,
                        subcategorias: Array.isArray(subsData) ? subsData.length : 0,
                        productos: prods.data?.data?.paginacion?.total || 0,
                        usuarios: userStats?.data?.data?.total || 0,
                        pedidos: ordStats.totalPedidos || 0,
                        ventas: Number(ordStats.ventasTotales) || 0,
                    });
                } catch (_) {
                    // ignore
                } finally {
                    setLoading(false);
                }
            };

            if (isAuthenticated && (isAdmin || isAuxiliar)) {
                load();
            }
        }, [isAuthenticated, isAdmin, isAuxiliar])
    );

    if (!isAuthenticated || (!isAdmin && !isAuxiliar)) {
        return (
            <View style={s.centered}>
                <Ionicons name="lock-closed" size={60} color="#e07070" />
                <ThemedText style={s.restrictedTitle}>Acceso restringido</ThemedText>
                <ThemedText style={s.restrictedSub}>Solo Administradores y auxiliares</ThemedText>
            </View>
        );
    }

    const cards: StatCard[] = [
        { title: 'Categorías',    value: stats.categorias,    icon: 'folder-outline',      color: '#d4956a', bg: '#fef3e2', emoji: '🗂️', route: '/admin/categorias', show: true },
        { title: 'Subcategorías', value: stats.subcategorias, icon: 'pricetags-outline',   color: '#d4956a', bg: '#fef3e2', emoji: '🏷️', route: '/admin/subcategorias', show: true },
        { title: 'Productos',     value: stats.productos,     icon: 'cube-outline',        color: '#d4956a', bg: '#fef3e2', emoji: '📦', route: '/admin/productos', show: true },
        { title: 'Usuarios',      value: stats.usuarios,      icon: 'people-outline',      color: '#1a6b9e', bg: '#e8f4fd', emoji: '👥', route: '/admin/usuarios',  show: isAdmin },
        { title: 'Pedidos',       value: stats.pedidos,       icon: 'cart-outline',        color: '#52b788', bg: '#d8f3dc', emoji: '🛒', route: '/admin/pedidos',   show: true },
    ];

    const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

    return (
        <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={s.header}>
                <View style={s.headerTop}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={s.headerTitle}>Panel de Control</ThemedText>
                        <ThemedText style={s.headerSub}>
                            ¡Hola, {user?.nombre || 'usuario'}! 👋
                        </ThemedText>
                        <View style={s.roleBadge}>
                            <ThemedText style={s.roleBadgeText}>
                                {isAdmin ? '👑 Administrador' : '🛠️ Auxiliar'}
                            </ThemedText>
                        </View>
                    </View>
                    <View style={s.headerIconWrap}>
                        <ThemedText style={{ fontSize: 32 }}>📊</ThemedText>
                    </View>
                </View>
            </View>

            {/* Grid de Estadísticas */}
            {loading ? (
                <View style={s.loadingBox}>
                    <ActivityIndicator size="large" color="#d4956a" />
                    <ThemedText style={s.loadingText}>Cargando estadísticas...</ThemedText>
                </View>
            ) : (
                <View style={s.grid}>
                    {cards.filter(c => c.show).map((card) => (
                        <Pressable
                            key={card.title}
                            style={s.card}
                            onPress={() => push(card.route)}
                        >
                            <View style={s.cardTop}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={s.cardLabel}>{card.title}</ThemedText>
                                    <ThemedText style={s.cardValue}>{card.value}</ThemedText>
                                </View>
                                <View style={[s.cardIconBox, { backgroundColor: card.bg }]}>
                                    <Ionicons name={card.icon} size={20} color={card.color} />
                                </View>
                            </View>
                            <View style={s.cardFooter}>
                                <ThemedText style={s.cardFooterText}>Gestionar</ThemedText>
                                <Ionicons name="chevron-forward" size={13} color="#9e8879" />
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Ventas Banner */}
            {!loading && (
                <View style={s.salesBanner}>
                    <View style={s.salesIconBox}>
                        <Ionicons name="trending-up-outline" size={24} color="#d4956a" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <ThemedText style={s.salesLabel}>Ventas Totales</ThemedText>
                        <ThemedText style={s.salesValue}>{fmt(stats.ventas)}</ThemedText>
                    </View>
                </View>
            )}

            {/* Accesos Rápidos */}
            <View style={s.section}>
                <View style={s.sectionHeader}>
                    <Ionicons name="flash-outline" size={18} color="#d4956a" />
                    <ThemedText style={s.sectionTitle}>Accesos Rápidos</ThemedText>
                </View>
                <View style={s.sectionBody}>
                    <Pressable style={s.actionBtn} onPress={() => push('/admin/producto-form')}>
                        <Ionicons name="add-circle-outline" size={18} color="#d4956a" />
                        <ThemedText style={[s.actionText, { color: '#d4956a' }]}>Nuevo Producto</ThemedText>
                    </Pressable>
                    <Pressable style={s.actionBtn} onPress={() => push('/admin/categoria-form')}>
                        <Ionicons name="add-circle-outline" size={18} color="#52b788" />
                        <ThemedText style={[s.actionText, { color: '#52b788' }]}>Nueva Categoría</ThemedText>
                    </Pressable>
                    <Pressable style={s.actionBtn} onPress={() => push('/admin/pedidos')}>
                        <Ionicons name="list-outline" size={18} color="#1a6b9e" />
                        <ThemedText style={[s.actionText, { color: '#1a6b9e' }]}>Gestionar Pedidos</ThemedText>
                    </Pressable>
                    <Pressable style={s.actionBtn} onPress={() => push('/')}>
                        <Ionicons name="storefront-outline" size={18} color="#9e8879" />
                        <ThemedText style={[s.actionText, { color: '#9e8879' }]}>Visitar Tienda</ThemedText>
                    </Pressable>
                </View>
            </View>

            {/* Info de Sistema */}
            <View style={s.infoCard}>
                <ThemedText style={s.infoTitle}>Información del Sistema</ThemedText>
                <View style={s.infoRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#52b788" />
                    <ThemedText style={s.infoText}>API en línea y operativa</ThemedText>
                </View>
                <View style={s.infoRow}>
                    <Ionicons name="server-outline" size={16} color="#d4956a" />
                    <ThemedText style={s.infoText} numberOfLines={1}>Host: {API_ORIGIN_URL}</ThemedText>
                </View>
                <View style={s.infoRow}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#9e8879" />
                    <ThemedText style={s.infoText}>Conexión cifrada y segura</ThemedText>
                </View>
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fdf8f4' },
    content: { padding: 16, gap: 16, paddingBottom: 40 },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#fdf8f4' },
    restrictedTitle: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
    restrictedSub: { color: '#9e8879', fontSize: 14 },

    // Header
    header: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        shadowColor: '#c4a882',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#3d2c1e' },
    headerSub: { fontSize: 14, color: '#9e8879', marginTop: 4 },
    roleBadge: { alignSelf: 'flex-start', backgroundColor: '#fff3e6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
    roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#d4956a' },
    headerIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff9f5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8ddd5' },

    // Loading
    loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 32 },
    loadingText: { color: '#9e8879', fontSize: 13 },

    // Grid
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        width: '48%', // Entran dos por fila restando el gap
        gap: 12,
        shadowColor: '#c4a882',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardLabel: { fontSize: 12, color: '#9e8879', fontWeight: '600' },
    cardValue: { fontSize: 26, fontWeight: '800', color: '#3d2c1e', marginTop: 4 },
    cardIconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: '#f7f2ed', paddingTop: 8 },
    cardFooterText: { fontSize: 12, color: '#9e8879', fontWeight: '600' },

    // Banner de ventas
    salesBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        shadowColor: '#c4a882',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    salesIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff3e6', alignItems: 'center', justifyContent: 'center' },
    salesLabel: { fontSize: 12, color: '#9e8879', fontWeight: '600' },
    salesValue: { fontSize: 24, fontWeight: '900', color: '#d4956a' },

    // Quick Actions
    section: {
        backgroundColor: '#fff',
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e8ddd5',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff9f5',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e8ddd5',
    },
    sectionTitle: { color: '#3d2c1e', fontWeight: '800', fontSize: 14 },
    sectionBody: { padding: 14, gap: 10 },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1.5,
        borderColor: '#f0ede8',
        backgroundColor: '#fdf8f4',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    actionText: { fontWeight: '700', fontSize: 13 },

    // Info Card
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e8ddd5',
        padding: 16,
        gap: 10,
    },
    infoTitle: { fontWeight: '800', fontSize: 14, color: '#3d2c1e', marginBottom: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { color: '#7c6455', fontSize: 13, fontWeight: '500' },
});
