import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Reserva } from '../types/index';
import axiosInstance from '../api/axios';

const getStatusClass = (status: string) => `status-chip status-${status}`;
const asNumber = (value: number | string) => Number(value ?? 0);
const getHabitacionLabel = (reserva: Reserva) => reserva.habitacion?.numero ?? reserva.habitacion_id;

const toLocalDateOnly = (value: string) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getDisplayStatus = (reserva: Reserva) => {
  const checkoutDate = toLocalDateOnly(reserva.fecha_checkout);
  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (reserva.estado === 'activo' && checkoutDate < currentDate) {
    return {
      label: 'Finalizada',
      className: 'status-chip',
      style: {
        background: 'rgba(59, 130, 246, 0.16)',
        color: '#60a5fa',
        borderColor: 'rgba(59, 130, 246, 0.4)',
      } as React.CSSProperties,
    };
  }

  if (reserva.estado === 'completado') {
    return {
      label: 'Finalizada',
      className: getStatusClass('completado'),
      style: {},
    };
  }

  if (reserva.estado === 'cancelado') {
    return {
      label: 'Cancelada',
      className: getStatusClass('cancelado'),
      style: {},
    };
  }

  if (reserva.estado === 'pendiente') {
    return {
      label: 'Pendiente',
      className: getStatusClass('pendiente'),
      style: {},
    };
  }

  return {
    label: 'Activa',
    className: getStatusClass('activo'),
    style: {},
  };
};

const Historial: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    try {
      const response = await axiosInstance.get('/api/reservas/mis-reservas?estado=activo,completado,cancelado');
      setReservas(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="app-shell"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: 'var(--home-page-background)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: 'var(--home-page-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">
          Historial de Reservas
        </h1>

        {reservas.length === 0 ? (
          <div className="panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>No tienes historial de reservas</p>
          </div>
        ) : (
          <div className="panel table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    Habitación
                  </th>
                  <th>
                    Check-in
                  </th>
                  <th>
                    Check-out
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
                {reservas.map((reserva) => (
                  (() => {
                    const displayStatus = getDisplayStatus(reserva);

                    return (
                  <tr key={reserva.id}>
                    <td style={{ color: 'var(--text)' }}>
                      Habitación #{getHabitacionLabel(reserva)}
                    </td>
                    <td style={{ color: 'var(--text)' }}>
                      {new Date(reserva.fecha_checkin).toLocaleDateString()}
                    </td>
                    <td style={{ color: 'var(--text)' }}>
                      {new Date(reserva.fecha_checkout).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={displayStatus.className} style={displayStatus.style}>
                        {displayStatus.label}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gold)' }}>
                      S/. {asNumber(reserva.total).toFixed(2)}
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
