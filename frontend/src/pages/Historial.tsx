import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { Reserva } from '../types/index';
import axiosInstance from '../api/axios';

const getStatusClass = (status: string) => `status-chip status-${status}`;
const asNumber = (value: number | string) => Number(value ?? 0);
const getHabitacionLabel = (reserva: Reserva) => reserva.habitacion?.numero ?? reserva.habitacion_id;

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
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
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
                      <span className={getStatusClass(reserva.estado)}>
                        {reserva.estado}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gold)' }}>
                      S/. {asNumber(reserva.total).toFixed(2)}
                    </td>
                  </tr>
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
