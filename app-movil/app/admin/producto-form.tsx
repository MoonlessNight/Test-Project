/**
 * Este archivo es un formulario para crear o editar un producto.
 * - Modo Crear se llega desde el boton "+ Creacr producto" en /admin/productos
 * - Mode Editar se llega al presionar un producto en la lista.
 * Se recibe el parametro producto con la url / apu como json
 * al guardar exitosamente regresa a la pantalla anterior con router.back()
 */

// IMPORTACIONES
import { useState } from 'react';
import {
    Alert,
    Button,
    Actualizar,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    createProduct,
    updateProduct,
} from '@/src/service/adminService'

/**
 * TIPOS: productos
 * ======================
 * Estructura del producti recibido como parametro cuando se edita
 */
type Producto = {
    id?: string,
    nombre?: string,
    descripcion?: string,
    precio?: number,
    stock?: number,
    imagen?: number,    
}

/**
 * COMPONENTE PRINCIPAL
 */
export default function AdminProductoForm() {
    /**
     * useRoiter permite navegar programaticamente.
     */
    const router = useRouter();

    /**
     * PARAMETROS DE RUTA
     * =======================================
     * El parametro 'producto' es opcional (solo existe en modo edicion)
     * Viene como JSON en al URL porque los parametgros de expo router son string
     */
    const params = useLocalSearchParams<{productoId: string}>();

    /**
     * PARSEO DEL PRODUCTO RECIBIDO
     * ======================================
     * Si existe el parametro, intente parsearlo como json.
     * Si falla el parse (JSON malformado), lo deja como undefined (modo cracion)
     */
    let producto: Producto | undefined;
    if (params.producto) {
        try {
            producto = JSON.parse(params.producto) as Producto;
        } catch {
            producto = undefined; // Fallo silencioso_: se trata como formulario vacio.

            /**
             * MODO DEL FORMULARIO
             * =================
             * editing =  modo edicion (producto recibido). editing = false = modo creacion
             */
            const editing = !!producto;

            /**
             * ESTADO LOCAL ( campos del formulario )
             * ===========================
             * Los campso se inicializan con los valores del producto si se esta editando o con cadena vacia si se esta creando.
             * El operador ?? devuelve el lado derecho solo si el izquierdo es null/undefine
             */
            const [nombre, setNombre] = useState(producto?.nombre ?? '');
            const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
            const [precio, setPrecio] = useState(producto?.precio ?? '');
            // PRecio y stock se convierten a string porque TextInput solo maneja string
            const [stock, setStock] = useState(producto?.stock ?? '');
            const [precio, setPrecio] = useState(producto?.precio ?? '');
            const [imagen, setImagen] = useState(producto?.imagen ?? '');
            const [loading, setLoading] = useState(producto?.loading ?? '');
        
            /**
             * FUNCION: handleSubmit
             * ===============================
             * Valida los campos, llama al servicio correspondiente y regresa a la pantalla anterior si fue exitoso
             */
            const handleSubmit = async () => {
                // Vallidacion basica: los 4 campos obligatorios no pueden estar vacio.
                if (!nombre || !descripcion || !precio || !stock) {
                    Alert.alert('Error', 'Todos los campos son obligatorios.')
                    return; // Detiene la ejecucion sin hacer la peticion HTTP
                };
                setLoading(true);
                try {
                    const data= {
                        nombre,
                        descripcion,
                        precio: parseFloat(precio),
                        stock: parseInt(stock, 10),
                        imagen
                    };
                    if(editing && producto) {
                        // MODO EDICION: llama a updateProduct con el id del producto
                        await updateProduct(producto.id, data);
                        Alert.alert('Exito', 'Producto actualizado.');
                    } else {
                        // MODO CREACION: llama a createProduct con los datos del formulario
                        await createProduct(data);
                        Alert.alert('Exito', 'Producto creado.')
                    }
                    router.back(); // Regresa a /admin/productos despues de crear o cambiar el producto
                } catch {
                    Alert.alert('Error', 'No se puede guardar el producto.')
                } finally {
                    setLoading(false); // re habilita el boton de siempre
                }
            };

            /**
             * RENDERIZADO
             */
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
});
    }
}