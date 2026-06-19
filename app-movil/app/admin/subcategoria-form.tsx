/**
 * Formulario para crear o editar una subcategoría — panel de administración.
 * Modo crear: llega desde "+ Nueva" en subcategorias.tsx
 * Modo editar: llega al presionar "Editar" en el modal de detalle
 * Carga la lista de categorías activas para el selector de categoría padre
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../../components/themed-text';
import apiClient from '../../src/api/apiClient';

type Subcategoria = {
  id?: number | string;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  categoriaId?: number | string;
  categoria?: { nombre?: string };
};

type Categoria = {
  id: number | string;
  nombre: string;
  activo?: boolean;
};

export default function AdminSubcategoriaForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subcategoria?: string }>();

  let subcategoria: Subcategoria | undefined;
  if (params.subcategoria) {
    try { subcategoria = JSON.parse(params.subcategoria) as Subcategoria; } catch { /* noop */ }
  }

  const editing = !!subcategoria;

  const [nombre, setNombre] = useState(subcategoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(subcategoria?.descripcion ?? '');
  const [categoriaId, setCategoriaId] = useState<number | string>(subcategoria?.categoriaId ?? '');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loading, setLoading] = useState(false);

  // Carga la lista de categorías para el picker
  useEffect(() => {
    apiClient.get('/admin/categorias')
      .then(res => {
        const data: Categoria[] = (res.data?.data?.categorias || []).filter((c: Categoria) => c.activo !== false);
        setCategorias(data);
        // Si estamos editando y no hay categoriaId seteado, intentamos matchear
        if (subcategoria?.categoriaId && !categoriaId) {
          setCategoriaId(subcategoria.categoriaId);
        }
      })
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las categorías'))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleSubmit = async () => {
    if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (!categoriaId) { Alert.alert('Error', 'Debes seleccionar una categoría'); return; }

    setLoading(true);
    try {
      if (editing && subcategoria?.id) {
        await apiClient.put(`/admin/subcategorias/${subcategoria.id}`, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          categoriaId,
        });
      } else {
        await apiClient.post('/admin/subcategorias', {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          categoriaId,
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('Error', (error as Error)?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Encabezado */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#7c6455" />
        </Pressable>
        <View style={s.headerText}>
          <ThemedText style={s.title}>{editing ? 'Editar Subcategoría' : 'Nueva Subcategoría'}</ThemedText>
          <ThemedText style={s.subtitle}>{editing ? `Modificando "${subcategoria?.nombre}"` : 'Completa los campos para crear'}</ThemedText>
        </View>
      </View>

      {/* Icono decorativo */}
      <View style={s.iconWrap}>
        <ThemedText style={s.icon}>🏷️</ThemedText>
      </View>

      {/* Campo: Nombre */}
      <ThemedText style={s.label}>Nombre *</ThemedText>
      <TextInput
        style={s.input}
        placeholder="Nombre de la subcategoría"
        placeholderTextColor="#b8a99a"
        value={nombre}
        onChangeText={setNombre}
        editable={!loading}
      />

      {/* Campo: Descripción */}
      <ThemedText style={s.label}>Descripción</ThemedText>
      <TextInput
        style={[s.input, s.textArea]}
        placeholder="Descripción opcional"
        placeholderTextColor="#b8a99a"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        editable={!loading}
      />

      {/* Selector de categoría padre */}
      <ThemedText style={s.label}>Categoría padre *</ThemedText>
      {loadingCats ? (
        <ActivityIndicator color="#d4956a" style={{ marginVertical: 12 }} />
      ) : (
        <View style={s.catGrid}>
          {categorias.map(cat => (
            <Pressable
              key={String(cat.id)}
              style={[s.catBtn, categoriaId === cat.id && s.catBtnSelected]}
              onPress={() => setCategoriaId(cat.id)}
            >
              <ThemedText style={[s.catBtnText, categoriaId === cat.id && s.catBtnTextSelected]}>
                {cat.nombre}
              </ThemedText>
              {categoriaId === cat.id && <Ionicons name="checkmark-circle" size={14} color="#d4956a" />}
            </Pressable>
          ))}
        </View>
      )}

      {/* Botones */}
      <View style={s.btnRow}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()} disabled={loading}>
          <ThemedText style={s.cancelBtnText}>Cancelar</ThemedText>
        </Pressable>
        <Pressable style={[s.saveBtn, loading && s.saveBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <><Ionicons name={editing ? 'save-outline' : 'add-circle-outline'} size={18} color="#fff" /><ThemedText style={s.saveBtnText}>{editing ? 'Guardar' : 'Crear'}</ThemedText></>
          }
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fdf8f4', flexGrow: 1, gap: 4, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8ddd5' },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#3d2c1e' },
  subtitle: { fontSize: 12, color: '#9e8879' },
  iconWrap: { alignSelf: 'center', marginBottom: 8 },
  icon: { fontSize: 48 },
  label: { fontSize: 13, fontWeight: '700', color: '#7c6455', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#3d2c1e' },
  textArea: { height: 90, paddingTop: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5' },
  catBtnSelected: { backgroundColor: '#fff3e6', borderColor: '#d4956a' },
  catBtnText: { fontSize: 13, fontWeight: '600', color: '#7c6455' },
  catBtnTextSelected: { color: '#d4956a' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f0ede8', alignItems: 'center' },
  cancelBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#d4956a' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
