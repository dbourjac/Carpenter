import { ServiceStatus, ServiceType, ServicePriority, User, UserRole } from './types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  supervisor: 'Jefe de Taller',
};

const ADMIN_ROLE_ALIASES = new Set([
  'admin',
  'administrator',
  'administrador',
  'superadmin',
  'root',
]);

const SUPERVISOR_ROLE_ALIASES = new Set([
  'manager',
  'supervisor',
  'jefedetaller',
  'jefe_de_taller',
  'jefe-taller',
  'jefe',
  'encargado',
]);

export const normalizeUserRole = (role: unknown): UserRole => {
  if (typeof role !== 'string') return 'supervisor';

  const normalized = role.trim().toLowerCase().replace(/[\s_-]+/g, '');

  if (ADMIN_ROLE_ALIASES.has(normalized)) return 'admin';
  if (SUPERVISOR_ROLE_ALIASES.has(normalized)) return 'supervisor';

  return normalized.includes('admin') ? 'admin' : 'supervisor';
};

export const getRoleLabel = (role: unknown): string => {
  return ROLE_LABELS[normalizeUserRole(role)];
};

const unwrapUserPayload = (value: any): any => {
  if (!value || typeof value !== 'object') return value;

  return value.usuario ?? value.user ?? value.data ?? value;
};

export const normalizeUser = (user: any): User => {
  const payload = unwrapUserPayload(user);

  return {
    id: String(payload?.id ?? payload?._id ?? payload?.user_id ?? ''),

    name: '',
    phone: '',

    email: String(
      payload?.email ??
      payload?.correo ??
      payload?.nombre_usuario ??
      ''
    ),

    role: normalizeUserRole(
      payload?.role ??
      payload?.rol ??
      payload?.cargo ??
      payload?.cargo_personal ??
      payload?.tipo_usuario ??
      payload?.userRole
    ),

    token: payload?.token ?? payload?.accessToken ?? payload?.access_token,
  };
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const isDateBeforeToday = (dateString: string): boolean => {
  return dateString < getTodayDateString();
};

export const getStatusLabel = (status: ServiceStatus): string => {
  const labels: Record<ServiceStatus, string> = {
    'pending': 'Pendiente',
    'in-progress': 'En Progreso',
    'completed': 'Completado',
  };
  return labels[status];
};

export const getTypeLabel = (type: ServiceType): string => {
  const labels: Record<ServiceType, string> = {
    'preventive': 'Preventivo',
    'corrective': 'Correctivo',
    'installation': 'Instalación',
    'other': 'Otro',
  };
  return labels[type];
};

export const getPriorityLabel = (priority: ServicePriority): string => {
  const labels: Record<ServicePriority, string> = {
    'low': 'Baja',
    'medium': 'Media',
    'high': 'Alta',
  };
  return labels[priority];
};

export const getStatusColor = (status: ServiceStatus): string => {
  const colors: Record<ServiceStatus, string> = {
    'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
  };
  return colors[status];
};

export const getPriorityColor = (priority: ServicePriority): string => {
  const colors: Record<ServicePriority, string> = {
    'low': 'bg-gray-100 text-gray-800 border-gray-200',
    'medium': 'bg-orange-100 text-orange-800 border-orange-200',
    'high': 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[priority];
};

export function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  const diff = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff > 1 && diff <= 7) return `Hace ${diff} días`;

  if (diff < 0) {
    const futureDiff = Math.abs(diff);

    if (futureDiff === 1) return 'Mañana';
    if (futureDiff <= 7) return `En ${futureDiff} días`;
  }

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

export const sortServices = (services: any[]) => {
  return [...services].sort((a, b) => {
    // prioridad alta primero
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;

    // más recientes primero
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });
};

export const filterServices = (
  services: any[],
  {
    searchQuery,
    statusFilter,
    typeFilter,
    priorityFilter
  }: {
    searchQuery: string;
    statusFilter: string;
    typeFilter: string;
    priorityFilter: string;
  }
) => {
  return services.filter(service => {
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      (service.nombre_servicio || '').toLowerCase().includes(q) ||
      (service.nombre_contacto || '').toLowerCase().includes(q) ||
      (service.nombre_area || '').toLowerCase().includes(q) ||
      (service.descripcion || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesType = typeFilter === 'all' || service.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || service.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });
};