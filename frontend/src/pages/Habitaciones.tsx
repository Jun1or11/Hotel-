import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import ReservaModal from '../components/ReservaModal';
import { Habitacion } from '../types/index';
import axiosInstance from '../api/axios';

const Habitaciones: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [filteredHabitaciones, setFilteredHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Habitacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [tipo, setTipo] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('');

  useEffect(() => {
    fetchHabitaciones();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [habitaciones, tipo, capacidad, precioMax, ordenarPor]);

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
    let filtered = [...habitaciones];

    if (tipo) {
      filtered = filtered.filter((h) => h.tipo === tipo);
    }

    if (capacidad) {
      filtered = filtered.filter((h) => h.capacidad >= parseInt(capacidad));
    }

    if (precioMax) {
      filtered = filtered.filter((h) => Number(h.precio_noche) <= Number(precioMax));
    }

    if (ordenarPor === 'precio_asc') {
      filtered.sort((a, b) => Number(a.precio_noche) - Number(b.precio_noche));
    } else if (ordenarPor === 'precio_desc') {
      filtered.sort((a, b) => Number(b.precio_noche) - Number(a.precio_noche));
    } else if (ordenarPor === 'capacidad_desc') {
      filtered.sort((a, b) => b.capacidad - a.capacidad);
    }

    setFilteredHabitaciones(filtered);
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
              Precio maximo
            </label>
            <input
              type="number"
              min="0"
              placeholder="Ej. 250"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
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

          <div>
            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
              Ordenar por
            </label>
            <select
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="form-control"
            >
              <option value="">Sin ordenar</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="capacidad_desc">Capacidad: mayor a menor</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 18 }} className="room-grid">
          {filteredHabitaciones.map((habitacion) => (
            <RoomCard
              key={habitacion.id}
              habitacion={habitacion}
              onReservar={handleReservar}
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
