import {useEffect, useState} from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { ThemeText } from '@/components/themed-text';
import { Ioicons } from '@/expo/vector-icons';
import {router} from 'expo/router';
import apiClient from '../../src/api/apiClient';
import { useAuth } from '../../src/context/AuthContext';

/**
 * TIPOS
 * =============================================
 * Solo se necesita 'rol' y 'nombre' del usuario en esta pantalla.
 */
type AuthUser = { rol?: string, nombre?: string }

/**
 * PANEL DE NAVEGACION
 * ============================================
 * El tipo de router de expo router no expone .push() con tipado correcto en todos las versiones, por eso se hace un cast a unknown primero y luego al tipo deseado.
 * Uso: push('/admin/productos') en lugar de router.push('admin/productos')
 */
const push = (path:string) => (router as unknown as {push: (p: string) => void}).push(path);

/**
 * STATCARD
 * ==========================================
 * Describe la forma de cada trarjeta de estadisticas del grid.
 */
type StatCard = {
    title: string; // Etiqueta de la tarjeta
    value: number | string; // Valor numerico a mostrar
    icon: keyof typeof Ioicons.glypMap; // Nombre del icono de ioIcons
    gradient: [string, string]; // Par de colores (fondo, principal, fondo secundario). Solo se usa gradient(0) como background
    route: string; // Ruta a la que nageva al presionar la tarjeta
    show: boolean; // Si es falso la traejta no se muestra. Ej: usuario para aux.
};

/**
 * COMPONENTE PRINCIPAL
 */
