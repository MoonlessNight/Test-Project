/**
 * ============================================
 * FOOTER COMPONENT
 * ============================================
 * Pie de página del sitio
 */

import React, { memo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = memo(() => {
  return (
    <footer className="bg-dark text-light mt-5 py-4">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <h5>
              <i className="bi bi-shop me-2"></i>
              E-Commerce
            </h5>
            <p className="text-muted">
              Tu tienda en línea de confianza. Encuentra los mejores productos al mejor precio.
            </p>
          </Col>
          
          <Col md={4} className="mb-3">
            <h6>Enlaces</h6>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="text-muted text-decoration-none">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="text-muted text-decoration-none">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-muted text-decoration-none">
                  Registrarse
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted text-decoration-none">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col md={4} className="mb-3">
            <h6>Contacto</h6>
            <p className="text-muted mb-1">
              <i className="bi bi-envelope me-2"></i>
              info@ecommerce.com
            </p>
            <p className="text-muted mb-1">
              <i className="bi bi-telephone me-2"></i>
              +57 300 123 4567
            </p>
            <div className="mt-3">
              <a href="#" className="text-light me-3">
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a href="#" className="text-light me-3">
                <i className="bi bi-instagram fs-5"></i>
              </a>
              <a href="#" className="text-light">
                <i className="bi bi-twitter fs-5"></i>
              </a>
            </div>
          </Col>
        </Row>
        
        <hr className="bg-secondary" />
        
        <Row>
          <Col className="text-center text-muted">
            <small>
              © {new Date().getFullYear()} E-Commerce SENA. Todos los derechos reservados.
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
