/**
 * Pantalla de cuenta pestaña 1 
 * Pantalla principal tienda muestra el catalogo de productos 
 * con un banner hero tarjetas de caracteristicas buscador de texto
 * chips de categorias lista de productos a 2 columas paginacion y un modal de detalle de producto 
 */

/**importar componentes de React native para constuir la pantalla
 * hooks de react:
 * useEffect ejecuta el codigo a al montar el componente o cuando cambian las dependencias
 * useMemo memoriza valores calculados para evitar recalculos innecesarios
 * useState maneja variables de estado local
*/



//manejo de variables de estado local
import { useState, useEffect, useMemo } from 'react';
//importar componentes 
//Dimensions optiene al ancho y alto de la pantalla para hacer diseños responsivos
//flatlist lista optomizada con virtualizacion para mostrar grandes cantidades de datos
//modal mostrar detalles de contenido en ventana emergente

import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Image, RefreshControl, Pressable, ScrollView, StyleSheet, TextInput, View, SafeAreaView } from "react-native";

//Ionicons libreria de iconos vectoriales para react native 
import { Ionicons } from "@expo/vector-icons";
//CatalogoService servicio que hace las llamadas HTTP (API) del backend para productos y categorias
import  catalogoService  from "../../src/services/catalogoService";
//themedText : texto q aplica colores del tema del dispositivo de manera automatica claro u oscuro
import { ThemedText } from "../../components/themed-text";
//themedView : color de fondo automatico segun el tema del dispositivo
import { ThemedView } from "../../components/themed-view";
//useCarrito hook del contexto del carrito para agregar productos
import { useCarrito } from '../../src/context/CarritoContext';

/**
 * Tipo Carrito CTX
 * describe los campos que se usan de useCarrito en pantalla
 */

type CarritoCtx = {
    //agregarProducto: agrega producto al carrito con la cantidad indicada
    agregarProducto: (producto: unknown, cantidad: number) => Promise<void>;
    //totalItems: numero total de items en el carrito
    totalItems: number;
};

/**
 * Constantes globales
 * se calculan una sola vez al cargar el modulo 
 */

//SCREEN_WIDTH ancho de dispositivo en dp (desity independent pixels) para diseños responsivos
const { width: SCREEN_WIDTH } = Dimensions.get('window');
//Card_gap espacio horizontal entre las 2 columnas de la tarjeta de producto
const CARD_GAP = 10;
//CARD_WIDTH ancho de cada tarjeta calculando para que quepan exactamente 2 por fila en dos columnas 
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) /2;
//ITEMS_POR_PAGINA numero de productos por pagina usando paginacion 
const ITEMS_POR_PAGINA = 15;

const FEATURES = [
    { icon: 'cube-outline', title: 'Envío Rápido', desc: 'Recibe en tu hogar', color: '#6366f1', bg: '#eef2ff' },
    { icon: 'shield-checkmark', title: 'Compra Segura', desc: 'Datos protegidos', color: '#10b981', bg: '#d1fae5' },
    { icon: 'headset', title: 'Atención 24/7', desc: 'Siempre disponibles', color: '#06b6d4', bg: '#cffafe' },
] as const;

/**
 * Componente principal HOME SCREEN
 */

