import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

type Subcategoria = {
  id?: number | string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  categoriaId?: number | string;
  categoria?: {
    nombre?: string;
  };
};

type AuthUser = { rol?: string };

export default function AdminSubcategoriasScreen() {
  const { user } = useAuth() as { user: AuthUser | null };
  const isAdmin = user?.rol === 'administrador';

  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const fetchSubcategorias = async (search = '') => {
    setLoading(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams();
      params.set('incluirCategoria', 'true');
      if (search.trim()) params.set('buscar', search.trim());

      const res = await apiClient.get(`/admin/subcategorias?${params.toString()}`);
      const data: Subcategoria[] = res.data?.data?.subcategorias || [];
      setSubcategorias(data);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'Error al cargar subcategorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategorias('');
  }, []);

  return (
    <View style={styles.container}>
      <ThemedText type="title">Subcategorías</ThemedText>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="Buscar subcategoría..."
          value={busqueda}
          onChangeText={(text) => {
            setBusqueda(text);
            fetchSubcategorias(text);
          }}
          style={styles.input}
        />
        <Pressable style={styles.searchBtn} onPress={() => fetchSubcategorias(busqueda)}>
          <ThemedText style={styles.searchBtnText}>Buscar</ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText>Cargando subcategorías...</ThemedText>
        </View>
      ) : null}

      {errorMessage ? <ThemedText style={styles.error}>{errorMessage}</ThemedText> : null}

      <FlatList
        data={subcategorias}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <ThemedText type="defaultSemiBold">{item.nombre || 'Sin nombre'}</ThemedText>
              <ThemedText numberOfLines={2}>{item.descripcion || 'Sin descripción'}</ThemedText>
              <ThemedText style={styles.meta}>
                {item.categoria?.nombre ? `Categoría: ${item.categoria.nombre}` : 'Sin categoría'}
              </ThemedText>
              <ThemedText style={styles.meta}>{item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
            </View>

            {isAdmin && (
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: item.activo ? '#b93a32' : '#218f4c' }]}
                  onPress={async () => {
                    try {
                      await apiClient.put(`/admin/subcategorias/${item.id}`, {
                        nombre: item.nombre,
                        descripcion: item.descripcion,
                        categoriaId: item.categoriaId,
                        activo: !item.activo,
                      });
                      fetchSubcategorias(busqueda);
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
                    Alert.alert('Eliminar subcategoría', '¿Está seguro de eliminar esta subcategoría?', [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await apiClient.delete(`/admin/subcategorias/${item.id}`);
                            fetchSubcategorias(busqueda);
                          } catch {
                            Alert.alert('Error', 'No se pudo eliminar la subcategoría');
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
        ListEmptyComponent={!loading && !errorMessage ? <ThemedText>No hay subcategorías.</ThemedText> : null}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  centered: { alignItems: 'center', gap: 10, marginVertical: 20 },
  error: { color: '#b93a32' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d5d5d5', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#fff' },
  searchBtn: { backgroundColor: '#0a7ea4', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontWeight: '700' },
  list: { flex: 1 },
  card: { flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 12, padding: 10, backgroundColor: '#fff', marginBottom: 8, alignItems: 'center' },
  cardBody: { flex: 1, gap: 2 },
  meta: { color: '#666', fontSize: 12 },
  actionsRow: { flexDirection: 'column', gap: 6, marginLeft: 8 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
