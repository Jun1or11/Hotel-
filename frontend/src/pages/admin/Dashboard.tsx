import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axiosInstance from '../../api/axios';

interface DashboardStats {
  total_habitaciones: number;
  ocupadas_hoy: number;
  reservas_pendientes: number;
  ingresos_mes: number;
}

interface PopularRoom {
  habitacion_id: number;
  numero: string;
  tipo: string;
  total_reservas: number;
}

interface RecentReservation {
  id: number;
  usuario_id?: number;
  habitacion_id?: number;
  habitacion?: {
    id: number;
    numero: number | string;
  };
  fecha_checkin: string;
  estado: string;
  total: number | string;
}

const getStatusClass = (status: string) => `status-chip status-${status}`;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentReservation[]>([]);
  const [popularRooms, setPopularRooms] = useState<PopularRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    let hadAnyError = false;

    const [statsResult, recentResult, popularRoomsResult] = await Promise.allSettled([
      axiosInstance.get('/api/dashboard/stats'),
      axiosInstance.get('/api/reservas?limit=5'),
      axiosInstance.get('/api/dashboard/habitaciones-populares?limit=5'),
    ]);

    if (statsResult.status === 'fulfilled') {
      setStats(statsResult.value.data);
    } else {
      hadAnyError = true;
      setStats({
        total_habitaciones: 0,
        ocupadas_hoy: 0,
        reservas_pendientes: 0,
        ingresos_mes: 0,
      });
      console.error('Error fetching dashboard stats:', statsResult.reason);
    }

    if (recentResult.status === 'fulfilled') {
      setRecent(recentResult.value.data);
    } else {
      hadAnyError = true;
      setRecent([]);
      console.error('Error fetching recent reservations:', recentResult.reason);
    }

    if (popularRoomsResult.status === 'fulfilled') {
      setPopularRooms(popularRoomsResult.value.data);
    } else {
      hadAnyError = true;
      setPopularRooms([]);
      console.error('Error fetching popular rooms:', popularRoomsResult.reason);
    }

    if (hadAnyError) {
      setError('No se pudieron cargar algunas secciones del dashboard.');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">
          Dashboard de Administración
        </h1>

        {error && (
          <div className="panel" style={{ padding: '0.75rem 0.9rem', marginBottom: 12 }}>
            <p style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            className="panel"
            style={{ padding: '0.9rem' }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>
              Total Habitaciones
            </p>
            <p style={{ color: 'var(--gold)', fontSize: '2rem', fontWeight: 700 }}>
              {stats?.total_habitaciones}
            </p>
          </div>

          <div
            className="panel"
            style={{ padding: '0.9rem' }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>
              Ocupadas Hoy
            </p>
            <p style={{ color: 'var(--amber)', fontSize: '2rem', fontWeight: 700 }}>
              {stats?.ocupadas_hoy}
            </p>
          </div>

          <div
            className="panel"
            style={{ padding: '0.9rem' }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>
              Reservas Pendientes
            </p>
            <p style={{ color: 'var(--amber)', fontSize: '2rem', fontWeight: 700 }}>
              {stats?.reservas_pendientes}
            </p>
          </div>

          <div
            className="panel"
            style={{ padding: '0.9rem' }}
          >
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>
              Ingresos del Mes
            </p>
            <p style={{ color: 'var(--green)', fontSize: '2rem', fontWeight: 700 }}>
              ${stats?.ingresos_mes?.toFixed(2) ?? '0.00'}
            </p>
          </div>
        </div>

        <div className="panel table-wrap">
          <h2 style={{ color: 'var(--gold)', padding: '0.95rem 1rem', borderBottom: '1px solid var(--border)' }}>
            Reservas Recientes
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th>
                  ID
                </th>
                <th>
                  Habitación
                </th>
                <th>
                  Check-in
                </th>
                <th>
                  Estado
                </th>
                <th>
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((res) => (
                <tr key={res.id}>
                  <td style={{ color: 'var(--text)' }}>
                    #{res.id}
                  </td>
                  <td style={{ color: 'var(--text)' }}>
                    #{res.habitacion?.numero ?? res.habitacion_id}
                  </td>
                  <td style={{ color: 'var(--text)' }}>
                    {new Date(res.fecha_checkin).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={getStatusClass(res.estado)}>
                      {res.estado}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gold)' }}>
                    ${Number(res.total ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)', textAlign: 'center' }}>
                    No hay reservas recientes para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="panel table-wrap" style={{ marginTop: 16 }}>
          <h2 style={{ color: 'var(--gold)', padding: '0.95rem 1rem', borderBottom: '1px solid var(--border)' }}>
            Habitaciones Mas Solicitadas
          </h2>
          <table className="table">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Habitacion</th>
                <th>Tipo</th>
                <th>Total Reservas</th>
              </tr>
            </thead>
            <tbody>
              {popularRooms.map((room, index) => (
                <tr key={room.habitacion_id}>
                  <td style={{ color: 'var(--text)' }}>#{index + 1}</td>
                  <td style={{ color: 'var(--text)' }}>#{room.numero}</td>
                  <td>
                    <span className={getStatusClass(room.tipo)}>
                      {room.tipo}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gold)' }}>{room.total_reservas}</td>
                </tr>
              ))}
              {popularRooms.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)', textAlign: 'center' }}>
                    Aun no hay suficientes reservas para calcular popularidad.
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

export default Dashboard;
