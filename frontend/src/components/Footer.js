/**
 * ============================================
 * FOOTER COMPONENT - Adaptado a la paleta del proyecto
 * ============================================
 * Pie de página con colores personalizados (fondo negativo, dorados)
 */

import React, { memo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Footer = memo(() => {
  return (
    <footer className="bg-negativo text-light mt-5 py-4">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <h5 className="text-gold">
              <i className="bi bi-shop me-2"></i>
              GAVAT
            </h5>
            <p className="text-light opacity-75">
              Tu tienda en línea donde compras material para realizar cambios en tu casa. ¡Encuentra todo lo que necesitas para transformar tus espacios con estilo y calidad!
            </p>
          </Col>
          
          <Col md={4} className="mb-3">
            <h6 className="text-gold">Enlaces</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="footer-link">
                  Inicio
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/catalogo" className="footer-link">
                  Catálogo
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/register" className="footer-link">
                  Registrarse
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/login" className="footer-link">
                  Iniciar Sesión
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col md={4} className="mb-3">
            <h6 className="text-gold">Contacto</h6>
            <p className="text-light opacity-75 mb-1">
              <i className="bi bi-envelope me-2"></i>
              info@gavat.com
            </p>
            <p className="text-light opacity-75 mb-1">
              <i className="bi bi-telephone me-2"></i>
              +57 300 123 4567
            </p>
            <div className="mt-3">
              <button type="button" className="social-icon me-3" aria-label="Facebook">
                <i className="bi bi-facebook fs-5"></i>
              </button>
              <button type="button" className="social-icon me-3" aria-label="Instagram">
                <i className="bi bi-instagram fs-5"></i>
              </button>
              <button type="button" className="social-icon" aria-label="Twitter">
                <i className="bi bi-twitter fs-5"></i>
              </button>
            </div>
          </Col>
        </Row>
        
        <hr className="bg-gold opacity-25" />
        
        <Row>
          <Col className="text-center text-light opacity-75">
            <small>
            </small>
          </Col>
        </Row>
      </Container>

      {/* Estilos específicos para el footer (pueden moverse a un CSS global) */}
      <style jsx>{`
        .bg-negativo {
          background-color: var(--bg-negativo, #192847);
        }
        .text-gold {
          color: var(--bs-gold, #f5c271);
        }
        .footer-link {
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .footer-link:hover {
          color: var(--bs-gold, #f5c271);
          transform: translateX(4px);
          display: inline-block;
        }
        .social-icon {
          color: rgba(255, 255, 255, 0.75);
          transition: all 0.3s ease;
          display: inline-block;
        }
        .social-icon:hover {
          color: var(--bs-gold, #f5c271);
          transform: translateY(-3px);
        }
        .opacity-75 {
          opacity: 0.75;
        }
      `}</style>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;