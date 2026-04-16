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
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;

  const cargarUsuarios = useCallback(async () => {
    try {
      const data = await usuarioService.obtenerUsuarios('?limite=1000');
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cargarUsuarios();
  }, []); // Solo una vez

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 Guardando usuario:', usuarioActual);

    try {
      if (editando) {
        // No enviar password si está vacío
        const dataActualizar = { ...usuarioActual };
        if (!dataActualizar.password) {
          delete dataActualizar.password;
        }
        await usuarioService.actualizarUsuario(usuarioActual.id, dataActualizar);
        console.log('✅ Usuario actualizado');
        alert('Usuario actualizado exitosamente');
      } else {
        if (!usuarioActual.password) {
          alert('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await usuarioService.crearUsuario(usuarioActual);
        console.log('✅ Usuario creado');
        alert('Usuario creado exitosamente');
      }
      
      setShowModal(false);
      limpiarFormulario();
      cargarUsuarios();
    } catch (error) {
      console.error('❌ Error al guardar usuario:', error);
      alert(error.response?.data?.mensaje || 'Error al guardar usuario');
    }
  };

  const handleEditar = (usuario) => {
    console.log('✏️ Editando usuario:', usuario);
    setUsuarioActual({
      ...usuario,
      password: '' // No mostrar password
    });
    setEditando(true);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;

    console.log('🗑️ Eliminando usuario:', id);
    try {
      await usuarioService.eliminarUsuario(id);
      console.log('✅ Usuario eliminado');
      alert('Usuario eliminado exitosamente');
      cargarUsuarios();
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleToggleActivo = async (usuario) => {
    const nuevoEstado = !usuario.activo;
    console.log('🔄 Cambiando estado de usuario:', usuario.id, 'a', nuevoEstado);

    try {
      await usuarioService.actualizarUsuario(usuario.id, {
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        rol: usuario.rol,
        activo: nuevoEstado
      });
      console.log('✅ Estado actualizado');
      cargarUsuarios();
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      alert('Error al cambiar estado del usuario');
    }
  };

  const limpiarFormulario = () => {
    setUsuarioActual({
      id: null,
      nombre: '',
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
    setFiltros({
      busqueda: '',
      rol: 'todos',
      estado: 'todos'
    });
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(usuario => {
      // Filtro por búsqueda (nombre o email)
      const busquedaLower = filtros.busqueda.toLowerCase().trim();
      const pasaBusqueda = !busquedaLower || 
        usuario.nombre.toLowerCase().includes(busquedaLower) ||
        usuario.email.toLowerCase().includes(busquedaLower);

      // Filtro por rol
      const pasaRol = filtros.rol === 'todos' || usuario.rol === filtros.rol;

      // Filtro por estado
      const pasaEstado = filtros.estado === 'todos' ||
        (filtros.estado === 'activo' && usuario.activo) ||
        (filtros.estado === 'inactivo' && !usuario.activo);

      return pasaBusqueda && pasaRol && pasaEstado;
    });
  }, [usuarios, filtros.busqueda, filtros.rol, filtros.estado]);

  // Aplicar paginación
  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina);
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return usuariosFiltrados.slice(inicio, fin);
  }, [usuariosFiltrados, paginaActual, registrosPorPagina]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.rol, filtros.estado]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Usuarios</h2>
        <div>
          <div className="btn-group me-2">
            <button className="btn btn-success" onClick={() => exportarUsuariosAPDF(usuariosFiltrados)}>
              <i className="bi bi-file-earmark-pdf me-1"></i>
              Exportar
            </button>
            <button className="btn btn-success dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"></button>
            <ul className="dropdown-menu">
              <li><button className="dropdown-item" onClick={() => exportarUsuariosAPDF(usuariosFiltrados)}>
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Exportar a PDF
              </button></li>
              <li><button className="dropdown-item" onClick={() => exportarUsuariosAExcel(usuariosFiltrados)}>
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar a Excel
              </button></li>
            </ul>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => {
              limpiarFormulario();
              setShowModal(true);
            }}
          >
            <i className="bi bi-plus-circle"></i> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros</h5>
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={limpiarFiltros}
              title="Limpiar filtros"
            >
              <i className="bi bi-x-circle me-1"></i>
              Limpiar
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Buscar por nombre o email:</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Escriba para buscar..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Rol:</label>
              <select 
                className="form-select"
                value={filtros.rol}
                onChange={(e) => setFiltros({...filtros, rol: e.target.value})}
              >
                <option value="todos">Todos los roles</option>
                <option value="administrador">Administradores</option>
                <option value="auxiliar">Auxiliares</option>
                <option value="cliente">Clientes</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Filtrar por Estado:</label>
              <select 
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
              >
                <option value="todos">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
          <div className="mt-3">
            <span className="badge bg-primary">
              <i className="bi bi-people-fill me-1"></i>
              {usuariosFiltrados.length} registro(s) encontrado(s)
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">
                      No hay usuarios para mostrar
                    </td>
                  </tr>
                ) : (
                  usuariosPaginados.map(usuario => (
                    <tr key={usuario.id}>
                      <td>{usuario.id}</td>
                      <td>{usuario.nombre}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.telefono || '-'}</td>
                      <td>
                        <span className={`badge ${
                          usuario.rol === 'administrador' ? 'bg-danger' :
                          usuario.rol === 'auxiliar' ? 'bg-warning' :
                          'bg-info'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${usuario.activo ? 'bg-success' : 'bg-secondary'}`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEditar(usuario)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className={`btn ${usuario.activo ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleActivo(usuario)}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            <i className={`bi ${usuario.activo ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => handleEliminar(usuario.id)}
                            title="Eliminar"
                          >
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
      </div>
      
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">
                  <i className="bi bi-file-text me-1"></i>
                  Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{usuariosPaginados.length}</strong> de <strong>{usuariosFiltrados.length}</strong> registros
                </small>
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  title="Primera página"
                >
                  <i className="bi bi-chevron-bar-left"></i>
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(prev => prev - 1)}
                  disabled={paginaActual === 1}
                  title="Página anterior"
                >
                  <i className="bi bi-chevron-left me-1"></i> Anterior
                </button>
                <button className="btn btn-primary btn-sm" disabled>
                  {paginaActual} / {totalPaginas}
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(prev => prev + 1)}
                  disabled={paginaActual === totalPaginas}
                  title="Página siguiente"
                >
                  Siguiente <i className="bi bi-chevron-right ms-1"></i>
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  title="Última página"
                >
                  <i className="bi bi-chevron-bar-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    limpiarFormulario();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={usuarioActual.nombre}
                        onChange={(e) => setUsuarioActual({...usuarioActual, nombre: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={usuarioActual.email}
                        onChange={(e) => setUsuarioActual({...usuarioActual, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Contraseña {editando ? '(dejar vacío para no cambiar)' : '*'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={usuarioActual.password}
                        onChange={(e) => setUsuarioActual({...usuarioActual, password: e.target.value})}
                        required={!editando}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        value={usuarioActual.telefono}
                        onChange={(e) => setUsuarioActual({...usuarioActual, telefono: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Dirección</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={usuarioActual.direccion}
                      onChange={(e) => setUsuarioActual({...usuarioActual, direccion: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Rol *</label>
                      <select
                        className="form-select"
                        value={usuarioActual.rol}
                        onChange={(e) => setUsuarioActual({...usuarioActual, rol: e.target.value})}
                        required
                      >
                        <option value="cliente">Cliente</option>
                        <option value="auxiliar">Auxiliar</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Estado *</label>
                      <select
                        className="form-select"
                        value={usuarioActual.activo}
                        onChange={(e) => setUsuarioActual({...usuarioActual, activo: e.target.value === 'true'})}
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      limpiarFormulario();
                    }}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsuariosPage;
