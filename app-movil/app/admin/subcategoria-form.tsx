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
import ConfirmModal from '../../components/confirm-modal';

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
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const [dropdownCatOpen, setDropdownCatOpen] = useState(false);
  const [textoBuscarCategoria, setTextoBuscarCategoria] = useState('');

  // Carga la lista de categorías para el picker
  useEffect(() => {
    apiClient.get('/admin/categorias')
      .then(res => {
        const data: Categoria[] = (res.data?.data?.categorias || []).filter((c: Categoria) => c.activo !== false);
        setCategorias(data);
        // Si estamos editando y no hay categoriaId seteado, intentamos matchear
        const selectedId = subcategoria?.categoriaId ?? categoriaId;
        if (selectedId) {
          setCategoriaId(selectedId);
          const found = data.find(c => String(c.id) === String(selectedId));
          if (found) {
            setTextoBuscarCategoria(found.nombre);
          }
        }
      })
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las categorías'))
      .finally(() => setLoadingCats(false));
  }, []);

  const handleSubmit = () => {
    if (!nombre.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (!categoriaId) { Alert.alert('Error', 'Debes seleccionar una categoría'); return; }
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmSubmit(false);
    setLoading(true);
    try {
      if (editing && subcategoria?.id) {
        await apiClient.put(`/admin/subcategorias/${subcategoria.id}`, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          categoriaId,
        });
        router.replace({
          pathname: '/admin/subcategorias',
          params: { toastMessage: 'Subcategoría actualizada exitosamente', toastType: 'success' }
        });
      } else {
        await apiClient.post('/admin/subcategorias', {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          categoriaId,
        });
        router.replace({
          pathname: '/admin/subcategorias',
          params: { toastMessage: 'Subcategoría creada exitosamente', toastType: 'success' }
        });
      }
    } catch (error) {
      Alert.alert('Error', (error as Error)?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Encabezado */}
      <View style={s.header}>
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
        <View style={s.dropdownContainer}>
          <View style={s.filterSearchBox}>
            <Ionicons name="folder-open-outline" size={16} color="#d4956a" style={{ marginLeft: 4 }} />
            <TextInput
              placeholder="Buscar y seleccionar categoría..."
              placeholderTextColor="#9ca3af"
              value={textoBuscarCategoria}
              onFocus={() => setDropdownCatOpen(true)}
              onChangeText={(text) => {
                setTextoBuscarCategoria(text);
                setDropdownCatOpen(true);
                if (text === '') {
                  setCategoriaId('');
                }
              }}
              style={s.filterSearchInput}
            />
            {textoBuscarCategoria.length > 0 || categoriaId !== '' ? (
              <Pressable onPress={() => {
                setTextoBuscarCategoria('');
                setCategoriaId('');
                setDropdownCatOpen(false);
              }}>
                <Ionicons name="close-circle" size={16} color="#9e8879" />
              </Pressable>
            ) : (
              <Pressable onPress={() => setDropdownCatOpen(!dropdownCatOpen)}>
                <Ionicons name={dropdownCatOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
              </Pressable>
            )}
          </View>

          {dropdownCatOpen && (
            <View style={s.dropdownList}>
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                {categorias
                  .filter((cat) => cat.nombre.toLowerCase().includes(textoBuscarCategoria.toLowerCase()))
                  .map((cat) => {
                    const isSelected = String(categoriaId) === String(cat.id);
                    return (
                      <Pressable
                        key={String(cat.id)}
                        style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                        onPress={() => {
                          setCategoriaId(cat.id);
                          setTextoBuscarCategoria(cat.nombre);
                          setDropdownCatOpen(false);
                        }}
                      >
                        <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                          📁 {cat.nombre}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </View>
          )}
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
      <ConfirmModal
        visible={showConfirmSubmit}
        title={editing ? 'Guardar Cambios' : 'Crear Subcategoría'}
        message={editing ? '¿Estás seguro de que deseas guardar los cambios realizados?' : '¿Estás seguro de que deseas crear esta nueva subcategoría?'}
        icon={editing ? 'save-outline' : 'add-circle-outline'}
        confirmText={editing ? 'Guardar' : 'Crear'}
        cancelText="Cancelar"
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
      />
    </>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fdf8f4', flexGrow: 1, gap: 4, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 16, width: '100%' },
  headerText: { alignItems: 'center', width: '100%' },
  title: { fontSize: 20, fontWeight: '800', color: '#3d2c1e', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#9e8879', textAlign: 'center' },
  iconWrap: { alignSelf: 'center', marginBottom: 8 },
  icon: { fontSize: 48 },
  label: { fontSize: 13, fontWeight: '700', color: '#7c6455', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#3d2c1e' },
  textArea: { height: 90, paddingTop: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f0ede8', alignItems: 'center' },
  cancelBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#d4956a' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Dropdown styles
  dropdownContainer: { position: 'relative', zIndex: 10, width: '100%', marginBottom: 8 },
  filterSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 12, height: 48, gap: 8 },
  filterSearchInput: { flex: 1, fontSize: 15, color: '#3d2c1e', padding: 0 },
  dropdownList: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e8ddd5', marginTop: 4, shadowColor: '#c4a882', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#fdf8f4' },
  dropdownItemActive: { backgroundColor: '#fff3e6' },
  dropdownItemText: { fontSize: 14, color: '#3d2c1e', fontWeight: '500' },
  dropdownItemTextActive: { color: '#d4956a', fontWeight: '700' },
});