export default function HomeScreen() {
    //Extrae las funciones del carrito necesarias para la pantalla
    const { agregarProducto, totalItems } = useCarrito() as CarritoCtx;

    /**
     * Estado de datos 
     * productos lista completa de productos traida del backend 
     */
    const [productos, setProductos] = useState<Array<any>>([]);
    //categorias lista de categorias traida del backend
    const [categorias, setCategorias] = useState<Array<any>>([]);

    //estado de UI
    //loading true mientras cargan los datos por primera vez
    const [loading, setLoading] = useState(true);
    //refreshing true mientras el usuario hace pull to refresh
    const [refreshing, setRefreshing] = useState(false);
    //error mensaje: mensaje de error si falla la carga 
    const [errorMessage, setErrorMessage] = useState('');
    //busqueda texto de campo de busqueda filtra productos en tiempo real
    const [busqueda, setBusqueda] = useState('');
    //categoriaActiva id de la categoria seleccionada o all para ver todas
    const [categoriaActiva, setCategoriaActiva] = useState<any>('all');
    //productoDetalle producto seleccionado para ver el modal 
    const [productoDetalle, setProductoDetalle] = useState<any>(null);
    //paginaActual numero de la pagina activa para paginacion empieza en 1
    const [paginaActual, setPaginaActual] = useState(1);
    //ITEMS_POR_PAGINA numero de productos por pagina
    const ITEMS_POR_PAGINA = 15;

    /**
     * funcion handeleAgregarAlCarrito 
     * agrega el producto al carrito y muestra una alerta de confirmacion o error
     */

    const handleAgregarAlCarrito = async (producto: any) => {
        try{
            await agregarProducto(producto, 1); //agrega 1 unidad del producto
            Alert.alert('Carrito', `${producto.nombre} agregado correctamente.`);
        } catch (error: unknown) {
            const msg = (error as {message?: string})?.message;
            Alert.alert('Error', msg || 'no se pudo agregar al carrito');
        }
    };

    /**
     * funcion loadCatalogo
     * carga los productos y categorias desde el backend en paralelo con promises.all
     * isRefresh: true cuando es un pull to refresh
     */

    const loadCatalogo = async ({ isRefresh = false } = {}) => {
        if (!isRefresh) setRefreshing(true); //pull-to-refresh activa indicador de refresco
        else setLoading(true); //carga inicial activa el spinner grande
        setErrorMessage('');
        try {
            /**llama todos los endpoind al mismo tiempo para mayor velocidad
             * getProductos con limite de 200 trae todos los productos de una vez
             */
            const [productosData, categoriasData] = await Promise.all([
                catalogoService.getProductos({ pagina: 1, limite: 200 }),
                catalogoService.getCategorias(),
            ]);
            //guarda los datos solo si son arrays
            setProductos(Array.isArray(productosData) ? productosData : []);
            setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            setErrorMessage(msg || 'No fue posible cargar el catalogo');
        } finally {
            //siempre desactiva los indicadores al terminar la carga sea exitoso o error
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Efecto carga inicial
     * como dependencias se ejecuta una sola vez la montar el componente
     */

    useEffect(() => {
        loadCatalogo();
    }, []);

    /**
     * Efecto resetear pagina al cambiar filtros
     * cuando el usuario escribe en el buscador o cambia de categoria
     * siempre vuelve a la pagina 1 para no quedar en una pagina vacia
     */

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaActiva]);

    /**
     * datos derivados (useMemo)
     * useMemo recalculasolo cuando cambian las dependencias indecadas
     * evitando filtrar/calcular en cada renderizado
     */

    //productos filtrados subconjunto de prodcutos que coinciden con la busqueda y categoria
    const productosFiltrados = useMemo (() => {
        const termino = busqueda.trim().toLowerCase();// normaliza el texto
        return productos.filter((p: any) => {
            //coincideTexto el producto tiene el termino en su nombre descripcion 
            const coincideTexto = 
            termino === '' ||
            //sin busqueda pasa toda la informacion de los productos 
            p.nombre?.toLowerCase().includes(termino) ||
            p.descripcion?.toLowerCase().includes(termino);

            //coincideCategoria el producto pertenece a la categoria activa
            //categoriaId o categoria.id son los dos campos posibles segun el endpoint
            const coincideCategoria = 
            categoriaActiva === 'all' ||
            //pasa todo
            String(p.categoriaId || p.categoria?.id) === categoriaActiva;
            return coincideTexto && coincideCategoria;
        });
    }, [busqueda, categoriaActiva, productos]); //recalcula cuando cambia la busqueda categoria o datos

    /**
     * hasproductos: ture si hay al menos un producto filtrado evita mostrar la vista vacia
     */
    const hasProductos = useMemo (() => productosFiltrados.length > 0, [productosFiltrados]);

    //total paginas numero total de paginas segun los productos filtrados
    const totalPaginas = useMemo (() => Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA), [productosFiltrados, ITEMS_POR_PAGINA]);

    //prodcutos visibles subconjunto de productos de la pagina actual eje pagina 1 1-15 pagina 2 16-30 ....
    const productosVisibles = useMemo (() => productosFiltrados.slice((paginaActual -1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA), [productosFiltrados, paginaActual, ITEMS_POR_PAGINA]);

  // ── SUBCOMPONENTE: ListHeader ────────────────────────────────────────────
  // Se renderiza UNA SOLA VEZ como cabecera fija del FlatList (encima de los productos).
    const ListHeader = () => (
    <>
      {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
      {/* Tarjeta índigo con título, subtítulo y 3 estadísticas en tiempo real */}
        <View style={styles.hero}>
        {/* Etiqueta superior en mayúsculas pequeñas */}
        <ThemedText style={styles.heroLabel}>TIENDA OFICIAL</ThemedText>
        {/* Título principal con salto de línea usando {'\n'} */}
        <ThemedText style={styles.heroTitle}>Bienvenido a{'\n'}E-Commerce</ThemedText>
        <ThemedText style={styles.heroSubtitle}>
            Encuentra los mejores productos al mejor precio.{'\n'}Compra segura y entrega a domicilio.
        </ThemedText>
        {/* Fila de 3 estadísticas dinámicas */}
        <View style={styles.heroStatsRow}>
          {/* Stat 1: total de productos en el catálogo */}
            <View style={styles.heroStat}>
            <ThemedText style={styles.heroStatValue}>{productos.length}</ThemedText>
            <ThemedText style={styles.heroStatLabel}>Productos</ThemedText>
            </View>
          {/* Stat 2: número de categorías disponibles */}
            <View style={styles.heroStat}>
            <ThemedText style={styles.heroStatValue}>{categorias.length}</ThemedText>
            <ThemedText style={styles.heroStatLabel}>Categorías</ThemedText>
            </View>
          {/* Stat 3: ítems en el carrito del usuario */}
            <View style={styles.heroStat}>
            <ThemedText style={styles.heroStatValue}>{totalItems}</ThemedText>
            <ThemedText style={styles.heroStatLabel}>En carrito</ThemedText>
            </View>
        </View>
        </View>

      {/* ── TARJETAS DE CARACTERÍSTICAS ─────────────────────────────────── */}
      {/* ScrollView horizontal: permite deslizar las tarjetas sin ocultar otras */}
        <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.featuresRow}>
        {/* Genera una tarjeta por cada entrada en FEATURES */}
        {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
            {/* Círculo de color con el ícono de la característica */}
            <View style={[styles.featureIconCircle, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon as any} size={22} color={f.color} />
            </View>
            <ThemedText style={styles.featureTitle}>{f.title}</ThemedText>
            <ThemedText style={styles.featureDesc}>{f.desc}</ThemedText>
            </View>
        ))}
        </ScrollView>

      {/* ── BUSCADOR ────────────────────────────────────────────────────── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            placeholder="Buscar productos..."
            value={busqueda}
            onChangeText={setBusqueda}
            style={styles.searchInput}
            placeholderTextColor="#9ca3af"
          />
          {busqueda.length > 0 && (
            <Pressable onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>

      {/* ── CHIPS DE CATEGORÍAS ─────────────────────────────────────────── */}
      {/* Scroll horizontal de pastillas para filtrar por categoría */}
        <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {/* Chip "Todas": selecciona categoriaActiva = 'all' */}
        <Pressable
            onPress={() => setCategoriaActiva('all')}
            style={[styles.chip, categoriaActiva === 'all' && styles.chipActive]}>
          {/* chipActive agrega fondo índigo cuando está seleccionado */}
            <ThemedText style={[styles.chipText, categoriaActiva === 'all' && styles.chipTextActive]}>
            Todas
            </ThemedText>
        </Pressable>
        {/* Un chip por cada categoría del backend */}
        {categorias.map((cat: any) => (
            <Pressable
            key={cat.id}
            onPress={() => setCategoriaActiva(String(cat.id))}
            style={[styles.chip, categoriaActiva === String(cat.id) && styles.chipActive]}>
            <ThemedText style={[styles.chipText, categoriaActiva === String(cat.id) && styles.chipTextActive]}>
                {cat.nombre}
            </ThemedText>
            </Pressable>
        ))}
        </ScrollView>

      {/* ── ENCABEZADO DE LA SECCIÓN DE PRODUCTOS ───────────────────────── */}
        <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Productos Disponibles</ThemedText>
        {/* Contador de resultados filtrados */}
        <ThemedText style={styles.sectionCount}>{productosFiltrados.length} encontrados</ThemedText>
        </View>

      {/* ── ESTADO: CARGANDO ────────────────────────────────────────────── */}
        {loading && (
        <View style={styles.centered}>
            <ActivityIndicator size="large" color="#6366f1" />
            <ThemedText style={styles.loadingText}>Cargando catálogo...</ThemedText>
        </View>
        )}
      {/* ── ESTADO: ERROR DE CARGA ───────────────────────────────────────── */}
        {!loading && errorMessage ? (
        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
        ) : null}
      {/* ── ESTADO: SIN RESULTADOS ───────────────────────────────────────── */}
        {!loading && !errorMessage && !hasProductos ? (
        <ThemedText style={styles.emptyText}>No hay productos para mostrar.</ThemedText>
        ) : null}
    </>
    );

  // ── SUBCOMPONENTE: ListFooter ─────────────────────────────────────────────
  // Se renderiza al final del FlatList. Muestra la paginación si hay más de 1 página.
  // Si solo hay 1 página, agrega un espacio vacío para que el último producto no quede
  // pegado al borde inferior de la pantalla.
    const ListFooter = () =>
    !loading && hasProductos && totalPaginas > 1 ? (
        <View style={styles.paginacionRow}>
        {/* Botón "Anterior": desactivado en la primera página */}
        <Pressable
            style={[styles.pagBtn, paginaActual === 1 && styles.pagBtnDisabled]}
            onPress={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}>
            <Ionicons name="chevron-back" size={15} color={paginaActual === 1 ? '#d1d5db' : '#6366f1'} />
            <ThemedText style={[styles.pagBtnText, paginaActual === 1 && styles.pagBtnTextDisabled]}>
            Anterior
            </ThemedText>
        </Pressable>
        {/* Indicador de página actual / total de páginas */}
        <ThemedText style={styles.pagInfo}>
            {paginaActual} / {totalPaginas}
        </ThemedText>
        {/* Botón "Siguiente": desactivado en la última página */}
        <Pressable
            style={[styles.pagBtn, paginaActual === totalPaginas && styles.pagBtnDisabled]}
            onPress={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}>
            <ThemedText style={[styles.pagBtnText, paginaActual === totalPaginas && styles.pagBtnTextDisabled]}>
            Siguiente
            </ThemedText>
            <Ionicons name="chevron-forward" size={15} color={paginaActual === totalPaginas ? '#d1d5db' : '#6366f1'} />
        </Pressable>
        </View>
    ) : (
      // Sin paginación: espacio vacío al final de la lista.
        <View style={{ height: 24 }} />
    );

  // ── FUNCIÓN: renderProducto ───────────────────────────────────────────────
  // FlatList llama esta función por cada ítem de productosVisibles.
  // Recibe { item: producto, index } y devuelve el JSX de la tarjeta.
    const renderProducto = ({ item: producto, index }: { item: any; index: number }) => (
    <View
        style={[
        styles.card,
        // Aplica margen para separar columnas:
        //   columna izquierda (índice par) → margen derecho
        //   columna derecha (índice impar) → margen izquierdo
        index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 },
        ]}>
      {/* Imagen del producto: buildImageUrl construye la URL completa */}
        <Image
        source={{ uri: catalogoService.buildImageUrl(producto.imagen) }}
        style={styles.cardImage}
        resizeMode="cover" /* Recorta la imagen para que llene el espacio sin deformarse. */
        />
      {/* Badge de categoría superpuesto sobre la imagen (position: absolute) */}
        <View style={styles.cardBadge}>
        <ThemedText style={styles.cardBadgeText} numberOfLines={1}>
            {producto.Categoria?.nombre || producto.categoria?.nombre || 'Sin categoría'}
        </ThemedText>
        </View>
      {/* Cuerpo de la tarjeta: nombre, precio y botones */}
        <View style={styles.cardBody}>
        {/* numberOfLines={2}: el nombre se trunca a 2 líneas máximo */}
        <ThemedText style={styles.cardNombre} numberOfLines={2}>
            {producto.nombre}
        </ThemedText>
        {/* Precio formateado en pesos colombianos */}
        <ThemedText style={styles.cardPrecio}>
            ${Number(producto.precio || 0).toLocaleString('es-CO')}
        </ThemedText>
        {/* Fila de botones: "Ver" (detalle) y carrito */}
        <View style={styles.cardActions}>
          {/* Botón "Ver": abre el modal de detalle con este producto */}
            <Pressable style={styles.outlineBtn} onPress={() => setProductoDetalle(producto)}>
            <ThemedText style={styles.outlineBtnText}>Ver</ThemedText>
            </Pressable>
          {/* Botón del carrito: agrega directamente 1 unidad */}
            <Pressable style={styles.cartBtn} onPress={() => handleAgregarAlCarrito(producto)}>
            <Ionicons name="cart" size={16} color="#fff" />
            </Pressable>
        </View>
        </View>
    </View>
    );

  // ── RENDERIZADO PRINCIPAL ────────────────────────────────────────────────
    return (
    // Fragment (<>) para envolver FlatList + Modal sin agregar un View extra.
    <>
      {/* ── FLATLIST: LISTA PRINCIPAL DE PRODUCTOS ─────────────────────── */}
        <FlatList
        // data: cuando está cargando o no hay productos, pasa array vacío para no
        //       renderizar ítems, pero sí muestra ListHeader (con el spinner).
        data={loading || !hasProductos ? [] : productosVisibles}
        // keyExtractor: identificador único por ítem, necesario para que React
        //               pueda optimizar el renderizado de la lista.
        keyExtractor={(item: any) => String(item.id)}
        // numColumns: muestra los productos en 2 columnas.
        numColumns={2}
        // renderItem: función que genera el JSX de cada producto.
        renderItem={renderProducto}
        // ListHeaderComponent: componente fijo al inicio de la lista (hero, buscador, etc.).
        ListHeaderComponent={<ListHeader />}
        // ListFooterComponent: componente fijo al final de la lista (paginación).
        ListFooterComponent={<ListFooter />}
        // contentContainerStyle: padding horizontal y padding inferior de toda la lista.
        contentContainerStyle={styles.content}
        // refreshControl: habilita el "pull to refresh" (tirar hacia abajo para actualizar).
        refreshControl={
            <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCatalogo({ isRefresh: true })}
            colors={['#6366f1']}     // Color del spinner en Android.
            tintColor="#6366f1"      // Color del spinner en iOS.
            />
        }
        />

      {/* ── MODAL: DETALLE DEL PRODUCTO ─────────────────────────────────── */}
      {/* Renderiza el modal solo si hay un producto seleccionado */}
      {productoDetalle && (
        <Modal
          visible={true}
          transparent
          animationType="slide"
          onRequestClose={() => setProductoDetalle(null)}>
          {/* Fondo semitransparente negro que cubre toda la pantalla */}
          <View style={styles.modalBackdrop}>
            {/* Tarjeta blanca con esquinas superiores redondeadas */}
            <ThemedView style={styles.modalCard}>
              {/* Contenido scrolleable */}
              <ScrollView
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Imagen grande del producto */}
                <Image
                  source={{ uri: catalogoService.buildImageUrl(productoDetalle.imagen) }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                {/* Categoría del producto */}
                <ThemedText style={styles.modalCategoria}>
                  {productoDetalle.Categoria?.nombre || 'Sin categoría'}
                </ThemedText>
                {/* Nombre del producto */}
                <ThemedText style={styles.modalTitle}>
                  {productoDetalle.nombre}
                </ThemedText>
                {/* Descripción */}
                <ThemedText style={styles.modalDesc}>
                  {productoDetalle.descripcion || 'Sin descripción disponible.'}
                </ThemedText>
                {/* Precio */}
                <ThemedText style={styles.modalPrecio}>
                  ${Number(productoDetalle.precio || 0).toLocaleString('es-CO')}
                </ThemedText>
                {/* Stock */}
                <View style={styles.modalStock}>
                  <Ionicons name="cube-outline" size={14} color="#6b7280" />
                  <ThemedText style={styles.modalStockText}>
                    Stock disponible: {productoDetalle.stock ?? 'N/A'} unidades
                  </ThemedText>
                </View>
              </ScrollView>
              {/* Fila de botones (fija al final) */}
              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]}
                  onPress={() => setProductoDetalle(null)}>
                  <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, { flex: 2, paddingVertical: 12 }]}
                  onPress={async () => {
                    await handleAgregarAlCarrito(productoDetalle);
                    setProductoDetalle(null);
                  }}>
                  <Ionicons name="cart" size={16} color="#fff" />
                  <ThemedText style={styles.primaryBtnText}>
                    Agregar al carrito
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </View>
        </Modal>
      )}
    </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Padding horizontal del FlatList + padding inferior para que el último producto
  // no quede pegado al borde de la pantalla.
    content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    },

  // ── HERO ──────────────────────────────────────────
  // Tarjeta índigo con bordes muy redondeados que actúa como banner principal.
    hero: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#6366f1', // Índigo.
    marginTop: 16,
    marginBottom: 16,
    gap: 10,                    // Espacio entre cada hijo directo.
    },
  // Etiqueta pequeña en mayúsculas con espaciado de letras (tracking).
    heroLabel: {
    color: '#c7d2fe',           // Índigo muy claro.
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: '700',
    },
    heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,             // Interlineado para texto de 2 líneas.
    },
    heroSubtitle: {
    color: '#e0e7ff',           // Blanco azulado.
    fontSize: 14,
    lineHeight: 21,
    },
  // Fila horizontal de las 3 estadísticas.
    heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    },
  // Caja individual de estadística: fondo blanco semitransparente.
    heroStat: {
    flex: 1,                                         // Cada stat ocupa el mismo ancho.
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',        // Blanco al 15% de opacidad.
    alignItems: 'center',
    gap: 2,
    },
    heroStatValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 20,
    },
    heroStatLabel: {
    color: '#c7d2fe',
    fontSize: 11,
    },

  // ── CARACTERÍSTICAS ───────────────────────────────
  // Contenedor del scroll horizontal de tarjetas de características.
    featuresRow: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 16,
    },
  // Cada tarjeta de característica: ancho fijo, sombra sutil.
    featureCard: {
    width: 128,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,               // Sombra en Android.
    gap: 6,
    },
  // Círculo de color que contiene el ícono de la característica.
  // El color de fondo se aplica inline con el campo 'bg' de FEATURES.
    featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,           // Mitad del ancho/alto = círculo perfecto.
    alignItems: 'center',
    justifyContent: 'center',
    },
    featureTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
    },
    featureDesc: {
    fontSize: 11,
    color: '#6b7280',           // Gris apagado.
    },

  // ── BUSCADOR ──────────────────────────────────────
  // Contenedor del campo de búsqueda: fila con ícono + input + botón limpiar.
    searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    },
  // El input ocupa todo el ancho disponible (flex:1) entre los íconos.
    searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    padding: 0,                 // Elimina el padding por defecto en Android.
    },

  // ── CHIPS ─────────────────────────────────────────
  // Contenedor del scroll horizontal de chips de categorías.
    chipsRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 16,
    },
  // Chip inactivo: borde gris, fondo blanco.
    chip: {
    borderRadius: 999,          // Cápsula perfecta (border-radius muy alto).
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    },
  // Chip activo: fondo y borde índigo (se aplica junto a 'chip').
    chipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    },
    chipText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
    },
    chipTextActive: {
    color: '#fff',              // Texto blanco cuando el chip está activo.
    },

  // ── ENCABEZADO SECCIÓN ────────────────────────────
  // Fila "Productos Disponibles" + contador de resultados.
    sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    },
    sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    },
    sectionCount: {
    fontSize: 12,
    color: '#6b7280',
    },

  // ── TARJETA PRODUCTO ──────────────────────────────
  // Tarjeta individual de producto con ancho calculado para 2 columnas.
    card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#6366f1',     // Sombra levemente índigo.
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 10,
    overflow: 'hidden',         // El badge y la imagen respetan los bordes redondeados.
    },
  // Imagen de portada del producto (ocupa todo el ancho de la tarjeta).
    cardImage: {
    width: '100%',
    height: 130,
    },
  // Badge de categoría superpuesto en la esquina superior izquierda de la imagen.
    cardBadge: {
    position: 'absolute',       // Se posiciona sobre la imagen.
    top: 8,
    left: 8,
    backgroundColor: 'rgba(99,102,241,0.85)', // Índigo semitransparente.
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    },
    cardBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase', // Texto en mayúsculas.
    letterSpacing: 0.3,
    },
  // Área de texto de la tarjeta (debajo de la imagen).
    cardBody: {
    padding: 10,
    gap: 4,
    },
    cardNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
    },
    cardPrecio: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6366f1',
    marginTop: 2,
    },
  // Fila de botones: "Ver" y carrito.
    cardActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    },

  // ── BOTONES ───────────────────────────────────────
  // Botón outline: solo borde, sin relleno.
    outlineBtn: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    },
    outlineBtnText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 12,
    },
  // Botón del carrito: relleno índigo, ocupa el espacio restante (flex:1).
    cartBtn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    },
  // Botón primario relleno con ícono + texto en fila.
    primaryBtn: {
    borderRadius: 8,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    },
    primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    },

  // ── ESTADOS ───────────────────────────────────────
  // Centrado para spinner de carga (dentro del ListHeader).
    centered: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
    },
    loadingText: {
    color: '#6b7280',
    fontSize: 14,
    },
    errorText: {
    color: '#ef4444',           // Rojo para mensajes de error.
    textAlign: 'center',
    marginVertical: 16,
    },
    emptyText: {
    textAlign: 'center',
    color: '#9ca3af',           // Gris para estado vacío.
    marginVertical: 24,
    fontSize: 14,
    },

  // ── PAGINACIÓN ────────────────────────────────────
  // Fila de botones Anterior / Página / Siguiente.
    paginacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
    },
  // Botón de paginación activo: borde índigo.
    pagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    },
  // Sobreescribe el borde cuando el botón está deshabilitado.
    pagBtnDisabled: {
    borderColor: '#d1d5db',     // Gris cuando está deshabilitado.
    },
    pagBtnText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
    },
    pagBtnTextDisabled: {
    color: '#9ca3af',           // Gris cuando está deshabilitado.
    },
    pagInfo: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 14,
    },

  // ── MODAL ─────────────────────────────────────────
  // Fondo semitransparente oscuro que cubre toda la pantalla.
  // justifyContent: 'flex-end' posiciona la tarjeta en la parte inferior.
    modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
    },
  // Tarjeta blanca del modal con bordes superiores redondeados (sheet style).
    modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 10,
    backgroundColor: '#fff',
    },
  // Imagen grande del producto en el modal.
    modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    },
  // Nombre de la categoría en pequeño sobre el título.
    modalCategoria: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
    },
    modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 28,
    },
    modalDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 21,
    },
  // Precio grande índigo en el modal.
    modalPrecio: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
    },
  // Fila de stock: ícono + texto.
    modalStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    },
    modalStockText: {
    fontSize: 13,
    color: '#6b7280',
    },
  // Fila de botones del modal: Cerrar + Agregar al carrito.
    modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
    },
});
