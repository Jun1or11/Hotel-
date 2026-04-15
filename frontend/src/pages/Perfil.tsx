import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuthContext } from '../context/AuthContext';

const Perfil: React.FC = () => {
  const { user, updateProfile } = useAuthContext();
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }
    setDni(user.dni || '');
    setNombre(user.nombre || '');
    setEmail(user.email || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const cleanDni = dni.trim();
    if (cleanDni && !/^\d{8}$/.test(cleanDni)) {
      setError('El DNI debe tener 8 dígitos');
      return;
    }

    if (newPassword && !currentPassword) {
      setError('Para cambiar contraseña debes ingresar la contraseña actual');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        dni: cleanDni || undefined,
        nombre: nombre.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });

      setCurrentPassword('');
      setNewPassword('');
      setMessage('Perfil actualizado correctamente');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container" style={{ maxWidth: 760 }}>
        <h1 className="page-title">Mi Perfil</h1>

        <div className="panel" style={{ padding: '1.2rem' }}>
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

          {message && (
            <div
              style={{
                marginBottom: 12,
                padding: '0.6rem 0.7rem',
                borderRadius: 10,
                border: '1px solid rgba(76, 175, 125, 0.35)',
                backgroundColor: 'rgba(76, 175, 125, 0.1)',
                color: 'var(--green)',
                fontSize: '.9rem',
              }}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                  DNI
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />
              </div>

              <div>
                <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <p style={{ marginBottom: 8, color: 'var(--muted)', fontSize: '.9rem' }}>
                  Cambiar contraseña (opcional)
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                  />
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 14, padding: '0.62rem 0.9rem' }}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
