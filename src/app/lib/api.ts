import axios from 'axios';
import {EquipmentItem, ServicePriority, ServiceRequest, ServiceStatus, ServiceType} from './types';

// CONFIGURACIÓN DE AXIOS

// @ts-ignore
const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined);
const API_URL = rawApiUrl || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Añade el token Bearer automáticamente si existe en localStorage
api.interceptors.request.use((config) => {
    const userStr = localStorage.getItem('workshop_current_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            console.error('Error parsing user from storage', e);
        }
    }
    return config;
});

// HELPERS GENERALES

/**
 * Filtra claves con valor `undefined` (no se envían al backend) y
 * convierte cadenas vacías a `null`. Evita sobrescribir campos en BD
 * cuando no se quiere modificarlos en un update parcial.
 */
const withNulls = <T extends Record<string, any>>(payload: T): Partial<T> => {
    return Object.fromEntries(
        Object.entries(payload)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, value === '' ? null : value])
    ) as Partial<T>;
};

// NORMALIZACIÓN — LECTURA (Backend → Frontend)

const normalizeServiceType = (value: unknown): ServiceType => {
    const raw = String(value ?? '').toLowerCase().trim();
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

const normalizeServicePriority = (value: unknown): ServicePriority => {
    const raw = String(value ?? '').toLowerCase();
    if (raw === 'alta' || raw === 'high') return 'high';
    if (raw === 'baja' || raw === 'low') return 'low';
    return 'medium';
};

const normalizeService = (row: any): ServiceRequest => {
    const source = row?.servicio ?? row?.service ?? row;
    // Validación segura del id para evitar "[object Object]"
    const rawId = source?.id ?? source?.servicio_id ?? source?.id_servicio;
    const safeId = rawId !== null && rawId !== undefined && typeof rawId !== 'object'
        ? String(rawId)
        : '';

    const startDate = source?.startDate ?? source?.fecha_inicio ?? source?.fechaInicio ?? new Date().toISOString();
    const endDate = source?.endDate ?? source?.fecha_fin ?? source?.fechaFin ?? startDate;

    // El campo `ubicacion` empaqueta "UbicacionReal | Descripcion"
    const packed = String(source?.ubicacion ?? '');
    const parts = packed.split(' | ').map(s => s.trim());
    const extractedLoc = parts[0] || '';
    const extractedDesc = parts.length > 1 ? parts[1] : '';

    return {
        id: safeId,
        name: source?.nombre_servicio ?? source?.nombre ?? source?.name ?? 'SIN NOMBRE',
        type: normalizeServiceType(source?.tipo_servicio ?? source?.tipo_seg_servicio ?? source?.type ?? source?.tipo),
        status: normalizeServiceStatus(source?.status ?? source?.status_servicio ?? source?.estado),
        priority: normalizeServicePriority(source?.prioridad ?? source?.priority),
        startDate: String(startDate),
        endDate: String(endDate),
        estimatedCompletionDate: source?.fecha_fin_estimada ?? source?.estimatedCompletionDate ?? source?.fecha_estimada,
        requesterName: source?.nombre_contacto ?? source?.nombre_solicitante ?? 'Sin nombre',
        requesterPhone: source?.telefono ?? source?.telefono_solicitante ?? '',
        requesterEmail: source?.email ?? source?.email_solicitante ?? '',
        requesterArea: source?.nombre_area ?? source?.area_solicitante ?? '',
        assignedTechnician: String(
            source?.personal_id ?? source?.tecnico_id ?? source?.id_personal ??
            source?.assignedTechnician ?? source?.tecnico_asignado ?? ''),
        equipment: source?.equipment ?? source?.equipos ?? source?.utensilios ?? [],
        observations: String(source?.observaciones ?? source?.seguimiento ?? source?.observations ?? ''),
        location: extractedLoc || source?.location || '',
        description: extractedDesc || source?.description || source?.descripcion || '',
        evidenceImages: source?.evidenceImages ?? source?.evidencias ?? source?.imagenes ?? [],
        createdAt: String(source?.createdAt ?? source?.created_at ?? source?.fecha_creacion ?? new Date().toISOString()),
        updatedAt: String(source?.updatedAt ?? source?.updated_at ?? source?.fecha_actualizacion ?? new Date().toISOString()),
        solicitanteId: String(source?.solicitante_id ?? source?.id_solicitante ?? ''), // ← agrega
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

const normalizeTechnician = (row: any) => {
    const source = row?.tecnico ?? row?.personal ?? row;
    return {
        id: String(source?.id ?? source?.id_personal ?? source?.personal_id ?? ''),
        name: String(source?.nombre ?? source?.name ?? source?.nombre_completo ?? 'Sin nombre'),
    };
};

const normalizeSolicitante = (row: any) => {
    const source = row?.solicitante ?? row?.item ?? row;
    return {
        id: String(source?.id ?? source?.solicitante_id ?? source?.id_solicitante ?? ''),
        name: String(source?.name ?? source?.nombre ?? source?.solicitante_nombre ?? source?.nombre_solicitante ?? 'Sin nombre'),
        email: String(source?.email ?? source?.email_solicitante ?? source?.solicitante_email ?? ''),
        phone: String(source?.phone ?? source?.telefono_solicitante ?? source?.solicitante_telefono ?? ''),
        area: String(source?.area ?? source?.area_solicitante ?? source?.solicitante_area ?? ''),
    };
};

// SERIALIZACIÓN — ESCRITURA (Frontend → Backend)

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

/** Empaqueta ubicación y descripción en un solo campo de BD */
const packUbicacion = (location?: string, description?: string): string =>
    `${location || ''} | ${description || ''}`;

const toDate = (val?: string | null): string | null => {
    if (!val) return null;
    return val.split('T')[0]; // '2026-04-29T07:00:00.000Z' → '2026-04-29'
};

const toBackendService = (datos: any) => {
    const payload: Record<string, any> = {
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
    };

    // Convierte cualquier undefined que haya quedado a null
    const clean = Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, v === undefined ? null : v])
    );

    return clean;
};

