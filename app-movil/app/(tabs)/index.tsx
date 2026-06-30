/**
 * Pantalla principal tienda muestra el catalogo de productos
 * con un banner hero tarjetas de caracteristicas buscador de texto
 * chips de categorias lista de productos a 2 columas paginacion y un modal de detalle de producto
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Image, Platform, RefreshControl, Pressable, ScrollView, StyleSheet, TextInput, View, Text } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import catalogoService from "../../src/services/catalogoService";
import apiClient from '../../src/api/apiClient';
import { ThemedText } from "../../components/themed-text";
import { ThemedView } from "../../components/themed-view";
import { useCarrito } from '../../src/context/CarritoContext';
import { useAuth } from '../../src/context/AuthContext';
import AdminToast from '../../components/admin-toast';
import { router, useNavigation } from 'expo-router';

type CarritoCtx = {
    agregarProducto: (producto: unknown, cantidad: number) => Promise<void>;
    totalItems: number;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;
const ITEMS_POR_PAGINA = 15;

export default function HomeScreen() {
    const { agregarProducto, totalItems } = useCarrito() as CarritoCtx;
    const { isAuthenticated, user } = useAuth() as any;
    const detailScrollViewRef = useRef<ScrollView>(null);

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
    const [showComentariosModal, setShowComentariosModal] = useState(false);

    const [comentariosProducto, setComentariosProducto] = useState<Array<any>>([]);
    const [cargandoComentarios, setCargandoComentarios] = useState(false);
    const [esElegibleComentar, setEsElegibleComentar] = useState(false);
    const [comentarioTexto, setComentarioTexto] = useState('');
    const [calificacionSeleccionada, setCalificacionSeleccionada] = useState(5);
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [miComentarioId, setMiComentarioId] = useState<number | null>(null);

    const [dropdownOrdenOpen, setDropdownOrdenOpen] = useState(false);
    const [textoBuscarOrden, setTextoBuscarOrden] = useState('');
    const [dropdownCatOpen, setDropdownCatOpen] = useState(false);
    const [textoBuscarCategoria, setTextoBuscarCategoria] = useState('');
    const [dropdownSubOpen, setDropdownSubOpen] = useState(false);
    const [textoBuscarSubcategoria, setTextoBuscarSubcategoria] = useState('');

    const handleSelectCategoria = (id: string, name: string) => {
        setCategoriaActiva(id);
        setTextoBuscarCategoria(name);
        setSubcategoriaActiva('all');
        setTextoBuscarSubcategoria('');
        setDropdownCatOpen(false);
    };

    const handleSelectSubcategoria = (id: string, name: string) => {
        setSubcategoriaActiva(id);
        setTextoBuscarSubcategoria(name);
        setDropdownSubOpen(false);
    };

    const handleSelectOrden = (key: string, label: string) => {
        setOrdenarPor(key);
        setTextoBuscarOrden(label);
        setDropdownOrdenOpen(false);
    };

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
            if (!isAuthenticated) {
                showToast(`"${producto.nombre}" agregado al carrito (local)`, 'success');
            } else {
                showToast(`"${producto.nombre}" agregado al carrito`, 'success');
            }
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
            console.error('Error al cargar el catálogo:', error);
            const msg = (error as { message?: string })?.message;
            setErrorMessage(msg || 'No fue posible cargar el catalogo');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const navigation = useNavigation();

    useEffect(() => {
        loadCatalogo();
        const unsubscribe = navigation.addListener('focus', () => {
            loadCatalogo();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, categoriaActiva, subcategoriaActiva, ordenarPor]);

    const loadComentarios = async (productoId: number) => {
        setCargandoComentarios(true);
        try {
            const response = await apiClient.get(`/catalogo/productos/${productoId}/comentarios`);
            const list = response.data?.data?.comentarios || response.data?.comentarios || [];
            setComentariosProducto(list);
            
            // Si el usuario está autenticado, busca si ya comentó este producto
            if (user) {
                const miComment = list.find((c: any) => String(c.usuarioId) === String(user.id));
                if (miComment) {
                    setMiComentarioId(miComment.id);
                    setComentarioTexto(miComment.comentario);
                    setCalificacionSeleccionada(miComment.calificacion);
                } else {
                    setMiComentarioId(null);
                }
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
        } finally {
            setCargandoComentarios(false);
        }
    };

    const checkElegibilidadComentario = async (productoId: number) => {
        try {
            const response = await apiClient.get('/cliente/pedidos?estado=entregado&limite=200');
            const pedidos = response.data?.data?.pedidos || response.data?.pedidos || [];
            
            const hasPurchased = pedidos.some((pedido: any) =>
                pedido.detalles?.some((detalle: any) => detalle.productoId === productoId)
            );
            
            setEsElegibleComentar(hasPurchased);
        } catch (error) {
            console.error('Error al verificar elegibilidad de comentarios:', error);
            setEsElegibleComentar(false);
        }
    };

    const handleSubmitComentario = async () => {
        if (!comentarioTexto.trim()) {
            Alert.alert('Error', 'El comentario no puede estar vacío');
            return;
        }

        setEnviandoComentario(true);
        try {
            if (miComentarioId) {
                const response = await apiClient.put(`/cliente/comentarios/${miComentarioId}`, {
                    comentario: comentarioTexto.trim(),
                    calificacion: calificacionSeleccionada
                });

                if (response.data?.success) {
                    showToast('Comentario actualizado exitosamente', 'success');
                    loadComentarios(productoDetalle.id);
                }
            } else {
                const response = await apiClient.post('/cliente/comentarios', {
                    productoId: productoDetalle.id,
                    comentario: comentarioTexto.trim(),
                    calificacion: calificacionSeleccionada
                });

                if (response.data?.success || response.data?.id) {
                    showToast('Comentario agregado exitosamente', 'success');
                    setComentarioTexto('');
                    setCalificacionSeleccionada(5);
                    setEsElegibleComentar(false);
                    loadComentarios(productoDetalle.id);
                }
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo guardar el comentario');
        } finally {
            setEnviandoComentario(false);
        }
    };

    const handleEliminarComentario = async () => {
        if (!miComentarioId) return;

        Alert.alert(
            'Confirmar',
            '¿Estás seguro de que deseas desactivar tu comentario? Ya no será visible para otros usuarios.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    style: 'destructive',
                    onPress: async () => {
                        setEnviandoComentario(true);
                        try {
                            const response = await apiClient.delete(`/cliente/comentarios/${miComentarioId}`);
                            if (response.data?.success) {
                                showToast('Comentario desactivado exitosamente', 'success');
                                setComentarioTexto('');
                                setCalificacionSeleccionada(5);
                                setMiComentarioId(null);
                                loadComentarios(productoDetalle.id);
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'No se pudo desactivar el comentario');
                        } finally {
                            setEnviandoComentario(false);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (productoDetalle) {
            loadComentarios(productoDetalle.id);
            if (isAuthenticated) {
                checkElegibilidadComentario(productoDetalle.id);
            } else {
                setEsElegibleComentar(false);
            }
        } else {
            setComentariosProducto([]);
            setEsElegibleComentar(false);
            setComentarioTexto('');
            setCalificacionSeleccionada(5);
            setMiComentarioId(null);
            setShowComentariosModal(false);
        }
    }, [productoDetalle, isAuthenticated]);

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

    const renderHeader = () => (
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
                        <View style={styles.dropdownContainer}>
                            <View style={styles.filterSearchBox}>
                                <Ionicons name="swap-vertical-outline" size={14} color="#d4956a" />
                                <TextInput
                                    placeholder="Buscar y seleccionar orden..."
                                    placeholderTextColor="#9ca3af"
                                    value={textoBuscarOrden}
                                    onFocus={() => setDropdownOrdenOpen(true)}
                                    onChangeText={(text) => {
                                        setTextoBuscarOrden(text);
                                        setDropdownOrdenOpen(true);
                                        setOrdenarPor('nombre');
                                    }}
                                    style={styles.filterSearchInput}
                                />
                                {textoBuscarOrden.length > 0 || ordenarPor !== 'nombre' ? (
                                    <Pressable onPress={() => {
                                        setTextoBuscarOrden('');
                                        setOrdenarPor('nombre');
                                        setDropdownOrdenOpen(false);
                                    }}>
                                        <Ionicons name="close-circle" size={16} color="#9e8879" />
                                    </Pressable>
                                ) : (
                                    <Pressable onPress={() => setDropdownOrdenOpen(!dropdownOrdenOpen)}>
                                        <Ionicons name={dropdownOrdenOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
                                    </Pressable>
                                )}
                            </View>
                            {dropdownOrdenOpen && (
                                <View style={styles.dropdownList}>
                                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                                        {[
                                            { key: 'nombre', label: '🔤 Nombre A-Z' },
                                            { key: 'precio_asc', label: '🪙 Menor precio' },
                                            { key: 'precio_desc', label: '💰 Mayor precio' },
                                            { key: 'reciente', label: '🕓 Más nuevos' }
                                        ]
                                            .filter(item => item.label.toLowerCase().includes(textoBuscarOrden.toLowerCase()))
                                            .map((item) => {
                                                const isSelected = ordenarPor === item.key;
                                                return (
                                                    <Pressable
                                                        key={item.key}
                                                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                                        onPress={() => {
                                                            handleSelectOrden(item.key, item.label);
                                                        }}
                                                    >
                                                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                                            {item.label}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Categorías */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Categoría</Text>
                        <View style={styles.dropdownContainer}>
                            <View style={styles.filterSearchBox}>
                                <Ionicons name="folder-open-outline" size={14} color="#d4956a" />
                                <TextInput
                                    placeholder="Buscar y seleccionar categoría..."
                                    placeholderTextColor="#9ca3af"
                                    value={textoBuscarCategoria}
                                    onFocus={() => setDropdownCatOpen(true)}
                                    onChangeText={(text) => {
                                        setTextoBuscarCategoria(text);
                                        setDropdownCatOpen(true);
                                        setCategoriaActiva('all');
                                    }}
                                    style={styles.filterSearchInput}
                                />
                                {textoBuscarCategoria.length > 0 || categoriaActiva !== 'all' ? (
                                    <Pressable onPress={() => {
                                        handleSelectCategoria('all', '');
                                    }}>
                                        <Ionicons name="close-circle" size={16} color="#9e8879" />
                                    </Pressable>
                                ) : (
                                    <Pressable onPress={() => setDropdownCatOpen(!dropdownCatOpen)}>
                                        <Ionicons name={dropdownCatOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
                                    </Pressable>
                                )}
                            </View>

                            {dropdownCatOpen && (
                                <View style={styles.dropdownList}>
                                    <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                                        <Pressable
                                            style={[styles.dropdownItem, categoriaActiva === 'all' && styles.dropdownItemActive]}
                                            onPress={() => {
                                                handleSelectCategoria('all', '');
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, categoriaActiva === 'all' && styles.dropdownItemTextActive]}>
                                                📁 Todas las categorías
                                            </Text>
                                        </Pressable>

                                        {categorias
                                            .filter((cat: any) => (cat.nombre || '').toLowerCase().includes(textoBuscarCategoria.toLowerCase()))
                                            .map((cat: any) => {
                                                const isSelected = categoriaActiva === String(cat.id);
                                                return (
                                                    <Pressable
                                                        key={String(cat.id)}
                                                        style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                                        onPress={() => {
                                                            handleSelectCategoria(String(cat.id), cat.nombre || '');
                                                        }}
                                                    >
                                                        <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                                            📁 {cat.nombre}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Subcategorías */}
                    {categoriaActiva !== 'all' && subcategorias.length > 0 && (
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Subcategoría</Text>
                            <View style={styles.dropdownContainer}>
                                <View style={styles.filterSearchBox}>
                                    <Ionicons name="pricetag-outline" size={14} color="#d4956a" />
                                    <TextInput
                                        placeholder="Buscar y seleccionar subcategoría..."
                                        placeholderTextColor="#9ca3af"
                                        value={textoBuscarSubcategoria}
                                        onFocus={() => setDropdownSubOpen(true)}
                                        onChangeText={(text) => {
                                            setTextoBuscarSubcategoria(text);
                                            setDropdownSubOpen(true);
                                            setSubcategoriaActiva('all');
                                        }}
                                        style={styles.filterSearchInput}
                                    />
                                    {textoBuscarSubcategoria.length > 0 || subcategoriaActiva !== 'all' ? (
                                        <Pressable onPress={() => {
                                            handleSelectSubcategoria('all', '');
                                        }}>
                                            <Ionicons name="close-circle" size={16} color="#9e8879" />
                                        </Pressable>
                                    ) : (
                                        <Pressable onPress={() => setDropdownSubOpen(!dropdownSubOpen)}>
                                            <Ionicons name={dropdownSubOpen ? "chevron-up-outline" : "chevron-down-outline"} size={16} color="#9e8879" />
                                        </Pressable>
                                    )}
                                </View>

                                {dropdownSubOpen && (
                                    <View style={styles.dropdownList}>
                                        <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                                            <Pressable
                                                style={[styles.dropdownItem, subcategoriaActiva === 'all' && styles.dropdownItemActive]}
                                                onPress={() => {
                                                    handleSelectSubcategoria('all', '');
                                                }}
                                            >
                                                <Text style={[styles.dropdownItemText, subcategoriaActiva === 'all' && styles.dropdownItemTextActive]}>
                                                    🏷️ Todas las subcategorías
                                                </Text>
                                            </Pressable>

                                            {subcategorias
                                                .filter((sub: any) => (sub.nombre || '').toLowerCase().includes(textoBuscarSubcategoria.toLowerCase()))
                                                .map((sub: any) => {
                                                    const isSelected = subcategoriaActiva === String(sub.id);
                                                    return (
                                                        <Pressable
                                                            key={String(sub.id)}
                                                            style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                                                            onPress={() => {
                                                                handleSelectSubcategoria(String(sub.id), sub.nombre || '');
                                                            }}
                                                        >
                                                            <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                                                                🏷️ {sub.nombre}
                                                            </Text>
                                                        </Pressable>
                                                    );
                                                })}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Limpiar Filtros */}
                    {(categoriaActiva !== 'all' || subcategoriaActiva !== 'all' || ordenarPor !== 'nombre' || textoBuscarCategoria !== '' || textoBuscarSubcategoria !== '' || textoBuscarOrden !== '') && (
                        <Pressable
                            style={styles.clearFiltersBtn}
                            onPress={() => {
                                setCategoriaActiva('all');
                                setSubcategoriaActiva('all');
                                setOrdenarPor('nombre');
                                setTextoBuscarCategoria('');
                                setTextoBuscarSubcategoria('');
                                setTextoBuscarOrden('');
                                setDropdownCatOpen(false);
                                setDropdownSubOpen(false);
                                setDropdownOrdenOpen(false);
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

    const renderFooter = () => {
        if (loading || !hasProductos || totalPaginas <= 1) {
            return <View style={{ height: 16 }} />;
        }
        return (
            <View style={styles.pagBarFooter}>
                <Pressable
                    style={[styles.pagCircleBtn, paginaActual === 1 && styles.pagCircleBtnOff]}
                    onPress={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}>
                    <Ionicons name="chevron-back" size={18} color={paginaActual === 1 ? '#d0c4bb' : '#d4956a'} />
                </Pressable>

                <View style={styles.pagDots}>
                    {Array.from({ length: totalPaginas }, (_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.pagDot,
                                i + 1 === paginaActual && styles.pagDotActive
                            ]}
                        />
                    ))}
                </View>

                <Pressable
                    style={[styles.pagCircleBtn, paginaActual === totalPaginas && styles.pagCircleBtnOff]}
                    onPress={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}>
                    <Ionicons name="chevron-forward" size={18} color={paginaActual === totalPaginas ? '#d0c4bb' : '#d4956a'} />
                </Pressable>
            </View>
        );
    };

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
                ListHeaderComponent={renderHeader()}
                ListFooterComponent={renderFooter()}
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
                    <View style={styles.modalBackdrop}>
                        {/* Backdrop clicable absoluto e independiente */}
                        <Pressable 
                            style={StyleSheet.absoluteFillObject} 
                            onPress={() => setProductoDetalle(null)} 
                        />
                        {/* Tarjeta del modal independiente para evitar conflictos de gestos de scroll */}
                        <View style={styles.modalCardWrapper}>
                            <ThemedView style={styles.modalCard}>
                                <ScrollView
                                    ref={detailScrollViewRef}
                                    style={styles.modalScroll}
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
                                            Stock máximo disponible: {productoDetalle.stock ?? 'N/A'} unidades
                                        </ThemedText>
                                    </View>

                                    {/* DIVIDER Y SECCIÓN DE RESUMEN DE PUNTUACIÓN (ÚNICAMENTE) */}
                                    <View style={styles.divider} />
                                    
                                    <Pressable 
                                        style={styles.ratingSummaryPressable}
                                        onPress={() => setShowComentariosModal(true)}
                                    >
                                        <View style={styles.ratingSummaryRow}>
                                            <ThemedText style={styles.ratingSummaryHeader}>
                                                Puntuación y opiniones ({comentariosProducto.length})
                                            </ThemedText>
                                            <Ionicons name="chevron-forward" size={18} color="#d4956a" />
                                        </View>
                                        
                                        {comentariosProducto.length > 0 ? (
                                            <View style={styles.ratingSummaryContent}>
                                                <View style={styles.ratingStarsRow}>
                                                    {Array.from({ length: 5 }).map((_, idx) => {
                                                        const avgRating = comentariosProducto.reduce((s, c) => s + c.calificacion, 0) / comentariosProducto.length;
                                                        return (
                                                            <Ionicons
                                                                key={idx}
                                                                name={idx < Math.round(avgRating) ? 'star' : 'star-outline'}
                                                                size={20}
                                                                color="#d4956a"
                                                                style={{ marginRight: 4 }}
                                                            />
                                                        );
                                                    })}
                                                    <ThemedText style={styles.ratingAverageText}>
                                                        {(comentariosProducto.reduce((s, c) => s + c.calificacion, 0) / comentariosProducto.length).toFixed(1)} de 5
                                                    </ThemedText>
                                                </View>
                                                <ThemedText style={styles.ratingTapToViewText}>
                                                    Presiona para ver opiniones y calificar
                                                </ThemedText>
                                            </View>
                                        ) : (
                                            <View style={styles.ratingSummaryContent}>
                                                <View style={styles.ratingStarsRow}>
                                                    {Array.from({ length: 5 }).map((_, idx) => (
                                                        <Ionicons
                                                            key={idx}
                                                            name="star-outline"
                                                            size={20}
                                                            color="#b8a99a"
                                                            style={{ marginRight: 4 }}
                                                        />
                                                    ))}
                                                    <ThemedText style={[styles.ratingAverageText, { color: '#9e8879' }]}>
                                                        Sin calificar
                                                    </ThemedText>
                                                </View>
                                                <ThemedText style={styles.ratingTapToViewText}>
                                                    Toca para calificar y dejar la primera opinión
                                                </ThemedText>
                                            </View>
                                        )}
                                    </Pressable>
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
                        </View>
                    </View>
                </Modal>
            )}

            {showComentariosModal && productoDetalle && (
                <Modal
                    visible={true}
                    transparent
                    animationType="slide"
                    statusBarTranslucent
                    onRequestClose={() => setShowComentariosModal(false)}>
                    <View style={styles.modalBackdrop}>
                        <Pressable 
                            style={StyleSheet.absoluteFillObject} 
                            onPress={() => setShowComentariosModal(false)} 
                        />
                        <View style={styles.modalCardWrapper}>
                            <ThemedView style={styles.modalCard}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <ThemedText style={[styles.commentsHeader, { fontSize: 16, marginBottom: 0 }]}>
                                        Opiniones: {productoDetalle.nombre}
                                    </ThemedText>
                                    <Pressable onPress={() => setShowComentariosModal(false)} style={{ padding: 4 }}>
                                        <Ionicons name="close" size={24} color="#9e8879" />
                                    </Pressable>
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{ paddingBottom: 24 }}
                                    style={styles.modalScroll}
                                >
                                    <View style={styles.commentsSection}>
                                        {comentariosProducto.length > 0 ? (
                                            <ThemedText style={styles.commentsSub}>
                                                ⭐ {(comentariosProducto.reduce((s, c) => s + c.calificacion, 0) / comentariosProducto.length).toFixed(1)} de 5 estrellas ({comentariosProducto.length} {comentariosProducto.length === 1 ? 'comentario' : 'comentarios'})
                                            </ThemedText>
                                        ) : (
                                            <ThemedText style={styles.commentsSub}>
                                                Sin calificaciones aún
                                            </ThemedText>
                                        )}

                                        {cargandoComentarios ? (
                                            <ActivityIndicator size="small" color="#d4956a" style={{ marginVertical: 16 }} />
                                        ) : (
                                            <View>
                                                {comentariosProducto.map((item) => (
                                                    <View key={item.id} style={styles.commentCard}>
                                                        <View style={styles.commentCardHeader}>
                                                            <ThemedText style={styles.commentAuthor}>
                                                                {item.autor}
                                                            </ThemedText>
                                                            <ThemedText style={styles.commentDate}>
                                                                {new Date(item.fecha).toLocaleDateString('es-CO')}
                                                            </ThemedText>
                                                        </View>
                                                        <View style={styles.commentStars}>
                                                            {Array.from({ length: 5 }).map((_, idx) => (
                                                                <Ionicons
                                                                    key={idx}
                                                                    name={idx < item.calificacion ? 'star' : 'star-outline'}
                                                                    size={12}
                                                                    color="#d4956a"
                                                                    style={{ marginRight: 2 }}
                                                                />
                                                            ))}
                                                        </View>
                                                        <ThemedText style={styles.commentText}>
                                                            {item.comentario}
                                                        </ThemedText>
                                                    </View>
                                                ))}

                                                {comentariosProducto.length === 0 && (
                                                    <ThemedText style={styles.noComments}>
                                                        Aún no hay comentarios. ¡Sé el primero en calificarlo!
                                                    </ThemedText>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.divider} />
                                    
                                    <ThemedText style={styles.formHeader}>
                                        {miComentarioId ? 'Editar tu Opinión' : 'Calificar Producto'}
                                    </ThemedText>

                                    {isAuthenticated ? (
                                        (esElegibleComentar || miComentarioId !== null) ? (
                                            <View>
                                                <View style={styles.starsSelectRow}>
                                                    <ThemedText style={styles.starsSelectLabel}>
                                                        Tu Calificación:
                                                    </ThemedText>
                                                    <View style={styles.starsSelectWrap}>
                                                        {Array.from({ length: 5 }).map((_, idx) => {
                                                            const ratingVal = idx + 1;
                                                            return (
                                                                <Pressable 
                                                                    key={idx} 
                                                                    onPress={() => setCalificacionSeleccionada(ratingVal)}
                                                                    style={{ padding: 4 }}
                                                                >
                                                                    <Ionicons
                                                                        name={ratingVal <= calificacionSeleccionada ? 'star' : 'star-outline'}
                                                                        size={24}
                                                                        color="#d4956a"
                                                                    />
                                                                </Pressable>
                                                            );
                                                        })}
                                                    </View>
                                                </View>

                                                <TextInput
                                                    placeholder="Escribe tu opinión sobre el producto (máx. 200 caracteres)..."
                                                    placeholderTextColor="#b8a99a"
                                                    value={comentarioTexto}
                                                    onChangeText={setComentarioTexto}
                                                    maxLength={200}
                                                    multiline
                                                    style={styles.formInput}
                                                />

                                                <View style={styles.formActions}>
                                                    {miComentarioId && (
                                                        <Pressable 
                                                            style={[styles.outlineBtn, { flex: 1, borderColor: '#e07070', paddingVertical: 10 }]}
                                                            onPress={handleEliminarComentario}
                                                            disabled={enviandoComentario}
                                                        >
                                                            <ThemedText style={[styles.outlineBtnText, { color: '#e07070' }]}>
                                                                Eliminar
                                                            </ThemedText>
                                                        </Pressable>
                                                    )}
                                                    <Pressable 
                                                        style={[styles.formBtn, { flex: miComentarioId ? 2 : 1, opacity: enviandoComentario ? 0.7 : 1 }]}
                                                        onPress={handleSubmitComentario}
                                                        disabled={enviandoComentario}
                                                    >
                                                        {enviandoComentario ? (
                                                            <ActivityIndicator size="small" color="#fff" />
                                                        ) : (
                                                            <>
                                                                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                                                                <ThemedText style={styles.formBtnText}>
                                                                    {miComentarioId ? 'Actualizar' : 'Publicar'}
                                                                </ThemedText>
                                                            </>
                                                        )}
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ) : (
                                            <View style={styles.infoBanner}>
                                                <Ionicons name="information-circle-outline" size={18} color="#7c6455" />
                                                <ThemedText style={styles.infoBannerText}>
                                                    Solo puedes calificar y comentar productos que hayas comprado previamente y cuyo pedido se encuentre en estado "Entregado".
                                                </ThemedText>
                                            </View>
                                        )
                                    ) : (
                                        <View style={styles.infoBanner}>
                                            <Ionicons name="lock-closed-outline" size={18} color="#7c6455" />
                                            <ThemedText style={styles.infoBannerText}>
                                                Inicia sesión para opinar sobre este producto.
                                            </ThemedText>
                                        </View>
                                    )}
                                </ScrollView>
                                <View style={styles.modalActions}>
                                    <Pressable
                                        style={[styles.outlineBtn, { flex: 1, paddingVertical: 12 }]}
                                        onPress={() => setShowComentariosModal(false)}>
                                        <ThemedText style={styles.outlineBtnText}>Cerrar</ThemedText>
                                    </Pressable>
                                </View>
                            </ThemedView>
                        </View>
                    </View>
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
    paddingBottom: 16,
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
  paginacionRow: { display: 'none' },
  pagBtn: { display: 'none' },
  pagBtnDisabled: {},
  pagBtnText: { color: '#d4956a' },
  pagBtnTextDisabled: { color: '#b8a99a' },
  pagInfo: { color: '#3d2c1e', fontWeight: '700', fontSize: 13 },

  // barra minimalista en footer
  pagBarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
  },
  pagCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c4a882',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pagCircleBtnOff: {
    backgroundColor: '#f5f0ec',
    shadowOpacity: 0,
    elevation: 0,
  },
  pagDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e8ddd5',
  },
  pagDotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4956a',
  },
  // legacy (unused but kept for TS)
  pagSolidBtn: { display: 'none' },
  pagSolidBtnOff: {},
  pagSolidBtnText: { color: '#fff' },
  pagSolidBtnTextOff: { color: '#b8a99a' },
  pagPillInfo: { display: 'none' },
  pagPillInfoText: { color: '#3d2c1e' },

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
    width: '100%',
  },
  modalCard: {
    padding: 24,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.82,
  },
  modalScroll: {
    flexGrow: 0,
    flexShrink: 1,
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
  dropdownContainer: { position: 'relative', zIndex: 10, width: '100%' },
  filterSearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', paddingHorizontal: 10, height: 38, gap: 6, marginBottom: 4 },
  filterSearchInput: { flex: 1, fontSize: 13, color: '#3d2c1e', padding: 0 },
  dropdownList: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e8ddd5', marginTop: 4, shadowColor: '#c4a882', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#fdf8f4' },
  dropdownItemActive: { backgroundColor: '#fff3e6' },
  dropdownItemText: { fontSize: 13, color: '#3d2c1e', fontWeight: '500' },
  dropdownItemTextActive: { color: '#d4956a', fontWeight: '700' },

  // Comentarios Styles
  commentsSection: {
    marginTop: 8,
  },
  commentsHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3d2c1e',
    marginBottom: 4,
  },
  commentsSub: {
    fontSize: 13,
    color: '#9e8879',
    marginBottom: 12,
  },
  commentCard: {
    backgroundColor: '#fffcf9',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0ede8',
    marginBottom: 8,
  },
  commentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d2c1e',
  },
  commentDate: {
    fontSize: 11,
    color: '#9e8879',
  },
  commentStars: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5c4d40',
  },
  noComments: {
    fontSize: 13,
    color: '#9e8879',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e8ddd5',
    marginVertical: 16,
  },
  formHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3d2c1e',
    marginBottom: 10,
  },
  starsSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  starsSelectLabel: {
    fontSize: 13,
    color: '#7c6455',
    fontWeight: '600',
  },
  starsSelectWrap: {
    flexDirection: 'row',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e8ddd5',
    borderRadius: 12,
    padding: 10,
    minHeight: 70,
    fontSize: 13,
    color: '#3d2c1e',
    backgroundColor: '#fdf8f4',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  formBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d4956a',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  formBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  ratingScrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  ratingScrollButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4956a',
  },
  infoBanner: {
    backgroundColor: '#f5efe9',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#7c6455',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  ratingSummaryPressable: {
    backgroundColor: '#fffcf9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8ddd5',
    padding: 16,
    marginTop: 8,
    shadowColor: '#c4a882',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ratingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingSummaryHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3d2c1e',
  },
  ratingSummaryContent: {
    gap: 8,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingAverageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3d2c1e',
    marginLeft: 6,
  },
  ratingTapToViewText: {
    fontSize: 12,
    color: '#d4956a',
    fontWeight: '600',
    marginTop: 2,
  },
});

