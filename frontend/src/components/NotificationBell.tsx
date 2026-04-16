import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell: React.FC = () => {
  const { notifications, clearNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: number) => {
    markAsRead(id);
  };

  return (
    <>
      {/* Bell Icon for Notifications */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notificaciones"
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface2)',
            color: 'var(--text)',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: 'var(--red)',
                color: 'white',
                fontSize: '.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg)',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              marginTop: 8,
              width: 320,
              borderRadius: 12,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface2)',
              zIndex: 200,
              maxHeight: 400,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border)',
                color: 'var(--gold)',
                fontSize: '.9rem',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  style={{
                    fontSize: '.75rem',
                    padding: '0.3rem 0.6rem',
                    backgroundColor: 'rgba(200, 169, 110, 0.2)',
                    border: '1px solid var(--gold)',
                    borderRadius: 4,
                    color: 'var(--gold)',
                    cursor: 'pointer',
                  }}
                >
                  Marcar todo como leído
                </button>
              )}
            </div>
            {notifications.length > 0 ? (
              <div>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '.88rem',
                      backgroundColor: notif.read
                        ? 'transparent'
                        : 'rgba(200, 169, 110, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div>{notif.message}</div>
                      <div
                        style={{
                          fontSize: '.75rem',
                          color: 'var(--muted)',
                          marginTop: 4,
                        }}
                      >
                        {notif.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Marcar como leído"
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: 'var(--red)',
                          border: 'none',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                ))}
                <button
                  onClick={() => clearNotifications()}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: 'none',
                    backgroundColor: 'rgba(224, 82, 82, 0.14)',
                    color: 'var(--red)',
                    fontSize: '.82rem',
                    cursor: 'pointer',
                  }}
                >
                  Limpiar todo
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '.88rem',
                }}
              >
                No hay notificaciones
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
