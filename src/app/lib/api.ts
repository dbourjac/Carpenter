import axios from 'axios';
import { EquipmentItem, ServiceRequest, ServiceStatus, ServiceType } from './types';

// Modo de conexión:
// - Si VITE_API_URL está vacío o igual a "proxy" => usamos rutas relativas (''),
//   de modo que las llamadas a "/api/..." pasen por el proxy de Vite en desarrollo.
// - Si VITE_API_URL está definida con una URL (p. ej. http://localhost:3000) =>
//   usamos esa URL como base y las peticiones irán directamente al backend.
const API_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeServiceType = (value: unknown): ServiceType => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('prevent') || raw.includes('mantenimiento')) return 'preventive';
  if (raw.includes('instal')) return 'installation';
  if (raw.includes('repar') || raw.includes('corr')) return 'corrective';
  return 'other';
};

const normalizeServiceStatus = (value: unknown): ServiceStatus => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('complet') || raw.includes('cerrad') || raw.includes('final')) return 'completed';
  if (raw.includes('progreso') || raw.includes('proceso') || raw.includes('progress')) return 'in-progress';
  return 'pending';
};

const normalizeService = (row: any): ServiceRequest => {
  const source = row?.servicio ?? row?.service ?? row;
  const startDate = source?.startDate ?? source?.fecha_inicio ?? source?.fechaInicio ?? new Date().toISOString();
  const endDate = source?.endDate ?? source?.fecha_fin ?? source?.fechaFin ?? startDate;

  return {
    id: String(source?.id ?? source?.servicio_id ?? source?.id_servicio ?? ''),
    name: String(source?.name ?? source?.nombre ?? source?.titulo ?? source?.descripcion_corta ?? source?.tipo_hs_servicio ?? 'Servicio'),
    type: normalizeServiceType(source?.type ?? source?.tipo ?? source?.tipo_hs_servicio),
    status: normalizeServiceStatus(source?.status ?? source?.estado ?? source?.status_final),
    priority: (source?.priority ?? source?.prioridad ?? 'medium') as ServiceRequest['priority'],
    startDate: String(startDate),
    endDate: String(endDate),
    estimatedCompletionDate: source?.estimatedCompletionDate ?? source?.fecha_estimada,
    requesterName: String(source?.requesterName ?? source?.solicitante_nombre ?? source?.nombre_solicitante ?? 'Sin nombre'),
    requesterPhone: String(source?.requesterPhone ?? source?.solicitante_telefono ?? source?.telefono_solicitante ?? ''),
    requesterEmail: String(source?.requesterEmail ?? source?.solicitante_email ?? source?.email_solicitante ?? ''),
    requesterArea: String(source?.requesterArea ?? source?.area_solicitante ?? source?.area ?? ''),
    assignedTechnician: source?.assignedTechnician ?? source?.tecnico_asignado ?? source?.personal_nombre ?? source?.tecnico,
    equipment: source?.equipment ?? source?.equipos ?? source?.utensilios ?? [],
    observations: String(source?.observations ?? source?.observaciones ?? source?.notas ?? ''),
    location: source?.location ?? source?.ubicacion,
    evidenceImages: source?.evidenceImages ?? source?.evidencias ?? source?.imagenes ?? [],
    description: source?.description ?? source?.descripcion ?? source?.notas,
    createdAt: String(source?.createdAt ?? source?.created_at ?? source?.fecha_creacion ?? source?.registrado_at ?? new Date().toISOString()),
    updatedAt: String(source?.updatedAt ?? source?.updated_at ?? source?.fecha_actualizacion ?? source?.registrado_at ?? new Date().toISOString()),
    materials: source?.materials ?? source?.materiales ?? [],
    tools: source?.tools ?? source?.herramientas ?? source?.equipos ?? source?.utensilios ?? [],
  };
};

const normalizeEquipmentType = (value: unknown): EquipmentItem['type'] => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('maquin')) return 'machinery';
  if (raw.includes('herram') || raw.includes('tool') || raw.includes('utens')) return 'tool';
  return 'equipment';
};

