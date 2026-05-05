import axios from 'axios';
import { EquipmentItem, ServiceRequest, ServiceStatus, ServiceType } from './types';

const rawApiUrl =
  (import.meta as any).env?.VITE_API_URL as string | undefined;
const API_URL = rawApiUrl || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const normalizeServiceType = (value: unknown): ServiceType => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('prevent')) return 'preventive';
  if (raw.includes('instal')) return 'installation';
  if (raw.includes('corr') || raw.includes('repar')) return 'corrective';
  return 'other';
};

const normalizeServiceStatus = (value: unknown): ServiceStatus => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('complet') || raw.includes('cerrad')) return 'completed';
  if (raw.includes('progreso') || raw.includes('proceso') || raw.includes('progress')) return 'in-progress';
  return 'pending';
};

const normalizeServicePriority = (value: unknown): 'low' | 'medium' | 'high' => {
  const raw = String(value ?? '').toLowerCase();
  if (raw === 'alta' || raw === 'high') return 'high';
  if (raw === 'baja' || raw === 'low') return 'low';
  return 'medium';
};

const normalizeService = (row: any): any => {
  const source =
    row?.servicio ??
    row?.service ??
    row?.data ??
    row?.item ??
    row;

  const rawId = source?.id ?? source?.servicio_id ?? source?.id_servicio;
  const safeId =
    rawId !== null && rawId !== undefined && typeof rawId !== 'object'
      ? String(rawId)
      : '';

  const startDate =
    source?.startDate ??
    source?.fecha_inicio ??
    source?.fechaInicio ??
    new Date().toISOString();

  const endDate =
    source?.endDate ??
    source?.fecha_fin ??
    source?.fechaFin ??
    startDate;

  const packed = String(source?.ubicacion ?? '');
  const parts = packed.split(' | ').map((s: string) => s.trim());
  const extractedLoc = parts[0] || '';
  const extractedDesc = parts.length > 1 ? parts[1] : '';

  return {
    id: safeId,
    tipo_hs_servicio: source?.tipo_hs_servicio,
    status_final: source?.status_final,
    fecha_inicio: source?.fecha_inicio,
    fecha_fin: source?.fecha_fin,
    nombre_personal: source?.nombre_personal,
    nombre_area:
      source?.nombre_area ??
      source?.area ??
      '',
    descripcion:
      source?.descripcion ??
      source?.detalle ??
      source?.observaciones ??
      source?.seguimiento ??
      '',
    name: source?.nombre_servicio ?? source?.nombre ?? source?.name ?? 'SIN NOMBRE',
    nombre_servicio: source?.nombre_servicio ?? source?.nombre ?? source?.name ?? 'SIN NOMBRE',
    type: normalizeServiceType(
      source?.tipo_servicio ?? source?.tipo_seg_servicio ?? source?.type ?? source?.tipo
    ),
    status: normalizeServiceStatus(
      source?.status ?? source?.status_servicio ?? source?.estado
    ),
    priority: normalizeServicePriority(
      source?.prioridad ?? source?.priority
    ),
    startDate: String(startDate),
    endDate: String(endDate),
    estimatedCompletionDate:
      source?.fecha_fin_estimada ??
      source?.estimatedCompletionDate ??
      source?.fecha_estimada,
    requesterName:
      source?.nombre_contacto ??
      source?.nombre_solicitante ??
      source?.solicitante_nombre ??
      source?.solicitante?.nombre ??
      source?.nombre_contacto_solicitante ??
      source?.contacto ??
      source?.nombre ??
      '',
    requesterPhone:
      source?.telefono ??
      source?.tel_solicitante ??
      source?.telefono_solicitante ??
      source?.solicitante?.telefono ??
      source?.phone ??
      '',
    requesterEmail:
      source?.email ??
      source?.correo ??
      source?.email_solicitante ??
      source?.solicitante?.email ??
      '',
    requesterArea:
      source?.nombre_area ??
      source?.area ??
      source?.departamento ??
      source?.solicitante?.area ??
      '',
    assignedTechnician:
      source?.personal_id ??
      source?.tecnico_id ??
      source?.id_personal ??
      source?.assignedTechnician ??
      source?.tecnico_asignado ??
      '',
   equipment: Array.isArray(
      source?.equipos ?? source?.utensilios ?? source?.utensilio
    )
      ? (source?.equipos ?? source?.utensilios ?? source?.utensilio)
      : [],
    observations: String(
      source?.observaciones ??
      source?.descripcion ??
      source?.detalle ??
      ''
    ),
    location: extractedLoc || source?.location || '',
    description: extractedDesc || source?.description || source?.descripcion || '',
    evidenceImages: source?.imagenes ?? [],
    createdAt: String(source?.created_at ?? new Date().toISOString()),
    updatedAt: String(source?.updated_at ?? new Date().toISOString()),
    solicitanteId: String(source?.solicitante_id ?? ''),
  };
};

