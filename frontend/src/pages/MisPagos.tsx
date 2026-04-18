import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { Pago } from '../types';

const asNumber = (value: number | string) => Number(value ?? 0);
const getStatusClass = (status: string) => `status-chip status-${status}`;

const MisPagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPagos();
  }, []);

  const fetchPagos = async () => {
    try {
      const response = await axiosInstance.get('/api/pagos/mis-pagos');
      setPagos(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">Mis Pagos</h1>

        {pagos.length === 0 ? (
          <div className="panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>Aún no tienes pagos registrados</p>
          </div>
        ) : (
          <div className="panel table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Reserva</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td style={{ color: 'var(--text)' }}>{new Date(pago.fecha_pago).toLocaleString()}</td>
                    <td style={{ color: 'var(--text)' }}>#{pago.reserva_id}</td>
                    <td style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{pago.metodo}</td>
                    <td><span className={getStatusClass(pago.estado)}>{pago.estado}</span></td>
                    <td style={{ color: 'var(--gold)' }}>
                      S/. {asNumber(pago.monto).toFixed(2)}
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

export default MisPagos;
