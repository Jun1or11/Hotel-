import React, { useEffect, useMemo, useState } from 'react';
import { Habitacion } from '../types/index';
import axiosInstance from '../api/axios';

interface ReservaModalProps {
  habitacion: Habitacion;
  onClose: () => void;
  onConfirm: () => void;
}

interface HabitacionOcupacion {
  fecha_checkin: string;
  fecha_checkout: string;
}

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromIsoDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, amount: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
};

const subDays = (date: Date, amount: number): Date => addDays(date, -amount);

const getMonthDaysGrid = (baseMonth: Date): Date[] => {
  const monthStart = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
  const startDay = monthStart.getDay();
  const gridStart = addDays(monthStart, -startDay);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
};

const ReservaModal: React.FC<ReservaModalProps> = ({ habitacion, onClose, onConfirm }) => {
  const [fechaCheckin, setFechaCheckin] = useState('');
  const [fechaCheckout, setFechaCheckout] = useState('');
  const [numHuespedes, setNumHuespedes] = useState(1);
  const [solicitudes, setSolicitudes] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutAuto, setCheckoutAuto] = useState(false);
  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());
  const [loadingOcupacion, setLoadingOcupacion] = useState(true);
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    calculateTotal();
  }, [fechaCheckin, fechaCheckout]);

  useEffect(() => {
    fetchOcupacion();
  }, [habitacion.id]);

  const monthDays = useMemo(() => getMonthDaysGrid(viewMonth), [viewMonth]);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const fetchOcupacion = async () => {
    setLoadingOcupacion(true);
    try {
      const response = await axiosInstance.get<HabitacionOcupacion[]>(`/api/habitaciones/${habitacion.id}/ocupacion`);
      const blocked = new Set<string>();

      response.data.forEach((reserva) => {
        let current = fromIsoDate(reserva.fecha_checkin);
        const checkout = fromIsoDate(reserva.fecha_checkout);

        while (current < checkout) {
          blocked.add(toIsoDate(current));
          current = addDays(current, 1);
        }
      });

      setOccupiedDates(blocked);
    } catch {
      setError('No se pudo cargar la ocupación de fechas para esta habitación.');
      setOccupiedDates(new Set());
    } finally {
      setLoadingOcupacion(false);
    }
  };

  const isRangeAvailable = (checkin: string, checkout: string): boolean => {
    let current = fromIsoDate(checkin);
    const end = fromIsoDate(checkout);

    while (current < end) {
      if (occupiedDates.has(toIsoDate(current))) {
        return false;
      }
      current = addDays(current, 1);
    }

    return true;
  };

  const handleDayClick = (day: Date) => {
    const iso = toIsoDate(day);
    const isPast = day < today;
    const isOccupied = occupiedDates.has(iso);

    if (isPast) {
      return;
    }

    if (isOccupied) {
      setError('Ese día ya está ocupado. Elige un día libre (verde).');
      return;
    }

    setError('');

    if (!fechaCheckin) {
      setFechaCheckin(iso);
      setFechaCheckout(toIsoDate(addDays(day, 1)));
      setCheckoutAuto(true);
      return;
    }

    if (fechaCheckin && fechaCheckout) {
      if (iso <= fechaCheckin) {
        setFechaCheckin(iso);
        setFechaCheckout(toIsoDate(addDays(day, 1)));
        setCheckoutAuto(true);
        return;
      }

      const internalCheckout = toIsoDate(addDays(day, 1));
      if (!isRangeAvailable(fechaCheckin, internalCheckout)) {
        setError('El rango elegido incluye fechas ocupadas. Selecciona otro check-out.');
        return;
      }

      setFechaCheckout(internalCheckout);
      setCheckoutAuto(false);
      return;
    }

    if (iso <= fechaCheckin) {
      setFechaCheckin(iso);
      setFechaCheckout(toIsoDate(addDays(day, 1)));
      setCheckoutAuto(true);
      return;
    }

    const internalCheckout = toIsoDate(addDays(day, 1));
    if (!isRangeAvailable(fechaCheckin, internalCheckout)) {
      setError('El rango elegido incluye fechas ocupadas. Selecciona otro check-out.');
      return;
    }

    setFechaCheckout(internalCheckout);
    setCheckoutAuto(false);
  };

  const calculateTotal = () => {
    if (!fechaCheckin || !fechaCheckout) {
      setTotal(0);
      return;
    }

    const checkIn = new Date(fechaCheckin);
    const checkOut = new Date(fechaCheckout);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights > 0) {
      setTotal(nights * habitacion.precio_noche);
    } else {
      setTotal(0);
    }
  };

  const handleCrearReserva = async () => {
    if (!fechaCheckin || !fechaCheckout) {
      setError('Por favor, selecciona las fechas de check-in y check-out');
      return;
    }

    if (!isRangeAvailable(fechaCheckin, fechaCheckout)) {
      setError('El rango elegido ya no está disponible, actualiza las fechas.');
      return;
    }

    if (numHuespedes > habitacion.capacidad) {
      setError(`La capacidad máxima de esta habitación es ${habitacion.capacidad} personas`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axiosInstance.post('/api/reservas', {
        habitacion_id: habitacion.id,
        fecha_checkin: fechaCheckin,
        fecha_checkout: fechaCheckout,
        num_huespedes: numHuespedes,
        solicitudes_especiales: solicitudes,
      });

      onConfirm();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  const checkinDate = fechaCheckin ? fromIsoDate(fechaCheckin) : null;
  const checkoutDate = fechaCheckout ? fromIsoDate(fechaCheckout) : null;
  const checkoutDisplayDate = checkoutDate ? subDays(checkoutDate, 1) : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.62)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        className="panel"
        style={{ width: '100%', maxWidth: 980, maxHeight: '96vh', overflowY: 'auto', padding: '1.2rem' }}
      >
        <h2 style={{ color: 'var(--gold)', marginBottom: 12 }}>
          Reservar Habitación #{habitacion.numero}
        </h2>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: '0.6rem 0.7rem',
              borderRadius: 10,
              border: '1px solid rgba(224, 82, 82, 0.35)',
              backgroundColor: 'rgba(224, 82, 82, 0.1)',
              color: 'var(--red)',
              fontSize: '.9rem',
            }}
          >
            {error}
          </div>
        )}

        <div className="reserva-layout" style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Check-in
              </label>
              <div className="form-control" style={{ minHeight: 44, display: 'grid', alignItems: 'center' }}>
                {fechaCheckin ? fromIsoDate(fechaCheckin).toLocaleDateString() : 'Selecciona en el calendario'}
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Check-out
              </label>
              <div className="form-control" style={{ minHeight: 44, display: 'grid', alignItems: 'center' }}>
                {checkoutDisplayDate ? checkoutDisplayDate.toLocaleDateString() : 'Selecciona en el calendario'}
              </div>
            </div>

            <div>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Número de huéspedes (máx. {habitacion.capacidad})
              </label>
              <input
                type="number"
                min="1"
                max={habitacion.capacidad}
                value={numHuespedes}
                onChange={(e) => setNumHuespedes(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="form-control"
              />
            </div>

            <div>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Solicitudes especiales (opcional)
              </label>
              <textarea
                value={solicitudes}
                onChange={(e) => setSolicitudes(e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Cama adicional, alto piso, vista al mar, etc."
              />
            </div>

            <div className="panel" style={{ padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)' }}>Precio por noche:</span>
                <span style={{ color: 'var(--gold)' }}>${habitacion.precio_noche}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span style={{ color: 'var(--muted)' }}>Total:</span>
                <span style={{ color: 'var(--gold)', fontSize: '1.6rem', fontWeight: 700 }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="calendar-panel">
            <div className="calendar-header">
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.3rem 0.55rem' }}
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              >
                {'<'}
              </button>
              <strong style={{ color: 'var(--gold)' }}>
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </strong>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.3rem 0.55rem' }}
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              >
                {'>'}
              </button>
            </div>

            <div className="calendar-weekdays">
              {DAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {monthDays.map((day) => {
                const iso = toIsoDate(day);
                const isCurrentMonth = day.getMonth() === viewMonth.getMonth();
                const isPast = day < today;
                const isOccupied = occupiedDates.has(iso);
                const isCheckin = Boolean(checkinDate && toIsoDate(checkinDate) === iso);
                const isCheckout = Boolean(
                  checkoutDisplayDate &&
                  !checkoutAuto &&
                  toIsoDate(checkoutDisplayDate) === iso
                );
                const isInRange = Boolean(
                  checkinDate &&
                  checkoutDisplayDate &&
                  !checkoutAuto &&
                  day >= checkinDate &&
                  day <= checkoutDisplayDate
                );

                const classes = [
                  'calendar-day',
                  !isCurrentMonth ? 'is-outside' : '',
                  isPast ? 'is-disabled' : '',
                  isOccupied ? 'is-occupied' : 'is-free',
                  isCheckin ? 'is-selected-start' : '',
                  isCheckout ? 'is-selected-end' : '',
                  isInRange ? 'is-selected-range' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={iso}
                    type="button"
                    className={classes}
                    onClick={() => handleDayClick(day)}
                    disabled={isPast || loadingOcupacion}
                    title={isOccupied ? 'Ocupado' : 'Disponible'}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="calendar-legend">
              <span><i className="dot dot-free" /> Libre</span>
              <span><i className="dot dot-occupied" /> Ocupado</span>
              <span><i className="dot dot-selected" /> Selección</span>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '.82rem', marginTop: 10 }}>
              Hora de entrada: 14:00 h | Hora de salida: 12:00 h
            </p>

            {loadingOcupacion && (
              <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginTop: 8 }}>
                Cargando fechas ocupadas...
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={handleCrearReserva}
            disabled={loading}
            className="btn-primary"
            style={{ padding: '0.6rem', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Procesando...' : 'Crear reserva'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost"
            style={{ padding: '0.6rem' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservaModal;
