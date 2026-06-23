// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVO: app/_layout.tsx
// PROPÓSITO: Layout raíz de la aplicación.
//   - Envuelve toda la app con los proveedores de contexto globales (Auth, Carrito).
//   - Configura el tema visual (claro / oscuro) con ThemeProvider.
//   - Define la navegación principal mediante un Stack Navigator de Expo Router.
//   - Cada <Stack.Screen> registra una ruta y le asigna el título de la cabecera.
// ─────────────────────────────────────────────────────────────────────────────

// ── IMPORTACIONES ────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, Pressable, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'; // Temas claro/oscuro.
import { Stack, router } from 'expo-router';          // Navegación por pila (Stack Navigator).
import { StatusBar } from 'expo-status-bar';  // Barra de estado del sistema operativo.
import 'react-native-reanimated';             // Requerido por Reanimated para funcionar antes de cualquier animación.
import { LogBox } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import pedidoService from '../src/services/pedidoService';
import { Ionicons } from '@expo/vector-icons';

// Ignora el error inofensivo de Keep Awake en emuladores/dispositivos
LogBox.ignoreLogs(['Unable to activate keep awake']);

// Silencia el error de Keep Awake de forma global en las promesas no capturadas
if (typeof global !== 'undefined') {
  if ((global as any).HermesInternal?.enablePromiseRejectionTracker) {
    (global as any).HermesInternal.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (id: number, rejection: any) => {
        const msg = rejection?.message || String(rejection);
        if (msg.includes('keep awake') || msg.includes('Keep Awake') || msg.includes('Unable to activate')) {
          return; // Ignorar silenciosamente
        }
        console.warn(`Unhandled promise rejection (id: ${id}):`, rejection);
      },
      onHandled: () => {},
    });
  } else {
    try {
      const tracking = require('promise/setimmediate/rejection-tracking');
      tracking.enable({
        allRejections: true,
        onUnhandled: (id: number, error: any) => {
          const msg = error?.message || String(error);
          if (msg.includes('keep awake') || msg.includes('Keep Awake') || msg.includes('Unable to activate')) {
            return; // Ignorar silenciosamente
          }
          console.warn(`Unhandled promise rejection (id: ${id}):`, error);
        },
      });
    } catch {
      // Ignorar si el módulo no está disponible
    }
  }
}


import { useColorScheme } from '../hooks/use-color-scheme'; // Hook que detecta si el dispositivo está en modo oscuro.
import { AuthProvider } from '../src/context/AuthContext';   // Proveedor de sesión de usuario (login/logout).
import { CarritoProvider } from '../src/context/CarritoContext'; // Proveedor del estado global del carrito.

// ── CONFIGURACIÓN DE EXPO ROUTER ──────────────────────────────────────────────
// unstable_settings.anchor define la pantalla inicial al abrir la app.
// '(tabs)' = la carpeta de tabs es la raíz de navegación por defecto.
export const unstable_settings = {
  anchor: '(tabs)',
};

