/**
 * Formulario para crear o editar un producto en el panel del admin.
 * Diseño pastel cálido • ThemedText • Botón retroceso y guardar personalizados.
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../src/api/apiClient';
import { createProduct, updateProduct } from '../../src/services/adminService';
import { API_ORIGIN_URL } from '../../src/utils/constants';
import { ThemedText } from '../../components/themed-text';
import ConfirmModal from '../../components/confirm-modal';

type Producto = {
  id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  imagen?: string;
  activo?: boolean;
  categoriaId?: number | string;
  subcategoriaId?: number | string;
  categoria?: { id?: number | string; nombre?: string };
  subcategoria?: { id?: number | string; nombre?: string };
};

type Option = {
  id?: number | string;
  nombre?: string;
  activo?: boolean;
  categoriaId?: number | string;
};

export default function AdminProductoForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ producto?: string }>();

  let producto: Producto | undefined;
  if (params.producto) {
    try {
      producto = JSON.parse(params.producto) as Producto;
    } catch {
      producto = undefined;
    }
  }

  const editing = !!producto;

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '');
  const [stock, setStock] = useState(producto?.stock?.toString() ?? '');
  const [imagen, setImagen] = useState(producto?.imagen ?? '');
  const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString?.() ?? producto?.categoria?.id?.toString?.() ?? '');
  const [subcategoriaId, setSubcategoriaId] = useState(producto?.subcategoriaId?.toString?.() ?? producto?.subcategoria?.id?.toString?.() ?? '');
  const [categorias, setCategorias] = useState<Option[]>([]);
  const [subcategorias, setSubcategorias] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const [dropdownCatOpen, setDropdownCatOpen] = useState(false);
  const [textoBuscarCategoria, setTextoBuscarCategoria] = useState('');
  const [dropdownSubOpen, setDropdownSubOpen] = useState(false);
  const [textoBuscarSubcategoria, setTextoBuscarSubcategoria] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar imágenes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoriaRes, subcategoriaRes] = await Promise.all([
          apiClient.get('/admin/categorias'),
          apiClient.get('/admin/subcategorias'),
        ]);

        const cats: Option[] = categoriaRes.data?.data?.categorias || [];
        const subs: Option[] = subcategoriaRes.data?.data?.subcategorias || [];
        setCategorias(cats);
        setSubcategorias(subs);

        const currentCatId = producto?.categoriaId?.toString?.() ?? producto?.categoria?.id?.toString?.() ?? categoriaId;
        const currentSubId = producto?.subcategoriaId?.toString?.() ?? producto?.subcategoria?.id?.toString?.() ?? subcategoriaId;

        if (currentCatId) {
          const foundCat = cats.find(c => String(c.id) === String(currentCatId));
          if (foundCat) {
            setTextoBuscarCategoria(foundCat.nombre || '');
          }
        }
        if (currentSubId) {
          const foundSub = subs.find(s => String(s.id) === String(currentSubId));
          if (foundSub) {
            setTextoBuscarSubcategoria(foundSub.nombre || '');
          }
        }
      } catch (error) {
        console.warn('No se pudieron cargar categorías o subcategorías', error);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (!categoriaId) {
      setSubcategoriaId('');
      setTextoBuscarSubcategoria('');
    }
  }, [categoriaId]);

  const handleSubmit = () => {
    if (!nombre.trim() || !descripcion.trim() || !precio.trim() || !stock.trim() || !categoriaId || !subcategoriaId) {
      Alert.alert('Error', 'Todos los campos obligatorios deben completarse');
      return;
    }
    setShowConfirmSubmit(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmSubmit(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre.trim());
      formData.append('descripcion', descripcion.trim());
      formData.append('precio', precio.trim());
      formData.append('stock', stock.trim());
      formData.append('categoriaId', categoriaId);
      formData.append('subcategoriaId', subcategoriaId);

      if (selectedImage) {
        const uri = selectedImage.uri;
        const filename = uri.split('/').pop() || 'imagen.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('imagen', {
          uri,
          name: filename,
          type,
        } as any);
      } else if (imagen) {
        formData.append('imagen', imagen);
      }

      if (editing && producto) {
        await updateProduct(String(producto.id), formData);
        router.replace({
          pathname: '/admin/productos',
          params: { toastMessage: 'Producto actualizado exitosamente', toastType: 'success' }
        });
      } else {
        await createProduct(formData);
        router.replace({
          pathname: '/admin/productos',
          params: { toastMessage: 'Producto creado exitosamente', toastType: 'success' }
        });
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el producto');
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
          <ThemedText style={s.title}>{editing ? 'Editar Producto' : 'Nuevo Producto'}</ThemedText>
          <ThemedText style={s.subtitle}>
            {editing ? `Modificando "${producto?.nombre}"` : 'Completa los campos del producto'}
          </ThemedText>
        </View>
      </View>

      {/* Icono decorativo */}
      <View style={s.iconWrap}>
        <ThemedText style={s.icon}>📦</ThemedText>
      </View>

      {/* Campo: Nombre */}
      <ThemedText style={s.label}>Nombre *</ThemedText>
      <TextInput
        style={s.input}
        placeholder="Nombre del producto"
        placeholderTextColor="#b8a99a"
        value={nombre}
        onChangeText={setNombre}
        editable={!loading}
      />

      {/* Campo: Descripción */}
      <ThemedText style={s.label}>Descripción *</ThemedText>
      <TextInput
        style={[s.input, s.textArea]}
        placeholder="Descripción completa"
        placeholderTextColor="#b8a99a"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        editable={!loading}
      />

      {/* Campo: Precio y Stock en Fila */}
      <View style={s.rowFields}>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.label}>Precio ($) *</ThemedText>
          <TextInput
            style={s.input}
            placeholder="15000"
            placeholderTextColor="#b8a99a"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.label}>Stock *</ThemedText>
          <TextInput
            style={s.input}
            placeholder="10"
            placeholderTextColor="#b8a99a"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>
      </View>

      {/* Campo: Categoría */}
      <ThemedText style={s.label}>Categoría *</ThemedText>
      {categorias.length ? (
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
                  .filter((cat) => (cat.nombre || '').toLowerCase().includes(textoBuscarCategoria.toLowerCase()))
                  .map((cat) => {
                    const isSelected = String(categoriaId) === String(cat.id);
                    return (
                      <Pressable
                        key={String(cat.id)}
                        style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                        onPress={() => {
                          setCategoriaId(String(cat.id));
                          setTextoBuscarCategoria(cat.nombre || '');
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
      ) : (
        <ThemedText style={s.helperText}>Cargando categorías...</ThemedText>
      )}

      {/* Campo: Subcategoría */}
      <ThemedText style={s.label}>Subcategoría *</ThemedText>
      {categoriaId ? (
        <View style={s.dropdownContainer}>
          <View style={s.filterSearchBox}>
            <Ionicons name="pricetag-outline" size={16} color="#d4956a" style={{ marginLeft: 4 }} />
            <TextInput
              placeholder="Buscar y seleccionar subcategoría..."
              placeholderTextColor="#9ca3af"
              value={textoBuscarSubcategoria}
              onFocus={() => setDropdownSubOpen(true)}
              onChangeText={(text) => {
                setTextoBuscarSubcategoria(text);
                setDropdownSubOpen(true);
                if (text === '') {
                  setSubcategoriaId('');
                }
              }}
              style={s.filterSearchInput}
            />
            {textoBuscarSubcategoria.length > 0 || subcategoriaId !== '' ? (
              <Pressable onPress={() => {
                setTextoBuscarSubcategoria('');
                setSubcategoriaId('');
                setDropdownSubOpen(false);
              }}>
                <Ionicons name="close-circle" size={16} color="#9e8879" />
              </Pressable>
            ) : (
              <Pressable onPress={() => setDropdownSubOpen(!dropdownSubOpen)}>
                <Ionicons name={dropdownSubOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
              </Pressable>
            )}
          </View>

          {dropdownSubOpen && (
            <View style={s.dropdownList}>
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                {subcategorias
                  .filter((sub) => String(sub.categoriaId) === String(categoriaId) && (sub.nombre || '').toLowerCase().includes(textoBuscarSubcategoria.toLowerCase()))
                  .map((sub) => {
                    const isSelected = String(subcategoriaId) === String(sub.id);
                    return (
                      <Pressable
                        key={String(sub.id)}
                        style={[s.dropdownItem, isSelected && s.dropdownItemActive]}
                        onPress={() => {
                          setSubcategoriaId(String(sub.id));
                          setTextoBuscarSubcategoria(sub.nombre || '');
                          setDropdownSubOpen(false);
                        }}
                      >
                        <ThemedText style={[s.dropdownItemText, isSelected && s.dropdownItemTextActive]}>
                          🏷️ {sub.nombre}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <ThemedText style={s.helperText}>Selecciona una categoría primero.</ThemedText>
      )}

      {/* Campo: Imagen del Producto */}
      <ThemedText style={s.label}>Imagen del Producto</ThemedText>
      <View style={s.imagePreviewContainer}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage.uri }} style={s.imagePreview} />
        ) : imagen ? (
          <Image
            source={{ uri: imagen.startsWith('http') ? imagen : `${API_ORIGIN_URL}/uploads/${imagen.replace(/^\//, '')}` }}
            style={s.imagePreview}
          />
        ) : (
          <View style={s.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#b8a99a" />
            <ThemedText style={s.imagePlaceholderText}>Sin imagen seleccionada</ThemedText>
          </View>
        )}
      </View>

      {/* Botones de Imagen */}
      <View style={s.imageButtonsContainer}>
        {!(selectedImage || imagen) ? (
          <>
            <Pressable style={s.imageBtn} onPress={pickImage} disabled={loading}>
              <Ionicons name="images-outline" size={16} color="#7c6455" />
              <ThemedText style={s.imageBtnText}>Galería</ThemedText>
            </Pressable>
            <Pressable style={s.imageBtn} onPress={takePhoto} disabled={loading}>
              <Ionicons name="camera-outline" size={16} color="#7c6455" />
              <ThemedText style={s.imageBtnText}>Cámara</ThemedText>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[s.imageBtn, s.imageBtnRemove]}
            onPress={() => {
              setSelectedImage(null);
              setImagen('');
            }}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={16} color="#c0392b" />
            <ThemedText style={s.imageBtnTextRemove}>Quitar</ThemedText>
          </Pressable>
        )}
      </View>

      {/* Botones de envío */}
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
        title={editing ? 'Guardar Cambios' : 'Crear Producto'}
        message={editing ? '¿Estás seguro de que deseas guardar los cambios realizados?' : '¿Estás seguro de que deseas crear este nuevo producto?'}
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
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#3d2c1e', width: '100%' },
  textArea: { height: 90, paddingTop: 12 },
  rowFields: { flexDirection: 'row', gap: 10, width: '100%' },

  // Tags
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8, width: '100%' },
  tagBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5' },
  tagBtnSel: { backgroundColor: '#fff3e6', borderColor: '#d4956a' },
  tagBtnText: { fontSize: 13, fontWeight: '600', color: '#7c6455' },
  tagBtnTextSel: { color: '#d4956a' },
  helperText: { fontSize: 13, color: '#9e8879', fontStyle: 'italic', marginVertical: 4 },

  // Imagen
  imagePreviewContainer: {
    width: '100%',
    height: 190,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', gap: 6 },
  imagePlaceholderText: { color: '#b8a99a', fontSize: 13, fontWeight: '500' },
  imageButtonsContainer: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  imageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 14 },
  imageBtnText: { color: '#7c6455', fontWeight: '700', fontSize: 13 },
  imageBtnRemove: { backgroundColor: '#fde8e8', borderColor: '#f4baba' },
  imageBtnTextRemove: { color: '#c0392b', fontWeight: '700', fontSize: 13 },

  // Botones inferiores
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' },
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
