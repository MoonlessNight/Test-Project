// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/checkout.tsx
// PROPÓSITO: Pantalla de pago (Checkout). El cliente completa los datos de envío
//   y método de pago antes de confirmar la compra.
//   - Guarda la dirección, teléfono, método de pago y notas adicionales.
//   - Llama a pedidoService.crearPedido() con los datos del formulario.
//   - Si el servidor devuelve un pedidoId, redirige a /pedido-confirmado con ese ID.
//   - Muestra pantallas de guardia si el usuario no está autenticado o el carrito está vacío.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { useMemo, useState, useEffect } from 'react';
import {
  KeyboardAvoidingView, // Evita que el teclado tape los campos en iOS.
  Platform,             // Detecta si es iOS o Android para aplicar el comportamiento correcto.
  Pressable,            // Botón táctil personalizable.
  ScrollView,           // Scroll vertical para el formulario.
  StyleSheet,
  TextInput,            // Campo de texto editable.
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router'; // Navegación programática.
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import { useCarrito } from '../src/context/CarritoContext';
import pedidoService from '../src/services/pedidoService';
import ConfirmModal from '../components/confirm-modal';

// ── TIPOS Y HELPERS DE NAVEGACIÓN ────────────────────────────────────────────
type CarritoCtx = { items: unknown[]; total: number; loading: boolean; refreshCarrito: () => Promise<void> };

const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);

