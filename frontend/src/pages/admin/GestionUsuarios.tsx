import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { Usuario } from '../../types/index';
import axiosInstance from '../../api/axios';

const getStatusClass = (status: string) => `status-chip status-${status}`;

const GestionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axiosInstance.get('/api/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      try {
        await axiosInstance.delete(`/api/usuarios/${id}`);
        fetchUsuarios();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">Gestión de Usuarios</h1>

        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td style={{ color: 'var(--text)' }}>{usuario.nombre}</td>
                  <td style={{ color: 'var(--text)' }}>{usuario.email}</td>
                  <td>
                    <span className={getStatusClass(usuario.rol)}>{usuario.rol}</span>
                  </td>
                  <td>
                    <span className={getStatusClass(usuario.activo ? 'activo' : 'cancelado')}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{new Date(usuario.fecha_registro).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteUsuario(usuario.id)}
                      className="btn-ghost"
                      style={{ padding: '0.32rem 0.55rem', color: 'var(--red)' }}
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionUsuarios;