// ── COMPONENTE RAÍZ ───────────────────────────────────────────────────────────
export default function RootLayout() {
  // Detecta si el dispositivo usa modo oscuro ('dark') o claro ('light').
  const colorScheme = useColorScheme();

  return (
    // AuthProvider: pone a disposición de toda la app el estado de sesión (usuario, token).
    <AuthProvider>
      {/* CarritoProvider: pone a disposición el carrito de compras en toda la app. */}
      <CarritoProvider>
        {/* ThemeProvider: aplica el tema visual según la preferencia del sistema. */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>

          {/* Stack: navegador de pila. Cada pantalla se apila sobre la anterior. */}
          <Stack>
            {/* (tabs): las 3 pestañas principales (Tienda, Carrito, Cuenta). Sin cabecera propia. */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* ── Pantallas del panel de administración ── */}
            <Stack.Screen name="admin/dashboard" options={{ title: 'Dashboard Admin' }} />
            <Stack.Screen name="admin/productos" options={{ title: 'Productos' }} />
            <Stack.Screen name="admin/subcategorias" options={{ title: 'Subcategorías' }} />
            <Stack.Screen name="admin/categorias" options={{ title: 'Categorías' }} />
            <Stack.Screen name="admin/producto-form" options={{ title: 'Crear/Editar Producto' }} />
            <Stack.Screen name="admin/usuarios" options={{ title: 'Usuarios' }} />
            <Stack.Screen name="admin/pedidos" options={{ title: 'Pedidos' }} />
            {/* Ruta dinámica: [id] se reemplaza por el ID real del pedido en tiempo de ejecución. */}
            <Stack.Screen name="admin/pedidos/[id]" options={{ title: 'Detalle Pedido' }} />

            {/* ── Pantallas del flujo de compra del cliente ── */}
            <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
            <Stack.Screen name="mis-pedidos" options={{ title: 'Mis pedidos' }} />
            {/* Ruta dinámica para el detalle de un pedido del cliente. */}
            <Stack.Screen name="pedidos/[id]" options={{ title: 'Detalle pedido' }} />

            {/* Modal global: se presenta sobre la pantalla actual con animación de hoja. */}
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>

          {/* StatusBar: ajusta automáticamente el color de los íconos (claro/oscuro) según el tema. */}
          <StatusBar style="auto" />
          <OrderUpdateNotifier />
        </ThemeProvider>
      </CarritoProvider>
    </AuthProvider>
  );
}

function OrderUpdateNotifier() {
  const { isAuthenticated } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [updatedOrder, setUpdatedOrder] = useState<{ id: string; estado: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const checkOrderUpdates = async () => {
      try {
        const pedidos = await pedidoService.getMisPedidos();
        if (!pedidos || !Array.isArray(pedidos)) return;

        const cacheRaw = await AsyncStorage.getItem('ORDER_STATES_CACHE');
        const cachedStates = cacheRaw ? JSON.parse(cacheRaw) : {};
        let hasChanges = false;
        let orderToNotify: { id: string; estado: string } | null = null;

        for (const pedido of pedidos) {
          const pedidoId = String(pedido.id || pedido._id);
          const currentEstado = pedido.estado;

          if (cachedStates[pedidoId] !== undefined) {
            if (cachedStates[pedidoId] !== currentEstado) {
              orderToNotify = { id: pedidoId, estado: currentEstado };
              cachedStates[pedidoId] = currentEstado;
              hasChanges = true;
              // Break on first detected change to notify the user one by one
              break;
            }
          } else {
            cachedStates[pedidoId] = currentEstado;
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await AsyncStorage.setItem('ORDER_STATES_CACHE', JSON.stringify(cachedStates));
        }

        if (orderToNotify) {
          setUpdatedOrder(orderToNotify);
          setModalVisible(true);
        }
      } catch (error) {
        console.warn('Error checking order status updates:', error);
      }
    };

    // Run immediately on mount/login
    checkOrderUpdates();

    // Set interval for every 15 seconds
    const interval = setInterval(checkOrderUpdates, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const mapEstadoLabel = (value: string): string => {
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_proceso: 'En proceso',
      procesando: 'En proceso',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return labels[value.toLowerCase()] || value;
  };

  if (!modalVisible || !updatedOrder) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={s.modalBackdrop}>
        <View style={s.modalCard}>
          <View style={s.iconWrapper}>
            <Ionicons name="notifications-circle-outline" size={48} color="#d4956a" />
          </View>
          <Text style={s.modalTitle}>¡Actualización de Pedido!</Text>
          <Text style={s.modalMessage}>
            El estado de tu pedido #{updatedOrder.id} ha cambiado a:
          </Text>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>{mapEstadoLabel(updatedOrder.estado)}</Text>
          </View>
          <View style={s.btnRow}>
            <Pressable
              style={s.closeBtn}
              onPress={() => {
                setModalVisible(false);
                setUpdatedOrder(null);
              }}
            >
              <Text style={s.closeBtnText}>Cerrar</Text>
            </Pressable>
            <Pressable
              style={s.actionBtn}
              onPress={() => {
                setModalVisible(false);
                const orderId = updatedOrder.id;
                setUpdatedOrder(null);
                router.push(`/pedidos/${orderId}`);
              }}
            >
              <Text style={s.actionBtnText}>Ver el Pedido</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 40, 71, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#192847',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e8ddd5',
  },
  iconWrapper: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3d2c1e',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#7c6455',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#fff3e6',
    borderColor: '#d4956a',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4956a',
    textTransform: 'uppercase',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0ede8',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#9e8879',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#192847',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
