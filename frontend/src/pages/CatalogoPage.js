/**
 * ============================================
 * CATALOGO PAGE
 * ============================================
 * Catálogo de productos con filtros
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import catalogoService from '../services/catalogoService';
import carritoService from '../services/carritoService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const CatalogoPage = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [paginacion, setPaginacion] = useState({ total: 0, pagina: 1, totalPaginas: 1 });
  const timeoutRef = useRef(null);
  const debounceRef = useRef(null);
  const isInitialMount = useRef(true);
  
  const [filtros, setFiltros] = useState({
    categoriaId: '',
    subcategoriaId: '',
    buscar: '',
    pagina: 1,
  });

  const { isAuthenticated, isCliente } = useAuth();
  const navigate = useNavigate();

  // Función para cargar productos (no depende de state)
  const fetchProductos = useCallback(async (filtrosActuales) => {
    setLoading(true);
    try {
      const response = await catalogoService.getProductos(filtrosActuales);
      setProductos(response.data.productos);
      setPaginacion(response.data.paginacion);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar productos' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategorias = useCallback(async () => {
    try {
      const response = await catalogoService.getCategorias();
      setCategorias(response.data.categorias);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  }, []);

  const loadSubcategorias = useCallback(async (categoriaId) => {
    try {
      const response = await catalogoService.getSubcategoriasPorCategoria(categoriaId);
      setSubcategorias(response.data.subcategorias);
    } catch (error) {
      console.error('Error al cargar subcategorías:', error);
    }
  }, []);

  // Cargar categorías al montar
  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  // Aplicar filtros automáticamente cuando cambien (incluye carga inicial)
  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Aplicar debounce solo a búsqueda de texto (y solo después del primer render)
    const delay = filtros.buscar && !isInitialMount.current ? 500 : 0;
    
    debounceRef.current = setTimeout(() => {
      fetchProductos(filtros);
      isInitialMount.current = false;
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filtros, fetchProductos]);

  // Cargar subcategorías cuando cambie la categoría
  useEffect(() => {
    if (filtros.categoriaId) {
      loadSubcategorias(filtros.categoriaId);
    } else {
      setSubcategorias([]);
      setFiltros(prevFiltros => ({ ...prevFiltros, subcategoriaId: '', pagina: 1 }));
    }
  }, [filtros.categoriaId, loadSubcategorias]);

  const handleFiltroChange = useCallback((e) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      [e.target.name]: e.target.value,
      pagina: 1, // Resetear a página 1 cuando cambian los filtros
    }));
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({
      categoriaId: '',
      subcategoriaId: '',
      buscar: '',
      pagina: 1,
    });
  }, []);

  const handlePageChange = useCallback((nuevaPagina) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      pagina: nuevaPagina
    }));
  }, []);

  const handleAddToCart = useCallback(async (producto) => {
    try {
      await carritoService.agregarAlCarrito(producto.id, 1, producto);
      setMensaje({ tipo: 'success', texto: `${producto.nombre} agregado al carrito` });
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Establecer nuevo timeout
      timeoutRef.current = setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 3000);
    } catch (error) {
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al agregar al carrito' });
    }
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-grid me-2"></i>
        Catálogo de Productos
      </h1>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      <Row>
        {/* Filtros laterales */}
        <Col md={3} className="mb-4">
          <div className="bg-light p-3 rounded">
            <h5 className="mb-3">
              <i className="bi bi-funnel me-2"></i>
              Filtros
            </h5>

            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Buscar</Form.Label>
                <Form.Control
                  type="text"
                  name="buscar"
                  placeholder="Nombre del producto..."
                  value={filtros.buscar}
                  onChange={handleFiltroChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Categoría</Form.Label>
                <Form.Select
                  name="categoriaId"
                  value={filtros.categoriaId}
                  onChange={handleFiltroChange}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {subcategorias.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Subcategoría</Form.Label>
                  <Form.Select
                    name="subcategoriaId"
                    value={filtros.subcategoriaId}
                    onChange={handleFiltroChange}
                  >
                    <option value="">Todas las subcategorías</option>
                    {subcategorias.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={handleLimpiarFiltros}
              >
                <i className="bi bi-x-circle me-2"></i>
                Limpiar Filtros
              </Button>
            </Form>
          </div>
        </Col>

        {/* Grid de productos */}
        <Col md={9}>
          {loading ? (
            <LoadingSpinner message="Cargando productos..." />
          ) : productos.length > 0 ? (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                  Mostrando {productos.length} de {paginacion.total} productos
                </p>
                <p className="text-muted mb-0">
                  Página {paginacion.pagina} de {paginacion.totalPaginas}
                </p>
              </div>
              <Row className="g-4">
                {productos.map((producto) => (
                  <Col key={producto.id} sm={6} lg={4}>
                    <ProductCard
                      producto={producto}
                      onAddToCart={handleAddToCart}
                    />
                  </Col>
                ))}
              </Row>

              {/* Paginación */}
              {paginacion.totalPaginas > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Button
                    variant="outline-primary"
                    disabled={paginacion.pagina === 1}
                    onClick={() => handlePageChange(paginacion.pagina - 1)}
                    className="me-2"
                  >
                    <i className="bi bi-chevron-left"></i> Anterior
                  </Button>
                  
                  <div className="d-flex align-items-center mx-3">
                    {Array.from({ length: Math.min(5, paginacion.totalPaginas) }, (_, i) => {
                      let pageNum;
                      if (paginacion.totalPaginas <= 5) {
                        pageNum = i + 1;
                      } else if (paginacion.pagina <= 3) {
                        pageNum = i + 1;
                      } else if (paginacion.pagina >= paginacion.totalPaginas - 2) {
                        pageNum = paginacion.totalPaginas - 4 + i;
                      } else {
                        pageNum = paginacion.pagina - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={paginacion.pagina === pageNum ? 'primary' : 'outline-primary'}
                          onClick={() => handlePageChange(pageNum)}
                          className="me-2"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline-primary"
                    disabled={paginacion.pagina === paginacion.totalPaginas}
                    onClick={() => handlePageChange(paginacion.pagina + 1)}
                  >
                    Siguiente <i className="bi bi-chevron-right"></i>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <h4 className="mt-3">No se encontraron productos</h4>
              <p className="text-muted">
                Intenta cambiar los filtros de búsqueda
              </p>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CatalogoPage;
