import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';
import { Pago, Reserva } from '../../types';

type AdminPago = Pago & {
  reserva?: Reserva;
  usuarioNombre?: string;
  habitacionNumero?: string;
  habitacionTipo?: string;
};

type PagosResumen = {
  cantidad_pagos_aprobados: number;
  total_aprobado: number;
};

const paymentMethods: Array<'mercadopago' | 'tarjeta' | 'transferencia' | 'efectivo'> = ['mercadopago', 'tarjeta', 'transferencia', 'efectivo'];
const paymentStatuses: Array<'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado'> = ['pendiente', 'aprobado', 'rechazado', 'reembolsado'];

const formatCurrency = (value: number | string) => Number(value ?? 0).toFixed(2);
const getStatusClass = (status: string) => `status-chip status-${status}`;

const AdminPagos: React.FC = () => {
  const [pagos, setPagos] = useState<AdminPago[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [resumen, setResumen] = useState<PagosResumen>({
    cantidad_pagos_aprobados: 0,
    total_aprobado: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    metodo: '',
    search: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    const [paymentsResult, reservationsResult, summaryResult] = await Promise.allSettled([
      axiosInstance.get('/api/pagos'),
      axiosInstance.get('/api/reservas?limit=200'),
      axiosInstance.get('/api/pagos/resumen/mes-actual'),
    ]);

    if (reservationsResult.status === 'fulfilled') {
      setReservas(reservationsResult.value.data);
    } else {
      console.error('Error fetching reservations for payments:', reservationsResult.reason);
      setReservas([]);
    }

    if (paymentsResult.status === 'fulfilled') {
      const reservationMap = new Map((reservationsResult.status === 'fulfilled' ? reservationsResult.value.data : []).map((reserva: Reserva) => [String(reserva.id), reserva]));

      setPagos(
        paymentsResult.value.data.map((pago: Pago) => {
          const reserva = reservationMap.get(String(pago.reserva_id));
          return {
            ...pago,
            reserva,
            usuarioNombre: reserva?.usuario?.nombre,
            habitacionNumero: reserva?.habitacion?.numero ? String(reserva.habitacion.numero) : undefined,
            habitacionTipo: reserva?.habitacion?.tipo,
          };
        })
      );
    } else {
      console.error('Error fetching payments:', paymentsResult.reason);
      setPagos([]);
      setError('No se pudieron cargar los pagos.');
    }

    if (summaryResult.status === 'fulfilled') {
      setResumen(summaryResult.value.data);
    } else {
      console.error('Error fetching payments summary:', summaryResult.reason);
      setResumen({
        cantidad_pagos_aprobados: 0,
        total_aprobado: 0,
      });
    }

    setLoading(false);
  };

  const filteredPayments = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return pagos.filter((pago) => {
      const matchesEstado = !filters.estado || pago.estado === filters.estado;
      const matchesMetodo = !filters.metodo || pago.metodo === filters.metodo;
      const reservationText = [
        pago.reserva?.id,
        pago.usuarioNombre,
        pago.habitacionNumero,
        pago.habitacionTipo,
        pago.referencia_externa,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !search || reservationText.includes(search) || String(pago.id).includes(search);

      return matchesEstado && matchesMetodo && matchesSearch;
    });
  }, [filters.estado, filters.metodo, filters.search, pagos]);

  const totalPagos = pagos.length;
  const pendientes = pagos.filter((pago) => pago.estado === 'pendiente').length;
  const aprobados = pagos.filter((pago) => pago.estado === 'aprobado').length;

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ color: 'var(--text)' }}>Cargando pagos...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Gestión de Pagos</h1>
            <p style={{ color: 'var(--muted)' }}>Consulta, filtra y registra pagos desde el panel administrativo.</p>
          </div>
          <div className="status-chip status-admin" style={{ padding: '0.45rem 0.7rem' }}>
            {totalPagos} pagos cargados
          </div>
        </div>

        {error && (
          <div className="panel" style={{ padding: '0.85rem 1rem' }}>
            <p style={{ color: 'var(--red)', marginBottom: 0 }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          <div className="panel" style={{ padding: '0.95rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Pagos totales</p>
            <p style={{ color: 'var(--gold)', fontSize: '2rem', fontWeight: 700 }}>{totalPagos}</p>
          </div>
          <div className="panel" style={{ padding: '0.95rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Aprobados</p>
            <p style={{ color: 'var(--green)', fontSize: '2rem', fontWeight: 700 }}>{aprobados}</p>
          </div>
          <div className="panel" style={{ padding: '0.95rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Pendientes</p>
            <p style={{ color: 'var(--amber)', fontSize: '2rem', fontWeight: 700 }}>{pendientes}</p>
          </div>
          <div className="panel" style={{ padding: '0.95rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Monto aprobado del mes</p>
            <p style={{ color: 'var(--gold)', fontSize: '2rem', fontWeight: 700 }}>S/. {formatCurrency(resumen.total_aprobado)}</p>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
            <input
              className="form-control"
              placeholder="Buscar por reserva, huésped, habitación o referencia"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
            <select
              className="form-control"
              value={filters.estado}
              onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))}
            >
              <option value="">Todos los estados</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              className="form-control"
              value={filters.metodo}
              onChange={(event) => setFilters((current) => ({ ...current, metodo: event.target.value }))}
            >
              <option value="">Todos los métodos</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Reserva</th>
                  <th>Huésped</th>
                  <th>Habitación</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((pago) => (
                  <tr key={pago.id}>
                    <td style={{ color: 'var(--text)' }}>{new Date(pago.fecha_pago).toLocaleString()}</td>
                    <td style={{ color: 'var(--text)' }}>#{pago.reserva_id}</td>
                    <td style={{ color: 'var(--text)' }}>{pago.usuarioNombre ?? 'Sin datos'}</td>
                    <td style={{ color: 'var(--text)' }}>
                      {pago.habitacionNumero ? `#${pago.habitacionNumero}` : 'Sin datos'}
                    </td>
                    <td style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{pago.metodo}</td>
                    <td>
                      <span className={getStatusClass(pago.estado)}>{pago.estado}</span>
                    </td>
                    <td style={{ color: 'var(--gold)' }}>S/. {formatCurrency(pago.monto)}</td>
                    <td style={{ color: 'var(--muted)' }}>{pago.referencia_externa || '---'}</td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)' }}>
                      No hay pagos que coincidan con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPagos;