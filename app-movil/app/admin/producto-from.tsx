/**
 * Este archivo es el formulario para crear o editar un producto en el panel del admin 
 * modo crear se llega dede el boton + crear producto en admin/productos 
 * no se recibe ningun parametro de ruta 
 * modo editar se llega al precionar un producto en la lista 
 * se recibe el parametro producto en la url /api como un json
 * al guardar exitosamente regresa a la pantalla anterior con router.back()
 */

//manejo de variables de estado local
import { useState } from 'react';
//importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseños responsivos
//flatlist lista optomizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventana emergente

import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

//lee los parametros de la url para obtener el id del pedido 
import { useLocalSearchParams, useRouter } from "expo-router"; //negacion y parametros de ruta 
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
    const [precio, setPrecio] = useState(producto?.precio?.toString ?? '');
    const [stock, setStock] = useState(producto?.stock?.toString ?? '');
    const [imagen, setImagen] = useState(producto?.imagen ?? '');
    const [loading, setLoading] = useState(false);

    /**
     * funcion handleSubmit
     * valida los campos llama al servicio correspondiente (crear o actualizar)
     * y regresa a la pantalla anterior si fue exitoso
     */
    const handleSubmit = async () => {
        //validacion basica los 4 campos obligatorios no pueden estar vacios
        if (!nombre || !descripcion || !precio || !stock) {
            Alert.alert('Error', 'Todos los campos obligatorios');
            return; //
        }

        setLoading(true); //deshabilita el boton durante la peticion
        try {
            //construye el objeto de datos covirtiendo precio y stock a numericos
            const data = {
                nombre,
                descripcion,
                precio: parseFloat(precio),
                stock: parseInt(stock, 10),
                imagen,
            };

            if(editing && producto) {
                //modo edicion llama a updateProduct con el id del producto
                //se usa id como fallback
                await updateProduct(producto.id || producto.id, data);
                Alert.alert('Exitoso', 'producto actualizado');
            } else {
                //cuando el formulario esta vacio se comporta como creacion
                await createProduct(data);
                Alert.alert('Exito', 'producto creado');
            }
            router.back(); //regresa a /admin/productos despues de guardar
        } catch {
            Alert.alert('Error', 'No se pudo guardar el producto');
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
