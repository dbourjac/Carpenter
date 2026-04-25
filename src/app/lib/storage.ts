import { ServiceRequest, EquipmentItem, User } from './types';

const STORAGE_KEYS = {
  SERVICES: 'workshop_services',
  EQUIPMENT: 'workshop_equipment',
  CURRENT_USER: 'workshop_current_user',
};

// Mock users for authentication
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    email: 'carlos@workshop.com',
    role: 'manager',
    phone: '+1234567890',
  },
  {
    id: '2',
    name: 'Ana García',
    email: 'ana@workshop.com',
    role: 'technician',
    phone: '+1234567891',
  },
];

// Authentication
export const login = (email: string, password: string): User | null => {
  const user = MOCK_USERS.find(u => u.email === email);
  if (user && password === 'password123') {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return stored ? JSON.parse(stored) : null;
};

// Services
const USE_MOCKS = true;

export const getServices = (): ServiceRequest[] => {
  if (USE_MOCKS) {
    return getMockServices();
  }

  const stored = localStorage.getItem(STORAGE_KEYS.SERVICES);
  return stored ? JSON.parse(stored) : [];
};

export const getServiceById = (id: string): ServiceRequest | undefined => {
  return getServices().find(s => s.id === id);
};

export const createService = (service: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): ServiceRequest => {
  const services = getServices();
  const newService: ServiceRequest = {
    ...service,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  services.push(newService);
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  return newService;
};

export const updateService = (id: string, updates: Partial<ServiceRequest>): ServiceRequest | null => {
  const services = getServices();
  const index = services.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  services[index] = {
    ...services[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  return services[index];
};

// Equipment
export const getEquipment = (): EquipmentItem[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
  if (stored) {
    return JSON.parse(stored);
  }
  const mockEquipment = getMockEquipment();
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(mockEquipment));
  return mockEquipment;
};

export const createEquipmentItem = (item: Omit<EquipmentItem, 'id'>): EquipmentItem => {
  const equipment = getEquipment();
  const newItem: EquipmentItem = {
    ...item,
    id: Date.now().toString(),
  };
  equipment.push(newItem);
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  return newItem;
};

export const updateEquipmentItem = (id: string, updates: Partial<EquipmentItem>): EquipmentItem | null => {
  const equipment = getEquipment();
  const index = equipment.findIndex(i => i.id === id);
  if (index === -1) return null;
  
  equipment[index] = { ...equipment[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
  return equipment[index];
};

export const deleteEquipmentItem = (id: string): boolean => {
  const equipment = getEquipment();
  const filtered = equipment.filter(i => i.id !== id);
  if (filtered.length === equipment.length) return false;
  localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(filtered));
  return true;
};

// Mock data generators
function getMockServices(): ServiceRequest[] {
  return [
    {
      id: '1',
      name: 'Reparación Motor Principal - Línea A',
      type: 'corrective',
      status: 'in-progress',
      priority: 'high',
      startDate: '2026-04-14',
      endDate: '2026-04-16',
      estimatedCompletionDate: '2026-04-16',
      requesterName: 'Juan Pérez',
      requesterPhone: '+1234567892',
      requesterEmail: 'juan.perez@company.com',
      requesterArea: 'Línea de Producción A',
      assignedTechnician: 'Ana García',
      equipment: ['Taladro Industrial', 'Llave de Torque'],
      observations: 'Motor presenta sobrecalentamiento. Se detectaron pernos flojos en la base.',
      location: 'Planta Baja - Sección 3',
      evidenceImages: [],
      description: 'Reparación urgente de motor que presenta fallas intermitentes',
      createdAt: '2026-04-14T08:00:00Z',
      updatedAt: '2026-04-15T14:30:00Z',
    },
    {
      id: '2',
      name: 'Mantenimiento Preventivo Mensual',
      type: 'preventive',
      status: 'completed',
      priority: 'medium',
      startDate: '2026-04-10',
      endDate: '2026-04-11',
      estimatedCompletionDate: '2026-04-11',
      requesterName: 'María López',
      requesterPhone: '+1234567893',
      requesterEmail: 'maria.lopez@company.com',
      requesterArea: 'Almacén Central',
      assignedTechnician: 'Ana García',
      equipment: ['Kit de Limpieza', 'Compresor de Aire'],
      observations: 'Mantenimiento realizado sin novedades. Todos los sistemas operativos.',
      location: 'Edificio 2 - Almacén',
      evidenceImages: [],
      description: 'Inspección y mantenimiento preventivo programado',
      createdAt: '2026-04-10T09:00:00Z',
      updatedAt: '2026-04-11T16:00:00Z',
    },
    {
      id: '3',
      name: 'Instalación Sistema de Climatización',
      type: 'installation',
      status: 'pending',
      priority: 'low',
      startDate: '2026-04-17',
      endDate: '2026-04-18',
      requesterName: 'Roberto Sánchez',
      requesterPhone: '+1234567894',
      requesterEmail: 'roberto.sanchez@company.com',
      requesterArea: 'Oficinas Administrativas',
      equipment: [],
      observations: '',
      location: 'Edificio 2 - Piso 3',
      evidenceImages: [],
      description: 'Instalación de nuevo sistema de aire acondicionado',
      createdAt: '2026-04-15T10:00:00Z',
      updatedAt: '2026-04-15T10:00:00Z',
    },
    {
      id: '4',
      name: 'Revisión Sistema Eléctrico',
      type: 'corrective',
      status: 'pending',
      priority: 'high',
      startDate: '2026-04-16',
      endDate: '2026-04-16',
      estimatedCompletionDate: '2026-04-16',
      requesterName: 'Laura Martínez',
      requesterPhone: '+1234567895',
      requesterEmail: 'laura.martinez@company.com',
      requesterArea: 'Línea de Producción B',
      equipment: [],
      observations: 'Reportadas fluctuaciones de voltaje. Urgente.',
      location: 'Planta Baja - Sección 5',
      evidenceImages: [],
      description: 'Revisión urgente por fallas eléctricas intermitentes',
      createdAt: '2026-04-15T15:00:00Z',
      updatedAt: '2026-04-15T15:00:00Z',
    },
    {
      id: '5',
      name: 'Fuga de Aire en Compresor Central',
      type: 'corrective',
      status: 'in-progress',
      priority: 'high',
      startDate: '2026-04-20',
      endDate: '2026-04-21',
      estimatedCompletionDate: '2026-04-21',
      requesterName: 'Carlos Méndez',
      requesterPhone: '+1234567896',
      requesterEmail: 'carlos.mendez@company.com',
      requesterArea: 'Compresores',
      assignedTechnician: 'Luis Torres',
      equipment: ['Detector de Fugas', 'Llave Inglesa'],
      observations: 'Fuga detectada en válvula principal. Requiere reemplazo.',
      location: 'Área Técnica - Zona Norte',
      evidenceImages: ['img1.jpg'],
      description: 'Pérdida de presión en sistema neumático',
      createdAt: '2026-04-20T07:30:00Z',
      updatedAt: '2026-04-20T10:00:00Z',
    },
    {
      id: '6',
      name: 'Cambio de Iluminación LED',
      type: 'installation',
      status: 'completed',
      priority: 'low',
      startDate: '2026-04-05',
      endDate: '2026-04-06',
      estimatedCompletionDate: '2026-04-06',
      requesterName: 'Sofía Ramírez',
      requesterPhone: '+1234567897',
      requesterEmail: 'sofia.ramirez@company.com',
      requesterArea: 'Oficinas',
      assignedTechnician: 'Pedro Díaz',
      equipment: ['Escalera', 'Kit Eléctrico'],
      observations: 'Instalación completada correctamente.',
      location: 'Edificio Administrativo',
      evidenceImages: ['img2.jpg', 'img3.jpg'],
      description: 'Sustitución de luminarias fluorescentes por LED',
      createdAt: '2026-04-04T11:00:00Z',
      updatedAt: '2026-04-06T17:00:00Z',
    },
    {
      id: '7',
      name: 'Lubricación de Banda Transportadora',
      type: 'preventive',
      status: 'in-progress',
      priority: 'medium',
      startDate: '2026-04-21',
      endDate: '2026-04-21',
      estimatedCompletionDate: '2026-04-21',
      requesterName: 'Miguel Ángel',
      requesterPhone: '+1234567898',
      requesterEmail: 'miguel.angel@company.com',
      requesterArea: 'Producción',
      assignedTechnician: 'Ana García',
      equipment: ['Aceite Industrial'],
      observations: 'Proceso en curso, banda con desgaste moderado.',
      location: 'Línea A',
      evidenceImages: [],
      description: 'Mantenimiento preventivo programado',
      createdAt: '2026-04-21T08:00:00Z',
      updatedAt: '2026-04-21T09:00:00Z',
    },
    {
      id: '8',
      name: 'Diagnóstico de Vibración en Máquina CNC',
      type: 'corrective',
      status: 'pending',
      priority: 'high',
      startDate: '2026-04-22',
      endDate: '2026-04-23',
      estimatedCompletionDate: '2026-04-23',
      requesterName: 'Fernando Ruiz',
      requesterPhone: '+1234567899',
      requesterEmail: 'fernando.ruiz@company.com',
      requesterArea: 'CNC',
      assignedTechnician: '',
      equipment: [],
      observations: 'Se detectó vibración anormal durante operación.',
      location: 'Área CNC',
      evidenceImages: [],
      description: 'Revisión de estabilidad y calibración',
      createdAt: '2026-04-21T15:00:00Z',
      updatedAt: '2026-04-21T15:00:00Z',
    },
    {
      id: '9',
      name: 'Inspección General de Seguridad',
      type: 'other',
      status: 'completed',
      priority: 'medium',
      startDate: '2026-04-01',
      endDate: '2026-04-01',
      estimatedCompletionDate: '2026-04-01',
      requesterName: 'Seguridad Industrial',
      requesterPhone: '+1234567800',
      requesterEmail: 'seguridad@company.com',
      requesterArea: 'General',
      assignedTechnician: 'Equipo Seguridad',
      equipment: ['Checklist Seguridad'],
      observations: 'Sin hallazgos críticos.',
      location: 'Toda la planta',
      evidenceImages: [],
      description: 'Revisión general de condiciones de seguridad',
      createdAt: '2026-04-01T08:00:00Z',
      updatedAt: '2026-04-01T12:00:00Z',
    },
  ];
}

function getMockEquipment(): EquipmentItem[] {
  return [
    { 
      id: '1', 
      name: 'Taladro Industrial Makita', 
      type: 'equipment', 
      available: true,
      description: 'Taladro de impacto 18V con batería'
    },
    { 
      id: '2', 
      name: 'Sierra Circular Dewalt', 
      type: 'equipment', 
      available: true,
      description: 'Sierra circular 7.25" con guía láser'
    },
    { 
      id: '3', 
      name: 'Compresor de Aire', 
      type: 'equipment', 
      available: false,
      description: 'Compresor portátil 50L - En mantenimiento'
    },
    { 
      id: '4', 
      name: 'Soldadora MIG', 
      type: 'equipment', 
      available: true,
      description: 'Soldadora MIG/MAG 200A'
    },
    { 
      id: '5', 
      name: 'Set de Llaves Allen', 
      type: 'tool', 
      available: true,
      description: 'Juego de llaves hexagonales métricas'
    },
    { 
      id: '6', 
      name: 'Llave de Torque Digital', 
      type: 'tool', 
      available: true,
      description: 'Llave dinamométrica 5-200 Nm'
    },
    { 
      id: '7', 
      name: 'Multímetro Digital', 
      type: 'tool', 
      available: true,
      description: 'Multímetro profesional Fluke'
    },
    { 
      id: '8', 
      name: 'Kit de Destornilladores', 
      type: 'tool', 
      available: true,
      description: 'Set de 24 piezas con estuche'
    },
    { 
      id: '9', 
      name: 'Escalera Telescópica', 
      type: 'equipment', 
      available: true,
      description: 'Escalera extensible 3.6m'
    },
    { 
      id: '10', 
      name: 'Amoladora Angular', 
      type: 'equipment', 
      available: false,
      description: 'Amoladora 9" - Asignada a otro servicio'
    },
    {
      id: '11',
      name: 'Máquina CNC Haas',
      type: 'machinery',
      available: true,
      description: 'Centro de mecanizado CNC de alta precisión'
    },
    {
      id: '12',
      name: 'Máquina de Inyección Plástica',
      type: 'machinery',
      available: false,
      description: 'Máquina industrial para moldeado por inyección'
    },
    {
      id: '13',
      name: 'Máquina Cortadora Láser',
      type: 'machinery',
      available: true,
      description: 'Corte de precisión con láser industrial'
    }
  ];
}

const TECHNICIANS_KEY = 'technicians';

export const getTechnicians = (): Technician[] => {
  const stored = localStorage.getItem(TECHNICIANS_KEY);
  if (stored) return JSON.parse(stored);

  const mock = getMockTechnicians();
  localStorage.setItem(TECHNICIANS_KEY, JSON.stringify(mock));
  return mock;
};

export const createTechnician = (tech: Omit<Technician, 'id' | 'createdAt' | 'updatedAt'>): Technician => {
  const technicians = getTechnicians();

  const newTech: Technician = {
    ...tech,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  technicians.push(newTech);
  localStorage.setItem(TECHNICIANS_KEY, JSON.stringify(technicians));
  return newTech;
};

export function getMockTechnicians(): Technician[] {
  return [
    {
      id: '1',
      nombre: 'Ana García',
      cargo: 'Técnico',
      especialidad: 'Mecánico',
      telefono: '+521234567890',
      servicios_activos: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      nombre: 'Luis Torres',
      cargo: 'Técnico',
      especialidad: 'Eléctrico',
      telefono: '+521234567891',
      servicios_activos: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}