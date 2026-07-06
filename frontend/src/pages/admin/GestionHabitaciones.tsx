import React, { useEffect, useState } from 'react';
import { Habitacion } from '../../types/index';
import axiosInstance from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

const getAmenidadesText = (amenidades: Habitacion['amenidades']) => {
  if (!amenidades) return '';
  if (Array.isArray(amenidades)) return amenidades.join(', ');
  return Object.keys(amenidades).filter((key) => (amenidades as Record<string, unknown>)[key]).join(', ');
};

const getStatusClass = (status: string) => `status-chip status-${status}`;

const getRoomTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'estandar':
      return 'Estandar';
    case 'matrimonial':
      return 'Matrimonial';
    case 'familiar':
      return 'Familiar';
    case 'suite':
      return 'Suite';
    default:
      return tipo;
  }
};

const GestionHabitaciones: React.FC = () => {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    numero: '',
    tipo: 'estandar',
    capacidad: 2,
    precio_noche: 0,
    estado: 'libre',
    descripcion: '',
    amenidades: '',
  });

  useEffect(() => {
    fetchHabitaciones();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showModal) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal]);

  const fetchHabitaciones = async () => {
    try {
      const response = await axiosInstance.get('/api/habitaciones');
      setHabitaciones(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (habitacion?: Habitacion) => {
    setErrorMsg('');
    if (habitacion) {
      setEditingId(habitacion.id);
      setFormData({
        numero: habitacion.numero,
        tipo: habitacion.tipo,
        capacidad: habitacion.capacidad,
        precio_noche: Number(habitacion.precio_noche) || 0,
        estado: habitacion.estado,
        descripcion: habitacion.descripcion || '',
        amenidades: getAmenidadesText(habitacion.amenidades),
      });
    } else {
      setEditingId(null);
      setFormData({
        numero: '',
        tipo: 'estandar',
        capacidad: 2,
        precio_noche: 0,
        estado: 'libre',
        descripcion: '',
        amenidades: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setErrorMsg('');
  };

  const handleSave = async () => {
    try {
      setErrorMsg('');

      if (!formData.numero.trim()) {
        setErrorMsg('El número de habitación es obligatorio');
        return;
      }

      const amenitiesArray = formData.amenidades
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a);

      const amenidades = amenitiesArray.reduce<Record<string, boolean>>((acc, item) => {
        acc[item] = true;
        return acc;
      }, {});

      const data = {
        ...formData,
        numero: formData.numero.trim(),
        precio_noche: Number(formData.precio_noche) || 0,
        capacidad: Number(formData.capacidad) || 1,
        amenidades,
      };

      if (editingId) {
        await axiosInstance.put(`/api/habitaciones/${editingId}`, data);
      } else {
        await axiosInstance.post('/api/habitaciones', data);
      }

      fetchHabitaciones();
      handleCloseModal();
    } catch (error: unknown) {
      console.error('Error saving room:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response: { data?: { detail?: string } } };
        setErrorMsg(err.response?.data?.detail || 'Error al guardar la habitación');
      } else {
        setErrorMsg('Error de conexión al guardar la habitación');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta habitación?')) return;

    try {
      await axiosInstance.delete(`/api/habitaciones/${id}`);
      fetchHabitaciones();
    } catch (error: unknown) {
      console.error('Error deleting room:', error);
      let msg = 'Error al eliminar la habitación';
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response: { data?: { detail?: string } } };
        msg = err.response?.data?.detail || msg;
      }
      alert(msg);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ color: 'var(--text)' }}>Cargando habitaciones...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-stack">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>
            Gestión de Habitaciones
          </h1>
          <button onClick={() => handleOpenModal()} className="btn-primary" style={{ padding: '0.55rem 0.9rem' }}>
            + Agregar
          </button>
        </div>

        <div className="panel table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Capacidad</th>
                <th>Precio/Noche</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {habitaciones.map((hab) => (
                <tr key={hab.id}>
                  <td style={{ color: 'var(--text)' }}>{hab.numero}</td>
                  <td>
                    <span className={getStatusClass(hab.tipo)}>{getRoomTypeLabel(hab.tipo)}</span>
                  </td>
                  <td style={{ color: 'var(--text)' }}>{hab.capacidad}</td>
                  <td style={{ color: 'var(--gold)' }}>S/. {hab.precio_noche}</td>
                  <td>
                    <span className={getStatusClass(hab.estado)}>{hab.estado}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleOpenModal(hab)}
                        className="btn-ghost"
                        style={{ padding: '0.35rem 0.52rem', color: 'var(--gold)' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(hab.id)}
                        className="btn-ghost"
                        style={{ padding: '0.35rem 0.52rem', color: 'var(--red)' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.62)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              overflowY: 'auto',
              zIndex: 1000,
              padding: 14,
            }}
          >
            <div className="panel" style={{ width: '100%', maxWidth: 480, maxHeight: 'calc(100vh - 28px)', overflowY: 'auto', padding: '1rem' }}>
              <h2 style={{ color: 'var(--gold)', marginBottom: 10 }}>
                {editingId ? 'Editar Habitación' : 'Nueva Habitación'}
              </h2>

              {errorMsg && (
                <div style={{ color: 'var(--red)', background: 'rgba(255,0,0,0.1)', padding: '8px 12px', borderRadius: 6, fontSize: '.85rem', marginBottom: 8 }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Número</label>
                  <input
                    name="numero"
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Tipo</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="form-control"
                  >
                    <option value="estandar">Estandar</option>
                    <option value="familiar">Familiar</option>
                    <option value="matrimonial">Matrimonial</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Capacidad</label>
                  <input
                    name="capacidad"
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Precio/Noche</label>
                  <input
                    name="precio_noche"
                    type="number"
                    value={formData.precio_noche}
                    onChange={(e) => setFormData({ ...formData, precio_noche: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Estado</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="form-control"
                  >
                    <option value="libre">Libre</option>
                    <option value="ocupado">Ocupado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>
                    Amenidades (separadas por coma)
                  </label>
                  <input
                    name="amenidades"
                    type="text"
                    value={formData.amenidades}
                    onChange={(e) => setFormData({ ...formData, amenidades: e.target.value })}
                    className="form-control"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
                  <button onClick={handleSave} className="btn-primary" style={{ padding: '0.58rem 0.65rem' }}>
                    Guardar
                  </button>
                  <button onClick={handleCloseModal} className="btn-ghost" style={{ padding: '0.58rem 0.65rem' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GestionHabitaciones;
