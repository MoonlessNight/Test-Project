/**
 * ============================================
 * PRODUCTO DETALLE PAGE
 * ============================================
 * Página de detalle completo de un producto con comentarios
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button, Badge, Alert, Breadcrumb } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import catalogoService from '../services/catalogoService';
import carritoService from '../services/carritoService';
import ProductoComentarios from '../components/ProductoComentarios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, getImageUrl } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

const ProductoDetallePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cantidad, setCantidad] = useState('');
  const { isAuthenticated, isCliente } = useAuth();

  useEffect(() => {
    const cargarProducto = async () => {
      setLoading(true);
      try {
        const response = await catalogoService.getProductoById(id);
        setProducto(response.data.producto);
      } catch (error) {
        console.error('Error al cargar producto:', error);
        setMensaje({ tipo: 'danger', texto: 'Error al cargar el producto' });
        setTimeout(() => navigate('/catalogo'), 2000);
      } finally {
        setLoading(false);
      }
    };

    cargarProducto();
  }, [id, navigate]);

  const handleAddToCart = useCallback(async () => {
    try {
      const cantidadFinal = cantidad === '' ? 1 : cantidad;
      await carritoService.agregarAlCarrito(producto.id, cantidadFinal, producto);
      setMensaje({ tipo: 'success', texto: `${producto.nombre} agregado al carrito` });
      setCantidad('');
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (error) {
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al agregar al carrito' });
    }
  }, [producto, cantidad]);

  const handleCantidadChange = useCallback((e) => {
    const valor = e.target.value;
    const maxStock = producto?.stock || 1;
    
    if (valor === '') {
      setCantidad('');
    } else {
      const num = parseInt(valor, 10);
      if (!isNaN(num)) {
        if (num < 1) {
          setCantidad('');
        } else if (num > maxStock) {
          setCantidad(maxStock);
        } else {
          setCantidad(num);
        }
      }
    }
  }, [producto?.stock]);

  const handleIncreaseQuantity = useCallback(() => {
    const maxStock = producto?.stock || 1;
    const currentValue = cantidad === '' ? 0 : cantidad;
    
    if (currentValue < maxStock) {
      setCantidad(currentValue + 1);
    }
  }, [cantidad, producto?.stock]);

  const handleDecreaseQuantity = useCallback(() => {
    const currentValue = cantidad === '' ? 0 : cantidad;
    
    if (currentValue > 1) {
      setCantidad(currentValue - 1);
    } else if (currentValue === 1) {
      setCantidad('');
    }
  }, [cantidad]);

  const handleComentarioCreado = useCallback(() => {
    setMensaje({ tipo: 'success', texto: 'Comentario creado exitosamente' });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  }, []);

  if (loading) {
    return <LoadingSpinner message="Cargando producto..." />;
  }

  if (!producto) {
    return (
      <Container className="py-4 text-center">
        <h2>Producto no encontrado</h2>
        <Button onClick={() => navigate('/catalogo')} className="mt-3">
          <i className="bi bi-arrow-left me-2"></i>
          Volver al catálogo
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }} className="text-decoration-none">
          <i className="bi bi-house me-2"></i>Inicio
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/catalogo')} style={{ cursor: 'pointer' }} className="text-decoration-none">
          Catálogo
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Mensaje */}
      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Detalle del producto */}
      <Row className="mb-5">
        <Col md={6} className="mb-4">
          <div style={{
            overflow: 'hidden',
            borderRadius: '1rem',
            backgroundColor: '#f8f9fa',
            height: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img
              src={getImageUrl(producto.imagen)}
              alt={producto.nombre}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        </Col>

        <Col md={6}>
          <h1 className="mb-3">{producto.nombre}</h1>

          <div className="mb-3">
            <p className="text-muted">{producto.descripcion}</p>
          </div>

          {/* Stock Badge */}
          <div className="mb-3">
            {producto.stock > 0 ? (
              <Badge className="badge-stock-success" style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                <i className="bi bi-check-circle me-1"></i>
                En stock: {producto.stock} unidades
              </Badge>
            ) : (
              <Badge className="badge-stock-danger" style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                <i className="bi bi-x-circle me-1"></i>
                Sin stock
              </Badge>
            )}
          </div>

          {/* Precio */}
          <h2 className="mb-4" style={{ color: 'var(--bs-oldGold-bg)', fontWeight: '700' }}>
            {formatCurrency(producto.precio)}
          </h2>

          {/* Cantidad */}
          {producto.stock > 0 && (
            <div className="mb-4">
              <label className="form-label">Cantidad (máximo {producto.stock}):</label>
              <div className="d-flex align-items-center gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleDecreaseQuantity}
                >
                  <i className="bi bi-dash"></i>
                </Button>
                <input
                  type="number"
                  className="form-control cantidad-input text-center"
                  placeholder="0"
                  value={cantidad}
                  onChange={handleCantidadChange}
                  min="1"
                  max={producto.stock}
                  style={{ width: '80px' }}
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleIncreaseQuantity}
                >
                  <i className="bi bi-plus"></i>
                </Button>
              </div>
            </div>
          )}

          {/* Botón Agregar al carrito */}
          {isAuthenticated && isCliente && producto.stock > 0 && (
            <Button
              className="w-100 btn-add-to-cart mb-3"
              size="lg"
              onClick={handleAddToCart}
            >
              <i className="bi bi-cart-plus me-2"></i>
              Agregar {cantidad} al carrito
            </Button>
          )}

          {!isAuthenticated && (
            <Button
              className="w-100 mb-3"
              size="lg"
              onClick={() => navigate('/login')}
              variant="info"
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Inicia sesión para comprar
            </Button>
          )}

          {producto.stock === 0 && (
            <Button className="w-100" size="lg" disabled variant="secondary">
              <i className="bi bi-ban me-2"></i>
              Producto no disponible
            </Button>
          )}

          {/* Información adicional */}
          <div className="mt-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '0.75rem' }}>
            <div className="mb-2">
              <strong>SKU:</strong> {producto.id}
            </div>
            {producto.categoria && (
              <div className="mb-2">
                <strong>Categoría:</strong> {producto.categoria?.nombre || 'N/A'}
              </div>
            )}
            {producto.subcategoria && (
              <div>
                <strong>Subcategoría:</strong> {producto.subcategoria?.nombre || 'N/A'}
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Comentarios */}
      <Row className="mb-5">
        <Col>
          <ProductoComentarios 
            productoId={producto.id}
            onComentarioCreado={handleComentarioCreado}
          />
        </Col>
      </Row>

      {/* Botón volver */}
      <Row>
        <Col className="text-center">
          <Button
            variant="outline-secondary"
            onClick={() => navigate('/catalogo')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver al catálogo
          </Button>
        </Col>
      </Row>

      <style jsx>{`
        .badge-stock-success {
          background-color: #198754;
          color: white;
        }
        .badge-stock-danger {
          background-color: #dc3545;
          color: white;
        }
        .cantidad-input::-webkit-outer-spin-button,
        .cantidad-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .cantidad-input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </Container>
  );
};

export default ProductoDetallePage;
