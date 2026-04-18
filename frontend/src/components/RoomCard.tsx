import React from 'react';
import { Habitacion } from '../types/index';

interface RoomCardProps {
  habitacion: Habitacion;
  onReservar: (habitacion: Habitacion) => void;
  isReservadaPorFecha?: boolean;
}

const getRoomIcon = (tipo: string): string => {
  switch (tipo) {
    case 'estandar':
      return '🛏️';
    case 'familiar':
      return '🏠';
    case 'matrimonial':
      return '⭐';
    case 'suite':
      return '👑';
    default:
      return '🛏️';
  }
};

const getRoomLabel = (tipo: string): string => {
  switch (tipo) {
    case 'estandar':
      return 'Estandar';
    case 'matrimonial':
      return 'Matrimonial';
    case 'familiar':
      return 'Familiar';
    case 'suite':
      return 'Suite';
    default:
      return tipo.charAt(0).toUpperCase() + tipo.slice(1);
  }
};

const getRoomColor = (tipo: string): string => {
  switch (tipo) {
    case 'estandar':
      return 'linear-gradient(135deg, #1C1C1F 0%, #2A2A2F 100%)';
    case 'familiar':
      return 'linear-gradient(135deg, #2A3F2A 0%, #1C2A1C 100%)';
    case 'matrimonial':
      return 'linear-gradient(135deg, #3F3A2A 0%, #2A251C 100%)';
    case 'suite':
      return 'linear-gradient(135deg, #4A3C2A 0%, #2A2015 100%)';
    default:
      return 'linear-gradient(135deg, #1C1C1F 0%, #2A2A2F 100%)';
  }
};

const getAmenidades = (amenidades: Habitacion['amenidades']) => {
  if (!amenidades) return [] as string[];
  if (Array.isArray(amenidades)) return amenidades;
  return Object.keys(amenidades).filter((key) => (amenidades as Record<string, unknown>)[key]);
};

const RoomCard: React.FC<RoomCardProps> = ({ habitacion, onReservar, isReservadaPorFecha = false }) => {
  const isMantenimiento = habitacion.estado === 'mantenimiento';
  const isAvailable = !isMantenimiento && !isReservadaPorFecha;
  const amenidades = getAmenidades(habitacion.amenidades);
  const typeLabel = getRoomLabel(habitacion.tipo);
  const estadoLabel = isReservadaPorFecha
    ? 'reservada'
    : (isMantenimiento ? 'mantenimiento' : 'disponible');
  const estadoChipClass = isReservadaPorFecha
    ? 'status-ocupado'
    : (isMantenimiento ? 'status-mantenimiento' : 'status-libre');

  return (
    <div
      className="panel"
      style={{
        background: getRoomColor(habitacion.tipo),
        opacity: isAvailable ? 1 : 0.6,
        pointerEvents: isAvailable ? 'auto' : 'none',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        transition: 'transform .2s ease, filter .2s ease',
      }}
      onClick={() => isAvailable && onReservar(habitacion)}
    >
      <div style={{ padding: '1rem', position: 'relative' }}>
        <span className={`status-chip status-${habitacion.tipo}`} style={{ position: 'absolute', left: 12, top: 12 }}>
          {typeLabel}
        </span>
        <span
          className={`status-chip ${estadoChipClass}`}
          style={{ position: 'absolute', right: 12, top: 12 }}
        >
          {estadoLabel}
        </span>

        <div style={{ marginTop: 30, marginBottom: 14 }}>
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>
              Habitación #{habitacion.numero}
            </p>
            <h3 style={{ color: 'var(--gold)', marginTop: 4, fontSize: '1.5rem' }}>
              {getRoomIcon(habitacion.tipo)} {typeLabel}
            </h3>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>Capacidad:</span>
            <span style={{ color: 'var(--text)' }}>{habitacion.capacidad} personas</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted)' }}>Precio/noche:</span>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
              S/. {habitacion.precio_noche}
            </span>
          </div>

          {amenidades.length > 0 && (
            <div>
              <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>
                Amenidades:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {amenidades.slice(0, 3).map((amenidad, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '.75rem',
                      padding: '0.14rem 0.48rem',
                      borderRadius: 999,
                      backgroundColor: 'rgba(200, 169, 110, 0.1)',
                      color: 'var(--gold)',
                    }}
                  >
                    {amenidad}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {habitacion.descripcion && (
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: 16 }}>
            {habitacion.descripcion}
          </p>
        )}

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '0.6rem 0.75rem', opacity: isAvailable ? 1 : 0.6 }}
          disabled={!isAvailable}
        >
          {isAvailable ? 'Reservar ahora' : (isReservadaPorFecha ? 'Reservada' : 'No disponible')}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
