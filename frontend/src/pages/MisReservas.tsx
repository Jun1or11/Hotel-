import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Reserva } from '../types/index';
import axiosInstance from '../api/axios';

const getStatusClass = (status: string) => `status-chip status-${status}`;
const asNumber = (value: number | string) => Number(value ?? 0);
const getHabitacionLabel = (reserva: Reserva) => reserva.habitacion?.numero ?? reserva.habitacion_id;
const getEstadoLabel = (estado: string) => (estado === 'activo' ? 'Comprado' : estado);

type PaymentGateway = 'mercadopago' | 'paypal' | 'tarjeta' | 'visa' | 'yape';

const paymentOptions: Array<{ id: PaymentGateway; label: string; description: string; enabled: boolean }> = [
  { id: 'mercadopago', label: 'Mercado Pago', description: 'Pago en línea inmediato', enabled: true },
  { id: 'paypal', label: 'PayPal', description: 'Próximamente', enabled: false },
  { id: 'tarjeta', label: 'Tarjeta de crédito', description: 'Próximamente', enabled: false },
  { id: 'visa', label: 'Visa', description: 'Próximamente', enabled: false },
  { id: 'yape', label: 'Yape', description: 'Próximamente', enabled: false },
];

const MisReservas: React.FC = () => {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingReservaId, setPayingReservaId] = useState<string | null>(null);
  const [cancellingReservaId, setCancellingReservaId] = useState<string | null>(null);
  const [expandedReservaId, setExpandedReservaId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedReservaForPayment, setSelectedReservaForPayment] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentGateway>('mercadopago');
  const [rememberPaymentMethod, setRememberPaymentMethod] = useState(true);
  const [paymentModalError, setPaymentModalError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    confirmMercadoPagoReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmMercadoPagoReturn = async () => {
    const params = new URLSearchParams(location.search);
    const paymentId = params.get('payment_id') || params.get('collection_id');
    const paymentStatus = params.get('status') || params.get('collection_status');
    const reservaIdFromUrl = params.get('reserva_id');
    const reservaIdFromStorage = localStorage.getItem('pending_reserva_id_mp');
    const pendingReservaId = reservaIdFromUrl || reservaIdFromStorage;

    if (!pendingReservaId) {
      fetchMisReservas();
      return;
    }

    try {
      await axiosInstance.get(`/api/reservas/${pendingReservaId}/pago-exitoso`, {
        params: {
          payment_id: paymentId || '',
          status: paymentStatus || '',
        },
      });
    } catch (error) {
      console.error('Error confirming Mercado Pago payment:', error);
    } finally {
      localStorage.removeItem('pending_reserva_id_mp');
      navigate('/mis-reservas', { replace: true });
      fetchMisReservas();
    }
  };

  const fetchMisReservas = async () => {
    try {
      const response = await axiosInstance.get('/api/reservas/mis-reservas?estado=activo,pendiente');
      setReservas(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async (reservaId: string) => {
    try {
      setPayingReservaId(reservaId);
      const response = await axiosInstance.post(`/api/reservas/${reservaId}/pagar`);
      const initPoint = response.data?.init_point;

      if (!initPoint) {
        throw new Error('No se recibió URL de pago');
      }

      localStorage.setItem('pending_reserva_id_mp', String(reservaId));
      window.location.href = initPoint;
    } catch (error: any) {
      console.error('Error iniciando pago de reserva:', error);
      const detail = error?.response?.data?.detail;
      alert(detail || 'No se pudo iniciar el pago de la reserva. Intenta nuevamente.');
    } finally {
      setPayingReservaId(null);
    }
  };

  const openPaymentGatewayModal = (reservaId: string) => {
    const preferred = localStorage.getItem('preferred_payment_method') as PaymentGateway | null;
    const exists = paymentOptions.some((option) => option.id === preferred);
    setSelectedPaymentMethod(exists && preferred ? preferred : 'mercadopago');
    setRememberPaymentMethod(true);
    setPaymentModalError('');
    setSelectedReservaForPayment(reservaId);
    setShowPaymentModal(true);
  };

  const closePaymentGatewayModal = () => {
    setShowPaymentModal(false);
    setSelectedReservaForPayment(null);
    setPaymentModalError('');
  };

  const confirmPaymentGateway = async () => {
    if (!selectedReservaForPayment) {
      return;
    }

    if (rememberPaymentMethod) {
      localStorage.setItem('preferred_payment_method', selectedPaymentMethod);
    }

    if (selectedPaymentMethod !== 'mercadopago') {
      setPaymentModalError('Por ahora solo Mercado Pago está disponible. Los demás métodos estarán disponibles pronto.');
      return;
    }

    closePaymentGatewayModal();
    await handlePagar(selectedReservaForPayment);
  };

  const handleCancelar = async (reservaId: string) => {
    const confirmed = window.confirm('Deseas cancelar esta reserva?');
    if (!confirmed) {
      return;
    }

    try {
      setCancellingReservaId(reservaId);
      await axiosInstance.put(`/api/reservas/${reservaId}/cancelar`);
      setReservas((prev) => prev.filter((reserva) => reserva.id !== reservaId));
    } catch (error: any) {
      console.error('Error cancelando reserva:', error);
      const detail = error?.response?.data?.detail;
      alert(detail || 'No se pudo cancelar la reserva. Intenta nuevamente.');
    } finally {
      setCancellingReservaId(null);
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
        <h1 className="page-title">Mis Reservas</h1>

        {reservas.length === 0 ? (
          <div className="panel" style={{ padding: '1.2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)' }}>No tienes reservas activas</p>
          </div>
        ) : (
          <div className="panel table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Habitación</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => {
                  const isExpanded = expandedReservaId === reserva.id;
                  const habitacion = reserva.habitacion;

                  return (
                    <React.Fragment key={reserva.id}>
                      <tr>
                        <td style={{ color: 'var(--text)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>Habitación #{getHabitacionLabel(reserva)}</span>
                            <button
                              type="button"
                              className="btn-ghost"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '.78rem' }}
                              onClick={() => setExpandedReservaId(isExpanded ? null : reserva.id)}
                            >
                              {isExpanded ? 'Ocultar info' : 'Ver habitación'}
                            </button>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text)' }}>{new Date(reserva.fecha_checkin).toLocaleDateString()}</td>
                        <td style={{ color: 'var(--text)' }}>{new Date(reserva.fecha_checkout).toLocaleDateString()}</td>
                        <td>
                          <span className={getStatusClass(reserva.estado)}>{getEstadoLabel(reserva.estado)}</span>
                        </td>
                        <td style={{ color: 'var(--gold)' }}>S/. {asNumber(reserva.total).toFixed(2)}</td>
                        <td>
                          {reserva.estado === 'pendiente' ? (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                onClick={() => openPaymentGatewayModal(reserva.id)}
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.7rem' }}
                                disabled={payingReservaId === reserva.id || cancellingReservaId === reserva.id}
                              >
                                {payingReservaId === reserva.id ? 'Procesando...' : 'Confirmar reserva'}
                              </button>
                              <button
                                onClick={() => handleCancelar(reserva.id)}
                                className="btn-ghost"
                                style={{ padding: '0.4rem 0.7rem', borderColor: 'rgba(224, 82, 82, 0.45)', color: 'var(--red)' }}
                                disabled={cancellingReservaId === reserva.id || payingReservaId === reserva.id}
                              >
                                {cancellingReservaId === reserva.id ? 'Cancelando...' : 'Cancelar reserva'}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--green)', fontSize: '.86rem', fontWeight: 600 }}>Comprado</span>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.8rem 1rem', display: 'grid', gap: 6 }}>
                              {habitacion ? (
                                <>
                                  <p style={{ margin: 0, color: 'var(--text)', fontWeight: 600 }}>Información de la habitación</p>
                                  <p style={{ margin: 0, color: 'var(--muted)' }}>Tipo: <span style={{ color: 'var(--text)' }}>{habitacion.tipo}</span></p>
                                  <p style={{ margin: 0, color: 'var(--muted)' }}>Capacidad: <span style={{ color: 'var(--text)' }}>{habitacion.capacidad} huésped(es)</span></p>
                                  <p style={{ margin: 0, color: 'var(--muted)' }}>Precio por noche: <span style={{ color: 'var(--gold)' }}>S/. {asNumber(habitacion.precio_noche).toFixed(2)}</span></p>
                                  {habitacion.descripcion && (
                                    <p style={{ margin: 0, color: 'var(--muted)' }}>Descripción: <span style={{ color: 'var(--text)' }}>{habitacion.descripcion}</span></p>
                                  )}
                                  {habitacion.amenidades && habitacion.amenidades.length > 0 && (
                                    <p style={{ margin: 0, color: 'var(--muted)' }}>Amenidades: <span style={{ color: 'var(--text)' }}>{habitacion.amenidades.join(', ')}</span></p>
                                  )}
                                </>
                              ) : (
                                <p style={{ margin: 0, color: 'var(--muted)' }}>No hay detalles de la habitación disponibles para esta reserva.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.62)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1100,
          }}
        >
          <div className="panel" style={{ width: '100%', maxWidth: 520, padding: '1.1rem' }}>
            <h2 style={{ color: 'var(--gold)', marginBottom: 10 }}>Seleccionar pasarela de pago</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 10, fontSize: '.88rem' }}>
              Elige cómo deseas confirmar tu reserva.
            </p>

            <div style={{ display: 'grid', gap: 8 }}>
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: `1px solid ${selectedPaymentMethod === option.id ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 10,
                    padding: '0.55rem 0.65rem',
                    background: selectedPaymentMethod === option.id ? 'rgba(200, 169, 110, 0.08)' : 'transparent',
                    opacity: option.enabled ? 1 : 0.7,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    checked={selectedPaymentMethod === option.id}
                    onChange={() => setSelectedPaymentMethod(option.id)}
                  />
                  <div>
                    <p style={{ margin: 0, color: 'var(--text)', fontWeight: 600 }}>{option.label}</p>
                    <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.8rem' }}>{option.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={rememberPaymentMethod}
                onChange={(e) => setRememberPaymentMethod(e.target.checked)}
              />
              Usar este método por defecto la próxima vez
            </label>

            {paymentModalError && (
              <div
                style={{
                  marginTop: 10,
                  padding: '0.55rem 0.65rem',
                  borderRadius: 10,
                  border: '1px solid rgba(224, 82, 82, 0.35)',
                  backgroundColor: 'rgba(224, 82, 82, 0.1)',
                  color: 'var(--red)',
                  fontSize: '.86rem',
                }}
              >
                {paymentModalError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
              <button className="btn-primary" onClick={confirmPaymentGateway}>
                Continuar
              </button>
              <button className="btn-ghost" onClick={closePaymentGatewayModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisReservas;
