import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../src/context/AuthContext';
import pedidoService from '../src/services/pedidoService';

type Pedido = {
  id?: string;
  _id?: string;
  estado?: string;
  total?: number;
  createdAt?: string;
  detalles?: unknown[];
  DetallesPedido?: unknown[];
};

const routerReplace = (path: string) => (router as unknown as { replace: (p: string) => void }).replace(path);
const routerPush    = (path: string) => (router as unknown as { push:    (p: string) => void }).push(path);

function formatCOP(value: unknown) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatDate(value: unknown) {
  if (!value) return '-';
  return new Date(value as string).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapEstadoLabel(value: string | undefined): string {
  const labels: Record<string, string> = {
    pendiente : 'Pendiente',
    confirmado: 'Confirmado',
    en_proceso: 'En proceso',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return labels[value || ''] || value || 'Pendiente';
}

const getEstadoStyle = (estado: string) => {
  const est = (estado || 'pendiente').toLowerCase();
  switch(est) {
    case 'pendiente':
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    case 'confirmado':
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    case 'en_proceso':
    case 'procesando':
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    case 'enviado':
      return { bg: '#fdf4ff', text: '#c084fc', border: '#f5d0fe' };
    case 'entregado':
      return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
    case 'cancelado':
      return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' };
    default:
      return { bg: '#f9fafb', text: '#4b5563', border: '#e5e7eb' };
  }
};

export default function MisPedidosScreen() {
  const { isAuthenticated } = useAuth();
  const [pedidos, setPedidos]           = useState<Pedido[]>([]);
  const [loading, setLoading]           = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPedidos = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const data = await pedidoService.getMisPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      setErrorMessage((error as { message?: string })?.message || 'No fue posible cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  useFocusEffect(
    useCallback(() => {
      loadPedidos();
    }, [loadPedidos])
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={64} color="#d4956a" />
          <ThemedText style={styles.title}>Debes iniciar sesión</ThemedText>
          <Text style={styles.subtitle}>Inicia sesión para ver tu historial de pedidos.</Text>
          <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/explore')}>
            <Text style={styles.primaryButtonText}>Ir a Cuenta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#d4956a" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>


        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        {pedidos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#d4956a" />
            <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
            <Text style={styles.subtitle}>Cuando realices una compra, tu historial aparecerá aquí.</Text>
            <Pressable style={styles.primaryButton} onPress={() => routerReplace('/(tabs)/')}>
              <Text style={styles.primaryButtonText}>Ir a Tienda</Text>
            </Pressable>
          </View>
        ) : (
          pedidos.map((pedido) => {
            const estStyle = getEstadoStyle(pedido.estado || '');
            const cant = pedido.detalles?.length || pedido.DetallesPedido?.length || 0;
            return (
              <Pressable
                key={pedido.id || pedido._id}
                style={styles.card}
                onPress={() => routerPush(`/pedidos/${pedido.id || pedido._id}`)}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>Pedido #{pedido.id || pedido._id}</Text>
                  <View style={[styles.badge, { backgroundColor: estStyle.bg, borderColor: estStyle.border }]}>
                    <Text style={[styles.badgeText, { color: estStyle.text }]}>
                      {mapEstadoLabel(pedido.estado)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.metaDate}>
                  <Ionicons name="calendar-outline" size={12} color="#9e8879" style={{ marginRight: 4 }} /> {formatDate(pedido.createdAt)}
                </Text>

                <View style={styles.divider} />

                <View style={styles.rowBetween}>
                  <Text style={styles.metaItems}>{cant} producto(s)</Text>
                  <Text style={styles.totalText}>{formatCOP(pedido.total)}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdf8f4' },
  container: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 60 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#3d2c1e', marginTop: 12 },
  subtitle: { color: '#9e8879', textAlign: 'center', fontSize: 14, lineHeight: 20, paddingHorizontal: 20 },
  loadingText: { color: '#9e8879', fontSize: 14, fontWeight: '600' },
  error: { color: '#e07070', fontWeight: '600', textAlign: 'center', marginVertical: 8 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e8ddd5',
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#3d2c1e' },

  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#e8ddd5', 
    padding: 32, 
    gap: 12, 
    marginTop: 20,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#3d2c1e' },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 16,
    gap: 10,
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#3d2c1e' },
  metaDate: { fontSize: 12, color: '#9e8879', fontWeight: '500', flexDirection: 'row', alignItems: 'center' },
  metaItems: { fontSize: 13, color: '#9e8879', fontWeight: '600' },
  totalText: { fontSize: 16, fontWeight: '800', color: '#192847' },
  divider: { height: 1, backgroundColor: '#f3ece6' },

  badge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  primaryButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192847',
    marginTop: 12,
    height: 48,
    shadowColor: '#192847',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