const normalizeEquipmentType = (value: unknown): EquipmentItem['type'] => {
  const raw = String(value ?? '').toLowerCase();
  if (raw.includes('maquin')) return 'machinery';
  if (raw.includes('tool') || raw.includes('utens')) return 'tool';
  return 'equipment';
};

const normalizeEquipment = (row: any): EquipmentItem => {
  const rawName = String(row.tipo_utensilio ?? '');
  const rawType = String(row.clasificacion ?? '').toLowerCase();

  return {
    id: String(row.id),

    name: rawName || 'Sin nombre',
    description: '',

    type: (() => {
      if (rawType.includes('maquin')) return 'machinery';
      if (rawType.includes('herramienta') || rawType.includes('utens')) return 'tool';
      return 'equipment';
    })(),

    available: row.status_utensilio !== 'En uso',

    solicitante_id: row.solicitante_id ? String(row.solicitante_id) : null,
    operador_id: row.operador_id ? String(row.operador_id) : null,

    nextMaintenanceDate: row.ultimo_mantenimiento,
    lastMaintenanceDate: row.ultimo_mantenimiento,

    maintenanceDescription: row.descripcion ?? '',
    maintenanceTechnician: row.personal_id ? String(row.personal_id) : '',
    maintenanceInterval: row.Rangos_mantenimiento ?? '',

    maintenanceCompleted: false,
    status_mantenimiento: row.status_mantenimiento,
    maintenanceNotes: '',
  };
};

const toBackendUtensilioType = (type?: EquipmentItem['type']) => {
  if (type === 'machinery') return 'Maquinaria';
  if (type === 'tool') return 'Herramienta';
  return 'Equipo';
};

const toBackendDisponibilidad = (available?: boolean) => {
  if (available === undefined) return undefined;
  return available ? 1 : 0;
};

const withNulls = <T extends Record<string, any>>(payload: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === '' ? null : value])
  ) as Partial<T>;
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
      nombre_usuario: user.email,
      email: user.email,
      password: user.password,
      rol: user.role,
      role: user.role,
      cargo_personal: 'Jefe de Taller',
    });
    return response.data;
  },

  updateUserPassword: async (id: string, password: string) => {
    const response = await api.patch(`/api/auth/usuarios/${id}/password`, {
      nueva_password: password,
    });
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
  getHistorial: async (params?: any) => {
    const response = await api.get('/api/reportes/historial', { params });
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map(normalizeService);
  },

  getResumenTipo: async () => {
    const response = await api.get('/api/reportes/resumen-tipo');
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/api/reportes/dashboard');
    return response.data;
  },

  getActivos: async () => {
    const response = await api.get('/api/reportes/activos');
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map(normalizeService);
  },

  getRankingPersonal: async () => {
    const res = await api.get('/api/reportes/ranking-personal');
    return res.data;
  },

  getMantenimientos: async () => {
    const res = await api.get('/api/reportes/mantenimientos');
    return res.data;
  },

  getHistorialMantenimiento: async (params?: any) => {
    const res = await api.get('/api/reportes/historial-mantenimiento', { params });
    return res.data;
  }
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

    const payload = {
      clasificacion: backendType,
      tipo: backendType,        // 👈 CLAVE 1
      categoria: backendType,   // 👈 CLAVE 2

      tipo_utensilio: item.name ?? '',
      nombre: item.name ?? '',

      status_utensilio: item.available ? 'Disponible' : 'En uso',

      solicitante_id: null,
      operador_id: null,
      Rangos_mantenimiento: item.nextMaintenanceDate || null,
      ultimo_mantenimiento: item.lastMaintenanceDate || null,
    };

    console.log("🚨 PAYLOAD REAL:", payload);

    const response = await api.post('/api/utensilios', payload);

    return normalizeEquipment(response.data);
  },

  update: async (id: string, updates: Partial<EquipmentItem>) => {
    const response = await api.put(`/api/utensilios/${id}`, {
      nombre: updates.name,
      descripcion: updates.description ?? null,

      clasificacion: toBackendUtensilioType(updates.type),
      tipo_utensilio: updates.name ?? '',

      status_mantenimiento: 'Al día',

      status_utensilio:
        updates.available === undefined
          ? 'Disponible'
          : updates.available ? 'Disponible' : 'En uso',

      solicitante_id: (updates as any).solicitante_id ?? null,
      operador_id: (updates as any).operador_id ?? null,
      Rangos_mantenimiento: (updates as any).maintenanceInterval || null,
      ultimo_mantenimiento: updates.lastMaintenanceDate || null,
    });

    return normalizeEquipment(response.data);
  },

  remove: async (id: string) => {
    await api.delete(`/api/utensilios/${id}`);
  },

  scheduleMaintenance: async (
    id: string,
    payload: {
      nextMaintenanceDate: string;
      maintenanceNotes?: string;
      personal_id?: string;
      rango?: string;
    }
  ) => {
    await api.post(`/api/utensilios/${id}/mantenimiento`, {
      fecha_mantenimiento: payload.nextMaintenanceDate,
      tipo: 'Preventivo',
      descripcion: payload.maintenanceNotes || 'Sin notas',
      proxima_fecha: payload.nextMaintenanceDate,
      personal_id: payload.personal_id || null,
      Rangos_mantenimiento: payload.rango || null
    });
  },
  };