// ── MÉTODOS DE PAGO ───────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { key: 'efectivo',       label: '💰 Efectivo' },
  { key: 'tarjeta',        label: '💳 Tarjeta' },
  { key: 'transferencia',  label: '📱 Transferencia' },
];

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function CheckoutScreen() {

  // ── CONTEXTOS ─────────────────────────────────────────────────────────────
  const { isAuthenticated, user } = useAuth() as any;
  const { items, total, loading, refreshCarrito } = useCarrito() as CarritoCtx;

  // ── ESTADO LOCAL (campos del formulario) ──────────────────────────────────
  const [direccionEnvio, setDireccionEnvio]     = useState('');
  const [telefono, setTelefono]                 = useState('');
  const [metodoPago, setMetodoPago]             = useState('efectivo'); // Valor por defecto: efectivo.
  const [notasAdicionales, setNotasAdicionales] = useState('');
  const [submitting, setSubmitting]             = useState(false); // true mientras se procesa el pedido.
  const [errorMessage, setErrorMessage]         = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── AUTOCOMPLETADO DESDE PERFIL ───────────────────────────────────────────
  useEffect(() => {
    if (user) {
      setDireccionEnvio((prev) => prev || user.direccion || '');
      setTelefono((prev) => prev || user.telefono || '');
    }
  }, [user]);

  // ── VALIDACIÓN REACTIVA ───────────────────────────────────────────────────
  const canSubmit = useMemo(() => {
    return direccionEnvio.trim() && telefono.trim() && items.length > 0 && !submitting;
  }, [direccionEnvio, telefono, items.length, submitting]);

  // ── GUARDIA: usuario no autenticado ───────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={64} color="#d4956a" />
        <Text style={styles.title}>Debes iniciar sesión</Text>
        <Text style={styles.subtitle}>Inicia sesión para finalizar tu compra.</Text>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
          <Text style={styles.primaryButtonText}>Ir a Cuenta</Text>
        </Pressable>
      </View>
    );
  }

  // ── GUARDIA: carrito vacío ─────────────────────────────────────────────────
  if (!loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cart-outline" size={64} color="#d4956a" />
        <Text style={styles.title}>Carrito vacío</Text>
        <Text style={styles.subtitle}>Agrega productos al carrito antes de continuar.</Text>
        <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
          <Text style={styles.primaryButtonText}>Volver a Tienda</Text>
        </Pressable>
      </View>
    );
  }

  // ── FUNCIÓN: handleConfirm ────────────────────────────────────────────────
  const handleConfirm = () => {
    setErrorMessage('');

    if (!direccionEnvio.trim()) {
      setErrorMessage('Ingresa la dirección de envío.');
      return;
    }
    if (!telefono.trim()) {
      setErrorMessage('Ingresa un teléfono de contacto.');
      return;
    }

    const phoneRegex = /^3\d{9}$/;
    if (!phoneRegex.test(telefono.trim())) {
      setErrorMessage('El teléfono debe ser un número celular de 10 dígitos (ej. 3001234567).');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmPedido = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const pedido = await pedidoService.crearPedido({
        direccionEnvio:    direccionEnvio.trim(),
        telefono:          telefono.trim(),
        metodoPago,
        notasAdicionales:  notasAdicionales.trim(),
      });

      await refreshCarrito();
      const pedidoId = pedido?.id;

      if (pedidoId) {
        routerReplace(`/pedido-confirmado?pedidoId=${pedidoId}`);
      } else {
        routerReplace('/pedido-confirmado');
      }
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible confirmar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── RENDERIZADO ───────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Finalizar Compra</Text>
          <Text style={styles.subtitle}>Completa los datos para confirmar tu pedido.</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={15} color="#e07070" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* ── SECCIÓN: datos de envío ──────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.label}>Dirección de envío *</Text>
          <TextInput
            value={direccionEnvio}
            onChangeText={setDireccionEnvio}
            placeholder="Ej: Calle 10 # 20-30, Bucaramanga"
            placeholderTextColor="#b8a99a"
            style={[styles.input, styles.multiline]}
            multiline
          />

          <Text style={styles.label}>Teléfono de contacto *</Text>
          <TextInput
            value={telefono}
            onChangeText={setTelefono}
            placeholder="3001234567"
            placeholderTextColor="#b8a99a"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          {/* ── Chips de método de pago ──────────────────────────────── */}
          <Text style={styles.label}>Método de pago *</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map((method) => {
              const selected = method.key === metodoPago;
              return (
                <Pressable
                  key={method.key}
                  onPress={() => setMetodoPago(method.key)}
                  style={[
                    styles.paymentChip,
                    selected && styles.paymentChipSelected,
                  ]}>
                  <Text style={[styles.paymentChipText, selected && styles.paymentChipTextSelected]}>
                    {method.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Notas adicionales (opcional)</Text>
          <TextInput
            value={notasAdicionales}
            onChangeText={setNotasAdicionales}
            placeholder="Indicaciones para la entrega (ej: torre, apartamento)"
            placeholderTextColor="#b8a99a"
            style={[styles.input, styles.multiline]}
            multiline
          />
        </View>

        {/* ── RESUMEN DEL PEDIDO ───────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen del pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{items.length} producto(s) en total</Text>
            <Text style={styles.summaryTotal}>${Number(total || 0).toLocaleString('es-CO')}</Text>
          </View>
        </View>

        {/* ── BOTÓN CONFIRMAR ──────────────────────────────────────────── */}
        <Pressable
          style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!canSubmit}>
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.confirmBtnText}>Confirmar Pedido</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
      
      <ConfirmModal
        visible={showConfirmModal}
        title="Confirmar Compra"
        message={`¿Estás seguro de que deseas realizar este pedido por un total de $${Number(total || 0).toLocaleString('es-CO')}?`}
        icon="cart-outline"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={confirmPedido}
        onCancel={() => setShowConfirmModal(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf8f4' },
  content: { padding: 20, gap: 14, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: '#fdf8f4', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  
  header: { alignItems: 'center', marginBottom: 6, width: '100%' },
  title: { fontSize: 22, fontWeight: '800', color: '#3d2c1e', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#9e8879', textAlign: 'center', marginTop: 4 },
  
  label: { fontSize: 13, fontWeight: '700', color: '#7c6455', marginTop: 10, marginBottom: 6 },
  section: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, gap: 4, borderWidth: 1, borderColor: '#e8ddd5', shadowColor: '#c4a882', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  
  input: { borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#fff9f5', color: '#3d2c1e', fontSize: 14, height: 46 },
  multiline: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  paymentChip: { borderWidth: 1, borderColor: '#e8ddd5', borderRadius: 20, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9 },
  paymentChipSelected: { backgroundColor: '#fff3e6', borderColor: '#d4956a' },
  paymentChipText: { color: '#7c6455', fontWeight: '600', fontSize: 13 },
  paymentChipTextSelected: { color: '#d4956a', fontWeight: '700' },
  
  summaryCard: { backgroundColor: '#ffffff', borderRadius: 24, borderWidth: 1, borderColor: '#e8ddd5', padding: 20, gap: 10, shadowColor: '#c4a882', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2, marginVertical: 8 },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#3d2c1e' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  summaryText: { fontSize: 13, color: '#9e8879', fontWeight: '600' },
  summaryTotal: { fontSize: 18, fontWeight: '800', color: '#192847' },
  
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, backgroundColor: '#d4956a', marginTop: 12, height: 48, shadowColor: '#d4956a', shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  
  primaryButton: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#192847', marginTop: 12, height: 48 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fde8e8', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f4baba', width: '100%', marginBottom: 4 },
  errorText: { color: '#e07070', fontSize: 13, flex: 1, fontWeight: '600' },
});
