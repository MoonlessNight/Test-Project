/**
 * ============================================
 * PRODUCT CARD COMPONENT
 * ============================================
 * Tarjeta de producto para mostrar en catálogo
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
            bg="warning" 
            className="position-absolute" 
            style={{ top: '10px', right: '10px', fontSize: '0.75rem' }}
          >
            ¡Últimas unidades!
          </Badge>
        )}
      </Link>
      
      <Card.Body className="d-flex flex-column p-3">
        <Link to={`/producto/${producto.id}`} className="text-decoration-none text-dark">
          <Card.Title className="h6 mb-2" style={{ fontWeight: '600' }}>
            {producto.nombre}
          </Card.Title>
        </Link>
        
        <Card.Text className="text-muted small flex-grow-1" style={{ lineHeight: '1.5' }}>
          {producto.descripcion?.substring(0, 80)}
          {producto.descripcion?.length > 80 && '...'}
        </Card.Text>
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0" style={{ 
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            {formatCurrency(producto.precio)}
          </h5>
          {producto.stock > 0 ? (
            <Badge 
              bg="success" 
              style={{ 
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                fontWeight: '500'
              }}
            >
              Stock: {producto.stock}
            </Badge>
          ) : (
            <Badge bg="danger" style={{ padding: '0.5rem 0.75rem' }}>Sin stock</Badge>
          )}
        </div>
        
        {showActions && producto.stock > 0 && (
          <Button
            variant="primary"
            className="w-100"
            onClick={handleAddToCart}
            style={{ 
              borderRadius: '0.75rem',
              padding: '0.625rem',
              fontWeight: '500'
            }}
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
    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
