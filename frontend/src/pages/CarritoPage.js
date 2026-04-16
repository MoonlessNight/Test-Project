/**
 * ============================================
 * CARRITO PAGE
 * ============================================
 * Página del carrito de compras
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import carritoService from '../services/carritoService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const CarritoPage = () => {
  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCarrito();
  }, []);

  const loadCarrito = async () => {
    setLoading(true);
    try {
      const response = await carritoService.getCarrito();
      console.log('📥 Respuesta del carrito:', response);
      // El backend devuelve response.data con items y resumen
      setCarrito(response.data || response.carrito);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar el carrito' });
    } finally {
      setLoading(false);
    }
  };

  const handleCantidadChange = async (itemId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;

    try {
      await carritoService.actualizarItem(itemId, nuevaCantidad);
      await loadCarrito();
      setMensaje({ tipo: 'success', texto: 'Cantidad actualizada' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (error) {
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al actualizar cantidad' });
    }
  };

  const handleEliminar = async (itemId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await carritoService.eliminarItem(itemId);
      await loadCarrito();
      setMensaje({ tipo: 'success', texto: 'Producto eliminado del carrito' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (error) {
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al eliminar producto' });
    }
  };

  const handleVaciarCarrito = async () => {
    if (!window.confirm('¿Estás seguro de vaciar todo el carrito?')) return;

    try {
      await carritoService.vaciarCarrito();
      await loadCarrito();
      setMensaje({ tipo: 'success', texto: 'Carrito vaciado' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (error) {
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al vaciar carrito' });
    }
  };

  const handleProcederPago = () => {
    if (!isAuthenticated) {
      setMensaje({ 
        tipo: 'warning', 
        texto: 'Debes iniciar sesión para proceder al pago' 
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Aquí iría la navegación a la página de checkout
    navigate('/checkout');
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  if (loading) {
    return <LoadingSpinner message="Cargando carrito..." />;
  }

  const items = carrito?.items || [];
  const total = parseFloat(carrito?.resumen?.total || carrito?.total || 0);

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <i className="bi bi-cart me-2"></i>
        Mi Carrito
      </h1>

      {!isAuthenticated && (
        <Alert variant="info" className="mb-4">
          <i className="bi bi-info-circle me-2"></i>
          Puedes agregar productos sin iniciar sesión. Al momento de pagar deberás crear una cuenta o iniciar sesión.
        </Alert>
      )}

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {items.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-cart-x display-1 text-muted"></i>
            <h3 className="mt-3">Tu carrito está vacío</h3>
            <p className="text-muted">Agrega productos para comenzar tu compra</p>
            <Button variant="primary" onClick={() => navigate('/catalogo')}>
              <i className="bi bi-shop me-2"></i>
              Ir al Catálogo
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="mb-4">
              <Card.Header className="bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    Productos en tu carrito
                    <Badge bg="primary" className="ms-2">{items.length}</Badge>
                  </h5>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleVaciarCarrito}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Vaciar carrito
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Precio</th>
                      <th className="text-center">Cantidad</th>
                      <th className="text-center">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={item.producto?.imagen || item.imagen || '/producto-default.jpg'}
                              alt={item.producto?.nombre || item.nombre}
                              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                              className="rounded me-3"
                              onError={(e) => {
                                e.target.src = '/producto-default.jpg';
                              }}
                            />
                            <div>
                              <div className="fw-bold">
                                {item.producto?.nombre || item.nombre}
                              </div>
                              {item.producto?.categoria && (
                                <small className="text-muted">
                                  {item.producto.categoria.nombre}
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center align-middle">
                          {formatearPrecio(item.precioUnitario || item.precio)}
                        </td>
                        <td className="text-center align-middle">
                          <div className="d-flex justify-content-center align-items-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleCantidadChange(item.id, item.cantidad - 1)}
                            >
                              <i className="bi bi-dash"></i>
                            </Button>
                            <span className="mx-3">{item.cantidad}</span>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={() => handleCantidadChange(item.id, item.cantidad + 1)}
                            >
                              <i className="bi bi-plus"></i>
                            </Button>
                          </div>
                        </td>
                        <td className="text-center align-middle fw-bold">
                          {formatearPrecio((item.precioUnitario || item.precio) * item.cantidad)}
                        </td>
                        <td className="text-center align-middle">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleEliminar(item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="sticky-top" style={{ top: '20px' }}>
              <Card.Header className="bg-white">
                <h5 className="mb-0">Resumen del Pedido</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal:</span>
                  <span>{formatearPrecio(total)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Envío:</span>
                  <span className="text-muted">A calcular</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <strong className="text-primary fs-4">{formatearPrecio(total)}</strong>
                </div>

                <Button
                  variant="primary"
                  className="w-100 mb-2"
                  size="lg"
                  onClick={handleProcederPago}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
                </Button>

                <Button
                  variant="outline-secondary"
                  className="w-100"
                  onClick={() => navigate('/catalogo')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Seguir Comprando
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default CarritoPage;
