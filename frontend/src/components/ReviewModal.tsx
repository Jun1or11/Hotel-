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
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        zIndex: 300,
        width: 'min(380px, calc(100vw - 1rem))',
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          padding: '0.95rem',
          borderRadius: 14,
          boxShadow: '0 18px 38px rgba(0, 0, 0, 0.22)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ color: 'var(--gold)', marginBottom: 3, fontSize: '1.15rem' }}>Tu reseña</h3>
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
          <p style={{ color: 'var(--muted)', margin: '0.8rem 0' }}>Cargando tu reseña...</p>
        ) : (
          <form onSubmit={submitReview}>
            <div style={{ display: 'flex', gap: 6, margin: '0.7rem 0 0.9rem', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    border: rating >= star ? '1px solid var(--gold)' : '1px solid var(--border)',
                    background: rating >= star ? 'rgba(200, 169, 110, 0.2)' : 'var(--surface2)',
                    color: rating >= star ? 'var(--gold)' : 'var(--muted)',
                    fontSize: '1.1rem',
                  }}
                  aria-label={`Seleccionar ${star} estrellas`}
                >
                  ★
                </button>
              ))}
            </div>

            <label style={{ color: 'var(--text)', display: 'block', marginBottom: 6, fontSize: '.86rem' }}>
              Comentario (opcional)
            </label>
            <textarea
              className="form-control"
              rows={3}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ padding: '0.45rem 0.8rem' }}
              >
                Cerrar
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.8rem' }} disabled={loading}>
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