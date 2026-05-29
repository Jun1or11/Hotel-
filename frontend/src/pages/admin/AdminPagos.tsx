import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminPagos: React.FC = () => {
  return (
    <AdminLayout>
      <div className="panel" style={{ padding: '1.2rem' }}>
        <h2 style={{ color: 'var(--gold)', marginBottom: 8 }}>Pagos</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
          Este módulo estará disponible próximamente para revisar pagos y conciliaciones.
        </p>
      </div>
    </AdminLayout>
  );
};

export default AdminPagos;