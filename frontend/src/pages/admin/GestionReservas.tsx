import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { Reserva } from '../../types/index';
import axiosInstance from '../../api/axios';

const getStatusClass = (status: string) => `status-chip status-${status}`;
const formatReservaId = (id: string | number) => {
  const text = String(id);
  return text.length > 8 ? `${text.slice(0, 8)}...` : text;
};

const GestionReservas: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservas();
  }, []);

  const fetchReservas = async () => {
    try {
      const response = await axiosInstance.get('/api/reservas');
      setReservas(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (
    id: string | number,
    action: 'liberar' | 'completar' | 'cancelar'
  ) => {
    try {
      await axiosInstance.put(`/api/reservas/${id}/${action}`);
      fetchReservas();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando reservas...</p>
        </div>
      </div>
    );
  }

  const activasYPendientes = reservas.filter(r => r.estado === 'pendiente' || r.estado === 'activo');
  const historial = reservas.filter(r => r.estado === 'completado' || r.estado === 'cancelado');

  const renderTableRows = (items: Reserva[]) => (
    <>
      {items.map((res) => (
        <tr key={res.id}>
          <td style={{ color: 'var(--text)' }}>{formatReservaId(res.id)}</td>
          <td style={{ color: 'var(--text)' }}>
            {res.usuario?.nombre || `Usuario #${res.usuario_id || '-'}`}
          </td>
          <td style={{ color: 'var(--text)' }}>
            #{res.habitacion?.numero || res.habitacion_id || '-'}
          </td>
          <td style={{ color: 'var(--text)' }}>
            {new Date(res.fecha_checkin).toLocaleDateString()} - {new Date(res.fecha_checkout).toLocaleDateString()}
          </td>
          <td>
            <span className={getStatusClass(res.estado)}>{res.estado}</span>
          </td>
          <td>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {res.estado === 'activo' && res.habitacion?.estado === 'ocupado' && (
                <button
                  onClick={() => runAction(res.id, 'liberar')}
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.5rem', color: 'var(--green)' }}
                  title="Salida anticipada"
                >
                  Liberar habitación
                </button>
              )}

              {res.estado === 'activo' && (
                <button
                  onClick={() => runAction(res.id, 'completar')}
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.5rem', color: 'var(--green)' }}
                  title="Finalizar estadía"
                >
                  Terminar estadía
                </button>
              )}

              {(res.estado === 'pendiente' || res.estado === 'activo') && (
                <button
                  onClick={() => runAction(res.id, 'cancelar')}
                  className="btn-ghost"
                  style={{ padding: '0.3rem 0.5rem', color: 'var(--red)' }}
                  title="Cancelar reserva"
                >
                  Cancelar reserva
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">Gestión de Reservas</h1>

        {/* Reservas Activas y Pendientes */}
        <div className="panel table-wrap">
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Reservas Activas y Pendientes</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Habitación</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activasYPendientes.length > 0 ? (
                renderTableRows(activasYPendientes)
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay reservas pendientes o activas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Historial de Reservas */}
        <div className="panel table-wrap" style={{ marginTop: '2rem' }}>
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Historial (Completadas y Canceladas)</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Habitación</th>
                <th>Fechas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {historial.length > 0 ? (
                renderTableRows(historial)
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay reservas completadas o canceladas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionReservas;
