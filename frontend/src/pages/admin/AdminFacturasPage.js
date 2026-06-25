/**
 * ============================================
 * ADMIN FACTURAS PAGE
 * ============================================
 * Gestión de facturas (consultar, descargar, anular)
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminFacturasPage = () => {
  useAuth();
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos'
  });
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;
  
  // Facturas filtradas y paginadas
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(factura => {
      // Filtro por búsqueda (número de factura, nombre cliente, email)
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide = 
          (factura.numero_factura && factura.numero_factura.toLowerCase().includes(busqueda)) ||
          (factura.cliente_nombre && factura.cliente_nombre.toLowerCase().includes(busqueda)) ||
          (factura.cliente_email && factura.cliente_email.toLowerCase().includes(busqueda));
        if (!coincide) return false;
      }
      
      // Filtro por estado
      if (filtros.estado !== 'todos') {
        if (filtros.estado !== factura.estado) return false;
      }
      
      return true;
    });
  }, [facturas, filtros.busqueda, filtros.estado]);
  
  // Aplicar paginación
  const totalPaginas = Math.ceil(facturasFiltradas.length / registrosPorPagina);
  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return facturasFiltradas.slice(inicio, fin);
  }, [facturasFiltradas, paginaActual, registrosPorPagina]);
  
  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.estado]);

  const loadFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminService.getFacturas({ limite: 1000 });
      const facturas = response.data?.facturas || response.data || [];
      setFacturas(Array.isArray(facturas) ? facturas : []);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar las facturas' });
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar facturas al montar el componente
  useEffect(() => {
    loadFacturas();
  }, [loadFacturas]);

  const handleVerDetalle = async (factura) => {
    try {
      const response = await adminService.getFacturaById(factura.id);
      setFacturaSeleccionada(response.data || factura);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar detalle de la factura' });
    }
  };

  const handleDescargarPDF = async (numeroFactura) => {
    try {
      const response = await adminService.descargarFacturaPDF(numeroFactura);
      
      // Crear un blob y descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${numeroFactura}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setMensaje({ tipo: 'success', texto: 'PDF descargado correctamente' });
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al descargar el PDF' });
    }
  };

  const handleAnularFactura = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas anular esta factura?')) return;
    
    try {
      await adminService.anularFactura(id);
      setMensaje({ tipo: 'success', texto: 'Factura anulada exitosamente' });
      setShowDetalleModal(false);
      loadFacturas();
    } catch (error) {
      console.error('Error al anular factura:', error);
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al anular la factura' });
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0 
    }).format(precio);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getBadgeEstado = (estado) => {
    const estados = {
      'emitida': 'warning',
      'enviada': 'info',
      'vista': 'warning',
      'anulada': 'danger'
    };
    return estados[estado] || 'secondary';
  };

  if (loading) {
    return <LoadingSpinner message="Cargando facturas..." />;
  }

  return (
    <div className="admin-facturas-page">
      <div className="admin-toolbar">
        <div className="admin-title">
          <h1>
            <i className="bi bi-file-earmark-pdf"></i>
            Gestión de Facturas
          </h1>
          <p className="subtext">Consulta, descarga y gestiona facturas</p>
        </div>

        <div className="action-groups">
          <div className="nav-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/dashboard')}>
              <i className="bi bi-arrow-left"></i>
              Volver
            </button>
          </div>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <section className="admin-card">
        <div className="admin-card-header">
          <i className="bi bi-funnel"></i>
          <strong>Filtros</strong>
        </div>
        <div className="admin-card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Buscar</label>
              <div className="input-group">
                <span className="input-icon"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por número, cliente o email..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="todos">Todos</option>
                <option value="emitida">Emitida</option>
                <option value="enviada">Enviada</option>
                <option value="vista">Vista</option>
                <option value="anulada">Anulada</option>
              </select>
            </div>

            <div className="form-group form-align-end">
              <button
                type="button"
                className="btn btn-outline-secondary full-width"
                onClick={() => setFiltros({ busqueda: '', estado: 'todos' })}
              >
                <i className="bi bi-x-circle"></i>
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="text-muted small">
            Mostrando {facturasFiltradas.length} de {facturas.length} facturas
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Número Factura</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {facturasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    {facturas.length === 0 ? 'No hay facturas registradas' : 'No se encontraron facturas con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                facturasPaginadas.map((factura) => (
                  <tr key={factura.id}>
                    <td className="font-bold">{factura.numeroFactura}</td>
                    <td>
                      <div>
                        <div className="font-bold">{factura.clienteNombre}</div>
                        <small className="text-muted">{factura.clienteEmail}</small>
                      </div>
                    </td>
                    <td className="font-bold">{formatearPrecio(factura.total)}</td>
                    <td>
                      <span 
                        className={`badge badge-${getBadgeEstado(factura.estado)}`}
                      >
                        {factura.estado}
                      </span>
                    </td>
                    <td>{formatearFecha(factura.fechaEmision)}</td>
                    <td className="text-center">
                      <button 
                        type="button" 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => handleVerDetalle(factura)}
                        title="Ver detalle"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-success btn-sm" 
                        onClick={() => handleDescargarPDF(factura.numeroFactura)}
                        title="Descargar PDF"
                      >
                        <i className="bi bi-download"></i>
                      </button>
                      {factura.estado !== 'anulada' && (
                        <button 
                          type="button" 
                          className="btn btn-outline-danger btn-sm" 
                          onClick={() => handleAnularFactura(factura.id)}
                          title="Anular factura"
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {totalPaginas > 1 && (
        <section className="admin-card pagination-card">
          <div className="admin-pagination">
            <div>
              <small className="text-muted">
                <i className="bi bi-file-text"></i>
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{facturasPaginadas.length}</strong> de <strong>{facturasFiltradas.length}</strong> registros
              </small>
            </div>
            <div className="pagination-buttons">
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1} title="Primera página">
                <i className="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(prev => prev - 1)} disabled={paginaActual === 1} title="Página anterior">
                <i className="bi bi-chevron-left"></i> Anterior
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled>
                {paginaActual} / {totalPaginas}
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(prev => prev + 1)} disabled={paginaActual === totalPaginas} title="Página siguiente">
                Siguiente <i className="bi bi-chevron-right"></i>
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas} title="Última página">
                <i className="bi bi-chevron-bar-right"></i>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* MODAL DETALLE FACTURA */}
      {showDetalleModal && facturaSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Detalle de Factura</h2>
              <button type="button" className="close-button" onClick={() => setShowDetalleModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Número Factura:</strong> {facturaSeleccionada.numeroFactura}
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong> 
                  <span 
                    className={`badge badge-${getBadgeEstado(facturaSeleccionada.estado)}`}
                  >
                    {facturaSeleccionada.estado}
                  </span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Fecha Emisión:</strong> {formatearFecha(facturaSeleccionada.fechaEmision)}
                </div>
                <div className="col-md-6">
                  <strong>Cliente:</strong> {facturaSeleccionada.clienteNombre || '-'}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Email:</strong> {facturaSeleccionada.clienteEmail || '-'}
                </div>
                <div className="col-md-6">
                  <strong>Documento:</strong> {facturaSeleccionada.clienteDocumento || 'N/A'}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Teléfono:</strong> {facturaSeleccionada.telefonoEnvio || '-'}
                </div>
                <div className="col-md-6">
                  <strong>Método Pago:</strong> {facturaSeleccionada.metodoPago || '-'}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-12">
                  <strong>Dirección Envío:</strong> 
                  <div className="alert alert-light mt-2 mb-0">
                    {facturaSeleccionada.direccionEnvio || 'No especificada'}
                  </div>
                </div>
              </div>

              <hr />

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Subtotal:</strong> {formatearPrecio(facturaSeleccionada.subtotal)}
                </div>
                <div className="col-md-6">
                  <strong>Impuesto (IVA):</strong> {formatearPrecio(facturaSeleccionada.impuesto)}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-12">
                  <strong style={{ fontSize: '1.1rem' }}>Total a Pagar:</strong> 
                  <div style={{ fontSize: '1.3rem', color: 'var(--bs-gold-dark, #c7984e)', fontWeight: 'bold' }}>
                    {formatearPrecio(facturaSeleccionada.total)}
                  </div>
                </div>
              </div>

              {facturaSeleccionada.notas && (
                <div className="row mb-3">
                  <div className="col-md-12">
                    <strong>Notas:</strong>
                    <div className="alert alert-info mt-2 mb-0">
                      {facturaSeleccionada.notas}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={() => handleDescargarPDF(facturaSeleccionada.numeroFactura)}
              >
                <i className="bi bi-download"></i> Descargar PDF
              </button>
              {facturaSeleccionada.estado !== 'anulada' && (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={() => handleAnularFactura(facturaSeleccionada.id)}
                >
                  <i className="bi bi-x-circle"></i> Anular
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFacturasPage;
