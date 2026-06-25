/**
 * ============================================
 * HOME PAGE - Adaptado a la paleta del proyecto
 * ============================================
 * Página principal del sitio con estilos personalizados (dorados, fondos)
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import catalogoService from '../services/catalogoService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isAdmin, isAuxiliar } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProductosDestacados();
  }, []);

  const loadProductosDestacados = async () => {
    try {
      const response = await catalogoService.getProductosDestacados();
      const payload = response.data || response;
      const data = payload.data || payload;
      setProductos((data.productos || []).slice(0, 4));
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero Section con degradado dorado */}
      <div className="hero-section text-white py-5" style={{ background: 'var(--gradient-gold, linear-gradient(135deg, #f5c271, #c7984e))' }}>
        <Container>
          <Row className="align-items-center py-4 gx-5">
            <Col lg={6} className="fade-in">
              <span className="eyebrow">Casa, estilo y confort</span>
              <h1 className="display-4 fw-bold mb-4" style={{ lineHeight: '1.1' }}>
                Bienvenidos a GAVAT
              </h1>
              <p className="lead mb-4" style={{ fontSize: '1.12rem', opacity: '0.95' }}>
                Compra los mejores productos para tu hogar con envíos rápidos y el respaldo de una tienda confiable.
              </p>

              <div className="hero-actions d-flex flex-wrap gap-3 mb-4">
                <Link
                  to="/catalogo"
                  className="btn btn-hero-primary"
                >
                  <i className="bi bi-grid me-2"></i>
                  Ver Catálogo
                </Link>
                {!isAuthenticated && (
                  <Link 
                    to="/register"
                    className="btn btn-hero-outline"
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Registrarse
                  </Link>
                )}
              </div>

              <div className="hero-hero-cards d-grid gap-3">
                <div className="hero-mini-card">
                  <strong>+1200</strong>
                  <p>Productos en stock</p>
                </div>
                <div className="hero-mini-card">
                  <strong>Entregas rápidas</strong>
                  <p>En todo el país</p>
                </div>
              </div>
            </Col>
            <Col lg={6} className="text-center hero-logo-col">
              <div className="hero-logo-wrap">
                <img 
                  src="/gavat.png"
                  alt="Logo GAVAT"
                  className="hero-logo-img"
                />
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        <div className="section-intro mb-5">
          <div>
            <span className="eyebrow">Recomendados</span>
            <h2 className="fw-bold mb-2">Nuestras colecciones destacadas</h2>
            <p className="text-muted">Encuentra inspiración y los productos mejor valorados por nuestros clientes.</p>
          </div>
          <Link to="/catalogo" className="link-secondary">Ver todo el catálogo</Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <Row className="g-4 mb-5">
            {productos.length > 0 ? (
              productos.map((producto, index) => (
                <Col key={producto.id} md={6} lg={3}>
                  <div className="card-preview" style={{ animation: `fadeIn 0.6s ease-out ${index * 0.1}s both` }}>
                    <ProductCard producto={producto} showActions={false} />
                  </div>
                </Col>
              ))
            ) : (
              <Col>
                <p className="text-center text-muted">No hay productos disponibles</p>
              </Col>
            )}
          </Row>
        )}

        <div className="features-section py-5">
          <Row className="g-4">
            <Col md={4}>
              <Card className="feature-card text-center h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="feature-icon feature-icon-gold">
                    <i className="bi bi-truck"></i>
                  </div>
                  <h5 className="fw-bold mb-3">Envío Express</h5>
                  <p className="text-muted">Despacho rápido y seguro en cada compra.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card text-center h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="feature-icon feature-icon-dark">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <h5 className="fw-bold mb-3">Pago Seguro</h5>
                  <p className="text-muted">Tu información siempre protegida.</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="feature-card text-center h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="feature-icon feature-icon-blue">
                    <i className="bi bi-headset"></i>
                  </div>
                  <h5 className="fw-bold mb-3">Soporte 24/7</h5>
                  <p className="text-muted">Atención inmediata cuando la necesites.</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {!isAuthenticated && (
          <Card className="border-0 shadow-lg cta-card">
            <Card.Body className="text-center py-5 px-4">
              <div className="cta-icon">
                <i className="bi bi-rocket-takeoff"></i>
              </div>
              <h3 className="fw-bold mb-3">Únete a GAVAT hoy</h3>
              <p className="text-muted mb-4">Regístrate gratis y comienza a recibir ofertas exclusivas en tu correo.</p>
              <Link to="/register" className="btn btn-gold-solid">
                <i className="bi bi-person-plus me-2"></i>
                Crear Cuenta Gratis
              </Link>
            </Card.Body>
          </Card>
        )}
      </Container>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .hero-actions .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 190px;
          border-radius: 0.85rem;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .btn-hero-primary {
          background: white;
          color: var(--bg-negativo, #192847);
          border: none;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 35px rgba(0, 0, 0, 0.2);
        }
        .btn-hero-outline {
          background: transparent;
          border: 1.5px solid rgba(255,255,255,0.9);
          color: white;
        }
        .btn-hero-outline:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }
        .hero-logo-col {
          position: relative;
        }
        .hero-logo-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .hero-logo-img {
          width: min(420px, 100%);
          animation: float 4s ease-in-out infinite;
          max-width: 420px;
        }
        .hero-hero-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .hero-mini-card {
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          background: rgba(255,255,255,0.14);
          border: 1px solid rgba(255,255,255,0.18);
          color: white;
        }
        .hero-mini-card strong {
          display: block;
          font-size: 1rem;
          margin-bottom: 0.4rem;
        }
        .section-intro {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .section-intro .eyebrow {
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.75rem;
          color: var(--gray-600);
          margin-bottom: 0.5rem;
        }
        .link-secondary {
          color: var(--bg-negativo);
          font-weight: 700;
          text-decoration: none;
        }
        .link-secondary:hover {
          text-decoration: underline;
        }
        .card-preview {
          height: 100%;
        }
        .features-section {
          margin-top: 3rem;
        }
        .feature-icon {
          width: 84px;
          height: 84px;
          display: grid;
          place-items: center;
          margin: 0 auto 1rem;
          border-radius: 1.25rem;
          background: rgba(145, 105, 52, 0.1);
          color: var(--bg-negativo);
          font-size: 2rem;
        }
        .feature-icon-gold {
          background: rgba(245, 194, 113, 0.18);
        }
        .feature-icon-dark {
          background: rgba(25, 40, 71, 0.16);
        }
        .feature-icon-blue {
          background: rgba(6, 182, 212, 0.16);
        }
        .cta-card {
          border-radius: 1.5rem;
          background: var(--bg-positiva);
          margin-top: 3rem;
        }
        .cta-icon {
          width: 88px;
          height: 88px;
          display: grid;
          place-items: center;
          margin: 0 auto 1.5rem;
          border-radius: 1.25rem;
          background: rgba(245, 194, 113, 0.18);
          color: var(--bg-negativo);
          font-size: 2rem;
        }
        .btn-gold-solid {
          background: var(--gradient-gold);
          color: var(--fnt-black);
          border: none;
          padding: 0.95rem 2.25rem;
          border-radius: 1rem;
          font-weight: 700;
        }
        .btn-gold-solid:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(145, 105, 52, 0.25);
        }
      `}</style>
    </>
  );
};

export default HomePage;