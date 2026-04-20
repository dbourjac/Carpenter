import { ServiceStatus, ServiceType, ServicePriority } from './types';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
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