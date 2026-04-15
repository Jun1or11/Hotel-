import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { Resena } from '../types';

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ open, onClose, userName }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchCurrentReview = async () => {
      setLoadingCurrent(true);
      setError('');
      setMessage('');

      try {
        const response = await axiosInstance.get<Resena>('/api/resenas/mi-resena');
        setRating(response.data.puntuacion || 5);
        setComment(response.data.comentario || '');
      } catch (err: any) {
        if (err.response?.status === 404) {
          setRating(5);
          setComment('');
        } else {
          setError('No se pudo cargar tu reseña actual');
        }
      } finally {
        setLoadingCurrent(false);
      }
    };

    fetchCurrentReview();
  }, [open]);

  if (!open) {
    return null;
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await axiosInstance.post('/api/resenas', {
        puntuacion: rating,
        comentario: comment.trim() || null,
      });
      setMessage('Gracias por tu reseña. La guardamos correctamente.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'No se pudo guardar la reseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 300,
        padding: '1rem',
      }}
    >
      <div
        className="panel"
        style={{
          width: 'min(560px, 100%)',
          padding: '1.2rem',
          borderRadius: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div>
            <h3 style={{ color: 'var(--gold)', marginBottom: 4 }}>Tu reseña</h3>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
              {userName}, califica tu experiencia del 1 al 5 y deja un comentario de mejora.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--muted)',
              borderColor: 'var(--border)',
              borderRadius: 10,
              width: 34,
              height: 34,
            }}
          >
            X
          </button>
        </div>

        {loadingCurrent ? (
          <p style={{ color: 'var(--muted)', margin: '1rem 0' }}>Cargando tu reseña...</p>
        ) : (
          <form onSubmit={submitReview}>
            <div style={{ display: 'flex', gap: 6, margin: '0.8rem 0 1rem', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: rating >= star ? '1px solid var(--gold)' : '1px solid var(--border)',
                    background: rating >= star ? 'rgba(200, 169, 110, 0.2)' : 'var(--surface2)',
                    color: rating >= star ? 'var(--gold)' : 'var(--muted)',
                    fontSize: '1.2rem',
                  }}
                  aria-label={`Seleccionar ${star} estrellas`}
                >
                  ★
                </button>
              ))}
            </div>

            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.9rem' }}>
              Comentario (opcional)
            </label>
            <textarea
              className="form-control"
              rows={4}
              maxLength={500}
              placeholder="Ejemplo: Me gustaria mejorar el tiempo de respuesta en recepcion."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error && (
              <div
                style={{
                  marginTop: 10,
                  padding: '0.6rem 0.7rem',
                  borderRadius: 10,
                  border: '1px solid rgba(224, 82, 82, 0.35)',
                  backgroundColor: 'rgba(224, 82, 82, 0.1)',
                  color: 'var(--red)',
                  fontSize: '.88rem',
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  marginTop: 10,
                  padding: '0.6rem 0.7rem',
                  borderRadius: 10,
                  border: '1px solid rgba(76, 175, 125, 0.35)',
                  backgroundColor: 'rgba(76, 175, 125, 0.1)',
                  color: 'var(--green)',
                  fontSize: '.88rem',
                }}
              >
                {message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ padding: '0.5rem 0.85rem' }}
              >
                Cerrar
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '0.5rem 0.85rem' }} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar reseña'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;