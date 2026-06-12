/**
 * Gestión de categorías en el panel de administración
 * Lista de todas las categorías del sistema con descripción y estado
 * Permite buscar en tiempo real y navega entre páginas
 * Solo administradores pueden eliminar categorías
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext'

/**
 * tipo de categoria
 * estructura de la categoria recibida del backend
 */
type Categoria = {
    id?: number | string;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
};

type AuthUser = { rol?: string };

/**
 * helpers de navegacion 
 */
const push = (path: string) => 
(router as unknown as { push: (p: string) => void}).push(path);

const pushParams = (pathname: string, params: Record<string, string>) =>
(router as unknown as { push: (p: {pathname: string; params: Record<string, string> }) => void }).push({ pathname, params});

export default function AdminCategoriasScreen() {
    const { user } = useAuth() as { user: AuthUser | null };
    
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchCategorias = async (search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const res = await apiClient.get('/admin/categorias');
            const categoriasData: Categoria[] = res.data?.data?.categorias || [];
            setCategorias(categoriasData);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias();
    }, []);

    const isAdmin = user?.rol === 'administrador';

    // ── RENDERIZADO ───────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">Categorías</ThemedText>
                <ThemedText style={styles.subtitle}>Administra tus categorías de forma rápida y clara.</ThemedText>
            </View>

            {/* Botón para crear una nueva categoría */}
            <Pressable 
                style={styles.createBtn} 
                onPress={() => push('/admin/categoria-form')}
            >
                <ThemedText style={styles.createBtnText}>+ Crear</ThemedText>
            </Pressable>

            {/* Spinner de carga */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText>Cargando categorías...</ThemedText>
                </View>
            ) : null}

            {/* Mensaje de error */}
            {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

            {/* ── LISTA DE CATEGORÍAS ──────────────────────────────────────────── */}
            <FlatList
                data={categorias}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {/* Área presionable para editar */}
                        <Pressable
                            style={{ flex: 1 }}
                            onPress={() => pushParams('/admin/categoria-form', { categoria: JSON.stringify(item) })}
                        >
                            <View style={styles.cardBody}>
                                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{item.nombre}</ThemedText>
                                <ThemedText style={styles.cardDescription} numberOfLines={2}>{item.descripcion || 'Sin descripción'}</ThemedText>
                            </View>
                        </Pressable>

                        {/* ── BOTÓN DE ESTADO (solo admin) ──────────────────────── */}
                        {isAdmin && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[styles.actionBtn, styles.viewBtn]}
                                    onPress={() => pushParams('/admin/categoria-form', { categoria: JSON.stringify(item) })}
                                >
                                    <ThemedText style={[styles.actionBtnText, styles.viewBtnText]}>Ver</ThemedText>
                                </Pressable>
                                <Pressable
                                    style={[
                                        styles.actionBtn,
                                        item.activo ? styles.deactivateBtn : styles.activateBtn,
                                    ]}
                                    onPress={async () => {
                                        try {
                                            await apiClient.patch(`/admin/categorias/${item.id}/toggle`);
                                            fetchCategorias();
                                        } catch {
                                            Alert.alert('Error', 'No se pudo cambiar el estado');
                                        }
                                    }}
                                >
                                    <ThemedText style={styles.actionBtnText}>{item.activo ? 'Desactivar' : 'Activar'}</ThemedText>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
                ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay categorías.</ThemedText> : null}
                style={styles.list}
            />
        </View>
    );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, padding: 14, gap: 10, backgroundColor: '#f8fafc' },
    header: { gap: 4, marginBottom: 10 },
    centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
    subtitle: { color: '#64748b', fontSize: 13, lineHeight: 18, maxWidth: '92%' },
    error: { color: '#ef4444' },
    createBtn: { backgroundColor: '#0f172a', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    createBtnText: { color: '#fff', fontWeight: '700', letterSpacing: 0.4 },
    list: { flex: 1 },
    card: { borderRadius: 16, padding: 14, backgroundColor: '#fff', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
    cardBody: { gap: 8 },
    cardTitle: { fontSize: 15, color: '#0f172a' },
    cardDescription: { color: '#475569', fontSize: 13, lineHeight: 18 },
    actionsRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    viewBtn: { backgroundColor: '#e2e8f0' },
    viewBtnText: { color: '#0f172a' },
    deactivateBtn: { backgroundColor: '#047857' },
    activateBtn: { backgroundColor: '#2563eb' },
});
