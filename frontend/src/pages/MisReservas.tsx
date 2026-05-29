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

const paymentOptions: Array<{
  id: PaymentGateway;
  label: string;
  description: string;
  enabled: boolean;
  badge: string;
  accent: 'gold' | 'muted';
}> = [
  { id: 'mercadopago', label: 'Mercado Pago', description: 'Pago en línea inmediato', enabled: true, badge: 'Disponible ahora', accent: 'gold' },
  { id: 'paypal', label: 'PayPal', description: 'Próximamente', enabled: false, badge: 'Próximamente', accent: 'muted' },
  { id: 'tarjeta', label: 'Tarjeta de crédito', description: 'Próximamente', enabled: false, badge: 'Próximamente', accent: 'muted' },
  { id: 'visa', label: 'Visa', description: 'Próximamente', enabled: false, badge: 'Próximamente', accent: 'muted' },
  { id: 'yape', label: 'Yape', description: 'Próximamente', enabled: false, badge: 'Próximamente', accent: 'muted' },
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
          className="payment-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1100,
          }}
        >
          <div className="panel payment-modal" style={{ width: '100%', maxWidth: 640 }}>
            <div className="payment-modal-hero">
              <div>
                <p className="payment-modal-kicker">Confirmación de reserva</p>
                <h2 style={{ color: 'var(--text)', margin: '0.15rem 0 0' }}>Seleccionar pasarela de pago</h2>
              </div>
              <div className="payment-modal-hero-chip">1 paso para continuar</div>
            </div>

            <p style={{ color: 'var(--muted)', margin: '0 0 1rem', fontSize: '.94rem' }}>
              Elige una pasarela segura para confirmar tu reserva. Por ahora solo Mercado Pago está habilitado.
            </p>

            <div className="payment-method-grid">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={[
                    'payment-method-card',
                    selectedPaymentMethod === option.id ? 'is-selected' : '',
                    !option.enabled ? 'is-disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    opacity: option.enabled ? 1 : 0.75,
                  }}
                >
                  <div className="payment-method-topline">
                    <div className="payment-method-icon" aria-hidden="true">
                      {option.id === 'mercadopago' ? 'MP' : option.label.slice(0, 1)}
                    </div>
                    <div className="payment-method-meta">
                      <p style={{ margin: 0, color: 'var(--text)', fontWeight: 700 }}>{option.label}</p>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '.84rem' }}>{option.description}</p>
                    </div>
                    <span className={`payment-method-badge ${option.accent === 'gold' ? 'is-gold' : ''}`}>
                      {option.badge}
                    </span>
                  </div>
                  <div className="payment-method-footer">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedPaymentMethod === option.id}
                      disabled={!option.enabled}
                      onChange={() => setSelectedPaymentMethod(option.id)}
                    />
                    <span style={{ color: 'var(--muted)', fontSize: '.8rem' }}>
                      {option.enabled ? 'Seleccionar este método' : 'Bloqueado hasta su lanzamiento'}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="payment-modal-footer">
              <label className="payment-default-toggle">
                <input
                  type="checkbox"
                  checked={rememberPaymentMethod}
                  onChange={(e) => setRememberPaymentMethod(e.target.checked)}
                />
                <span>
                  <strong>Usar este método por defecto</strong>
                  <small>Se guardará para la próxima reserva</small>
                </span>
              </label>

              <div className="payment-modal-actions">
                <button className="btn-ghost" onClick={closePaymentGatewayModal}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={confirmPaymentGateway}>
                  Continuar
                </button>
              </div>
            </div>

            {paymentModalError && (
              <div
                className="payment-modal-error"
                style={{
                  marginTop: 0,
                }}
              >
                {paymentModalError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MisReservas;