export default api;

// PERSONAL
export async function getPersonal() {
  const res = await api.get('/api/personal');

  const data = res.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.personal)) return data.personal;

  return [];
}

// SEGUIMIENTO
export const seguimientoApi = {
  getByServiceId: async (serviceId: string) => {
    const response = await api.get(`/api/seguimiento/por-servicio/${serviceId}`);
    return response.data;
  },

  add: async (serviceId: string, datos: any) => {
    const response = await api.post('/api/seguimiento', withNulls({
      servicio_id: serviceId,
      nombre_servicio: datos.name || 'S/N',
      solicitante_id: datos.solicitanteId || null,
      personal_id: datos.assignedTechnician || null,
      ubicacion: packUbicacion(datos.location, datos.description),
      tipo_seg_servicio: toBackendServiceType(datos.type),
      fecha_inicio: datos.startDate || null,
      fecha_fin_estimada: datos.estimatedCompletionDate || null,
      observaciones: datos.observations || null,
      fecha_seguimiento: new Date().toISOString(),
    }));
    return response.data;
  },

  updateObservaciones: async (id: string, data: { observaciones: string }) => {
    const response = await api.patch(`/api/seguimiento/${id}/observaciones`, data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/api/seguimiento/${id}`, data);
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/api/seguimiento/${id}`);
    return response.data;
  },
};

export async function getSeguimientoByServiceId(id: string | number) {
  const res = await api.get(`/api/seguimiento/servicio/${id}`);
  return res.data;
}

export async function createPersonal(data: {
  nombre: string;
  cargo: string;
  especialidad: string;
  telefono: string;
}) {
  const res = await api.post('/api/personal', data);
  return res.data;
}

const normalizeSolicitante = (row: any) => {
  const source = row?.solicitante ?? row?.item ?? row;
  return {
    id: String(source?.id ?? source?.solicitante_id ?? source?.id_solicitante ?? ''),
    name: String(source?.name ?? source?.nombre ?? source?.nombre_solicitante ?? 'Sin nombre'),
    email: String(source?.email ?? ''),
    phone: String(source?.telefono ?? ''),
    area: String(source?.nombre_area ?? ''),
  };
};

const toBackendSolicitante = (datos: any) => {
  return withNulls({
    nombre_contacto: datos.name ?? null,
    nombre_area: datos.area ?? null,
    telefono: datos.phone ?? null,
    email: datos.email ?? null,
    direccion: datos.area ?? 'Sin especificar',
  });
};

