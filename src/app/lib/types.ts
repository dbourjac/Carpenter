export type ServiceType = 'preventive' | 'corrective' | 'installation' | 'other';
export type ServiceStatus = 'pending' | 'in-progress' | 'completed';
export type ServicePriority = 'low' | 'medium' | 'high';
export type UserRole = 'admin' | 'supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  token?: string; // Token de autenticación del backend
}

export interface ServiceRequest {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  priority: ServicePriority;
  startDate: string;
  endDate: string;
  estimatedCompletionDate?: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  requesterArea: string;
  assignedTechnician?: string;
  equipment: string[];
  observations: string;
  location?: string;
  evidenceImages: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'equipment' | 'tool' | 'machinery';
  available: boolean;
  description?: string;
  nextMaintenanceDate?: string;
  lastMaintenanceDate?: string;
  maintenanceCompleted?: boolean;
  maintenanceNotes?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  status: 'available' | 'busy' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
