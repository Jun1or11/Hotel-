import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

type AdminSettings = {
  defaultCurrency: 'USD' | 'PEN';
  preferredPaymentMethod: 'mercadopago' | 'tarjeta' | 'transferencia' | 'efectivo';
  confirmDestructiveActions: boolean;
  emailNotifications: boolean;
  compactTables: boolean;
  dashboardRefreshMinutes: 5 | 10 | 15 | 30;
};

const SETTINGS_STORAGE_KEY = 'hotelnova_admin_settings_v1';

const DEFAULT_SETTINGS: AdminSettings = {
  defaultCurrency: 'USD',
  preferredPaymentMethod: 'mercadopago',
  confirmDestructiveActions: true,
  emailNotifications: true,
  compactTables: false,
  dashboardRefreshMinutes: 15,
};

const formatValue = (value: boolean | string | number) => {
  if (typeof value === 'boolean') {
    return value ? 'Activado' : 'Desactivado';
  }

  return String(value);
};

const readSettings = (): AdminSettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<AdminSettings>;

    return {
      defaultCurrency: parsed.defaultCurrency === 'PEN' ? 'PEN' : 'USD',
      preferredPaymentMethod:
        parsed.preferredPaymentMethod === 'tarjeta' ||
        parsed.preferredPaymentMethod === 'transferencia' ||
        parsed.preferredPaymentMethod === 'efectivo'
          ? parsed.preferredPaymentMethod
          : 'mercadopago',
      confirmDestructiveActions: typeof parsed.confirmDestructiveActions === 'boolean' ? parsed.confirmDestructiveActions : true,
      emailNotifications: typeof parsed.emailNotifications === 'boolean' ? parsed.emailNotifications : true,
      compactTables: typeof parsed.compactTables === 'boolean' ? parsed.compactTables : false,
      dashboardRefreshMinutes:
        parsed.dashboardRefreshMinutes === 5 ||
        parsed.dashboardRefreshMinutes === 10 ||
        parsed.dashboardRefreshMinutes === 15 ||
        parsed.dashboardRefreshMinutes === 30
          ? parsed.dashboardRefreshMinutes
          : 15,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const AdminConfiguracion: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings>(() => readSettings());
  const [savedAt, setSavedAt] = useState<string>('');

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toLocaleString());
  }, [settings]);

  const settingsCards = useMemo(
    () => [
      { label: 'Moneda por defecto', value: settings.defaultCurrency },
      { label: 'Método preferido', value: settings.preferredPaymentMethod },
      { label: 'Confirmación al borrar', value: formatValue(settings.confirmDestructiveActions) },
      { label: 'Notificaciones por correo', value: formatValue(settings.emailNotifications) },
      { label: 'Tablas compactas', value: formatValue(settings.compactTables) },
      { label: 'Refresco del dashboard', value: `${settings.dashboardRefreshMinutes} min` },
    ],
    [settings]
  );

  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AdminLayout>
      <div className="admin-page-stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Configuración</h1>
            <p style={{ color: 'var(--muted)' }}>
              Ajustes persistentes del panel administrativo guardados en este navegador.
            </p>
          </div>
          <button type="button" className="btn-ghost" onClick={resetSettings} style={{ padding: '0.55rem 0.9rem', color: 'var(--red)' }}>
            Restaurar valores
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {settingsCards.map((card) => (
            <div key={card.label} className="panel" style={{ padding: '0.95rem' }}>
              <p style={{ color: 'var(--muted)', fontSize: '.84rem' }}>{card.label}</p>
              <p style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 600 }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="panel" style={{ padding: '1rem' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: 12 }}>Preferencias generales</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text)', marginBottom: 6, fontSize: '.84rem' }}>Moneda por defecto</label>
              <select
                className="form-control"
                value={settings.defaultCurrency}
                onChange={(event) => updateSetting('defaultCurrency', event.target.value === 'PEN' ? 'PEN' : 'USD')}
              >
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text)', marginBottom: 6, fontSize: '.84rem' }}>Método de pago preferido</label>
              <select
                className="form-control"
                value={settings.preferredPaymentMethod}
                onChange={(event) =>
                  updateSetting(
                    'preferredPaymentMethod',
                    event.target.value as AdminSettings['preferredPaymentMethod']
                  )
                }
              >
                <option value="mercadopago">mercadopago</option>
                <option value="tarjeta">tarjeta</option>
                <option value="transferencia">transferencia</option>
                <option value="efectivo">efectivo</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: 'var(--text)', marginBottom: 6, fontSize: '.84rem' }}>Refresco del dashboard</label>
              <select
                className="form-control"
                value={settings.dashboardRefreshMinutes}
                onChange={(event) =>
                  updateSetting(
                    'dashboardRefreshMinutes',
                    Number(event.target.value) as AdminSettings['dashboardRefreshMinutes']
                  )
                }
              >
                <option value={5}>Cada 5 min</option>
                <option value={10}>Cada 10 min</option>
                <option value={15}>Cada 15 min</option>
                <option value={30}>Cada 30 min</option>
              </select>
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: 12 }}>Comportamiento del panel</h2>

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '0.7rem 0.9rem', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span>
                <strong style={{ display: 'block', color: 'var(--text)' }}>Confirmar acciones destructivas</strong>
                <small style={{ color: 'var(--muted)' }}>Solicita confirmación antes de eliminar o cancelar registros.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.confirmDestructiveActions}
                onChange={(event) => updateSetting('confirmDestructiveActions', event.target.checked)}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '0.7rem 0.9rem', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span>
                <strong style={{ display: 'block', color: 'var(--text)' }}>Notificaciones por correo</strong>
                <small style={{ color: 'var(--muted)' }}>Activa el envío de avisos automáticos del panel.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(event) => updateSetting('emailNotifications', event.target.checked)}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '0.7rem 0.9rem', border: '1px solid var(--border)', borderRadius: 14 }}>
              <span>
                <strong style={{ display: 'block', color: 'var(--text)' }}>Tablas compactas</strong>
                <small style={{ color: 'var(--muted)' }}>Reduce el espaciado visual de las tablas administrativas.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.compactTables}
                onChange={(event) => updateSetting('compactTables', event.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: 12 }}>Estado de guardado</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
            Los cambios se guardan automáticamente en este navegador.
          </p>
          <p style={{ color: 'var(--text)', marginTop: 8 }}>
            Último guardado: {savedAt || 'Aún no se guardó ningún cambio'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracion;
