/**
 * Este archivo es el formulario para crear o editar un producto en el panel del admin 
 * modo crear se llega dede el boton + crear producto en admin/productos 
 * no se recibe ningun parametro de ruta 
 * modo editar se llega al precionar un producto en la lista 
 * se recibe el parametro producto en la url /api como un json
 * al guardar exitosamente regresa a la pantalla anterior con router.back()
 */

//manejo de variables de estado local
import { useEffect, useState } from 'react';
//importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseños responsivos
//flatlist lista optomizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventana emergente

import { Alert, Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

//lee los parametros de la url para obtener el id del pedido 
import { useLocalSearchParams, useRouter } from "expo-router"; //negacion y parametros de ruta 
import apiClient from '../../src/api/apiClient';
import { createProduct, updateProduct } from '../../src/services/adminService';
/**
 * tipo de producto
 * estructura del producto recibido como parametro cuando edita
 */

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

export default function AdminProductoForm() {
    /**
     * navegacion
     * use router permite cargar navegar programaticamente 
     */
    const router = useRouter();
    /**
     * Parametros de ruta
     * el parametro producto es opcional solo existe en modo editar 
     * expo Router son strings
     */
    const params = useLocalSearchParams<{ producto? : string }>();

    /**
     * Producto recibido
     * si existe el parametro intenta pasarlo como un json
     * si falla el parse (JSON malformado), lo deja como undefined (modo de creacion)
     */
    let producto: Producto | undefined;
    if (params.producto) {
        try {
            producto = JSON.parse(params.producto) as Producto;
        } catch {
            producto = undefined; //fallo silencioso se trata como formulario vacia
        }
    }

    /**
     * modo formulario
     * editing = true modo edicion (producto recibido)
     * editing = false modo creacion 
     */
    const editing = !!producto;

    /**
     * Estado local campos del formulario
     * los campos se inicializan con los valores del producto si se esta editando
     * o en cadena si vacia se esta creando
     * El operador ?? devuelve el lado derecho solo si el izquierdo es null /undefined
     */

    const [nombre, setNombre] = useState(producto?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
    //precio y stock se guardan como string para facilitar la entrada de texInput
    const [precio, setPrecio] = useState(producto?.precio?.toString() ?? '');
    const [stock, setStock] = useState(producto?.stock?.toString() ?? '');
    const [imagen, setImagen] = useState(producto?.imagen ?? '');
    const [categoriaId, setCategoriaId] = useState(producto?.categoriaId?.toString?.() ?? producto?.categoria?.id?.toString?.() ?? '');
    const [subcategoriaId, setSubcategoriaId] = useState(producto?.subcategoriaId?.toString?.() ?? producto?.subcategoria?.id?.toString?.() ?? '');
    const [categorias, setCategorias] = useState<{ id?: number | string; nombre?: string; activo?: boolean }[]>([]);
    const [subcategorias, setSubcategorias] = useState<{ id?: number | string; nombre?: string; categoriaId?: number | string; activo?: boolean }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [categoriaRes, subcategoriaRes] = await Promise.all([
                    apiClient.get('/admin/categorias'),
                    apiClient.get('/admin/subcategorias'),
                ]);

                setCategorias(categoriaRes.data?.data?.categorias || []);
                setSubcategorias(subcategoriaRes.data?.data?.subcategorias || []);
            } catch (error) {
                console.warn('No se pudieron cargar categorías o subcategorías', error);
            }
        };

        loadOptions();
    }, []);

    useEffect(() => {
        if (!categoriaId) {
            setSubcategoriaId('');
        }
    }, [categoriaId]);

    /**
     * funcion handleSubmit
     * valida los campos llama al servicio correspondiente (crear o actualizar)
     * y regresa a la pantalla anterior si fue exitoso
     */
    const handleSubmit = async () => {
        //validacion basica los campos obligatorios no pueden estar vacios
        if (!nombre || !descripcion || !precio || !stock || !categoriaId || !subcategoriaId) {
            Alert.alert('Error', 'Todos los campos obligatorios deben completarse');
            return;
        }

        setLoading(true); //deshabilita el boton durante la peticion
        try {
            const formData = new FormData();
            formData.append('nombre', nombre);
            formData.append('descripcion', descripcion);
            formData.append('precio', precio);
            formData.append('stock', stock);
            formData.append('categoriaId', categoriaId);
            formData.append('subcategoriaId', subcategoriaId);
            if (imagen) {
                formData.append('imagen', imagen);
            }

            if (editing && producto) {
                await updateProduct(String(producto.id), formData);
                Alert.alert('Exitoso', 'Producto actualizado');
            } else {
                await createProduct(formData);
                Alert.alert('Exito', 'Producto creado');
            }

            router.back(); //regresa a /admin/productos despues de guardar
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el producto');
        } finally {
            setLoading(false); //habilita el boton nuevamente
        }
    };

    // ── RENDERIZADO ───────────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* ── CAMPO: Nombre ───────────────────────────────────────────────── */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre} // Actualiza el estado al escribir.
      />

      {/* ── CAMPO: Descripción ──────────────────────────────────────────── */}
      <Text style={styles.label}>Descripcion</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline // Permite múltiples líneas para textos largos.
      />

      {/* ── CAMPO: Precio ───────────────────────────────────────────────── */}
      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric" // Muestra teclado numérico en dispositivos móviles.
      />

      {/* ── CAMPO: Stock ────────────────────────────────────────────────── */}
      <Text style={styles.label}>Stock</Text>
      <TextInput
        style={styles.input}
        value={stock}
        onChangeText={setStock}
        keyboardType="numeric"
      />

      {/* ── CAMPO: Categoría ───────────────────────────────────────────── */}
      <Text style={styles.label}>Categoría</Text>
      {categorias.length ? (
        <View style={styles.optionsContainer}>
          {categorias.map((categoria) => (
            <Pressable
              key={String(categoria.id)}
              style={[
                styles.option,
                categoriaId === String(categoria.id) && styles.optionSelected,
              ]}
              onPress={() => setCategoriaId(String(categoria.id))}
            >
              <Text style={styles.optionText}>{categoria.nombre}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.helperText}>Cargando categorías...</Text>
      )}

      {/* ── CAMPO: Subcategoría ───────────────────────────────────────── */}
      <Text style={styles.label}>Subcategoría</Text>
      {categoriaId ? (
        <View style={styles.optionsContainer}>
          {subcategorias
            .filter((sub) => String(sub.categoriaId) === String(categoriaId))
            .map((subcategoria) => (
              <Pressable
                key={String(subcategoria.id)}
                style={[
                  styles.option,
                  subcategoriaId === String(subcategoria.id) && styles.optionSelected,
                ]}
                onPress={() => setSubcategoriaId(String(subcategoria.id))}
              >
                <Text style={styles.optionText}>{subcategoria.nombre}</Text>
              </Pressable>
            ))}
          {subcategorias.filter((sub) => String(sub.categoriaId) === String(categoriaId)).length === 0 && (
            <Text style={styles.helperText}>No hay subcategorías activas para esta categoría.</Text>
          )}
        </View>
      ) : (
        <Text style={styles.helperText}>Selecciona una categoría primero.</Text>
      )}

      {/* ── CAMPO: URL Imagen ───────────────────────────────────────────── */}
      <Text style={styles.label}>URL Imagen</Text>
      <TextInput
        style={styles.input}
        value={imagen}
        onChangeText={setImagen}
        // Sin keyboardType especial: admite cualquier texto (URL o ruta).
      />

      {/* ── BOTÓN DE GUARDAR ────────────────────────────────────────────── */}
      {/* El título cambia según el modo: "Actualizar" si edita, "Crear" si es nuevo. */}
      {/* disabled evita envíos múltiples mientras loading=true. */}
      <Button
        title={editing ? 'Actualizar' : 'Crear'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor del ScrollView: padding interior, fondo blanco.
  // flexGrow: 1 hace que ocupe toda la pantalla aunque el contenido sea corto.
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  // Etiqueta de campo: negrita con margen superior para separar campos.
  label: { fontWeight: 'bold', marginTop: 10 },
  // Campo de texto: borde gris, esquinas ligeramente redondeadas, padding interior.
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, marginTop: 5, marginBottom: 10 },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5, marginBottom: 10 },
  option: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f9fafb' },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#dbeafe' },
  optionText: { color: '#111' },
  helperText: { color: '#6b7280', marginTop: 6, marginBottom: 10 },
});
