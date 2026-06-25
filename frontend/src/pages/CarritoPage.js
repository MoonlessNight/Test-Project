/**
 * ============================================
 * CARRITO PAGE - Adaptado a la paleta del proyecto
 * ============================================
 * Página del carrito de compras con estilos personalizados (dorados, fondos)
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
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
      <h1 className="carrito-title mb-4">
        <i className="bi bi-cart me-2"></i>
        Mi Carrito
      </h1>

      {!isAuthenticated && (
        <Alert variant="info" className="carrito-alert-info mb-4">
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
        <Card className="carrito-empty-card text-center py-5">
          <Card.Body>
            <i className="bi bi-cart-x display-1 text-muted"></i>
            <h3 className="mt-3">Tu carrito está vacío</h3>
            <p className="text-muted">Agrega productos para comenzar tu compra</p>
            <Button as={Link} to="/catalogo" className="btn-ir-catalogo">
              <i className="bi bi-shop me-2"></i>
              Ir al Catálogo
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="carrito-card mb-4">
              <Card.Header className="carrito-card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    Productos en tu carrito
                    <Badge className="carrito-badge ms-2">{items.length}</Badge>
                  </h5>
                  <Button 
                    className="btn-vaciar-carrito" 
                    size="sm"
                    onClick={handleVaciarCarrito}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Vaciar carrito
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive hover className="carrito-table mb-0">
                  <thead className="carrito-table-header">
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
                              className="btn-cantidad"
                              size="sm"
                              onClick={() => handleCantidadChange(item.id, item.cantidad - 1)}
                            >
                              <i className="bi bi-dash"></i>
                            </Button>
                            <span className="mx-3">{item.cantidad}</span>
                            <Button
                              className="btn-cantidad"
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
                            className="btn-eliminar"
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
            <Card className="resumen-card sticky-top" style={{ top: '20px' }}>
              <Card.Header className="resumen-card-header">
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
                <hr className="resumen-hr" />
                <div className="d-flex justify-content-between mb-3">
                  <strong>Total:</strong>
                  <strong className="resumen-total fs-4">{formatearPrecio(total)}</strong>
                </div>

                <Button
                  className="btn-proceder-pago w-100 mb-2"
                  size="lg"
                  onClick={handleProcederPago}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  {isAuthenticated ? 'Proceder al Pago' : 'Iniciar Sesión para Pagar'}
                </Button>

                <Button as={Link} to="/catalogo" className="btn-seguir-comprando w-100">
                  <i className="bi bi-arrow-left me-2"></i>
                  Seguir Comprando
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Estilos personalizados usando variables globales */}
      <style jsx>{`
        .carrito-title {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .carrito-alert-info {
          border-radius: 0.75rem;
          background-color: #cfe2ff;
          border: none;
          color: #084298;
        }
        .carrito-empty-card, .carrito-card, .resumen-card {
          border-radius: 1.5rem;
          border: none;
          overflow: hidden;
          background: var(--bg, #ffffff);
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }
        .carrito-card-header, .resumen-card-header {
          background: var(--bg-positiva, #DBE1ED);
          border-bottom: none;
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: var(--bg-negativo, #192847);
        }
        .carrito-badge {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          color: var(--fnt-black, #000000);
          padding: 0.35rem 0.65rem;
          border-radius: 0.5rem;
        }
        .btn-vaciar-carrito {
          background: transparent;
          border: 1px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }
        .btn-vaciar-carrito:hover {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000000);
          transform: translateY(-1px);
        }
        .carrito-table {
          border-radius: 1.5rem;
          overflow: hidden;
        }
        .carrito-table-header {
          background: var(--bg-positiva, #DBE1ED);
          color: var(--bg-negativo, #192847);
          font-weight: 600;
        }
        .carrito-table-header th {
          border-bottom: none;
          padding: 1rem;
        }
        .btn-cantidad {
          background: transparent;
          border: 1px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.5rem;
          padding: 0.25rem 0.5rem;
          transition: all 0.2s ease;
        }
        .btn-cantidad:hover {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000000);
        }
        .btn-eliminar {
          background: transparent;
          border: 1px solid #dc3545;
          color: #dc3545;
          border-radius: 0.5rem;
          padding: 0.25rem 0.5rem;
          transition: all 0.2s ease;
        }
        .btn-eliminar:hover {
          background: #dc3545;
          color: white;
          transform: translateY(-1px);
        }
        .resumen-hr {
          background-color: var(--gray-300, #d1d5db);
          opacity: 0.5;
        }
        .resumen-total {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .btn-proceder-pago {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem;
          font-weight: 600;
          color: var(--fnt-black, #000000);
          transition: all 0.3s ease;
        }
        .btn-proceder-pago:hover {
          background: linear-gradient(135deg, var(--bs-gold-dark, #c7984e), var(--bs-oldGold-bg, #916934));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px 0 rgba(145, 105, 52, 0.3);
        }
        .btn-seguir-comprando {
          background: transparent;
          border: 2px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.75rem;
          padding: 0.625rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-seguir-comprando:hover {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000000);
          transform: translateY(-2px);
        }
        .btn-ir-catalogo {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.625rem 1.5rem;
          font-weight: 600;
          color: var(--fnt-black, #000000);
          transition: all 0.3s ease;
        }
        .btn-ir-catalogo:hover {
          background: linear-gradient(135deg, var(--bs-gold-dark, #c7984e), var(--bs-oldGold-bg, #916934));
          transform: translateY(-2px);
        }
      `}</style>
    </Container>
  );
};

export default CarritoPage;