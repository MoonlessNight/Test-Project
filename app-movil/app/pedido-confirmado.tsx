// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/pedido-confirmado.tsx
// PROPÓSITO: Pantalla de éxito tras confirmar una compra.
//   - Recibe el parámetro ?pedidoId=... en la URL.
//   - Muestra un banner y resumen de confirmación centrado y minimalista.
//   - Ofrece botones para ver todos los pedidos o seguir comprando.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/themed-text';
import pedidoService from '../src/services/pedidoService';

type Pedido = {
  id?: string;
  _id?: string;
  estado?: string;
  total?: number;
  direccionEnvio?: string;
  telefono?: string;
};

function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

export default function PedidoConfirmadoScreen() {
  const { pedidoId } = useLocalSearchParams();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(Boolean(pedidoId));
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadPedido = async () => {
      if (!pedidoId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');
      try {
        const data = await pedidoService.getPedidoById(pedidoId);
        setPedido(data);
      } catch (error: unknown) {
        setErrorMessage((error as { message?: string })?.message || 'No se pudo cargar la información del pedido.');
      } finally {
        setLoading(false);
      }
    };

    loadPedido();
  }, [pedidoId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d4956a" />
          <Text style={styles.loadingText}>Cargando información del pedido...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle-outline" size={54} color="#d4956a" />
        </View>

        {/* Success Title & Message */}
        <Text style={styles.title}>¡Pedido Confirmado!</Text>
        <Text style={styles.subtitle}>
          Tu pedido se ha generado correctamente. Hemos recibido tu compra y ya estamos procesándola.
        </Text>

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}

        {/* Receipt-style Card */}
        {pedido ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen de Compra</Text>
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pedido ID</Text>
              <Text style={styles.infoValue}>#{pedido.id || pedido._id}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección de envío</Text>
              <Text style={styles.infoValue}>{pedido.direccionEnvio || '-'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Teléfono</Text>
              <Text style={styles.infoValue}>{pedido.telefono || '-'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total pagado</Text>
              <Text style={styles.totalValue}>{formatCOP(pedido.total)}</Text>
            </View>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/mis-pedidos')}>
            <Text style={styles.primaryButtonText}>Ver mis pedidos</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Seguir comprando</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdf8f4' },
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { color: '#9e8879', fontSize: 14, fontWeight: '600' },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 149, 106, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3d2c1e',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9e8879',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  error: { color: '#e07070', fontWeight: '600', textAlign: 'center', marginVertical: 4 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 18,
    width: '100%',
    maxWidth: 320,
    gap: 2,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3d2c1e',
    paddingVertical: 4,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 12, color: '#9e8879', fontWeight: '600' },
  infoValue: { fontSize: 12, color: '#3d2c1e', fontWeight: '700' },
  totalValue: { fontSize: 14, color: '#192847', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f3ece6' },
  buttonsContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192847',
    height: 48,
    shadowColor: '#192847',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e8ddd5',
    height: 48,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  secondaryButtonText: { color: '#9e8879', fontWeight: '700', fontSize: 14 },
});
