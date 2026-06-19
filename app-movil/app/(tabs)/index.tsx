/**
 * Pantalla principal tienda muestra el catalogo de productos
 * con un banner hero tarjetas de caracteristicas buscador de texto
 * chips de categorias lista de productos a 2 columas paginacion y un modal de detalle de producto
 */

import { useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Image, RefreshControl, Pressable, ScrollView, StyleSheet, TextInput, View, SafeAreaView, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import catalogoService from "../../src/services/catalogoService";
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";
import { useCarrito } from '../../src/context/CarritoContext';
import AdminToast from '../../components/admin-toast';

type CarritoCtx = {
    agregarProducto: (producto: unknown, cantidad: number) => Promise<void>;
    totalItems: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;
const ITEMS_POR_PAGINA = 15;

export default function HomeScreen() {
    const { agregarProducto, totalItems } = useCarrito() as CarritoCtx;

    const [productos, setProductos] = useState<Array<any>>([]);
    const [categorias, setCategorias] = useState<Array<any>>([]);
    const [subcategorias, setSubcategorias] = useState<Array<any>>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [categoriaActiva, setCategoriaActiva] = useState<any>('all');
    const [subcategoriaActiva, setSubcategoriaActiva] = useState<string>('all');
    const [showFiltros, setShowFiltros] = useState(false);
    const [ordenarPor, setOrdenarPor] = useState<string>('nombre');
    const [selectorAbierto, setSelectorAbierto] = useState(false);
    const [productoDetalle, setProductoDetalle] = useState<any>(null);
    const [paginaActual, setPaginaActual] = useState(1);

    // Carga de subcategorías al cambiar de categoría
    useEffect(() => {
        const loadSubcategorias = async () => {
            if (categoriaActiva === 'all') {
                setSubcategorias([]);
                setSubcategoriaActiva('all');
                return;
            }
            try {
                const subData = await catalogoService.getSubcategoriasByCategoria(categoriaActiva);
                setSubcategorias(Array.isArray(subData) ? subData : []);
                setSubcategoriaActiva('all');
            } catch (error) {
                console.error("Error loading subcategories:", error);
                setSubcategorias([]);
                setSubcategoriaActiva('all');
            }
        };
        loadSubcategorias();
    }, [categoriaActiva]);

    // Estados para la notificación Toast personalizada
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
    const [toastVisible, setToastVisible] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setToastVisible(true);
        setTimeout(() => {
            setToastVisible(false);
        }, 2200);
    };

    const handleAgregarAlCarrito = async (producto: any) => {
        try {
            await agregarProducto(producto, 1);
            showToast(`"${producto.nombre}" agregado al carrito`, 'success');
        } catch (error: unknown) {
            const msg = (error as {message?: string})?.message;
            showToast(msg || 'No se pudo agregar al carrito. Verifica el stock disponible.', 'error');
        }
    };

    const loadCatalogo = async ({ isRefresh = false } = {}) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setErrorMessage('');
        try {
            const [productosData, categoriasData] = await Promise.all([
                catalogoService.getProductos({ pagina: 1, limite: 200 }),
                catalogoService.getCategorias(),
            ]);
            setProductos(Array.isArray(productosData) ? productosData : []);
            setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
        } catch (error: unknown) {
            const msg = (error as { message?: string })?.message;
            setErrorMessage(msg || 'No fue posible cargar el catalogo');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadCatalogo();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaActiva, subcategoriaActiva, ordenarPor]);

    const productosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        const filtered = productos.filter((p: any) => {
            const coincideTexto = 
                termino === '' ||
                p.nombre?.toLowerCase().includes(termino) ||
                p.descripcion?.toLowerCase().includes(termino);

            const coincideCategoria = 
                categoriaActiva === 'all' ||
                String(p.categoriaId || p.categoria?.id) === categoriaActiva;

            const coincideSubcategoria = 
                subcategoriaActiva === 'all' ||
                String(p.subcategoriaId || p.subcategoria?.id) === subcategoriaActiva;

            return coincideTexto && coincideCategoria && coincideSubcategoria;
        });

        // Ordenamiento
        if (ordenarPor === 'precio_asc') {
            filtered.sort((a: any, b: any) => (a.precio || 0) - (b.precio || 0));
        } else if (ordenarPor === 'precio_desc') {
            filtered.sort((a: any, b: any) => (b.precio || 0) - (a.precio || 0));
        } else if (ordenarPor === 'reciente') {
            filtered.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } else {
            // 'nombre' default
            filtered.sort((a: any, b: any) => (a.nombre || '').localeCompare(b.nombre || ''));
        }

        return filtered;
    }, [busqueda, categoriaActiva, subcategoriaActiva, ordenarPor, productos]);

    const hasProductos = useMemo(() => productosFiltrados.length > 0, [productosFiltrados]);
    const totalPaginas = useMemo(() => Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA), [productosFiltrados]);
    const productosVisibles = useMemo(() => productosFiltrados.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA), [productosFiltrados, paginaActual]);

    const ListHeader = () => (
        <>
            {/* ── HERO BANNER ─────────────────────────────────────────────────── */}
            <View style={styles.hero}>
                <ThemedText style={styles.heroLabel}>SOLUCIONES ARQUITECTÓNICAS</ThemedText>
                <ThemedText style={styles.heroTitle}>Bienvenido a la{'\n'}Tienda GAVAT</ThemedText>
                <ThemedText style={styles.heroSubtitle}>
                    Encuentra los mejores productos al mejor precio.{'\n'}Compra segura y entrega a domicilio.
                </ThemedText>
                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                        <ThemedText style={styles.heroStatValue}>{productos.length}</ThemedText>
                        <ThemedText style={styles.heroStatLabel}>Productos</ThemedText>
                    </View>
                    <View style={styles.heroStat}>
                        <ThemedText style={styles.heroStatValue}>{categorias.length}</ThemedText>
                        <ThemedText style={styles.heroStatLabel}>Categorías</ThemedText>
                    </View>
                    <View style={styles.heroStat}>
                        <ThemedText style={styles.heroStatValue}>{totalItems}</ThemedText>
                        <ThemedText style={styles.heroStatLabel}>En tu carrito</ThemedText>
                    </View>
                </View>
            </View>

            {/* ── BUSCADOR ────────────────────────────────────────────────────── */}
            <View style={styles.helperRow}>
                <ThemedText style={styles.helperText}>Busca productos o aplica filtros avanzados</ThemedText>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#9e8879" />
                    <TextInput
                        placeholder="Buscar productos..."
                        value={busqueda}
                        onChangeText={setBusqueda}
                        style={styles.searchInput}
                        placeholderTextColor="#9ca3af"
                    />
                    {busqueda.length > 0 && (
                        <Pressable onPress={() => setBusqueda('')}>
                            <Ionicons name="close-circle" size={18} color="#9e8879" />
                        </Pressable>
                    )}
                </View>
                <Pressable
                    onPress={() => setShowFiltros(!showFiltros)}
                    style={[styles.filterToggleBtn, showFiltros && styles.filterToggleBtnActive]}
                >
                    <Ionicons name="filter-outline" size={18} color={showFiltros ? '#ffffff' : '#d4956a'} />
                </Pressable>
            </View>

            {/* Panel de Filtros Desplegable */}
            {showFiltros && (
                <View style={styles.filterPanel}>
                    {/* Ordenamiento */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Ordenar por</Text>
                        <View style={styles.pillRow}>
                            {([
                                { key: 'nombre', label: 'Nombre A-Z' },
                                { key: 'precio_asc', label: 'Menor precio' },
                                { key: 'precio_desc', label: 'Mayor precio' },
                                { key: 'reciente', label: 'Más nuevos' },
                            ] as const).map((ord) => (
                                <Pressable
                                    key={ord.key}
                                    style={[styles.filterPill, ordenarPor === ord.key && styles.filterPillActive]}
                                    onPress={() => setOrdenarPor(ord.key)}
                                >
                                    <Text style={[styles.filterPillText, ordenarPor === ord.key && styles.filterPillTextActive]}>
                                        {ord.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Categorías */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Categoría</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPillRow}>
                            <Pressable
                                style={[styles.filterPill, categoriaActiva === 'all' && styles.filterPillActive]}
                                onPress={() => setCategoriaActiva('all')}
                            >
                                <Text style={[styles.filterPillText, categoriaActiva === 'all' && styles.filterPillTextActive]}>
                                    Todas
                                </Text>
                            </Pressable>
                            {categorias.map((cat: any) => (
                                <Pressable
                                    key={String(cat.id)}
                                    style={[styles.filterPill, categoriaActiva === String(cat.id) && styles.filterPillActive]}
                                    onPress={() => setCategoriaActiva(String(cat.id))}
                                >
                                    <Text style={[styles.filterPillText, categoriaActiva === String(cat.id) && styles.filterPillTextActive]}>
                                        {cat.nombre}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Subcategorías */}
                    {categoriaActiva !== 'all' && subcategorias.length > 0 && (
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Subcategoría</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollPillRow}>
                                <Pressable
                                    style={[styles.filterPill, subcategoriaActiva === 'all' && styles.filterPillActive]}
                                    onPress={() => setSubcategoriaActiva('all')}
                                >
                                    <Text style={[styles.filterPillText, subcategoriaActiva === 'all' && styles.filterPillTextActive]}>
                                        Todas
                                    </Text>
                                </Pressable>
                                {subcategorias.map((sub: any) => (
                                    <Pressable
                                        key={String(sub.id)}
                                        style={[styles.filterPill, subcategoriaActiva === String(sub.id) && styles.filterPillActive]}
                                        onPress={() => setSubcategoriaActiva(String(sub.id))}
                                    >
                                        <Text style={[styles.filterPillText, subcategoriaActiva === String(sub.id) && styles.filterPillTextActive]}>
                                            {sub.nombre}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Limpiar Filtros */}
                    {(categoriaActiva !== 'all' || subcategoriaActiva !== 'all' || ordenarPor !== 'nombre') && (
                        <Pressable
                            style={styles.clearFiltersBtn}
                            onPress={() => {
                                setCategoriaActiva('all');
                                setSubcategoriaActiva('all');
                                setOrdenarPor('nombre');
                            }}
                        >
                            <Ionicons name="trash-outline" size={14} color="#e07070" />
                            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                        </Pressable>
                    )}
                </View>
            )}

            {/* ── ENCABEZADO DE LA SECCIÓN DE PRODUCTOS ───────────────────────── */}
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <ThemedText style={styles.helperText}>Productos</ThemedText>
                </View>
                <ThemedText style={styles.sectionCount}>{productosFiltrados.length} encontrados</ThemedText>
            </View>

            {/* ── ESTADO: CARGANDO ────────────────────────────────────────────── */}
            {loading && (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#d4956a" />
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

    const ListFooter = () =>
        !loading && hasProductos && totalPaginas > 1 ? (
            <View style={styles.paginacionRow}>
                <Pressable
                    style={[styles.pagBtn, paginaActual === 1 && styles.pagBtnDisabled]}
                    onPress={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}>
                    <Ionicons name="chevron-back" size={15} color={paginaActual === 1 ? '#b8a99a' : '#d4956a'} />
                    <ThemedText style={[styles.pagBtnText, paginaActual === 1 && styles.pagBtnTextDisabled]}>
                        Anterior
                    </ThemedText>
                </Pressable>
                <ThemedText style={styles.pagInfo}>
                    {paginaActual} de {totalPaginas} páginas
                </ThemedText>
                <Pressable
                    style={[styles.pagBtn, paginaActual === totalPaginas && styles.pagBtnDisabled]}
                    onPress={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}>
                    <ThemedText style={[styles.pagBtnText, paginaActual === totalPaginas && styles.pagBtnTextDisabled]}>
                        Siguiente
                    </ThemedText>
                    <Ionicons name="chevron-forward" size={15} color={paginaActual === totalPaginas ? '#b8a99a' : '#d4956a'} />
                </Pressable>
            </View>
        ) : (
            <View style={{ height: 24 }} />
        );

    const renderProducto = ({ item: producto, index }: { item: any; index: number }) => (
        <Pressable
            onPress={() => setProductoDetalle(producto)}
            android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
            style={[
                styles.card,
                index % 2 === 0 ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 },
            ]}>
            <Image
                source={{ uri: catalogoService.buildImageUrl(producto.imagen) }}
                style={styles.cardImage}
                resizeMode="cover"
            />
            <View style={styles.cardBadge}>
                <ThemedText style={styles.cardBadgeText} numberOfLines={1}>
                    {producto.Categoria?.nombre || producto.categoria?.nombre || 'Sin categoría'}
                </ThemedText>
            </View>
            <View style={styles.cardBody}>
                <ThemedText style={styles.cardNombre} numberOfLines={2}>
                    {producto.nombre}
                </ThemedText>
                <ThemedText style={styles.cardPrecio}>
                    ${Number(producto.precio || 0).toLocaleString('es-CO')}
                </ThemedText>
                <View style={styles.cardActions}>
                    <Pressable style={styles.cartBtn} onPress={() => handleAgregarAlCarrito(producto)}>
                        <Ionicons name="cart" size={16} color="#fff" />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <FlatList
                data={loading || !hasProductos ? [] : productosVisibles}
                keyExtractor={(item: any) => String(item.id)}
                numColumns={2}
                renderItem={renderProducto}
                ListHeaderComponent={<ListHeader />}
                ListFooterComponent={<ListFooter />}
                contentContainerStyle={styles.content}
                style={styles.flatList}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadCatalogo({ isRefresh: true })}
                        colors={['#d4956a']}
                        tintColor="#d4956a"
                    />
                }
            />

            {productoDetalle && (
                <Modal
                    visible={true}
                    transparent
                    animationType="slide"
                    statusBarTranslucent
                    onRequestClose={() => setProductoDetalle(null)}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setProductoDetalle(null)}>
                        <Pressable style={styles.modalCardWrapper} onPress={() => {}}>
                            <ThemedView style={styles.modalCard}>
                                <ScrollView
                                    scrollEnabled={true}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 16 }}>
                                    <Image
                                        source={{ uri: catalogoService.buildImageUrl(productoDetalle.imagen) }}
                                        style={styles.modalImage}
                                        resizeMode="cover"
                                    />
                                    <ThemedText style={styles.modalCategoria}>
                                        {productoDetalle.Categoria?.nombre || productoDetalle.categoria?.nombre || 'Sin categoría'}
                                    </ThemedText>
                                    <ThemedText style={styles.modalTitle}>
                                        {productoDetalle.nombre}
                                    </ThemedText>
                                    <ThemedText style={styles.modalDesc}>
                                        {productoDetalle.descripcion || 'Sin descripción disponible.'}
                                    </ThemedText>
                                    <ThemedText style={styles.modalPrecio}>
                                        ${Number(productoDetalle.precio || 0).toLocaleString('es-CO')}
                                    </ThemedText>
                                    <View style={styles.modalStock}>
                                        <Ionicons name="cube-outline" size={14} color="#9e8879" />
                                        <ThemedText style={styles.modalStockText}>
                                            Stock disponible: {productoDetalle.stock ?? 'N/A'} unidades
                                        </ThemedText>
                                    </View>
                                </ScrollView>
                                <View style={styles.modalActions}>
                                    <Pressable
                                        style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]}
                                        onPress={() => setProductoDetalle(null)}>
                                        <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.primaryBtn, { flex: 2, paddingVertical: 12 }]}
                                        onPress={() => {
                                            const prod = productoDetalle;
                                            setProductoDetalle(null);
                                            handleAgregarAlCarrito(prod);
                                        }}>
                                        <Ionicons name="cart" size={16} color="#fff" />
                                        <ThemedText style={styles.primaryBtnText}>
                                            Agregar al carrito
                                        </ThemedText>
                                    </Pressable>
                                </View>
                            </ThemedView>
                        </Pressable>
                    </Pressable>
                </Modal>
            )}

            <AdminToast message={toastMessage} type={toastType} visible={toastVisible} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fdf8f4' },
  flatList: { flex: 1, backgroundColor: '#fdf8f4' },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    backgroundColor: '#fdf8f4',
  },

  // ── HERO ──────────────────────────────────────────
  hero: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#192847',
    marginTop: 16,
    marginBottom: 20,
    gap: 8,
    shadowColor: '#192847',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroLabel: {
    color: '#d4956a',
    letterSpacing: 1.5,
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  heroStat: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    gap: 2,
  },
  heroStatValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  heroStatLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },

  // ── BUSCADOR ──────────────────────────────────────
  helperRow: {
    marginBottom: 8,
    marginTop: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#9e8879',
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3d2c1e',
    padding: 0,
  },
  filterToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8ddd5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterToggleBtnActive: {
    backgroundColor: '#d4956a',
    borderColor: '#d4956a',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 16,
    gap: 14,
    marginBottom: 16,
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    color: '#9e8879',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scrollPillRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: 4,
  },
  filterPill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillActive: {
    backgroundColor: '#192847',
    borderColor: '#192847',
  },
  filterPillText: {
    color: '#7c6455',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fce8e6',
    backgroundColor: '#fff5f5',
    marginTop: 4,
  },
  clearFiltersText: {
    color: '#e07070',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── SELECTOR DE CATEGORÍAS ─────────────────────────
  categoryButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    paddingRight: 4,
  },
  categoryButton: {
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#d4956a',
    borderColor: '#d4956a',
  },
  categoryButtonText: {
    color: '#7c6455',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // ── ENCABEZADO SECCIÓN ────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionCount: {
    fontSize: 12,
    color: '#9e8879',
    fontWeight: '600',
  },

  // ── TARJETA PRODUCTO ──────────────────────────────
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8ddd5',
    shadowColor: '#c4a882',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 136,
  },
  cardBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(25, 40, 71, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBadgeText: {
    color: '#192847',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  cardNombre: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d2c1e',
    lineHeight: 18,
  },
  cardPrecio: {
    fontSize: 15,
    fontWeight: '800',
    color: '#d4956a',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },

  // ── BOTONES ───────────────────────────────────────
  outlineBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e8ddd5',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: '#9e8879',
    fontWeight: '700',
    fontSize: 13,
  },
  cartBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#192847',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    height: 36,
  },
  primaryBtn: {
    borderRadius: 12,
    backgroundColor: '#d4956a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── ESTADOS ───────────────────────────────────────
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9e8879',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#e07070',
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9e8879',
    marginVertical: 24,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── PAGINACIÓN ────────────────────────────────────
  paginacionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  pagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d4956a',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pagBtnDisabled: {
    borderColor: '#e8ddd5',
  },
  pagBtnText: {
    color: '#d4956a',
    fontWeight: '700',
    fontSize: 13,
  },
  pagBtnTextDisabled: {
    color: '#b8a99a',
  },
  pagInfo: {
    color: '#3d2c1e',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── MODAL ─────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(61, 44, 30, 0.35)',
  },
  modalCardWrapper: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalCard: {
    padding: 24,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  modalCategoria: {
    fontSize: 11,
    color: '#d4956a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3d2c1e',
    lineHeight: 26,
  },
  modalDesc: {
    fontSize: 14,
    color: '#9e8879',
    lineHeight: 21,
  },
  modalPrecio: {
    fontSize: 22,
    fontWeight: '800',
    color: '#d4956a',
  },
  modalStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStockText: {
    fontSize: 13,
    color: '#9e8879',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 8,
  },
});
