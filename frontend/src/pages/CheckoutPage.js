/**
 * ============================================
 * CHECKOUT PAGE - Adaptado a la paleta del proyecto
 * ============================================
 * Página para finalizar la compra con estilos personalizados (dorados, fondos)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carritoService from '../services/carritoService';
import pedidoService from '../services/pedidoService';
import LoadingSpinner from '../components/LoadingSpinner';

const CheckoutPage = () => {
  const [carrito, setCarrito] = useState(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    direccionEnvio: '',
    telefono: '',
    metodoPago: 'efectivo',
    solicitudPedido: ''
  });

  const loadCarrito = useCallback(async () => {
    setLoading(true);
    try {
      const response = await carritoService.getCarrito();
      const carritoData = response.data || response.carrito;
      
      if (!carritoData || !carritoData.items || carritoData.items.length === 0) {
        setMensaje({ 
          tipo: 'warning', 
          texto: 'Tu carrito está vacío' 
        });
        setTimeout(() => navigate('/carrito'), 2000);
        return;
      }
      
      setCarrito(carritoData);
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar el carrito' });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMensaje({ 
        tipo: 'warning', 
        texto: 'Debes iniciar sesión para proceder al pago' 
      });
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    loadCarrito();
  }, [isAuthenticated, navigate, loadCarrito]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.direccionEnvio.trim()) {
      setMensaje({ tipo: 'danger', texto: 'La dirección de envío es requerida' });
      return;
    }
    
    if (!formData.telefono.trim()) {
      setMensaje({ tipo: 'danger', texto: 'El teléfono es requerido' });
      return;
    }

    setProcesando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const response = await pedidoService.crearPedido(
        formData.direccionEnvio,
        formData.telefono,
        formData.metodoPago,
        formData.solicitudPedido
      );

      if (response.success) {
        const pedidoId = response.data?.pedido?.id || response.pedido?.id;
        if (pedidoId) {
          navigate(`/pedido-confirmado/${pedidoId}`);
        } else {
          setMensaje({ 
            tipo: 'danger', 
            texto: 'Error: No se pudo obtener el ID del pedido' 
          });
        }
      } else {
        setMensaje({ 
          tipo: 'danger', 
          texto: response.message || 'Error al procesar el pedido' 
        });
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      setMensaje({ 
        tipo: 'danger', 
        texto: error.message || 'Error al procesar el pedido' 
      });
    } finally {
      setProcesando(false);
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  if (loading) {
    return <LoadingSpinner message="Cargando información..." />;
  }

  const items = carrito?.items || [];
  const total = parseFloat(carrito?.resumen?.total || 0);

  return (
    <Container className="py-4">
      <h1 className="checkout-title mb-4">
        <i className="bi bi-credit-card me-2"></i>
        Finalizar Compra
      </h1>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          <Card className="checkout-card mb-4">
            <Card.Header className="checkout-card-header">
              <h5 className="mb-0">Información de Envío</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="checkout-label">
                    Nombre Completo <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={user?.nombre || ''}
                    disabled
                    className="checkout-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="checkout-label">
                    Correo Electrónico <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="checkout-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="checkout-label">
                    Dirección de Envío <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="direccionEnvio"
                    value={formData.direccionEnvio}
                    onChange={handleChange}
                    placeholder="Ingresa tu dirección completa"
                    required
                    className="checkout-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="checkout-label">
                    Teléfono de Contacto <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 3001234567"
                    required
                    className="checkout-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="checkout-label">Método de Pago</Form.Label>
                  <Form.Select
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleChange}
                    className="checkout-select"
                  >
                    <option value="efectivo">Efectivo (Pago contra entrega)</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="checkout-label">Solicitud del Pedido (Opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="solicitudPedido"
                    value={formData.solicitudPedido}
                    onChange={handleChange}
                    placeholder="Describe la solicitud o instrucción del pedido"
                    className="checkout-input"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    className="btn-confirmar-pedido"
                    size="lg"
                    type="submit"
                    disabled={procesando}
                  >
                    {procesando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Confirmar Pedido
                      </>
                    )}
                  </Button>
                  <Button
                    className="btn-volver-carrito"
                    onClick={() => navigate('/carrito')}
                    disabled={procesando}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver al Carrito
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="resumen-card sticky-top" style={{ top: '20px' }}>
            <Card.Header className="resumen-card-header">
              <h5 className="mb-0">Resumen del Pedido</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {items.map((item) => (
                  <ListGroup.Item key={item.id} className="resumen-item px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <div className="fw-bold">{item.producto?.nombre || item.nombre}</div>
                        <small className="text-muted">
                          Cantidad: {item.cantidad} x {formatearPrecio(item.precioUnitario || item.precio)}
                        </small>
                      </div>
                      <div className="fw-bold">
                        {formatearPrecio((item.precioUnitario || item.precio) * item.cantidad)}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <hr className="resumen-hr" />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatearPrecio(total)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Envío:</span>
                <span className="text-muted">Gratis</span>
              </div>
              <hr className="resumen-hr" />
              <div className="d-flex justify-content-between mb-0">
                <strong className="fs-5">Total:</strong>
                <strong className="resumen-total fs-4">{formatearPrecio(total)}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estilos personalizados usando variables globales */}
      <style jsx>{`
        .checkout-title {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .checkout-card, .resumen-card {
          border-radius: 1.5rem;
          border: none;
          overflow: hidden;
          background: var(--bg, #ffffff);
          box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        }
        .checkout-card-header, .resumen-card-header {
          background: var(--bg-positiva, #DBE1ED);
          border-bottom: none;
          padding: 1rem 1.5rem;
          font-weight: 600;
          color: var(--bg-negativo, #192847);
        }
        .checkout-label {
          font-weight: 600;
          color: var(--bg-negativo, #192847);
        }
        .checkout-input, .checkout-select {
          border-radius: 0.75rem;
          border: 1px solid var(--gray-300, #d1d5db);
          padding: 0.625rem 1rem;
          transition: all 0.3s ease;
          background-color: var(--bg, #ffffff);
        }
        .checkout-input:focus, .checkout-select:focus {
          border-color: var(--bs-gold, #f5c271);
          box-shadow: 0 0 0 3px rgba(145, 105, 52, 0.1);
        }
        .btn-confirmar-pedido {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.75rem;
          font-weight: 600;
          color: var(--fnt-black, #000000);
          transition: all 0.3s ease;
        }
        .btn-confirmar-pedido:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--bs-gold-dark, #c7984e), var(--bs-oldGold-bg, #916934));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px 0 rgba(145, 105, 52, 0.3);
        }
        .btn-confirmar-pedido:active {
          transform: translateY(0);
        }
        .btn-volver-carrito {
          background: transparent;
          border: 2px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.75rem;
          padding: 0.625rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-volver-carrito:hover:not(:disabled) {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000000);
          transform: translateY(-2px);
        }
        .resumen-item {
          background: transparent;
          border-bottom: 1px solid var(--gray-200, #e5e7eb);
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
      `}</style>
    </Container>
  );
};

export default CheckoutPage;