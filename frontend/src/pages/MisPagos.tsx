import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';
import { Pago, Reserva } from '../types';

const asNumber = (value: number | string) => Number(value ?? 0);
const getStatusClass = (status: string) => `status-chip status-${status}`;

const MisPagos: React.FC = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  const resumenPagos = useMemo(() => {
    const totalGastado = pagos
      .filter((pago) => pago.estado === 'aprobado')
      .reduce((suma, pago) => suma + asNumber(pago.monto), 0);

    const pagosAprobados = pagos.filter((pago) => pago.estado === 'aprobado').length;

    return {
      totalGastado,
      pagosAprobados,
    };
  }, [pagos]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const pagosResponse = await axiosInstance.get('/api/pagos/mis-pagos');

      setPagos(pagosResponse.data);
    } catch (error) {
      console.error('Error fetching payments summary:', error);
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
          <p style={{ color: 'var(--text)' }}>Cargando pagos...</p>
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
        <h1 className="page-title">Mis Pagos</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1rem' }}>
          <div className="panel" style={{ padding: '0.95rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Total gastado</p>
            <p style={{ color: 'var(--gold)', fontSize: '1.7rem', fontWeight: 700 }}>S/. {resumenPagos.totalGastado.toFixed(2)}</p>
          </div>
          <div className="panel" style={{ padding: '0.95rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Pagos aprobados</p>
            <p style={{ color: 'var(--green)', fontSize: '1.7rem', fontWeight: 700 }}>{resumenPagos.pagosAprobados}</p>
          </div>
        </div>

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
