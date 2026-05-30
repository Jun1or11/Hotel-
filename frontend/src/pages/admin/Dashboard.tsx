import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

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

interface ReviewSummaryItem {
  id: number;
  usuario_nombre: string;
  puntuacion: number;
  comentario?: string | null;
  fecha_creacion: string;
}

interface ReviewSummary {
  promedio_puntuacion: number;
  total_resenas: number;
  recientes: ReviewSummaryItem[];
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

const formatCurrency = (value: number | string) => Number(value ?? 0).toFixed(2);

const buildRatingStars = (rating: number) => {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
};

const getRoomTone = (type: string, index: number) => {
  const palette = ['linear-gradient(135deg, rgba(200,169,110,0.95), rgba(140,104,44,0.95))', 'linear-gradient(135deg, rgba(76,175,125,0.92), rgba(37,100,68,0.95))', 'linear-gradient(135deg, rgba(224,160,82,0.92), rgba(147,92,24,0.95))', 'linear-gradient(135deg, rgba(122,120,117,0.92), rgba(73,70,66,0.95))'];
  const lookup: Record<string, string> = {
    estandar: palette[0],
    matrimonial: palette[1],
    familiar: palette[2],
    suite: palette[3],
  };

  return lookup[type] ?? palette[index % palette.length];
};

const ChartCard: React.FC<{ label: string; value: number; maxValue: number; tone: string; subtitle?: string }> = ({
  label,
  value,
  maxValue,
  tone,
  subtitle,
}) => {
  const width = maxValue > 0 ? Math.max(8, (value / maxValue) * 100) : 0;

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${width}%`, height: '100%', borderRadius: 999, background: tone }} />
      </div>
      {subtitle && <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{subtitle}</span>}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentReservation[]>([]);
  const [popularRooms, setPopularRooms] = useState<PopularRoom[]>([]);
  const [reviews, setReviews] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const occupancyRate = useMemo(() => {
    if (!stats?.total_habitaciones) {
      return 0;
    }

    return Math.min(100, Math.round((stats.ocupadas_hoy / stats.total_habitaciones) * 100));
  }, [stats]);

  const popularRoomsMax = useMemo(() => {
    return popularRooms.reduce((max, room) => Math.max(max, room.total_reservas), 0);
  }, [popularRooms]);

  const recentReservationTrend = useMemo(() => {
    return recent.reduce<Record<string, number>>((accumulator, reservation) => {
      const dateKey = new Date(reservation.fecha_checkin).toLocaleDateString();
      accumulator[dateKey] = (accumulator[dateKey] || 0) + Number(reservation.total ?? 0);
      return accumulator;
    }, {});
  }, [recent]);

  const recentTrendEntries = useMemo(
    () => Object.entries(recentReservationTrend).slice(0, 5),
    [recentReservationTrend]
  );
  const recentTrendMax = useMemo(
    () => recentTrendEntries.reduce((max, [, total]) => Math.max(max, total), 0),
    [recentTrendEntries]
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    let hadAnyError = false;

    const [statsResult, recentResult, popularRoomsResult, reviewsResult] = await Promise.allSettled([
      axiosInstance.get('/api/dashboard/stats'),
      axiosInstance.get('/api/reservas?limit=5'),
      axiosInstance.get('/api/dashboard/habitaciones-populares?limit=5'),
      axiosInstance.get('/api/dashboard/resenas?limit=5'),
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

    if (reviewsResult.status === 'fulfilled') {
      setReviews(reviewsResult.value.data);
    } else {
      hadAnyError = true;
      setReviews({
        promedio_puntuacion: 0,
        total_resenas: 0,
        recientes: [],
      });
      console.error('Error fetching review summary:', reviewsResult.reason);
    }

    if (hadAnyError) {
      setError('No se pudieron cargar algunas secciones del dashboard.');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ color: 'var(--text)' }}>Cargando dashboard...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-stack">
        <div
          className="panel"
          style={{
            padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(200,169,110,0.16) 0%, rgba(28,28,31,0.96) 50%, rgba(20,20,22,0.98) 100%)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 760 }}>
              <p className="admin-topbar-kicker" style={{ marginBottom: 6 }}>Hotel Nova / Administración</p>
              <h1 className="page-title" style={{ marginBottom: 8 }}>Dashboard ejecutivo</h1>
              <p style={{ color: 'var(--muted)', maxWidth: 680 }}>
                Una vista más clara de ocupación, ingresos, habitaciones más solicitadas y feedback reciente.
              </p>
            </div>
            <div className="status-chip status-admin" style={{ padding: '0.55rem 0.8rem' }}>
              Vista en tiempo real
            </div>
          </div>
        </div>

        {error && (
          <div className="panel" style={{ padding: '0.75rem 0.9rem', marginBottom: 12 }}>
            <p style={{ color: 'var(--red)' }}>{error}</p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            alignItems: 'stretch',
          }}
        >
          <div className="panel" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginBottom: 6 }}>Total habitaciones</p>
            <p style={{ color: 'var(--gold)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>{stats?.total_habitaciones ?? 0}</p>
          </div>

          <div className="panel" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginBottom: 6 }}>Ocupación hoy</p>
            <p style={{ color: 'var(--amber)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>{stats?.ocupadas_hoy ?? 0}</p>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>{occupancyRate}% de ocupación</p>
          </div>

          <div className="panel" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginBottom: 6 }}>Reservas pendientes</p>
            <p style={{ color: 'var(--amber)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>{stats?.reservas_pendientes ?? 0}</p>
          </div>

          <div className="panel" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', marginBottom: 6 }}>Ingresos del mes</p>
            <p style={{ color: 'var(--green)', fontSize: '2.2rem', fontWeight: 700, lineHeight: 1 }}>S/. {formatCurrency(stats?.ingresos_mes ?? 0)}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
          <div className="panel" style={{ padding: '1rem', minHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: 'var(--gold)', marginBottom: 4 }}>Ocupación e ingresos</h2>
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Indicadores rápidos para decidir dónde actuar hoy.</p>
              </div>
              <div className="status-chip status-admin" style={{ padding: '0.45rem 0.7rem' }}>
                {occupancyRate}% ocupación
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
                <div
                  style={{
                    width: 'min(100%, 240px)',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: `conic-gradient(var(--gold) 0 ${occupancyRate}%, rgba(255,255,255,0.08) ${occupancyRate}% 100%)`,
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{
                    width: '58%',
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    background: 'linear-gradient(180deg, rgba(20,20,22,0.98), rgba(28,28,31,0.98))',
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    padding: 16,
                  }}>
                    <div>
                      <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginBottom: 4 }}>Ocupación</p>
                      <strong style={{ color: 'var(--text)', fontSize: '2rem', lineHeight: 1 }}>{occupancyRate}%</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12, alignSelf: 'stretch' }}>
                <ChartCard
                  label="Habitaciones ocupadas"
                  value={stats?.ocupadas_hoy ?? 0}
                  maxValue={stats?.total_habitaciones || 1}
                  tone="linear-gradient(90deg, rgba(76,175,125,0.95), rgba(200,169,110,0.95))"
                  subtitle="Vista de ocupación sobre el total disponible"
                />
                <ChartCard
                  label="Reservas pendientes"
                  value={stats?.reservas_pendientes ?? 0}
                  maxValue={Math.max(stats?.reservas_pendientes ?? 0, stats?.ocupadas_hoy ?? 0, 1)}
                  tone="linear-gradient(90deg, rgba(224,160,82,0.95), rgba(200,169,110,0.95))"
                  subtitle="Reservas que requieren seguimiento"
                />
                <ChartCard
                  label="Ingresos del mes"
                  value={Math.round(stats?.ingresos_mes ?? 0)}
                  maxValue={Math.max(Math.round(stats?.ingresos_mes ?? 0), 1)}
                  tone="linear-gradient(90deg, rgba(200,169,110,0.95), rgba(76,175,125,0.95))"
                  subtitle={`S/. ${formatCurrency(stats?.ingresos_mes ?? 0)}`}
                />
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: '1rem', minHeight: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ color: 'var(--gold)', marginBottom: 4 }}>Habitaciones más solicitadas</h2>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Ranking visual según cantidad de reservas acumuladas.</p>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {popularRooms.length > 0 ? (
                popularRooms.map((room, index) => (
                  <div key={room.habitacion_id} style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div>
                        <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 3 }}>#{index + 1} Habitación {room.numero}</p>
                        <span className={`status-chip status-${room.tipo}`}>{room.tipo}</span>
                      </div>
                      <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{room.total_reservas}</strong>
                    </div>
                    <div style={{ height: 14, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${popularRoomsMax > 0 ? Math.max(8, (room.total_reservas / popularRoomsMax) * 100) : 0}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: getRoomTone(room.tipo, index),
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                  Aun no hay suficientes reservas para mostrar popularidad.
                </p>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, alignItems: 'stretch' }}>
          <div className="panel table-wrap" style={{ minHeight: '100%' }}>
            <div style={{ padding: '0.95rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ color: 'var(--gold)', marginBottom: 4 }}>Reservas recientes</h2>
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Últimos movimientos registrados en el sistema.</p>
              </div>
              <div className="status-chip status-activo" style={{ padding: '0.45rem 0.7rem' }}>{recent.length} registros</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Habitación</th>
                  <th>Check-in</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((res) => (
                  <tr key={res.id}>
                    <td style={{ color: 'var(--text)' }}>#{res.id}</td>
                    <td style={{ color: 'var(--text)' }}>#{res.habitacion?.numero ?? res.habitacion_id}</td>
                    <td style={{ color: 'var(--text)' }}>{new Date(res.fecha_checkin).toLocaleDateString()}</td>
                    <td><span className={getStatusClass(res.estado)}>{res.estado}</span></td>
                    <td style={{ color: 'var(--gold)' }}>S/. {formatCurrency(res.total)}</td>
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

          <div className="panel" style={{ padding: '1rem', minHeight: '100%' }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ color: 'var(--gold)', marginBottom: 4 }}>Ingreso por fecha</h2>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Mini gráfica con el total de reservas recientes agrupadas por fecha.</p>
            </div>

            {recentTrendEntries.length > 0 ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {recentTrendEntries.map(([dateLabel, total], index) => (
                  <div key={`${dateLabel}-${index}`} style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{dateLabel}</span>
                      <strong style={{ color: 'var(--green)' }}>S/. {formatCurrency(total)}</strong>
                    </div>
                    <div style={{ height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${recentTrendMax > 0 ? Math.max(10, (total / recentTrendMax) * 100) : 0}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, rgba(76,175,125,0.95), rgba(200,169,110,0.95))',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                Aun no hay datos suficientes para mostrar la gráfica.
              </p>
            )}
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: 'var(--gold)', marginBottom: 4 }}>Reseñas y comentarios</h2>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Valoración general de los huéspedes y comentarios más recientes.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div className="status-chip status-admin" style={{ padding: '0.45rem 0.7rem' }}>
                Promedio: {reviews?.promedio_puntuacion?.toFixed(1) ?? '0.0'}/5
              </div>
              <div className="status-chip status-activo" style={{ padding: '0.45rem 0.7rem' }}>
                Total reseñas: {reviews?.total_resenas ?? 0}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {reviews?.recientes?.length ? (
              reviews.recientes.map((review) => (
                <div
                  key={review.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '1rem',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 4 }}>{review.usuario_nombre}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>{new Date(review.fecha_creacion).toLocaleDateString()}</p>
                    </div>
                    <div style={{ color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em' }}>{buildRatingStars(review.puntuacion)}</div>
                  </div>

                  <p style={{ color: 'var(--text)', marginTop: 10, lineHeight: 1.6 }}>
                    {review.comentario?.trim() || 'Sin comentario adicional.'}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '0.75rem 0' }}>
                Aun no hay reseñas registradas.
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
