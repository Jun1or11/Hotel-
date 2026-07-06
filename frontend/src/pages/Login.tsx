import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axiosInstance from '../api/axios';

type AuthTab = 'login' | 'register';

const passwordPolicyPattern = /^[A-Za-z0-9]+$/;

const validatePasswordPolicy = (value: string): string | null => {
  if (value.length < 7 || value.length > 12) {
    return 'La contraseña debe tener entre 7 y 12 caracteres';
  }

  if (!/[A-Z]/.test(value)) {
    return 'La contraseña debe incluir al menos una mayúscula';
  }

  if (!/\d/.test(value)) {
    return 'La contraseña debe incluir al menos un número';
  }

  if (!passwordPolicyPattern.test(value)) {
    return 'No se permiten signos. Solo se permiten letras y números';
  }

  return null;
};

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
  const [dniRegistrado, setDniRegistrado] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, register, token, isAdmin, authLoading } = useAuthContext();
  const backgroundImageStyle = {
    backgroundImage: 'var(--auth-page-background)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  } as const;

  const isGmailEmail = (value: string) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(value.trim());

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
      const user = await login(email.trim().toLowerCase(), password);
      navigate(user.rol === 'admin' ? '/admin/dashboard' : '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!isGmailEmail(normalizedEmail)) {
      setError('El correo debe ser una cuenta @gmail.com');
      return;
    }

    const passwordError = validatePasswordPolicy(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      const user = await register(dni.trim(), nombre.trim(), normalizedEmail, password);
      navigate(user.rol === 'admin' ? '/admin/dashboard' : '/', { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      let msg = 'Error al registrarse';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Errores de validación Pydantic 422: [{msg: '...', loc: [...]}]
        msg = detail.map((d: any) => d.msg || d.message || 'Error de validación').join('. ');
      }
      setError(msg);
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
        setDniRegistrado(data.registradoEnHotelNova ?? false);
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
                setDniRegistrado(false);
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
                      name="dni"
                      type="text"
                      value={dni}
                      onChange={(e) => {
                        setDni(e.target.value.replace(/\D/g, '').slice(0, 8));
                        setDniRegistrado(false);
                      }}
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
                  {dniRegistrado && dni.length === 8 && lastDniLookup === dni && (
                    <div
                      style={{
                        marginTop: 6,
                        padding: '0.4rem 0.6rem',
                        borderRadius: 8,
                        border: '1px solid rgba(224, 82, 82, 0.3)',
                        backgroundColor: 'rgba(224, 82, 82, 0.08)',
                        color: 'var(--red)',
                        fontSize: '.8rem',
                        textAlign: 'center',
                      }}
                    >
                      Este DNI ya está registrado en Hotel Nova
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                    Nombre completo
                  </label>
                  <input
                    name="nombre"
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
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-control"
                pattern={tab === 'register' ? '[a-zA-Z0-9._%+-]+@gmail\\.com' : undefined}
                title={tab === 'register' ? 'Ingresa un correo @gmail.com' : undefined}
                placeholder={tab === 'register' ? 'tuusuario@gmail.com' : 'correo'}
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.85rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  pattern={tab === 'register' ? '[A-Za-z0-9!@._-]+' : undefined}
                  title={tab === 'register' ? 'Usa 7 a 12 caracteres, letras, números y los símbolos ! @ . - _' : undefined}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: 'var(--text)',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
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