const toBackendSolicitante = (datos: any) => {
    return withNulls({
        nombre_contacto: datos.name ?? datos.requesterName ?? null,
        nombre_area: datos.area ?? datos.requesterArea ?? null,
        telefono: datos.phone ?? datos.requesterPhone ?? null,
        email: datos.email ?? datos.requesterEmail ?? null,
        direccion: datos.direccion ?? 'Sin especificar',
        notas: datos.notes ?? null,
    });
};

const toBackendUtensilioType = (type?: EquipmentItem['type']): string => {
    if (type === 'machinery') return 'maquinaria';
    if (type === 'tool') return 'utensilio';
    return 'equipo';
};

const toBackendDisponibilidad = (available?: boolean): number | undefined => {
    if (available === undefined) return undefined;
    return available ? 1 : 0;
};

// API — AUTENTICACIÓN

export const authApi = {
    login: async (email: string, password: string) => {
        const response = await api.post('/api/auth/login', {
            nombre_usuario: email,
            password,
        });
        if (response.data?.token) {
            localStorage.setItem('workshop_current_user', JSON.stringify(response.data));
        }
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
            nombre_usuario: user.email,
            password: user.password,
            rol: user.role,
            cargo_personal: 'Personal de Taller',
        });
        return response.data;
    },

    updateUserPassword: async (id: string, password: string) => {
        const response = await api.patch(`/api/auth/usuarios/${id}/password`, {password});
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

// API — REPORTES


export const reportesApi = {
    getHistorial: async () => {
        const response = await api.get('/api/reportes/historial');
        const rows = Array.isArray(response.data)
            ? response.data
            : response.data?.servicios ?? response.data?.data ?? [];
        return rows.map(normalizeService);
    },
};


// API — UTENSILIOS / EQUIPAMIENTO


export const utensiliosApi = {
    getAll: async () => {
        const response = await api.get('/api/utensilios');
        const rows = Array.isArray(response.data)
            ? response.data
            : response.data?.utensilios ?? response.data?.data ?? [];
        return rows.map(normalizeEquipment);
    },

    create: async (item: Omit<EquipmentItem, 'id'>) => {
        const response = await api.post('/api/utensilios', withNulls({
            nombre: item.name,
            descripcion: item.description,
            tipo: toBackendUtensilioType(item.type),
            disponible: toBackendDisponibilidad(item.available),
            proximo_mantenimiento: item.nextMaintenanceDate,
            mantenimiento_completado: item.maintenanceCompleted,
            notas_mantenimiento: item.maintenanceNotes,
        }));
        return normalizeEquipment(response.data);
    },

    update: async (id: string, updates: Partial<EquipmentItem>) => {
        const response = await api.put(`/api/utensilios/${id}`, withNulls({
            nombre: updates.name,
            descripcion: updates.description,
            tipo: toBackendUtensilioType(updates.type),
            disponible: toBackendDisponibilidad(updates.available), // undefined → filtrado, no sobrescribe en BD
            proximo_mantenimiento: updates.nextMaintenanceDate,
            ultimo_mantenimiento: updates.lastMaintenanceDate,
            mantenimiento_completado: updates.maintenanceCompleted,
            notas_mantenimiento: updates.maintenanceNotes,
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
        }));
    },
};


// API — SOLICITANTES


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


// API — SERVICIOS DE TALLER


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

    // --- Actualizaciones parciales (PATCH) ---

    completar: async (id: string, fecha_fin: string) => {
        const response = await api.patch(`/api/servicios/${id}/completar`, {fecha_fin});
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

    // --- Utensilios dentro de un servicio ---

    addUtensilio: async (id: string, datos: { nombre: string }) => {
        const response = await api.post(`/api/servicios/${id}/utensilios`, datos);
        return normalizeService(response.data);
    },

    removeUtensilio: async (id: string, utensilio_id: string | number) => {
        const response = await api.delete(`/api/servicios/${id}/utensilios/${utensilio_id}`);
        return normalizeService(response.data);
    },

    // --- Evidencias ---

    addEvidencia: async (id: string, datos: { imagen: string; tipo?: 'inicio' | 'fin' }) => {
        try {
            const response = await api.post(`/api/servicios/${id}/evidencias`, {
                image: datos.imagen,
                tipo: datos.tipo ?? 'inicio',
            });
            return normalizeService(response.data);
        } catch (error: any) {
            console.error('[addEvidencia] Error detalle:', error.response?.data);
            throw error;
        }
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


// API — SEGUIMIENTO DE SERVICIOS


export const seguimientoApi = {
    getByServiceId: async (serviceId: string) => {
        const response = await api.get(`/api/seguimiento/servicio/${serviceId}`);
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

    update: async (id: string, observaciones: string) => {
        try {
            const response = await api.patch(`/api/seguimiento/${id}/observaciones`, {
                observaciones: observaciones ?? null,
            });
            return response.data;
        } catch (error: any) {
            console.error('Error detalle:', error.response?.data);
            throw error;
        }
    },

    remove: async (id: string) => {
        const response = await api.delete(`/api/seguimiento/${id}`);
        return response.data;
    },
};


// API — PERSONAL / TÉCNICOS


export const technicianApi = {
    getAll: async () => {
        const response = await api.get('/api/personal');
        const rows = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        return rows.map(normalizeTechnician);
    },

    getAvailable: async () => {
        const response = await api.get('/api/personal/disponibles');
        const rows = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
        return rows.map(normalizeTechnician);
    },
};

export default api;