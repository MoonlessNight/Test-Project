/**
 * ============================================
 * CHECKOUT PAGE
 * ============================================
 * Página para finalizar la compra
 */

import React, { useState, useEffect } from 'react';
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
    notasAdicionales: ''
  });

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
  }, [isAuthenticated, navigate]);

  const loadCarrito = async () => {
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
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación
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
        formData.telefono
      );

      if (response.success) {
        // Redirigir a la página de confirmación con el ID del pedido
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
      <h1 className="mb-4">
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
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Información de Envío</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Nombre Completo <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={user?.nombre || ''}
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Correo Electrónico <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="email"
                    value={user?.email || ''}
                    disabled
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
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
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Teléfono de Contacto <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 3001234567"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Método de Pago</Form.Label>
                  <Form.Select
                    name="metodoPago"
                    value={formData.metodoPago}
                    onChange={handleChange}
                  >
                    <option value="efectivo">Efectivo (Pago contra entrega)</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Notas Adicionales (Opcional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="notasAdicionales"
                    value={formData.notasAdicionales}
                    onChange={handleChange}
                    placeholder="Instrucciones especiales para la entrega"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
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
                    variant="outline-secondary"
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
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-white">
              <h5 className="mb-0">Resumen del Pedido</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                {items.map((item) => (
                  <ListGroup.Item key={item.id} className="px-0">
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

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatearPrecio(total)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Envío:</span>
                <span className="text-muted">Gratis</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-0">
                <strong className="fs-5">Total:</strong>
                <strong className="text-primary fs-4">{formatearPrecio(total)}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutPage;
