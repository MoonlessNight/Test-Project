/**
 * ============================================
 * PRODUCT CARD COMPONENT - Adaptado a la paleta del proyecto
 * ============================================
 * Tarjeta de producto con estilos personalizados (dorados, fondos)
 */

import React, { memo, useCallback } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { formatCurrency, getImageUrl } from '../utils/helpers';

const ProductCard = memo(({ producto, onAddToCart, showActions = true }) => {
  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(producto);
    }
  }, [producto, onAddToCart]);

  return (
    <Card className="h-100 product-card shadow-sm">
      <Link to={`/producto/${producto.id}`} className="text-decoration-none position-relative">
        <div style={{ overflow: 'hidden', height: '200px', borderRadius: '0.75rem 0.75rem 0 0' }}>
          <Card.Img
            variant="top"
            src={getImageUrl(producto.imagen)}
            alt={producto.nombre}
            style={{ height: '200px', objectFit: 'cover', width: '100%' }}
          />
        </div>
        {producto.stock > 0 && producto.stock < 10 && (
          <Badge 
            className="badge-warning-custom position-absolute" 
            style={{ top: '10px', right: '10px', fontSize: '0.75rem' }}
          >
            ¡Últimas unidades!
          </Badge>
        )}
      </Link>
      
      <Card.Body className="d-flex flex-column p-3">
        <Link to={`/producto/${producto.id}`} className="text-decoration-none">
          <Card.Title className="h6 mb-2 product-title">
            {producto.nombre}
          </Card.Title>
        </Link>
        
        <Card.Text className="text-muted small flex-grow-1" style={{ lineHeight: '1.5' }}>
          {producto.descripcion?.substring(0, 80)}
          {producto.descripcion?.length > 80 && '...'}
        </Card.Text>
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 product-price">
            {formatCurrency(producto.precio)}
          </h5>
          {producto.stock > 0 ? (
            <Badge className="badge-stock-success">
              Stock: {producto.stock}
            </Badge>
          ) : (
            <Badge className="badge-stock-danger">Sin stock</Badge>
          )}
        </div>
        
        {showActions && producto.stock > 0 && (
          <Button
            className="btn-add-to-cart w-100"
            onClick={handleAddToCart}
          >
            <i className="bi bi-cart-plus me-2"></i>
            Agregar al carrito
          </Button>
        )}
        
        {showActions && producto.stock === 0 && (
          <Button variant="secondary" className="w-100" disabled style={{ borderRadius: '0.75rem' }}>
            No disponible
          </Button>
        )}
      </Card.Body>

      {/* Estilos personalizados usando las variables globales */}
      <style jsx>{`
        .product-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none !important;
          background: var(--bg, #ffffff);
        }
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        }
        .product-card:hover .product-title {
          color: var(--bs-oldGold-bg, #916934);
        }
        .product-title {
          color: var(--bg-negativo, #192847);
          font-weight: 600;
          transition: color 0.3s ease;
        }
        .product-price {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .badge-warning-custom {
          background-color: var(--bg-aviso, #F7B517);
          color: var(--fnt-black, #000000);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-weight: 500;
        }
        .badge-stock-success {
          background: linear-gradient(135deg, #10b981, #059669);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-weight: 500;
          color: white;
        }
        .badge-stock-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-weight: 500;
        }
        .btn-add-to-cart {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.625rem;
          font-weight: 500;
          color: var(--fnt-black, #000000);
          transition: all 0.3s ease;
        }
        .btn-add-to-cart:hover {
          background: linear-gradient(135deg, var(--bs-gold-dark, #c7984e), var(--bs-oldGold-bg, #916934));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px 0 rgba(145, 105, 52, 0.3);
        }
        .btn-add-to-cart:active {
          transform: translateY(0);
        }
      `}</style>
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;