const normalizeEquipment = (row: any): EquipmentItem => {
  const source = row?.utensilio ?? row?.item ?? row;
  return {
    id: String(source?.id ?? source?.utensilio_id ?? source?.id_utensilio ?? ''),
    name: String(source?.name ?? source?.tipo_utensilio ?? source?.nombre ?? source?.descripcion ?? 'Sin nombre'),
    type: normalizeEquipmentType(source?.type ?? source?.tipo ?? source?.clasificacion),
    available: String(source?.status_utensilio ?? source?.estado ?? '').toLowerCase() !== 'en uso',
    description: source?.description ?? source?.descripcion,
    nextMaintenanceDate: source?.nextMaintenanceDate ?? source?.Rangos_mantenimiento ?? source?.rangos_mantenimiento ?? source?.proximo_mantenimiento ?? source?.fecha_mantenimiento,
    lastMaintenanceDate: source?.lastMaintenanceDate ?? source?.ultimo_mantenimiento,
    maintenanceCompleted: String(source?.status_mantenimiento ?? '').toLowerCase() === 'al día' || source?.maintenanceCompleted === true,
    maintenanceNotes: source?.maintenanceNotes ?? source?.notas_mantenimiento,
  };
};

const toBackendUtensilioType = (type?: EquipmentItem['type']) => {
  if (type === 'machinery') return 'Maquinaria';
  if (type === 'tool') return 'Herramienta';
  return 'Equipo';
};

const toBackendStatusUtensilio = (available?: boolean, maintenanceCompleted?: boolean) => {
  if (maintenanceCompleted) return 'Disponible';
  if (available === false) return 'En uso';
  return 'Disponible';
};

const toBackendStatusMantenimiento = (
  nextMaintenanceDate?: string,
  maintenanceCompleted?: boolean
) => {
  if (maintenanceCompleted) return 'Al día';
  if (nextMaintenanceDate) return 'Próximo';
  return 'Al día';
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
    const response = await api.get('/api/reportes'); // Cambiado a /api/reportes para ser más general
    const rows = Array.isArray(response.data)
      ? response.data
      : response.data?.historial ?? response.data?.servicios ?? response.data?.data ?? [];
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
    const statusUtensilio = toBackendStatusUtensilio(item.available, item.maintenanceCompleted);
    const statusMantenimiento = toBackendStatusMantenimiento(item.nextMaintenanceDate, item.maintenanceCompleted);

    const response = await api.post('/api/utensilios', withNulls({
      clasificacion: backendType,
      tipo_utensilio: item.name,
      nombre: item.name,
      descripcion: item.description,
      tipo: backendType,
      disponible: disponibilidad,
      status_utensilio: statusUtensilio,
      estado: statusUtensilio,
      categoria: backendType,
      Rangos_mantenimiento: item.nextMaintenanceDate,
      rangos_mantenimiento: item.nextMaintenanceDate,
      proximo_mantenimiento: item.nextMaintenanceDate,
      status_mantenimiento: statusMantenimiento,
      mantenimiento_completado: item.maintenanceCompleted,
      notas_mantenimiento: item.maintenanceNotes,
      name: item.name,
      type: item.type,
      available: item.available,
    }));
    return normalizeEquipment(response.data);
  },

  update: async (id: string, updates: Partial<EquipmentItem>) => {
    const backendType = toBackendUtensilioType(updates.type);
    const disponibilidad = toBackendDisponibilidad(updates.available);
    const statusUtensilio = toBackendStatusUtensilio(updates.available, updates.maintenanceCompleted);
    const statusMantenimiento = toBackendStatusMantenimiento(updates.nextMaintenanceDate, updates.maintenanceCompleted);

    const response = await api.put(`/api/utensilios/${id}`, withNulls({
      clasificacion: backendType,
      tipo_utensilio: updates.name,
      nombre: updates.name,
      descripcion: updates.description,
      tipo: backendType,
      disponible: disponibilidad,
      status_utensilio: statusUtensilio,
      estado: updates.available === undefined ? undefined : statusUtensilio,
      categoria: updates.type === undefined ? undefined : backendType,
      Rangos_mantenimiento: updates.nextMaintenanceDate,
      rangos_mantenimiento: updates.nextMaintenanceDate,
      proximo_mantenimiento: updates.nextMaintenanceDate,
      ultimo_mantenimiento: updates.lastMaintenanceDate,
      status_mantenimiento: statusMantenimiento,
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
      Rangos_mantenimiento: payload.nextMaintenanceDate,
      rangos_mantenimiento: payload.nextMaintenanceDate,
      fecha_mantenimiento: payload.nextMaintenanceDate,
      notas_mantenimiento: payload.maintenanceNotes,
      nextMaintenanceDate: payload.nextMaintenanceDate,
      maintenanceNotes: payload.maintenanceNotes,
      status_mantenimiento: 'Próximo',
      status_utensilio: 'Mantenimiento',
    }));
  },
};

export default api;