export const solicitanteApi = {
  getAll: async () => {
    const response = await api.get('/api/solicitantes');
    const rows = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
    return rows.map(normalizeSolicitante);
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/solicitantes/${id}`);
    return normalizeSolicitante(response.data);
  },

  create: async (datos: any) => {
    const response = await api.post('/api/solicitantes', toBackendSolicitante(datos));
    return normalizeSolicitante(response.data);
  },

  update: async (id: string, datos: any) => {
    const response = await api.put(`/api/solicitantes/${id}`, toBackendSolicitante(datos));
    return normalizeSolicitante(response.data);
  },

  remove: async (id: string) => {
    await api.delete(`/api/solicitantes/${id}`);
  },
};

const toBackendServiceType = (type?: string): string => {
  if (type === 'preventive') return 'Mantenimiento preventivo';
  if (type === 'installation') return 'Instalación';
  if (type === 'corrective') return 'Reparación';
  return 'Otros';
};

const toBackendServiceStatus = (status?: string): string => {
  if (status === 'completed') return 'Completado';
  if (status === 'in-progress') return 'En progreso';
  return 'Pendiente';
};

const toBackendServicePriority = (priority?: string): string => {
  if (priority === 'high') return 'alta';
  if (priority === 'low') return 'baja';
  return 'media';
};

const packUbicacion = (location?: string, description?: string): string =>
  `${location || ''} | ${description || ''}`;

const toDate = (val?: string | null): string | null => {
  if (!val) return null;
  return val.split('T')[0];
};

const toBackendService = (datos: any) => {
  return {
    nombre_servicio: datos.name || 'S/N',
    tipo_servicio: toBackendServiceType(datos.type),
    prioridad: toBackendServicePriority(datos.priority),
    status: toBackendServiceStatus(datos.status),
    ubicacion: packUbicacion(datos.location, datos.description),
    fecha_inicio: toDate(datos.startDate),
    fecha_fin: toDate(datos.endDate),
    solicitante_id: datos.solicitanteId ?? null,
    personal_id: datos.assignedTechnician ?? null,
    observaciones: datos.observations ?? null,
    fecha_fin_estimada: datos.estimatedCompletionDate || null,
  };
};

export const serviceApi = {
  getAll: async () => {
    const response = await api.get('/api/servicios');
    const rows = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
    return rows.map(normalizeService);
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/servicios/${id}`);
    return normalizeService(response.data);
  },

  create: async (datos: any) => {
    const response = await api.post('/api/servicios', toBackendService(datos));
    return normalizeService(response.data);
  },

  update: async (id: string, datos: any) => {
    try {
      const response = await api.put(`/api/servicios/${id}`, toBackendService(datos));
      return normalizeService(response.data);
    } catch (error: any) {
      console.error('[serviceApi.update] Error detalle:', error.response?.data);
      throw error;
    }
  },

  remove: async (id: string) => {
    await api.delete(`/api/servicios/${id}`);
  },

  completar: async (id: string, fecha_fin: string) => {
    const response = await api.patch(`/api/servicios/${id}/completar`, {
      fecha_fin
    });
    return normalizeService(response.data);
  },

  cambiarStatus: async (id: string, status: ServiceStatus) => {
    const response = await api.patch(`/api/servicios/${id}/status`, {
      status: toBackendServiceStatus(status),
    });
    return normalizeService(response.data);
  },

  cambiarPrioridad: async (id: string, prioridad: ServiceRequest['priority']) => {
    const response = await api.patch(`/api/servicios/${id}/prioridad`, {
      prioridad: toBackendServicePriority(prioridad),
    });
    return normalizeService(response.data);
  },

  addUtensilio: async (
    id: string,
    datos: { utensilio_id: number; personal_id?: string; solicitante_id?: string }
  ) => {
    const response = await api.post(`/api/servicios/${id}/utensilios`, {
      utensilio_id: datos.utensilio_id,
      personal_id: datos.personal_id || null,
      solicitante_id: datos.solicitante_id || null
    });
    return normalizeService(response.data);
  },

  removeUtensilio: async (id: string, utensilio_id: string | number) => {
    const response = await api.delete(`/api/servicios/${id}/utensilios/${utensilio_id}`);
    return normalizeService(response.data);
  },

  addEvidencia: async (id: string, datos: { imagen: string; tipo?: 'inicio' | 'fin' }) => {
    const response = await api.post(`/api/servicios/${id}/evidencias`, {
      image: datos.imagen,
      tipo: datos.tipo ?? 'inicio',
    });
    return normalizeService(response.data);
  },

  getEvidencias: async (id: string) => {
    const response = await api.get(`/api/servicios/${id}/evidencias`);
    return Array.isArray(response.data) ? response.data : response.data?.evidencias ?? [];
  },

  deleteEvidencia: async (id: string, evidencia_id: string | number) => {
    const response = await api.delete(`/api/servicios/${id}/evidencias/${evidencia_id}`);
    return normalizeService(response.data);
  },
};

export const updatePersonal = async (id: number, data: any) => {
  const response = await api.put(`/api/personal/${id}`, data);
  return response.data;
};