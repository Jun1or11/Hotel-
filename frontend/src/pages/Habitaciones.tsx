import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import ReservaModal from '../components/ReservaModal';
import { Habitacion } from '../types/index';
import axiosInstance from '../api/axios';

const Habitaciones: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [filteredHabitaciones, setFilteredHabitaciones] = useState<Habitacion[]>([]);
  const [availableRoomIds, setAvailableRoomIds] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Habitacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [tipo, setTipo] = useState('');
  const [fechaCheckin, setFechaCheckin] = useState('');
  const [fechaCheckout, setFechaCheckout] = useState('');
  const [capacidad, setCapacidad] = useState('');

  useEffect(() => {
    fetchHabitaciones();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [habitaciones, tipo, fechaCheckin, fechaCheckout, capacidad]);

  useEffect(() => {
    fetchAvailableForDates();
  }, [habitaciones, fechaCheckin, fechaCheckout]);

  const fetchHabitaciones = async () => {
    try {
      const response = await axiosInstance.get('/api/habitaciones');
      setHabitaciones(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = habitaciones;

    if (tipo) {
      filtered = filtered.filter((h) => h.tipo === tipo);
    }

    if (capacidad) {
      filtered = filtered.filter((h) => h.capacidad >= parseInt(capacidad));
    }

    setFilteredHabitaciones(filtered);
  };

  const fetchAvailableForDates = async () => {
    if (!fechaCheckin || !fechaCheckout) {
      setAvailableRoomIds(null);
      return;
    }

    try {
      const response = await axiosInstance.get('/api/habitaciones', {
        params: {
          fecha_checkin: fechaCheckin,
          fecha_checkout: fechaCheckout,
        },
      });
      const ids = new Set<string>(response.data.map((room: Habitacion) => String(room.id)));
      setAvailableRoomIds(ids);
    } catch (error) {
      console.error('Error fetching date availability:', error);
      setAvailableRoomIds(null);
    }
  };

  const handleReservar = (habitacion: Habitacion) => {
    setSelectedRoom(habitacion);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  const handleReservaConfirm = async () => {
    fetchHabitaciones();
    handleCloseModal();
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2500);
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando habitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">
          Nuestras Habitaciones
        </h1>

        <div className="search-row">
          <div>
            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="form-control"
            >
              <option value="">Todos</option>
              <option value="estandar">Estandar</option>
              <option value="familiar">Familiar</option>
              <option value="matrimonial">Matrimonial</option>
              <option value="suite">Suite</option>
            </select>
          </div>

          <div>
            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
              Check-in
            </label>
            <input
              type="date"
              value={fechaCheckin}
              onChange={(e) => setFechaCheckin(e.target.value)}
              className="form-control"
            />
          </div>

          <div>
            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
              Check-out
            </label>
            <input
              type="date"
              value={fechaCheckout}
              onChange={(e) => setFechaCheckout(e.target.value)}
              className="form-control"
            />
          </div>

          <div>
            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
              Capacidad
            </label>
            <select
              value={capacidad}
              onChange={(e) => setCapacidad(e.target.value)}
              className="form-control"
            >
              <option value="">Cualquier capacidad</option>
              <option value="1">1+ personas</option>
              <option value="2">2+ personas</option>
              <option value="4">4+ personas</option>
              <option value="6">6+ personas</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="room-grid">
          {filteredHabitaciones.map((habitacion) => (
            <RoomCard
              key={habitacion.id}
              habitacion={habitacion}
              onReservar={handleReservar}
              isReservadaPorFecha={Boolean(
                fechaCheckin &&
                fechaCheckout &&
                availableRoomIds &&
                !availableRoomIds.has(String(habitacion.id))
              )}
            />
          ))}
        </div>
      </div>

      {showModal && selectedRoom && (
        <ReservaModal
          habitacion={selectedRoom}
          onClose={handleCloseModal}
          onConfirm={handleReservaConfirm}
        />
      )}

      {showToast && <div className="toast">Reserva creada. Completa el pago en Mis Reservas.</div>}
    </div>
  );
};

export default Habitaciones;
