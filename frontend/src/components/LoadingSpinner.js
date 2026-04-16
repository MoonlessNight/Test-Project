/**
 * ============================================
 * LOADING SPINNER COMPONENT
 * ============================================
 * Indicador de carga reutilizable
 */

import React, { memo } from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = memo(({ message = 'Cargando...' }) => {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Cargando...</span>
      </Spinner>
      {message && <p className="mt-3 text-muted">{message}</p>}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
