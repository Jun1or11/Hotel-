import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import axiosInstance from '../../api/axios';

interface NotificacionAdmin {
  id: number;
  usuario_id: number;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
  };
}

const GestionNotificaciones: React.FC = () => {
  const [items, setItems] = useState<NotificacionAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotificaciones = async () => {
    try {
      const response = await axiosInstance.get<NotificacionAdmin[]>('/api/notificaciones/enviadas?limit=200');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const leidas = items.filter((n) => n.leida).length;
    const noLeidas = total - leidas;
    return { total, leidas, noLeidas };
  }, [items]);

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">Notificaciones Enviadas</h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className="panel" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Total</p>
            <p style={{ color: 'var(--gold)', fontSize: '1.9rem', fontWeight: 700 }}>{stats.total}</p>
          </div>
          <div className="panel" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Leidas</p>
            <p style={{ color: 'var(--green)', fontSize: '1.9rem', fontWeight: 700 }}>{stats.leidas}</p>
          </div>
          <div className="panel" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>No Leidas</p>
            <p style={{ color: 'var(--red)', fontSize: '1.9rem', fontWeight: 700 }}>{stats.noLeidas}</p>
          </div>
        </div>

        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text)' }}>#{item.id}</td>
                  <td style={{ color: 'var(--text)' }}>{item.usuario?.nombre || `Usuario #${item.usuario_id}`}</td>
                  <td style={{ color: 'var(--muted)' }}>{item.usuario?.email || '-'}</td>
                  <td style={{ color: 'var(--text)' }}>{item.mensaje}</td>
                  <td>
                    <span
                      className="status-chip"
                      style={{
                        color: item.leida ? 'var(--green)' : 'var(--red)',
                        borderColor: item.leida ? 'rgba(76, 175, 125, 0.35)' : 'rgba(224, 82, 82, 0.35)',
                        background: item.leida ? 'rgba(76, 175, 125, 0.14)' : 'rgba(224, 82, 82, 0.14)',
                      }}
                    >
                      {item.leida ? 'Leida' : 'No leida'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text)' }}>{new Date(item.fecha_creacion).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--muted)', textAlign: 'center' }}>
                    No hay notificaciones enviadas.
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

export default GestionNotificaciones;
