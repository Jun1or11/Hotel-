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

  const runAction = async (id: string | number, action: 'aprobar' | 'checkin' | 'checkout' | 'cancelar') => {
    try {
      await axiosInstance.put(`/api/reservas/${id}/${action}`);
      fetchReservas();
    } catch (error) {
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

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">Gestión de Reservas</h1>

        <div className="panel table-wrap">
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
              {reservas.map((res) => (
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
                      <button
                        onClick={() => runAction(res.id, 'aprobar')}
                        className="btn-ghost"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--green)' }}
                        title="Aprobar"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => runAction(res.id, 'checkin')}
                        className="btn-ghost"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--gold)' }}
                        title="Check-in"
                      >
                        Check-in
                      </button>
                      <button
                        onClick={() => runAction(res.id, 'checkout')}
                        className="btn-ghost"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--green)' }}
                        title="Check-out"
                      >
                        Check-out
                      </button>
                      <button
                        onClick={() => runAction(res.id, 'cancelar')}
                        className="btn-ghost"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--red)' }}
                        title="Cancelar"
                      >
                        Cancelar
                      </button>
                    </div>
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

export default GestionReservas;
