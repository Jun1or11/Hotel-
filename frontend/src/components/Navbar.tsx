import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import ReviewModal from './ReviewModal';
import NotificationBell from './NotificationBell';

const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuthContext();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const shortName = user?.nombre?.trim().split(' ')[0] || '';
  const userInitial = shortName ? shortName.charAt(0).toUpperCase() : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(10px)',
          background: 'rgba(20, 20, 22, 0.9)',
        }}
      >
        <div
          style={{
            width: 'min(1160px, 92vw)',
            margin: '0 auto',
            minHeight: 74,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Link
            to={isAdmin() ? '/admin/dashboard' : '/'}
            style={{
              color: 'var(--gold)',
              fontFamily: 'Cormorant Garamond, serif',
              fontWeight: 700,
              fontSize: '1.95rem',
              letterSpacing: '0.04em',
            }}
          >
            Hotel Nova
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {!isAdmin() ? (
                  <>
                    <Link
                      to="/habitaciones"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Habitaciones
                    </Link>
                    <Link
                      to="/mis-reservas"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Mis Reservas
                    </Link>
                    <Link
                      to="/mis-pagos"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Mis Pagos
                    </Link>
                    <Link
                      to="/historial"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Historial
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/admin/dashboard"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/habitaciones"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Habitaciones
                    </Link>
                    <Link
                      to="/admin/reservas"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Reservas
                    </Link>
                    <Link
                      to="/admin/notificaciones"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Notificaciones
                    </Link>
                    <Link
                      to="/admin/usuarios"
                      style={{ color: 'var(--text)', fontSize: '.95rem' }}
                    >
                      Usuarios
                    </Link>
                  </>
                )}
              </div>

              {isAdmin() && <span className="status-chip status-admin">Admin</span>}

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!isAdmin() && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReviewModal(true);
                    }}
                    title="Dejar reseña"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface2)',
                      color: 'var(--gold)',
                      fontSize: '.95rem',
                    }}
                  >
                    ★
                  </button>
                )}

                {!isAdmin() && <NotificationBell />}

                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.32rem 0.5rem',
                      borderRadius: 9,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface2)',
                      color: 'var(--text)',
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '999px',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '.72rem',
                        fontWeight: 700,
                        color: 'var(--bg)',
                        backgroundColor: 'var(--gold)',
                      }}
                    >
                      {userInitial}
                    </span>
                    <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '.86rem' }}>
                      {shortName}
                    </span>
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>▼</span>
                  </button>

                  {showMenu && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: 8,
                        width: 220,
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface2)',
                        padding: 8,
                        zIndex: 200,
                      }}
                    >
                      <div
                        style={{
                          padding: '0.5rem 0.6rem',
                          marginBottom: 6,
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--muted)',
                          fontSize: '.82rem',
                        }}
                      >
                        {user.email}
                      </div>
                      <Link
                        to="/mi-perfil"
                        onClick={() => setShowMenu(false)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 0.6rem',
                          borderRadius: 8,
                          color: 'var(--text)',
                          fontSize: '.88rem',
                          marginBottom: 6,
                          border: '1px solid var(--border)',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        Mi perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 0.6rem',
                          borderRadius: 8,
                          backgroundColor: 'rgba(224, 82, 82, 0.14)',
                          color: 'var(--red)',
                          fontSize: '.88rem',
                        }}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/login" className="btn-ghost" style={{ padding: '0.45rem 0.8rem', fontSize: '.9rem' }}>
                Iniciar sesión
              </Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.45rem 0.8rem', fontSize: '.9rem' }}>
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </nav>

      {user && !isAdmin() && (
        <ReviewModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          userName={user.nombre}
        />
      )}
    </>
  );
};

export default Navbar;
