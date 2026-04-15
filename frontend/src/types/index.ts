export type UserRole = 'admin' | 'huesped';
export type RoomType = 'estandar' | 'familiar' | 'matrimonial' | 'suite';
export type RoomStatus = 'libre' | 'ocupado' | 'mantenimiento';
export type ReservationStatus = 'pendiente' | 'activo' | 'completado' | 'cancelado';
export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago';

export interface Usuario {
  id: string;
  dni?: string;
  nombre: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  fecha_registro: string;
}

export interface Habitacion {
  id: string;
  numero: number;
  tipo: RoomType;
  capacidad: number;
  precio_noche: number;
  estado: RoomStatus;
  descripcion?: string;
  amenidades?: string[];
}

export interface Reserva {
  id: string;
  usuario_id: string;
  habitacion_id: string;
  usuario?: Usuario;
  habitacion?: Habitacion;
  fecha_checkin: string;
  fecha_checkout: string;
  num_huespedes: number;
  total: number | string;
  estado: ReservationStatus;
  solicitudes_especiales?: string;
  fecha_creacion: string;
}

export interface Pago {
  id: string;
  reserva_id: string;
  monto: number | string;
  moneda: string;
  metodo: PaymentMethod;
  estado: PaymentStatus;
  referencia_externa?: string;
  fecha_pago: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  dni: string;
  nombre: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Usuario;
}
