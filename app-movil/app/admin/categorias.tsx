/**
 * Gestión de categorías en el panel de administración
 * Lista de todas las categorías del sistema con descripción y estado
 * Permite buscar en tiempo real y navega entre páginas
 * Solo administradores pueden eliminar categorías
 */

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
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
    const [busqueda, setBusqueda] = useState('');

    const fetchCategorias = async (search = '') => {
        setLoading(true);
        setErrorMessage('');
        try {
            const params: string[] = [];
            if (search.trim()) params.push(`buscar=${encodeURIComponent(search.trim())}`);
            const url = `/admin/categorias?${params.length ? params.join('&') : ''}`;
            
            const res = await apiClient.get(url);
            const categoriasData: Categoria[] = res.data?.data?.categorias || [];
            setCategorias(categoriasData);
        } catch (error: unknown) {
            setErrorMessage((error as { message?: string })?.message || 'Error al cargar categorías');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategorias('');
    }, []);

    const isAdmin = user?.rol === 'administrador';

    // ── RENDERIZADO ───────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <ThemedText type="title">Categorías</ThemedText>

            {/* ── BARRA DE BÚSQUEDA ──────────────────────────────────────────── */}
            <View style={styles.searchRow}>
                <TextInput
                    placeholder="Buscar categoría..."
                    value={busqueda}
                    onChangeText={(text) => {
                        setBusqueda(text);
                        fetchCategorias(text);
                    }}
                    style={styles.input}
                />
                <Pressable style={styles.searchBtn} onPress={() => fetchCategorias(busqueda)}>
                    <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
                </Pressable>
            </View>

            {/* Botón para crear una nueva categoría */}
            <Pressable 
                style={styles.createBtn} 
                onPress={() => push('/admin/categoria-form')}
            >
                <ThemedText style={styles.createBtnText}>+ Crear categoría</ThemedText>
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
                                <ThemedText type="defaultSemiBold">{item.nombre}</ThemedText>
                                <ThemedText numberOfLines={2}>{item.descripcion || 'Sin descripción'}</ThemedText>
                                <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                            </View>
                        </Pressable>

                        {/* ── BOTONES DE ACCIÓN (solo admin) ──────────────────────── */}
                        {isAdmin && (
                            <View style={styles.actionsRow}>
                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: item.activo ? '#b93a32' : '#218f4c' }]}
                                    onPress={async () => {
                                        try {
                                            await apiClient.patch(`/admin/categorias/${item.id}/toggle`);
                                            fetchCategorias(busqueda);
                                        } catch {
                                            Alert.alert('Error', 'No se pudo cambiar el estado');
                                        }
                                    }}
                                >
                                    <ThemedText style={styles.actionBtnText}>{item.activo ? 'Desactivar' : 'Activar'}</ThemedText>
                                </Pressable>

                                <Pressable
                                    style={[styles.actionBtn, { backgroundColor: '#b93a32' }]}
                                    onPress={() => {
                                        Alert.alert('Eliminar categoría', '¿Está seguro de eliminar esta categoría?', [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Eliminar',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await apiClient.delete(`/admin/categorias/${item.id}`);
                                                        fetchCategorias(busqueda);
                                                    } catch {
                                                        Alert.alert('Error', 'No se pudo eliminar la categoría');
                                                    }
                                                },
                                            },
                                        ]);
                                    }}
                                >
                                    <ThemedText style={styles.actionBtnText}>Eliminar</ThemedText>
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
    container: { flex: 1, padding: 16, gap: 10 },
    centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
    error: { color: '#b93a32' },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
    searchBtn: { backgroundColor: '#0a7ea4', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
    searchBtnText: { color: '#fff', fontWeight: '700' },
    createBtn: { backgroundColor: '#218f4c', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
    createBtnText: { color: '#fff', fontWeight: '700' },
    list: { flex: 1 },
    card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 10, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
    actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
    actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, marginBottom: 2 },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    cardBody: { flex: 1, gap: 2 },
    meta: { color: '#666', fontSize: 12 },
});
