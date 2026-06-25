import React, { useState, useEffect, useMemo, useCallback } from 'react';
import usuarioService from '../services/usuarioService';
import { exportarUsuariosAPDF, exportarUsuariosAExcel } from '../utils/exportUtils';

function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState({
    id: null,
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    rol: 'cliente',
    activo: true
  });
  const [filtros, setFiltros] = useState({
    busqueda: '',
    rol: 'todos',
    estado: 'todos'
  });
  
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;

  const cargarUsuarios = useCallback(async () => {
    try {
      const data = await usuarioService.obtenerUsuarios('?limite=1000');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        const dataActualizar = { ...usuarioActual };
        if (!dataActualizar.password) delete dataActualizar.password;
        await usuarioService.actualizarUsuario(usuarioActual.id, dataActualizar);
        alert('Usuario actualizado exitosamente');
      } else {
        if (!usuarioActual.password) {
          alert('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await usuarioService.crearUsuario(usuarioActual);
        alert('Usuario creado exitosamente');
      }
      setShowModal(false);
      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleEditar = (usuario) => {
    setUsuarioActual({ ...usuario, password: '' });
    setEditando(true);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await usuarioService.eliminarUsuario(id);
      alert('Usuario eliminado exitosamente');
      cargarUsuarios();
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  const handleToggleActivo = async (usuario) => {
    try {
      await usuarioService.cambiarEstado(usuario.id);
      cargarUsuarios();
    } catch (error) {
      alert('Error al cambiar estado del usuario');
    }
  };

  const limpiarFormulario = () => {
    setUsuarioActual({
      id: null,
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      telefono: '',
      direccion: '',
      rol: 'cliente',
      activo: true
    });
    setEditando(false);
  };

  const limpiarFiltros = () => {
    setFiltros({ busqueda: '', rol: 'todos', estado: 'todos' });
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      const busquedaLower = filtros.busqueda.toLowerCase().trim();
      const pasaBusqueda = !busquedaLower || 
        usuario.nombre.toLowerCase().includes(busquedaLower) ||
        usuario.email.toLowerCase().includes(busquedaLower);
      const pasaRol = filtros.rol === 'todos' || usuario.rol === filtros.rol;
      const pasaEstado = filtros.estado === 'todos' ||
        (filtros.estado === 'activo' && usuario.activo) ||
        (filtros.estado === 'inactivo' && !usuario.activo);
      return pasaBusqueda && pasaRol && pasaEstado;
    });
  }, [usuarios, filtros]);

  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina);
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [usuariosFiltrados, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.rol, filtros.estado]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border" style={{ color: 'var(--bs-gold, #f5c271)' }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="admin-title">Gestión de Usuarios</h2>
        <div>
          <div className="btn-group me-2">
            <button className="btn-exportar" onClick={() => exportarUsuariosAPDF(usuariosFiltrados)}>
              <i className="bi bi-file-earmark-pdf me-1"></i> Exportar
            </button>
            <button className="btn-exportar dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"></button>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" onClick={() => exportarUsuariosAPDF(usuariosFiltrados)}>PDF</button></li>
              <li><button className="dropdown-item" onClick={() => exportarUsuariosAExcel(usuariosFiltrados)}>Excel</button></li>
            </ul>
          </div>
          <button className="btn-nuevo" onClick={() => { limpiarFormulario(); setShowModal(true); }}>
            <i className="bi bi-plus-circle"></i> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filtros-card mb-4">
        <div className="filtros-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros</h5>
            <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
              <i className="bi bi-x-circle me-1"></i> Limpiar
            </button>
          </div>
        </div>
        <div className="filtros-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="filtros-label">Buscar por nombre o email:</label>
              <div className="input-group">
                <span className="input-group-text bg-gold-light"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control admin-input" placeholder="Escriba para buscar..."
                  value={filtros.busqueda} onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})} />
              </div>
            </div>
            <div className="col-md-4">
              <label className="filtros-label">Filtrar por Rol:</label>
              <select className="form-select admin-select" value={filtros.rol}
                onChange={(e) => setFiltros({...filtros, rol: e.target.value})}>
                <option value="todos">Todos los roles</option>
                <option value="administrador">Administradores</option>
                <option value="auxiliar">Auxiliares</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="filtros-label">Filtrar por Estado:</label>
              <select className="form-select admin-select" value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}>
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <span className="badge-registros">
              <i className="bi bi-people-fill me-1"></i>
              {usuariosFiltrados.length} registro(s) encontrado(s)
            </span>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="tabla-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr><td colSpan="7" className="text-center text-muted">No hay usuarios para mostrar</td></tr>
              ) : (
                usuariosPaginados.map(usuario => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.nombre}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.telefono || '-'}</td>
                    <td><span className={`badge-rol ${usuario.rol}`}>{usuario.rol}</span></td>
                    <td><span className={`badge-estado ${usuario.activo ? 'activo' : 'inactivo'}`}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span></td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn-action edit" onClick={() => handleEditar(usuario)} title="Editar">
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className={`btn-action toggle ${usuario.activo ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleActivo(usuario)} title={usuario.activo ? 'Desactivar' : 'Activar'}>
                          <i className={`bi ${usuario.activo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                        </button>
                        <button className="btn-action delete" onClick={() => handleEliminar(usuario.id)} title="Eliminar">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="paginacion-card mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted">
                <i className="bi bi-file-text me-1"></i>
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{usuariosPaginados.length}</strong> de <strong>{usuariosFiltrados.length}</strong> registros
              </small>
            </div>
            <div className="btn-group">
              <button className="btn-paginacion" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}>
                <i className="bi bi-chevron-bar-left"></i>
              </button>
              <button className="btn-paginacion" onClick={() => setPaginaActual(p => p-1)} disabled={paginaActual === 1}>
                <i className="bi bi-chevron-left me-1"></i> Anterior
              </button>
              <button className="btn-paginacion active" disabled>
                {paginaActual} / {totalPaginas}
              </button>
              <button className="btn-paginacion" onClick={() => setPaginaActual(p => p+1)} disabled={paginaActual === totalPaginas}>
                Siguiente <i className="bi bi-chevron-right ms-1"></i>
              </button>
              <button className="btn-paginacion" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas}>
                <i className="bi bi-chevron-bar-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container modal-lg">
            <div className="modal-header-custom">
              <h5>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
              <button className="btn-close-custom" onClick={() => { setShowModal(false); limpiarFormulario(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body-custom">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Nombre</label>
                    <input type="text" className="admin-input w-100" value={usuarioActual.nombre}
                      onChange={(e) => setUsuarioActual({...usuarioActual, nombre: e.target.value})} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Apellido</label>
                    <input type="text" className="admin-input w-100" value={usuarioActual.apellido}
                      onChange={(e) => setUsuarioActual({...usuarioActual, apellido: e.target.value})} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label fw-bold">Email *</label>
                    <input type="email" className="admin-input w-100" value={usuarioActual.email}
                      onChange={(e) => setUsuarioActual({...usuarioActual, email: e.target.value})} required />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}</label>
                    <input type="password" className="admin-input w-100" value={usuarioActual.password}
                      onChange={(e) => setUsuarioActual({...usuarioActual, password: e.target.value})} required={!editando} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Teléfono</label>
                    <input type="text" className="admin-input w-100" value={usuarioActual.telefono}
                      onChange={(e) => setUsuarioActual({...usuarioActual, telefono: e.target.value})} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Dirección</label>
                  <textarea className="admin-input w-100" rows="2" value={usuarioActual.direccion}
                    onChange={(e) => setUsuarioActual({...usuarioActual, direccion: e.target.value})}></textarea>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Rol *</label>
                    <select className="admin-select w-100" value={usuarioActual.rol}
                      onChange={(e) => setUsuarioActual({...usuarioActual, rol: e.target.value})} required>
                      <option value="cliente">Cliente</option>
                      <option value="auxiliar">Auxiliar</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-bold">Estado *</label>
                    <select className="admin-select w-100" value={usuarioActual.activo}
                      onChange={(e) => setUsuarioActual({...usuarioActual, activo: e.target.value === 'true'})}>
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer-custom">
                <button type="button" className="btn-cancelar" onClick={() => { setShowModal(false); limpiarFormulario(); }}>Cancelar</button>
                <button type="submit" className="btn-guardar">{editando ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-title {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .btn-exportar {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-exportar:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        .btn-nuevo {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          color: var(--fnt-black, #000);
          border: none;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-nuevo:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(145,105,52,0.3);
        }
        .filtros-card {
          background: var(--bg-positiva, #DBE1ED);
          border-radius: 1rem;
          overflow: hidden;
        }
        .filtros-header {
          background: var(--bg-negativo, #192847);
          color: white;
          padding: 0.75rem 1.25rem;
        }
        .filtros-body {
          padding: 1.25rem;
        }
        .filtros-label {
          font-weight: 600;
          color: var(--bg-negativo, #192847);
          margin-bottom: 0.5rem;
          display: block;
        }
        .admin-input, .admin-select {
          border-radius: 0.75rem;
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          transition: all 0.3s;
          background: white;
        }
        .admin-input:focus, .admin-select:focus {
          border-color: var(--bs-gold, #f5c271);
          box-shadow: 0 0 0 3px rgba(145,105,52,0.1);
          outline: none;
        }
        .badge-registros {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000);
          padding: 0.35rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.85rem;
          font-weight: 500;
          display: inline-block;
        }
        .tabla-card {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }
        .admin-table thead {
          background: var(--bg-positiva, #DBE1ED);
          color: var(--bg-negativo, #192847);
        }
        .admin-table th, .admin-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .admin-table tbody tr:hover {
          background: rgba(145,105,52,0.05);
        }
        .badge-rol {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-rol.administrador { background: #dc3545; color: white; }
        .badge-rol.auxiliar { background: #ffc107; color: #000; }
        .badge-rol.cliente { background: #0dcaf0; color: #000; }
        .badge-estado {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .badge-estado.activo { background: #10b981; color: white; }
        .badge-estado.inactivo { background: #6c757d; color: white; }
        .btn-action {
          background: transparent;
          border: 1px solid;
          border-radius: 0.5rem;
          padding: 0.25rem 0.5rem;
          margin: 0 0.125rem;
          transition: all 0.2s;
        }
        .btn-action.edit { border-color: var(--bs-gold, #f5c271); color: var(--bs-gold-dark, #c7984e); }
        .btn-action.edit:hover { background: var(--bs-gold, #f5c271); color: black; }
        .btn-action.toggle.deactivate { border-color: #ffc107; color: #ffc107; }
        .btn-action.toggle.deactivate:hover { background: #ffc107; color: black; }
        .btn-action.toggle.activate { border-color: #10b981; color: #10b981; }
        .btn-action.toggle.activate:hover { background: #10b981; color: white; }
        .btn-action.delete { border-color: #dc3545; color: #dc3545; }
        .btn-action.delete:hover { background: #dc3545; color: white; }
        .paginacion-card {
          background: white;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .btn-paginacion {
          background: transparent;
          border: 1px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.5rem;
          padding: 0.25rem 0.75rem;
          margin: 0 0.25rem;
          transition: all 0.2s;
        }
        .btn-paginacion:hover:not(:disabled) {
          background: var(--bs-gold, #f5c271);
          color: black;
        }
        .btn-paginacion.active {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          color: black;
          border: none;
        }
        .btn-paginacion:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .modal-container {
          background: white;
          border-radius: 1.5rem;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: var(--bg-positiva, #DBE1ED);
          border-radius: 1.5rem 1.5rem 0 0;
        }
        .modal-header-custom h5 {
          margin: 0;
          color: var(--bg-negativo, #192847);
          font-weight: 600;
        }
        .btn-close-custom {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--bg-negativo, #192847);
        }
        .modal-body-custom {
          padding: 1.5rem;
        }
        .modal-footer-custom {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        .btn-cancelar {
          background: transparent;
          border: 2px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-weight: 600;
          transition: all 0.3s;
        }
        .btn-cancelar:hover {
          background: var(--bs-gold, #f5c271);
          color: black;
        }
        .btn-guardar {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-weight: 600;
          color: var(--fnt-black, #000);
          transition: all 0.3s;
        }
        .btn-guardar:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(145,105,52,0.3);
        }
      `}</style>
    </div>
  );
}

export default AdminUsuariosPage;