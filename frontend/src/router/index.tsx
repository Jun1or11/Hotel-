import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Inicio from '../pages/Inicio';
import Habitaciones from '../pages/Habitaciones';
import MisReservas from '../pages/MisReservas';
import MisPagos from '../pages/MisPagos';
import Historial from '../pages/Historial';
import Perfil from '../pages/Perfil';
import Dashboard from '../pages/admin/Dashboard';
import GestionHabitaciones from '../pages/admin/GestionHabitaciones';
import GestionNotificaciones from '../pages/admin/GestionNotificaciones';
import GestionReservas from '../pages/admin/GestionReservas';
import GestionUsuarios from '../pages/admin/GestionUsuarios';
import { useAuthContext } from '../context/AuthContext';

const Router: React.FC = () => {
  const { token, user, authLoading } = useAuthContext();

  if (authLoading) {
    return (
      <div className="app-shell">
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/" element={<Inicio />} />

        <Route
          path="/inicio"
          element={<Navigate to="/" replace />}
        />
        <Route
          path="/habitaciones"
          element={<ProtectedRoute component={<Habitaciones />} />}
        />
        <Route
          path="/mis-reservas"
          element={<ProtectedRoute component={<MisReservas />} />}
        />
        <Route
          path="/mis-pagos"
          element={<ProtectedRoute component={<MisPagos />} />}
        />
        <Route
          path="/historial"
          element={<ProtectedRoute component={<Historial />} />}
        />
        <Route
          path="/mi-perfil"
          element={<ProtectedRoute component={<Perfil />} />}
        />

        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute component={<Dashboard />} requireAdmin />}
        />
        <Route
          path="/admin/habitaciones"
          element={<ProtectedRoute component={<GestionHabitaciones />} requireAdmin />}
        />
        <Route
          path="/admin/reservas"
          element={<ProtectedRoute component={<GestionReservas />} requireAdmin />}
        />
        <Route
          path="/admin/notificaciones"
          element={<ProtectedRoute component={<GestionNotificaciones />} requireAdmin />}
        />
        <Route
          path="/admin/usuarios"
          element={<ProtectedRoute component={<GestionUsuarios />} requireAdmin />}
        />

        <Route path="*" element={<Navigate to={token ? (user?.rol === 'admin' ? '/admin/dashboard' : '/') : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
