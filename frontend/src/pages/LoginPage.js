/**
 * ============================================
 * LOGIN PAGE
 * ============================================
 * Página de inicio de sesión
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tieneCarrito, setTieneCarrito] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si hay items en el carrito local
    const carritoLocal = JSON.parse(localStorage.getItem('carrito_local') || '[]');
    setTieneCarrito(carritoLocal.length > 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      
      // Redirigir según el rol
      if (response.data.usuario.rol === 'cliente') {
        navigate('/catalogo');
      } else if (response.data.usuario.rol === 'administrador' || response.data.usuario.rol === 'auxiliar') {
        navigate('/admin/dashboard');  // Ir solo al dashboard, no a productos
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar Sesión
                </h2>
                <p className="text-muted">Accede a tu cuenta</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              {tieneCarrito && (
                <Alert variant="success" className="mb-3">
                  <i className="bi bi-cart-check me-2"></i>
                  Tu carrito se sincronizará automáticamente al iniciar sesión
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-envelope me-2"></i>
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <i className="bi bi-lock me-2"></i>
                    Contraseña
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </Form>

              <hr />

              <div className="text-center">
                <p className="mb-2">¿No tienes cuenta?</p>
                <Link to="/register" className="btn btn-outline-primary w-100">
                  <i className="bi bi-person-plus me-2"></i>
                  Crear cuenta nueva
                </Link>
              </div>

              <div className="mt-4">
                <Alert variant="info" className="mb-0">
                  <strong>Cuentas de prueba:</strong>
                  <br />
                  <small>Admin: admin@ecommerce.com / admin1234</small>
                  <br />
                  <small>Cliente: cliente1@ecommerce.com / cliente1</small>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
