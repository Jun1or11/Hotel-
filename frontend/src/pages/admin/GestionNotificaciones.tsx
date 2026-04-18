import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import axiosInstance from '../../api/axios';

type NotificationTarget = 'all' | 'single';
type NotificationTemplate = 'custom' | 'salida_24h' | 'estadia_hoy' | 'pago_pendiente';

interface NotificacionAdmin {
  id: number;
  usuario_id: number;
  mensaje: string;
  leida: boolean;
  fecha_creacion: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
  };
}

interface UsuarioOption {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
}

const templateLabels: Record<NotificationTemplate, string> = {
  custom: 'Personalizado',
  salida_24h: 'Salida en 24 horas',
  estadia_hoy: 'La estadía termina hoy',
  pago_pendiente: 'Pago pendiente',
};

const templateDefaults: Record<NotificationTemplate, string> = {
  custom: '',
  salida_24h: 'Te quedan 24 horas para tu salida. Por favor coordina tu check-out.',
  estadia_hoy: 'Tu estadía finaliza hoy. Por favor coordina tu salida.',
  pago_pendiente: 'Tienes un pago pendiente por confirmar.',
};

const GestionNotificaciones: React.FC = () => {
  const [items, setItems] = useState<NotificacionAdmin[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [usuarioId, setUsuarioId] = useState('');
  const [template, setTemplate] = useState<NotificationTemplate>('salida_24h');
  const [mensaje, setMensaje] = useState(templateDefaults.salida_24h);
  const [sendResult, setSendResult] = useState<string>('');
  const [sendError, setSendError] = useState<string>('');

  const fetchData = async () => {
    try {
      const [notificacionesResponse, usuariosResponse] = await Promise.all([
        axiosInstance.get<NotificacionAdmin[]>('/api/notificaciones/enviadas?limit=200'),
        axiosInstance.get<UsuarioOption[]>('/api/usuarios?limit=500'),
      ]);
      setItems(notificacionesResponse.data);
      setUsuarios(usuariosResponse.data);
    } catch (error) {
      console.error('Error fetching sent notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (template === 'custom') return;
    setMensaje(templateDefaults[template]);
  }, [template]);

  const handleSendNotification = async () => {
    setSending(true);
    setSendResult('');
    setSendError('');

    try {
      const response = await axiosInstance.post('/api/notificaciones/enviar', {
        destinatario: target,
        usuario_id: target === 'single' ? Number(usuarioId) : null,
        plantilla: template,
        mensaje,
      });

      setSendResult(`Se enviaron ${response.data.sent} notificación(es).`);
      await fetchData();
    } catch (error: any) {
      setSendError(error.response?.data?.detail || 'No se pudo enviar la notificación');
    } finally {
      setSending(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const leidas = items.filter((n) => n.leida).length;
    const noLeidas = total - leidas;
    return { total, leidas, noLeidas };
  }, [items]);

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
        <h1 className="page-title">Notificaciones Enviadas</h1>

        <div className="panel" style={{ padding: '1rem', marginBottom: 16 }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: 12 }}>Enviar notificación</h2>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div>
                <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Destinatario</label>
                <select className="form-control" value={target} onChange={(e) => setTarget(e.target.value as NotificationTarget)}>
                  <option value="all">Todos los usuarios</option>
                  <option value="single">Un usuario</option>
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Plantilla</label>
                <select className="form-control" value={template} onChange={(e) => setTemplate(e.target.value as NotificationTemplate)}>
                  {Object.entries(templateLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {target === 'single' && (
                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Usuario</label>
                  <select className="form-control" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                    <option value="">Selecciona un usuario</option>
                    {usuarios.filter((usuario) => usuario.activo).map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} - {usuario.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Mensaje</label>
              <textarea
                className="form-control"
                rows={4}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Escribe aquí la notificación..."
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleSendNotification} disabled={sending} style={{ padding: '0.6rem 0.95rem' }}>
                {sending ? 'Enviando...' : 'Enviar notificación'}
              </button>
              {sendResult && <p style={{ color: 'var(--green)', alignSelf: 'center' }}>{sendResult}</p>}
              {sendError && <p style={{ color: 'var(--red)', alignSelf: 'center' }}>{sendError}</p>}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div className="panel" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Total</p>
            <p style={{ color: 'var(--gold)', fontSize: '1.9rem', fontWeight: 700 }}>{stats.total}</p>
          </div>
          <div className="panel" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>Leidas</p>
            <p style={{ color: 'var(--green)', fontSize: '1.9rem', fontWeight: 700 }}>{stats.leidas}</p>
          </div>
          <div className="panel" style={{ padding: '0.9rem' }}>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>No Leidas</p>
            <p style={{ color: 'var(--red)', fontSize: '1.9rem', fontWeight: 700 }}>{stats.noLeidas}</p>
          </div>
        </div>

        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text)' }}>#{item.id}</td>
                  <td style={{ color: 'var(--text)' }}>{item.usuario?.nombre || `Usuario #${item.usuario_id}`}</td>
                  <td style={{ color: 'var(--muted)' }}>{item.usuario?.email || '-'}</td>
                  <td style={{ color: 'var(--text)' }}>{item.mensaje}</td>
                  <td>
                    <span
                      className="status-chip"
                      style={{
                        color: item.leida ? 'var(--green)' : 'var(--red)',
                        borderColor: item.leida ? 'rgba(76, 175, 125, 0.35)' : 'rgba(224, 82, 82, 0.35)',
                        background: item.leida ? 'rgba(76, 175, 125, 0.14)' : 'rgba(224, 82, 82, 0.14)',
                      }}
                    >
                      {item.leida ? 'Leida' : 'No leida'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text)' }}>{new Date(item.fecha_creacion).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--muted)', textAlign: 'center' }}>
                    No hay notificaciones enviadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestionNotificaciones;
