import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { Habitacion } from '../../types/index';
import axiosInstance from '../../api/axios';

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
  const [formData, setFormData] = useState({
    numero: 0,
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
    if (habitacion) {
      setEditingId(habitacion.id);
      setFormData({
        numero: habitacion.numero,
        tipo: habitacion.tipo,
        capacidad: habitacion.capacidad,
        precio_noche: habitacion.precio_noche,
        estado: habitacion.estado,
        descripcion: habitacion.descripcion || '',
        amenidades: getAmenidadesText(habitacion.amenidades),
      });
    } else {
      setEditingId(null);
      setFormData({
        numero: 0,
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
  };

  const handleSave = async () => {
    try {
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
        amenidades,
      };

      if (editingId) {
        await axiosInstance.put(`/api/habitaciones/${editingId}`, data);
      } else {
        await axiosInstance.post('/api/habitaciones', data);
      }

      fetchHabitaciones();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving room:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta habitación?')) {
      try {
        await axiosInstance.delete(`/api/habitaciones/${id}`);
        fetchHabitaciones();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="app-container">
          <p style={{ color: 'var(--text)' }}>Cargando habitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-container">
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

              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Número</label>
                  <input
                    type="number"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: parseInt(e.target.value) || 0 })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Tipo</label>
                  <select
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
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Precio/Noche</label>
                  <input
                    type="number"
                    value={formData.precio_noche}
                    onChange={(e) => setFormData({ ...formData, precio_noche: parseFloat(e.target.value) || 0 })}
                    className="form-control"
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.84rem' }}>Estado</label>
                  <select
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
    </div>
  );
};

export default GestionHabitaciones;
