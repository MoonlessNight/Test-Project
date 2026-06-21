/**
 * Formulario para crear o editar una categoría en el panel de administración.
 * Diseño pastel cálido • ThemedText • Botón retroceso y guardar personalizados.
 */

import { useState } from 'react';
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

type Categoria = {
  id?: string | number;
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
};

export default function AdminCategoriaForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoria?: string }>();

  let categoria: Categoria | undefined;
  if (params.categoria) {
    try {
      categoria = JSON.parse(params.categoria) as Categoria;
    } catch {
      categoria = undefined;
    }
  }

  const editing = !!categoria;

  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [loading, setLoading] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const handleSubmit = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre de la categoría es obligatorio');
      return;
    }
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmSubmit(false);
    setLoading(true);
    try {
      if (editing && categoria?.id) {
        await apiClient.put(`/admin/categorias/${categoria.id}`, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
        });
        router.replace({
          pathname: '/admin/categorias',
          params: { toastMessage: 'Categoría actualizada exitosamente', toastType: 'success' }
        });
      } else {
        await apiClient.post('/admin/categorias', {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
        });
        router.replace({
          pathname: '/admin/categorias',
          params: { toastMessage: 'Categoría creada exitosamente', toastType: 'success' }
        });
      }
    } catch (error) {
      const errorMsg = (error as Error)?.message || 'No se pudo guardar la categoría';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Encabezado */}
      <View style={s.header}>
        <View style={s.headerText}>
          <ThemedText style={s.title}>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</ThemedText>
          <ThemedText style={s.subtitle}>
            {editing ? `Modificando "${categoria?.nombre}"` : 'Completa los campos para crear'}
          </ThemedText>
        </View>
      </View>

      {/* Icono decorativo */}
      <View style={s.iconWrap}>
        <ThemedText style={s.icon}>🗂️</ThemedText>
      </View>

      {/* Campo: Nombre */}
      <ThemedText style={s.label}>Nombre *</ThemedText>
      <TextInput
        style={s.input}
        placeholder="Nombre de la categoría"
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
        numberOfLines={4}
        textAlignVertical="top"
        editable={!loading}
      />

      {/* Botones */}
      <View style={s.btnRow}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()} disabled={loading}>
          <ThemedText style={s.cancelBtnText}>Cancelar</ThemedText>
        </Pressable>
        <Pressable
          style={[s.saveBtn, loading && s.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={editing ? 'save-outline' : 'add-circle-outline'} size={18} color="#fff" />
              <ThemedText style={s.saveBtnText}>{editing ? 'Guardar' : 'Crear'}</ThemedText>
            </>
          )}
        </Pressable>
      </View>
      </ScrollView>
      <ConfirmModal
        visible={showConfirmSubmit}
        title={editing ? 'Guardar Cambios' : 'Crear Categoría'}
        message={editing ? '¿Estás seguro de que deseas guardar los cambios realizados?' : '¿Estás seguro de que deseas crear esta nueva categoría?'}
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
  textArea: { height: 110, paddingTop: 12 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f0ede8', alignItems: 'center' },
  cancelBtnText: { color: '#9e8879', fontWeight: '700', fontSize: 15 },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#d4956a' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
