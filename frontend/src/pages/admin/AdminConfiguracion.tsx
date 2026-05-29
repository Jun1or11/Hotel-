import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminConfiguracion: React.FC = () => {
  return (
    <AdminLayout>
      <div className="panel" style={{ padding: '1.2rem' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: 8 }}>Configuración</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
          Aquí podrás centralizar ajustes del panel administrativo sin afectar la experiencia del usuario.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminConfiguracion;