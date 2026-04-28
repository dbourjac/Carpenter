import axios from 'axios';
import { EquipmentItem, ServiceRequest, ServiceStatus, ServiceType } from './types';

// Modo de conexión:
// - Si VITE_API_URL está vacío o igual a "proxy" => usamos rutas relativas (''),
//   de modo que las llamadas a "/api/..." pasen por el proxy de Vite en desarrollo.
// - Si VITE_API_URL está definida con una URL (p. ej. http://localhost:3000) =>
//   usamos esa URL como base y las peticiones irán directamente al backend.
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined);
const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeServiceType = (value: unknown): ServiceType => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('prevent')) return 'preventive';
  if (raw.includes('instal')) return 'installation';
  if (raw.includes('corr')) return 'corrective';
  return 'other';
};

const normalizeServiceStatus = (value: unknown): ServiceStatus => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('complet') || raw.includes('cerrad')) return 'completed';
  if (raw.includes('progreso') || raw.includes('proceso') || raw.includes('progress')) return 'in-progress';
  return 'pending';
};

const normalizeService = (row: any): ServiceRequest => {
  const source = row?.servicio ?? row?.service ?? row;
  const startDate = source?.startDate ?? source?.fecha_inicio ?? source?.fechaInicio ?? new Date().toISOString();
  const endDate = source?.endDate ?? source?.fecha_fin ?? source?.fechaFin ?? startDate;

  return {
    id: String(source?.id ?? source?.servicio_id ?? source?.id_servicio ?? ''),
    name: String(source?.name ?? source?.nombre ?? source?.titulo ?? source?.descripcion_corta ?? 'Servicio'),
    type: normalizeServiceType(source?.type ?? source?.tipo),
    status: normalizeServiceStatus(source?.status ?? source?.estado),
    priority: (source?.priority ?? source?.prioridad ?? 'medium') as ServiceRequest['priority'],
    startDate: String(startDate),
    endDate: String(endDate),
    estimatedCompletionDate: source?.estimatedCompletionDate ?? source?.fecha_estimada,
    requesterName: String(source?.requesterName ?? source?.solicitante_nombre ?? source?.nombre_solicitante ?? 'Sin nombre'),
    requesterPhone: String(source?.requesterPhone ?? source?.solicitante_telefono ?? source?.telefono_solicitante ?? ''),
    requesterEmail: String(source?.requesterEmail ?? source?.solicitante_email ?? source?.email_solicitante ?? ''),
    requesterArea: String(source?.requesterArea ?? source?.area_solicitante ?? source?.area ?? ''),
    assignedTechnician: source?.assignedTechnician ?? source?.tecnico_asignado ?? source?.personal_nombre,
    equipment: source?.equipment ?? source?.equipos ?? source?.utensilios ?? [],
    observations: String(source?.observations ?? source?.observaciones ?? ''),
    location: source?.location ?? source?.ubicacion,
    evidenceImages: source?.evidenceImages ?? source?.evidencias ?? source?.imagenes ?? [],
    description: source?.description ?? source?.descripcion,
    createdAt: String(source?.createdAt ?? source?.created_at ?? source?.fecha_creacion ?? new Date().toISOString()),
    updatedAt: String(source?.updatedAt ?? source?.updated_at ?? source?.fecha_actualizacion ?? new Date().toISOString()),
  };
};

const normalizeEquipmentType = (value: unknown): EquipmentItem['type'] => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('maquin')) return 'machinery';
  if (raw.includes('tool') || raw.includes('utens')) return 'tool';
  return 'equipment';
};

const normalizeEquipment = (row: any): EquipmentItem => {
  const source = row?.utensilio ?? row?.item ?? row;
  return {
    id: String(source?.id ?? source?.utensilio_id ?? source?.id_utensilio ?? ''),
    name: String(source?.name ?? source?.nombre ?? source?.descripcion ?? 'Sin nombre'),
    type: normalizeEquipmentType(source?.type ?? source?.tipo),
    available: Boolean(source?.available ?? source?.disponible ?? source?.estado !== 'en_uso'),
    description: source?.description ?? source?.descripcion,
    nextMaintenanceDate: source?.nextMaintenanceDate ?? source?.proximo_mantenimiento ?? source?.fecha_mantenimiento,
    lastMaintenanceDate: source?.lastMaintenanceDate ?? source?.ultimo_mantenimiento,
    maintenanceCompleted: source?.maintenanceCompleted ?? source?.mantenimiento_completado,
    maintenanceNotes: source?.maintenanceNotes ?? source?.notas_mantenimiento,
  };
};

