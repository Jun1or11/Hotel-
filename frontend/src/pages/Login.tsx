import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

type AuthTab = 'login' | 'register';

const Auth: React.FC = () => {
  const location = useLocation();
  const [tab, setTab] = useState<AuthTab>(location.pathname === '/register' ? 'register' : 'login');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDni, setLoadingDni] = useState(false);
  const [lastDniLookup, setLastDniLookup] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register, token, isAdmin, authLoading } = useAuthContext();
  const backgroundImageStyle = {
    backgroundImage:
      "linear-gradient(180deg, rgba(10, 10, 12, 0.78) 0%, rgba(10, 10, 12, 0.9) 100%), url('https://images.unsplash.com/photo-1517840901100-8179e982acb7?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  } as const;

  useEffect(() => {
    setTab(location.pathname === '/register' ? 'register' : 'login');
  }, [location.pathname]);

  useEffect(() => {
    if (authLoading || !token) {
      return;
    }

    navigate(isAdmin() ? '/admin/dashboard' : '/', { replace: true });
  }, [authLoading, token, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(dni.trim(), nombre.trim(), email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarDni = async () => {
    const cleanedDni = dni.trim();
    if (!cleanedDni) {
      setError('Ingresa un DNI para autocompletar el nombre');
      return;
    }

    if (!/^\d{8}$/.test(cleanedDni)) {
      setError('El DNI debe tener 8 dígitos');
      return;
    }

    setError('');
    setLoadingDni(true);
    try {
      const response = await axiosInstance.get(`/api/auth/dni/${cleanedDni}`);
      const data = response.data;
      if (data?.nombre) {
        setNombre(data.nombre);
        setLastDniLookup(cleanedDni);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo consultar el DNI');
    } finally {
      setLoadingDni(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', ...backgroundImageStyle }}>
      <Navbar />
      <div
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          width: 'min(1160px, 92vw)',
          margin: '0 auto',
          padding: '1rem 0 2rem',
        }}
      >
        <div
          className="panel"
          style={{ width: '100%', maxWidth: 470, padding: '1.3rem' }}
        >
          <h1 style={{ color: 'var(--gold)', marginBottom: 12 }}>Acceso Hotel Nova</h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={tab === 'login' ? 'btn-primary' : 'btn-ghost'}
              style={{
                flex: 1,
                padding: '0.58rem 0.5rem',
                backgroundColor: tab === 'login' ? 'var(--gold)' : 'transparent',
              }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={tab === 'register' ? 'btn-primary' : 'btn-ghost'}
              style={{
                flex: 1,
                padding: '0.58rem 0.5rem',
                backgroundColor: tab === 'register' ? 'var(--gold)' : 'transparent',
              }}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                padding: '0.6rem 0.7rem',
                borderRadius: 10,
                border: '1px solid rgba(224, 82, 82, 0.35)',
                backgroundColor: 'rgba(224, 82, 82, 0.1)',
                color: 'var(--red)',
                textAlign: 'center',
                fontSize: '.9rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
            {tab === 'register' && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                    DNI
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <input
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      onBlur={() => {
                        if (dni.length === 8 && dni !== lastDniLookup) {
                          handleBuscarDni();
                        }
                      }}
                      className="form-control"
                      placeholder="Ej. 12345678"
                      required={tab === 'register'}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleBuscarDni}
                      disabled={loadingDni}
                      style={{ padding: '0.55rem 0.75rem' }}
                    >
                      {loadingDni ? 'Buscando...' : 'Buscar DNI'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="form-control"
                    required={tab === 'register'}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.64rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? 'Procesando...'
                : tab === 'login'
                  ? 'Iniciar sesión'
                  : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