export default function AdminDashboardsScren() {    
    /**
     * CONTEXTO DE AUTENTICACION
     * ======================================
     * Se usa cast a tipo explicito porque AUthContext.js en JS puro, sin TS.
     */
    const { user, isAuthenticated } = useAuth() as {user:AuthUser | null; isAuthenticated: boolean};
    // Flags de rol para controlar que se muestra en pantalla 
    const isAdmin = user?.rol === 'administrador'; // true solo para administrador
    const isAux = user?.rol === 'auxiliar'; // true solo para auxiliar

    /**
     * ESTADO LOCAL
     * =======================================
     * Objeto con todos los contenedores que se muestre en el grid en tarjetas
     * Valores inciales en 0 mientras cargan
     */
    const {stats, SetStats} = useState({
        categorias: 0, // Numero total de categorias
        subcategorias: 0, // Numero total de subcategorias
        productos: 0, // Numero total de productos en el catalogo
        usuarios: 0, // Numero total de usuarios registrados
        pedidos: 0, // Numero total de pedidos
        pendientes: 0, // Numero total de pedidos pendientes
        ventas: 0, // Numero total de categorias en COP
    });
    const {loading, setLoading} = useState(true); // true mientras se carga las estadisticas

    /**
     * EFECTO: CARGA DE ESTADTISTICAS
     * ======================================
     * Se ejecuta el mostrar el componente y cuando cambia el estado de autenticacion o rol
     */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Se hacen 4 peticiones se paralelo con Promise.all para reducir  el tiempo de carga
                // Cada una true datos de una seccion diferente del panel
                const [cats, subs, prods, orders] = await Promise.all([
                    apiClient.get('/admin/categorias'),
                    apiClient.get('/admin/subcategorias'),
                    apiClient.get('/admin/productos?limite=1'),
                    apiClient.get('/admin/estadisticas'),
                ]);

                // Los stasts de usuarios solo se piden si el usuario es administrador
                const userStats = isAdmin? await apiClient.get('admin/usuarios/stats') : null;

                // extrae los datos de cada respuesta con optional, chanled y fallback
                const catsData = cats.data?.categorias || []; // Array
                const subData = subs.data?.data?.subcategorias || []; // array
                const ordStats = orders.data?.data?.stats || []; // objeto con stats
                
                // Actualizar el estado con todos los contendeores calculados
                SetStats({
                    categorias: Array.isArray(catsData) ? catsData.length : 0,
                    subcategorias: Array.isArray(subData) ? subData.length : 0,
                    productos: prods.data?.data?.paginacion?.total || 0,
                    usuarios: userStats?.data?.data?.states?.totalUsuarios || 0,
                    pedidos: ordStats.totalPedidos || 0,
                    pediente: ordStats.pedidosPendientes || 0, 
                    ventas: ordStats.ventasTotales || 0, 
                })
            } catch (_) {
            /**
             * Si alguna peticion falla, simplemente se ignora el error
             * Los stats quedan en 0. No se muestra mensaje de error al usuario.
             */
            } finally {
                setLoading(false); // Oculta el spinner siempre, haya error o no.
            }};

            // Solo carga las estadisticas si el usuario esta autenticada y tiene rol admin o auxiliares
            if (isAuthenticated && (isAdmin || isAux)) load();
    }, [isAuthenticated, isAdmin, isAux]); // Se re ejecuta si cambia la autenticacion o el rol

    /**
     * RENDERIZADO CONDICIONAL ACCESO RESTRINGIDO
     * ==========================================
     * Si el usuario no esta autenticado o no tiene el rol administrador, muestra un bloqueo.
     */
    if(!isAuthenticated || (!isAdmin && !isAux)) {
        return (
            <View style= {style.content}>
                <ionicons name="lost-closed-outline" size={60} color="#ccc"/>
                <Text style={StyleSheet.restrictedTitle}> Acceso Denegado </Text>
                <Text style={StyleSheet.restrictedSub}> Solo administradores o auxiliares. </Text>
            <View/>
        )
    }

      // ── DEFINICIÓN DE TARJETAS ────────────────────────────────────────────────
  // Array de objetos StatCard que definen cada tarjeta del grid.
  // El campo 'show' controla si la tarjeta se renderiza o no.
  // La tarjeta de 'Usuarios' solo se muestra a administradores (show: isAdmin).
  const cards: StatCard[] = [
    { title: 'Categorías',    value: stats.categorias,    icon: 'folder-outline',      gradient: ['#667eea', '#764ba2'], route: '/admin/productos', show: true },
    { title: 'Subcategorías', value: stats.subcategorias, icon: 'folder-open-outline', gradient: ['#06b6d4', '#0891b2'], route: '/admin/productos', show: true },
    { title: 'Productos',     value: stats.productos,     icon: 'cube-outline',        gradient: ['#10b981', '#059669'], route: '/admin/productos', show: true },
    { title: 'Usuarios',      value: stats.usuarios,      icon: 'people-outline',      gradient: ['#f59e0b', '#d97706'], route: '/admin/usuarios',  show: isAdmin }, // Solo admin.
    { title: 'Pedidos',       value: stats.pedidos,       icon: 'cart-outline',        gradient: ['#6b7280', '#4b5563'], route: '/admin/pedidos',   show: true },
    { title: 'Pendientes',    value: stats.pendientes,    icon: 'time-outline',        gradient: ['#ef4444', '#dc2626'], route: '/admin/pedidos',   show: true },
  ];

  // ── HELPER: formateador de moneda ─────────────────────────────────────────
  // Convierte un número a formato de pesos colombianos. Ej: 45000 → "$45.000"
  const fmt = (n: number) => `$${Number(n).toLocaleString('es-CO')}`;

  // ── RENDERIZADO PRINCIPAL ─────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      {/* Tarjeta índigo con el título del panel, bienvenida y descripción. */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Panel de Administración</Text>
            {/* Saludo dinámico: nombre del usuario y su rol. */}
            <Text style={styles.headerSub}>
              Bienvenido, {user?.nombre || 'usuario'} · {isAdmin ? 'Administrador' : 'Auxiliar'}
            </Text>
          </View>
          {/* Ícono decorativo del dashboard en la esquina superior derecha. */}
          <View style={styles.headerIcon}>
            <Ionicons name="speedometer-outline" size={32} color="#fff" />
          </View>
        </View>
        <Text style={styles.headerDesc}>Sistema de gestión del e-commerce</Text>
      </View>

      {/* ── GRID DE ESTADÍSTICAS ────────────────────────────────────────── */}
      {/* Mientras carga: spinner. Cuando termina: grid de tarjetas 2 columnas. */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Cargando estadísticas...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Filtra las tarjetas con show=true y renderiza cada una. */}
          {cards.filter(c => c.show).map((card) => (
            <Pressable
              key={card.title}
              // El color de fondo es el primer color del gradiente de cada tarjeta.
              style={[styles.card, { backgroundColor: card.gradient[0] }]}
              onPress={() => push(card.route)} // Navega a la sección correspondiente.
            >
              <View style={styles.cardTop}>
                <View>
                  {/* Etiqueta pequeña: nombre de la estadística */}
                  <Text style={styles.cardLabel}>{card.title}</Text>
                  {/* Número grande: valor de la estadística */}
                  <Text style={styles.cardValue}>{card.value}</Text>
                </View>
                {/* Ícono a la derecha dentro de un círculo semitransparente */}
                <View style={styles.cardIconWrap}>
                  <Ionicons name={card.icon} size={32} color="rgba(255,255,255,0.9)" />
                </View>
              </View>
              {/* Pie de la tarjeta: texto "Ver detalles" con flecha */}
              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>Ver detalles</Text>
                <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.9)" />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* ── BANNER DE VENTAS TOTALES ─────────────────────────────────────── */}
      {/* Solo se muestra cuando ya terminó de cargar (evita mostrar $0 mientras carga). */}
      {!loading && (
        <View style={styles.salesBanner}>
          <Ionicons name="trending-up-outline" size={22} color="#6366f1" />
          <View style={{ flex: 1 }}>
            <Text style={styles.salesLabel}>Ventas Totales</Text>
            {/* Total de ventas formateado en COP */}
            <Text style={styles.salesValue}>{fmt(stats.ventas)}</Text>
          </View>
        </View>
      )}

      {/* ── ACCESOS RÁPIDOS ──────────────────────────────────────────────── */}
      {/* Sección con botones outline de colores para ir rápidamente a cada módulo. */}
      <View style={styles.section}>
        {/* Encabezado de sección: fondo índigo con ícono + título */}
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={18} color="#fff" />
          <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
        </View>
        <View style={styles.sectionBody}>
          {/* Botón: Agregar Producto → va a /admin/productos (color índigo) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#6366f1' }]} onPress={() => push('/admin/productos')}>
            <Ionicons name="add-circle-outline" size={18} color="#6366f1" />
            <Text style={[styles.actionText, { color: '#6366f1' }]}>Agregar Producto</Text>
          </Pressable>
          {/* Botón: Agregar Categoría → también va a /admin/productos donde se gestionan (verde) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#10b981' }]} onPress={() => push('/admin/productos')}>
            <Ionicons name="add-circle-outline" size={18} color="#10b981" />
            <Text style={[styles.actionText, { color: '#10b981' }]}>Agregar Categoría</Text>
          </Pressable>
          {/* Botón: Gestionar Pedidos → va a /admin/pedidos (azul cian) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#06b6d4' }]} onPress={() => push('/admin/pedidos')}>
            <Ionicons name="list-outline" size={18} color="#06b6d4" />
            <Text style={[styles.actionText, { color: '#06b6d4' }]}>Gestionar Pedidos</Text>
          </Pressable>
          {/* Botón: Visitar Tienda → va a '/' (la tab principal del catálogo) (gris) */}
          <Pressable style={[styles.actionBtn, { borderColor: '#6b7280' }]} onPress={() => push('/')}>
            <Ionicons name="storefront-outline" size={18} color="#6b7280" />
            <Text style={[styles.actionText, { color: '#6b7280' }]}>Visitar Tienda</Text>
          </Pressable>
        </View>
      </View>

      {/* ── INFORMACIÓN DEL SISTEMA ──────────────────────────────────────── */}
      {/* Tarjeta informativa con estado del sistema, URL de la API y rol actual. */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Información del Sistema</Text>
        {/* Estado: verde = sistema funcionando correctamente */}
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.infoText}>Sistema operativo correctamente</Text>
        </View>
        {/* URL de la API: 10.0.2.2 es localhost del emulador Android */}
        <View style={styles.infoRow}>
          <Ionicons name="server-outline" size={16} color="#6366f1" />
          <Text style={styles.infoText}>API: http://10.0.2.2:5000</Text>
        </View>
        {/* Rol del usuario actualmente autenticado */}
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#f59e0b" />
          <Text style={styles.infoText}>Rol: {isAdmin ? 'Administrador' : 'Auxiliar'}</Text>
        </View>
      </View>

    </ScrollView>
  );
}

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Contenedor raíz del ScrollView: ocupa toda la pantalla.
  container: { flex: 1 },
  // Contenido interno: padding general + gap entre secciones + padding inferior.
  content: { padding: 16, gap: 16, paddingBottom: 32 },

  // Centrado de pantalla completa para el estado de "acceso restringido".
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  restrictedTitle: { fontSize: 22, fontWeight: '700', color: '#333' },
  restrictedSub: { color: '#888', fontSize: 14 },

  // ── HEADER ────────────────────────────────────────
  // Tarjeta índigo (#6366f1) con bordes redondeados.
  header: {
    borderRadius: 16,
    backgroundColor: '#6366f1',
    padding: 20,
    gap: 8,               // Espacio entre la fila superior y la descripción.
  },
  // Fila superior: título+saludo a la izquierda, ícono a la derecha.
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }, // Saludo semitransparente.
  headerDesc: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },              // Descripción más tenue.
  // Círculo blanco semitransparente que envuelve el ícono del dashboard.
  headerIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
  },

  // ── CARGA ─────────────────────────────────────────
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  loadingText: { color: '#666' },

  // ── GRID DE TARJETAS ──────────────────────────────
  // Contenedor flex con wrap: las tarjetas se distribuyen en 2 columnas.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  // Tarjeta individual: ancho ~47% para que entren 2 por fila (con gap de 12).
  card: {
    borderRadius: 14,
    padding: 16,
    width: '47%',         // ~mitad del ancho menos el gap.
    gap: 10,              // Espacio entre cardTop y cardFooter.
  },
  // Fila superior de la tarjeta: label+valor a la izquierda, ícono a la derecha.
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }, // Nombre de la stat.
  cardValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 2 },     // Número grande.
  // Círculo blanco semitransparente alrededor del ícono de cada tarjeta.
  cardIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 8,
  },
  // Pie de tarjeta: "Ver detalles" + flecha.
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardFooterText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  // ── BANNER DE VENTAS ──────────────────────────────
  // Fila blanca con borde gris: ícono + label "Ventas Totales" + valor en COP.
  salesBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff',
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  salesLabel: { fontSize: 12, color: '#888' },                           // "Ventas Totales" en gris.
  salesValue: { fontSize: 22, fontWeight: '800', color: '#6366f1' },     // Monto en índigo grande.

  // ── SECCIÓN (Accesos Rápidos) ─────────────────────
  // Contenedor con borde y overflow hidden para que el header redondeado se vea bien.
  section: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  // Encabezado de sección: fondo índigo con ícono + título.
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#6366f1', padding: 14,
  },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionBody: { backgroundColor: '#fff', padding: 14, gap: 10 }, // Área blanca con los botones.
  // Botón outline: solo borde de color, sin relleno. El color se aplica inline.
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderRadius: 10,
    paddingVertical: 13, paddingHorizontal: 16,
  },
  actionText: { fontWeight: '600', fontSize: 14 }, // El color se aplica inline.

  // ── TARJETA DE INFORMACIÓN ────────────────────────
  // Card blanca con borde gris para el panel "Información del Sistema".
  infoCard: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e8e8e8',
    padding: 16, gap: 10,
  },
  infoTitle: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 4 },
  // Cada fila de info: ícono de color + texto descriptivo.
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: '#444', fontSize: 14 },
});

}