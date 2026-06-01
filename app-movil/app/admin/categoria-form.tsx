/**
 * Formulario para crear o editar una categoría en el panel de administración
 * Modo crear: se llega desde el botón "+ Crear categoría" en admin/categorias
 * Modo editar: se llega al presionar una categoría en la lista
 * Después de guardar, regresa a admin/categorias con router.back()
 */

import { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import apiClient from '../../src/api/apiClient';

/**
 * Tipo de categoría
 * Estructura de la categoría recibida como parámetro cuando se edita
 */
type Categoria = {
    id?: string | number;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
};

export default function AdminCategoriaForm() {
    const router = useRouter();
    const params = useLocalSearchParams<{ categoria?: string }>();

    /**
     * Categoría recibida
     * Si existe el parámetro, intenta parsearlo como JSON
     * Si falla, lo deja como undefined (modo de creación)
     */
    let categoria: Categoria | undefined;
    if (params.categoria) {
        try {
            categoria = JSON.parse(params.categoria) as Categoria;
        } catch {
            categoria = undefined;
        }
    }

    const editing = !!categoria;

    /**
     * Estado local - campos del formulario
     * Se inicializa con los valores de la categoría si se está editando
     * O en cadena vacía si se está creando
     */
    const [nombre, setNombre] = useState(categoria?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
    const [loading, setLoading] = useState(false);

    /**
     * Función handleSubmit
     * Valida los campos, llama al servicio correspondiente (crear o actualizar)
     * y regresa a la pantalla anterior si fue exitoso
     */
    const handleSubmit = async () => {
        // Validación: el nombre es obligatorio
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre de la categoría es obligatorio');
            return;
        }

        setLoading(true);
        try {
            if (editing && categoria?.id) {
                // Modo edición: actualizar categoría existente
                await apiClient.put(`/admin/categorias/${categoria.id}`, {
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim() || null,
                });
                Alert.alert('Exitoso', 'Categoría actualizada');
            } else {
                // Modo creación: crear nueva categoría
                await apiClient.post('/admin/categorias', {
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim() || null,
                });
                Alert.alert('Exitoso', 'Categoría creada');
            }

            router.back(); // Regresa a /admin/categorias después de guardar
        } catch (error) {
            const errorMsg = (error as Error)?.message || 'No se pudo guardar la categoría';
            Alert.alert('Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // ── RENDERIZADO ───────────────────────────────────────────────────────────
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{editing ? 'Editar Categoría' : 'Crear Categoría'}</Text>

            {/* ── CAMPO: Nombre ───────────────────────────────────────────────── */}
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
                style={styles.input}
                placeholder="Nombre de la categoría"
                value={nombre}
                onChangeText={setNombre}
                editable={!loading}
            />

            {/* ── CAMPO: Descripción ──────────────────────────────────────────── */}
            <Text style={styles.label}>Descripción</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción de la categoría (opcional)"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
                editable={!loading}
            />

            {/* ── BOTÓN DE GUARDAR ────────────────────────────────────────────── */}
            <View style={styles.buttonContainer}>
                <Button
                    title={editing ? 'Actualizar' : 'Crear'}
                    onPress={handleSubmit}
                    disabled={loading}
                />
            </View>

            {/* ── BOTÓN DE CANCELAR ────────────────────────────────────────────── */}
            <View style={styles.buttonContainer}>
                <Button
                    title="Cancelar"
                    onPress={() => router.back()}
                    color="#999"
                    disabled={loading}
                />
            </View>
        </ScrollView>
    );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#111',
    },
    label: {
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        textAlignVertical: 'top',
        height: 100,
    },
    buttonContainer: {
        marginTop: 15,
        marginBottom: 10,
    },
});
