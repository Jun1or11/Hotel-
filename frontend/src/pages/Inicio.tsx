import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import axiosInstance from '../api/axios';
import { Habitacion } from '../types';
import { useAuthContext } from '../context/AuthContext';

const Inicio: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const { token, isAdmin } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHabitaciones = async () => {
      try {
        const response = await axiosInstance.get('/api/habitaciones');
        setHabitaciones(response.data);
      } catch (error) {
        console.error('Error fetching rooms in home page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHabitaciones();
  }, []);

  const handleIntentarReservar = () => {
    if (isAdmin()) {
      navigate('/admin/habitaciones');
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    navigate('/habitaciones');
  };

  return (
    <div
      className="app-shell"
      style={{
        backgroundImage: 'var(--home-page-background)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <Navbar />
      <div className="app-container">
        <section
          className="panel"
          style={{
            padding: '1.6rem',
            display: 'grid',
            gap: 14,
            background: 'var(--hero-panel-background)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--gold)',
              fontSize: '.82rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Bienvenido a Hotel Nova
          </p>

          <h1 className="page-title" style={{ margin: 0 }}>
            Tu experiencia comienza aquí
          </h1>

          <p style={{ color: 'var(--text)', maxWidth: 760, fontSize: '1.02rem' }}>
            Explora nuestras habitaciones disponibles. Cuando elijas una, podrás iniciar sesión para completar tu reserva.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
            {token ? (
              <Link to={isAdmin() ? '/admin/habitaciones' : '/habitaciones'} className="btn-primary" style={{ padding: '0.62rem 0.9rem' }}>
                Ir a reservar
              </Link>
            ) : (
              <Link to="/login" className="btn-primary" style={{ padding: '0.62rem 0.9rem' }}>
                Iniciar sesión para reservar
              </Link>
            )}
            {!token && (
              <Link to="/register" className="btn-ghost" style={{ padding: '0.62rem 0.9rem' }}>
                Crear cuenta
              </Link>
            )}
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <h2 style={{ color: 'var(--text)', marginBottom: 12 }}>Habitaciones destacadas</h2>

          {loading ? (
            <div className="panel" style={{ padding: '1rem' }}>
              <p style={{ color: 'var(--muted)' }}>Cargando habitaciones...</p>
            </div>
          ) : (
            <div className="room-grid">
              {habitaciones.slice(0, 8).map((habitacion) => (
                <RoomCard
                  key={habitacion.id}
                  habitacion={habitacion}
                  onReservar={handleIntentarReservar}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Inicio;
