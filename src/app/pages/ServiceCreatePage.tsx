import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getTodayDateString, isDateBeforeToday } from '../lib/utils';
import { ServiceType, ServicePriority } from '../lib/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { serviceApi, solicitanteApi, getPersonal, seguimientoApi, utensiliosApi } from '../lib/api';

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
    equipment: [] as number[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [technicianSearch, setTechnicianSearch] = useState('');
  const [filteredTechnicians, setFilteredTechnicians] = useState<any[]>([]);
    useEffect(() => {
      const load = async () => {
        try {
          const data = await getPersonal();
          setTechnicians(data);
        } catch (error) {
          console.error('Error cargando técnicos', error);
          setTechnicians([]);
        }
      };
      load();
    }, []);
    useEffect(() => {
      const loadEquipment = async () => {
        try {
          const data = await utensiliosApi.getAll();
          setAvailableEquipment(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error cargando equipos');
          setAvailableEquipment([]);
        }
      };
      loadEquipment();
    }, []);
    useEffect(() => {
      if (!technicianSearch.trim()) {
        setFilteredTechnicians([]);
        return;
      }

      const filtered = technicians
        .filter(t =>
          `${t.nombre || t.name} ${t.id}`
            .toLowerCase()
            .includes(technicianSearch.toLowerCase())
        )
        .slice(0, 5);

      setFilteredTechnicians(filtered);
    }, [technicianSearch, technicians]);

  const [newEquipment, setNewEquipment] = useState('');
  const [availableEquipment, setAvailableEquipment] = useState<{ id: string; name: string; available: boolean }[]>([]);
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
    if (!formData.assignedTechnician?.trim()) {
      newErrors.assignedTechnician = 'El técnico asignado es requerido';
    }
    if (
      formData.endDate &&
      formData.startDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
    }
    if (formData.estimatedCompletionDate && isDateBeforeToday(formData.estimatedCompletionDate)) {
      newErrors.estimatedCompletionDate = 'La fecha estimada de finalización no puede ser anterior a hoy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
    const handleAddEquipment = () => {
        if (!newEquipment.trim()) {
          toast.error('Seleccione o ingrese un equipo');
          return;
        }

        const equipo = availableEquipment.find(e => String(e.id) === newEquipment);

        if (equipo && !equipo.available) {
          toast.error('Este equipo no está disponible');
          return;
        }

        setFormData(prev => ({
          ...prev,
          equipment: [...prev.equipment, Number(newEquipment)]
        }));

        setNewEquipment('');
      };

    const handleRemoveEquipment = (_: number, index: number) => {
        setFormData(prev => ({
          ...prev,
          equipment: prev.equipment.filter((_, i) => i !== index)
        }));
      };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error('Por favor, corrige los errores en el formulario');
        return;
      }
      

      try {
        // 1. Crear solicitante
        const requester = await solicitanteApi.create({
          name: formData.requesterName,
          email: formData.requesterEmail,
          phone: formData.requesterPhone,
          area: formData.requesterArea,
        });

        // 2. Crear servicio
        const newService = await serviceApi.create({
          name: formData.name,
          type: formData.type,
          priority: formData.priority,
          status: 'pending',

          startDate: formData.startDate,
          endDate: null,
          estimatedCompletionDate: formData.estimatedCompletionDate || null,

          solicitanteId: requester.id,
          assignedTechnician: formData.assignedTechnician || null,
          location: formData.location || null,

          description: formData.description || null,
          observations: null,
        });

        if (formData.equipment && formData.equipment.length > 0) {
          for (const equipmentId of formData.equipment) {
            if (!equipmentId) continue;
            try {
              const equipo = availableEquipment.find(e => Number(e.id) === equipmentId);
              await serviceApi.addUtensilio(newService.id, {
                utensilio_id: Number(equipmentId)
              });
            } catch (error) {
              console.error('Error agregando utensilio:', error);
            }
          }
        }
        
        try {
          await seguimientoApi.add(newService.id, {
            name: formData.name || 'S/N',
            solicitanteId: requester?.id ?? null,
            assignedTechnician: formData.assignedTechnician
              ? String(formData.assignedTechnician)
              : null,
            location: formData.location ?? null,
            description: formData.description ?? null,
            type: formData.type ?? 'other',
            startDate: formData.startDate ?? null,
            estimatedCompletionDate:
              formData.estimatedCompletionDate || null,
            observations: formData.observations ?? null,
          });
        } catch (err) {
          console.error('Error creando seguimiento:', err);
        }

        toast.success('Servicio creado exitosamente');

        navigate(`/services/${newService.id}`);

      } catch (error: any) {
        console.error('🔥 ERROR COMPLETO:', error);
        console.error('🔥 RESPONSE:', error?.response?.data);
        toast.error('Error al crear servicio');
      }
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
                <Label htmlFor="estimatedCompletionDate">Fecha Estimada Finalización</Label>
                <Input
                  id="estimatedCompletionDate"
                  type="date"
                  value={formData.estimatedCompletionDate}
                  onChange={(e) => updateField('estimatedCompletionDate', e.target.value)}
                  min={getTodayDateString()}
                  className={`h-11 ${errors.estimatedCompletionDate ? 'border-red-500' : ''}`}
                />
                {errors.estimatedCompletionDate && (
                  <p className="text-sm text-red-600">{errors.estimatedCompletionDate}</p>
                )}
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
                <Label>Técnico asignado *</Label>

                <Input
                  placeholder="Buscar técnico por nombre o ID..."
                  value={technicianSearch}
                  onChange={(e) => setTechnicianSearch(e.target.value)}
                  className={`h-11 ${errors.assignedTechnician ? 'border-red-500' : ''}`}
                />

                {filteredTechnicians.length > 0 && (
                  <div className="border rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
                    {filteredTechnicians.map((tech) => (
                      <div
                        key={tech.id}
                        className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => {
                          updateField('assignedTechnician', String(tech.id));
                          setTechnicianSearch(tech.nombre || tech.name);
                          setFilteredTechnicians([]);
                        }}
                      >
                        {tech.nombre || tech.name} — {tech.especialidad || 'Sin especialidad'}
                      </div>
                    ))}
                  </div>
                )}

                {errors.assignedTechnician && (
                  <p className="text-sm text-red-600">{errors.assignedTechnician}</p>
                )}
              </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
            <CardTitle>Equipos y Herramientas Asignadas</CardTitle>
            <CardDescription>Recursos utilizados en este servicio</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">

            {formData.equipment.length > 0 && (
              <div className="space-y-2">
                {formData.equipment.map((equipmentId, index) => {
                  const equipo = availableEquipment.find(e => String(e.id) === String(equipmentId));

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span>{equipo?.name || equipmentId}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveEquipment(equipmentId, index)}>
                        <X className="h-4 w-4 text-red-600"/>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              <Select value={newEquipment} onValueChange={setNewEquipment}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar del inventario..." />
                </SelectTrigger>
                <SelectContent>
                  {(availableEquipment || [])
                    .filter(e => e.available)
                    .map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button type="button" onClick={handleAddEquipment}>
                <Plus className="h-4 w-4 mr-1"/>Agregar
              </Button>
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
