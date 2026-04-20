import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { createService } from '../lib/storage';
import { ServiceType, ServicePriority } from '../lib/types';
import { toast } from 'sonner';

export function ServiceCreatePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'corrective' as ServiceType,
    priority: 'medium' as ServicePriority,
    startDate: '',
    endDate: '',
    estimatedCompletionDate: '',
    requesterName: '',
    requesterPhone: '',
    requesterEmail: '',
    requesterArea: '',
    assignedTechnician: '',
    location: '',
    description: '',
    observations: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre del servicio es requerido';
    if (!formData.requesterName.trim()) newErrors.requesterName = 'El nombre del solicitante es requerido';
    if (!formData.requesterPhone.trim()) newErrors.requesterPhone = 'El teléfono es requerido';
    if (!formData.requesterEmail.trim()) {
      newErrors.requesterEmail = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.requesterEmail)) {
      newErrors.requesterEmail = 'Email inválido';
    }
    if (!formData.requesterArea.trim()) newErrors.requesterArea = 'El área es requerida';
    if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es requerida';
    if (!formData.assignedTechnician.trim()) {
      newErrors.assignedTechnician = 'El técnico asignado es requerido';
    }
    if (!formData.endDate) newErrors.endDate = 'La fecha de fin es requerida';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    const newService = createService({
      name: formData.name,
      type: formData.type,
      priority: formData.priority,
      status: 'pending',
      startDate: formData.startDate,
      endDate: formData.endDate,
      estimatedCompletionDate: formData.estimatedCompletionDate || undefined,
      requesterName: formData.requesterName,
      requesterPhone: formData.requesterPhone,
      requesterEmail: formData.requesterEmail,
      requesterArea: formData.requesterArea,
      assignedTechnician: formData.assignedTechnician || undefined,
      location: formData.location || undefined,
      description: formData.description || undefined,
      observations: formData.observations,
      equipment: [],
      evidenceImages: [],
    });

    toast.success('Servicio creado exitosamente');
    navigate(`/services/${newService.id}`);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/services')}
          className="hover:bg-blue-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nueva Solicitud de Servicio
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Registra una nueva solicitud de mantenimiento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
            <CardTitle>Información del Servicio</CardTitle>
            <CardDescription>Datos generales de la solicitud</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Servicio *</Label>
              <Input
                id="name"
                placeholder="ej. Reparación Motor Principal - Línea A"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`h-11 ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Servicio *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => updateField('type', value)}
                >
                  <SelectTrigger id="type" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventivo</SelectItem>
                    <SelectItem value="corrective">Correctivo</SelectItem>
                    <SelectItem value="installation">Instalación</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => updateField('priority', value)}
                >
                  <SelectTrigger id="priority" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="ej. Planta Baja - Sección 3"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className={`h-11 ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Fin *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className={`h-11 ${errors.endDate ? 'border-red-500' : ''}`}
                />
                {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCompletionDate">Fecha Estimada Finalización</Label>
                <Input
                  id="estimatedCompletionDate"
                  type="date"
                  value={formData.estimatedCompletionDate}
                  onChange={(e) => updateField('estimatedCompletionDate', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción del Servicio</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente el servicio requerido..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Requester Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 border-b">
            <CardTitle>Información del Solicitante</CardTitle>
            <CardDescription>Datos de contacto de quien solicita el servicio</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requesterName">Nombre Completo *</Label>
                <Input
                  id="requesterName"
                  placeholder="Juan Pérez"
                  value={formData.requesterName}
                  onChange={(e) => updateField('requesterName', e.target.value)}
                  className={`h-11 ${errors.requesterName ? 'border-red-500' : ''}`}
                />
                {errors.requesterName && <p className="text-sm text-red-600">{errors.requesterName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requesterArea">Área / Departamento *</Label>
                <Input
                  id="requesterArea"
                  placeholder="Producción - Línea A"
                  value={formData.requesterArea}
                  onChange={(e) => updateField('requesterArea', e.target.value)}
                  className={`h-11 ${errors.requesterArea ? 'border-red-500' : ''}`}
                />
                {errors.requesterArea && <p className="text-sm text-red-600">{errors.requesterArea}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requesterPhone">Teléfono *</Label>
                <Input
                  id="requesterPhone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.requesterPhone}
                  onChange={(e) => updateField('requesterPhone', e.target.value)}
                  className={`h-11 ${errors.requesterPhone ? 'border-red-500' : ''}`}
                />
                {errors.requesterPhone && <p className="text-sm text-red-600">{errors.requesterPhone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requesterEmail">Email *</Label>
                <Input
                  id="requesterEmail"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={formData.requesterEmail}
                  onChange={(e) => updateField('requesterEmail', e.target.value)}
                  className={`h-11 ${errors.requesterEmail ? 'border-red-500' : ''}`}
                />
                {errors.requesterEmail && <p className="text-sm text-red-600">{errors.requesterEmail}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
            <CardTitle>Asignación</CardTitle>
            <CardDescription>Asignar responsable al servicio</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="assignedTechnician">Técnico Asignado *</Label>
              <Input
                id="assignedTechnician"
                placeholder="Nombre del técnico responsable"
                value={formData.assignedTechnician}
                onChange={(e) => updateField('assignedTechnician', e.target.value)}
                className={`h-11 ${errors.assignedTechnician ? 'border-red-500' : ''}`}
              />
              {errors.assignedTechnician && (
                <p className="text-sm text-red-600">{errors.assignedTechnician}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones Iniciales</Label>
              <Textarea
                id="observations"
                placeholder="Notas o detalles adicionales sobre el servicio..."
                value={formData.observations}
                onChange={(e) => updateField('observations', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            type="submit" 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Crear Servicio
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/services')}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