const toBackendUtensilioType = (type?: EquipmentItem['type']) => {
  if (type === 'machinery') return 'maquinaria';
  if (type === 'tool') return 'utensilio';
  return 'equipo';
};

const toBackendDisponibilidad = (available?: boolean) => {
  if (available === undefined) return undefined;
  return available ? 1 : 0;
};

const withNulls = <T extends Record<string, any>>(payload: T): T => {
  const entries = Object.entries(payload).map(([key, value]) => [
    key,
    value === undefined ? null : value,
  ]);
  return Object.fromEntries(entries) as T;
};

// Interceptor para añadir el token a las peticiones si existe
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('workshop_current_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Asumiendo que el backend devuelve un token y lo guardamos en el objeto user
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error('Error parsing user from storage', e);
    }
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', {
      nombre_usuario: email,
      password
    });
    return response.data;
  },

  listUsers: async () => {
    const response = await api.get('/api/auth/usuarios');
    return response.data;
  },

  createUser: async (user: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
  }) => {
    const response = await api.post('/api/auth/usuarios', {
      nombre: user.name,
      name: user.name,
      nombre_usuario: user.email,
      email: user.email,
      password: user.password,
      telefono: user.phone,
      phone: user.phone,
      rol: user.role,
      role: user.role,
      cargo_personal: 'Jefe de Taller',
    });
    return response.data;
  },

  updateUserPassword: async (id: string, password: string) => {
    const response = await api.patch(`/api/auth/usuarios/${id}/password`, {
      password,
    });
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/api/auth/usuarios/${id}`);
    return response.data;
  },

  logout: async () => {
    await api.post('/api/auth/logout');
  },

  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

export const reportesApi = {
  getHistorial: async () => {
    const response = await api.get('/api/reportes/historial');
    const rows = Array.isArray(response.data)
      ? response.data
      : response.data?.servicios ?? response.data?.data ?? [];
    return rows.map(normalizeService);
  },
};

export const utensiliosApi = {
  getAll: async () => {
    const response = await api.get('/api/utensilios');
    const rows = Array.isArray(response.data)
      ? response.data
      : response.data?.utensilios ?? response.data?.data ?? [];
    return rows.map(normalizeEquipment);
  },

  create: async (item: Omit<EquipmentItem, 'id'>) => {
    const backendType = toBackendUtensilioType(item.type);
    const disponibilidad = toBackendDisponibilidad(item.available);

    const response = await api.post('/api/utensilios', withNulls({
      nombre: item.name,
      descripcion: item.description,
      tipo: backendType,
      disponible: disponibilidad,
      estado: item.available ? 'disponible' : 'en_uso',
      categoria: backendType,
      proximo_mantenimiento: item.nextMaintenanceDate,
      mantenimiento_completado: item.maintenanceCompleted,
      notas_mantenimiento: item.maintenanceNotes,
      // compatibilidad por si backend acepta claves en ingles
      name: item.name,
      type: item.type,
      available: item.available,
    }));
    return normalizeEquipment(response.data);
  },

  update: async (id: string, updates: Partial<EquipmentItem>) => {
    const backendType = toBackendUtensilioType(updates.type);
    const disponibilidad = toBackendDisponibilidad(updates.available);

    const response = await api.put(`/api/utensilios/${id}`, withNulls({
      nombre: updates.name,
      descripcion: updates.description,
      tipo: backendType,
      disponible: disponibilidad,
      estado: updates.available === undefined ? undefined : (updates.available ? 'disponible' : 'en_uso'),
      categoria: updates.type === undefined ? undefined : backendType,
      proximo_mantenimiento: updates.nextMaintenanceDate,
      ultimo_mantenimiento: updates.lastMaintenanceDate,
      mantenimiento_completado: updates.maintenanceCompleted,
      notas_mantenimiento: updates.maintenanceNotes,
      name: updates.name,
      type: updates.type,
      available: updates.available,
    }));
    return normalizeEquipment(response.data);
  },

  remove: async (id: string) => {
    await api.delete(`/api/utensilios/${id}`);
  },

  scheduleMaintenance: async (id: string, payload: { nextMaintenanceDate: string; maintenanceNotes?: string }) => {
    await api.post(`/api/utensilios/${id}/mantenimiento`, withNulls({
      fecha_mantenimiento: payload.nextMaintenanceDate,
      notas_mantenimiento: payload.maintenanceNotes,
      nextMaintenanceDate: payload.nextMaintenanceDate,
      maintenanceNotes: payload.maintenanceNotes,
    }));
  },
};

export default api;
