import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Wrench, CheckCircle, XCircle, Settings, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { utensiliosApi, getPersonal, serviceApi } from '../lib/api';
import { EquipmentItem } from '../lib/types';
import { toast } from 'sonner';

const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return '';
  if (value.includes('T')) return value.slice(0, 16);
  return `${value}T09:00`;
};

const getNowLocalDateTimeValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isPastDateTime = (value: string): boolean => {
  const selected = new Date(value);
  const now = new Date();
  now.setSeconds(0, 0);
  return selected.getTime() < now.getTime();
};

const parseMaintenanceDate = (value: string): Date => {
  return value.includes('T') ? new Date(value) : new Date(`${value}T00:00`);
};

const toStartOfDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isUnderMaintenance = (item: EquipmentItem) => {
  return item.status_mantenimiento === 'En proceso';
};

export function EquipmentPage() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [maintenanceItem, setMaintenanceItem] = useState<EquipmentItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<EquipmentItem | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment' as 'equipment' | 'tool' | 'machinery',
    available: true,
  });

  const [maintenanceData, setMaintenanceData] = useState({
    nextMaintenanceDate: '',
    maintenanceNotes: '',
    personal_id: ''
  });

  const loadEquipment = async () => {
    setLoadingEquipment(true);
    try {
      const rows = await utensiliosApi.getAll();
      setEquipment(rows);
      checkMaintenanceNotifications(rows);
    } catch (err) {
      console.error('Error loading utensilios:', err);
      toast.error('No se pudieron cargar equipos y utensilios');
    } finally {
      setLoadingEquipment(false);
    }
  };

  const [technicians, setTechnicians] = useState<any[]>([]);
  useEffect(() => {
    const loadTechs = async () => {
      try {
        const data = await getPersonal();
        setTechnicians(data);
      } catch {
        console.error('Error cargando técnicos');
      }
    };
    loadTechs();
  }, []);

  // Check maintenance notifications on component mount
  useEffect(() => {
    const init = async () => {
      await loadEquipment();

      const updatedServices = await serviceApi.getAll();
      setServices(updatedServices);
    };

    init();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceApi.getAll();
      setServices(data);
    } catch {
      console.error('Error cargando servicios');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'equipment',
      available: true,
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: EquipmentItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        available: item.available,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    const itemData = {
      name: formData.name,
      type: formData.type,
      available: formData.available,
    };

    try {
      if (editingItem) {
        await utensiliosApi.update(editingItem.id, {
          ...editingItem,
          name: formData.name,
          type: formData.type,
          available: formData.available,
        });
        toast.success('Item actualizado correctamente');
      } else {
        await utensiliosApi.create(itemData);
        toast.success('Item agregado correctamente');
      }

      await loadEquipment();
    } catch (err) {
      console.error('Error saving utensilio:', err);
      toast.error('No se pudo guardar el item');
      return;
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este item?')) {
      try {
        await utensiliosApi.remove(id);
        await loadEquipment();
        toast.success('Item eliminado');
      } catch (err) {
        console.error('Error deleting utensilio:', err);
        toast.error('No se pudo eliminar el item');
      }
    }
  };

  const toggleAvailability = async (item: EquipmentItem) => {
    const assignment = getAssignment(item.id);

    try {
      if (assignment) {
        await serviceApi.removeUtensilio(
          assignment.serviceId,
          item.id
        );
      }

      const updated = await utensiliosApi.update(item.id, {
        name: item.name,
        type: item.type,
        available: !item.available,

        solicitante_id: !item.available ? null : item.solicitante_id,
        operador_id: !item.available ? null : item.operador_id
      });

      await loadEquipment();

      const freshServices = await serviceApi.getAll();
      setServices(freshServices);

      toast.success(updated.available ? 'Disponible' : 'En uso');

    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
    }
  };

  const openMaintenanceDialog = (item: EquipmentItem) => {
    if (item.type !== 'machinery') {
      toast.error('El mantenimiento programado aplica solo para maquinaria');
      return;
    }

    setMaintenanceItem(item);
    setMaintenanceData({
      nextMaintenanceDate: toDateTimeLocalValue(item.nextMaintenanceDate),
      maintenanceNotes: '',
      personal_id: ''
    });
    setMaintenanceDialogOpen(true);
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!maintenanceData.nextMaintenanceDate) {
      toast.error('La fecha de mantenimiento es requerida');
      return;
    }

    const selectedDate = new Date(maintenanceData.nextMaintenanceDate);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('La fecha de mantenimiento no puede ser anterior a hoy');
      return;
    }

    if (maintenanceItem) {
      try {
        await utensiliosApi.scheduleMaintenance(maintenanceItem.id, {
          nextMaintenanceDate: maintenanceData.nextMaintenanceDate,
          maintenanceNotes: maintenanceData.maintenanceNotes || undefined,
          personal_id: maintenanceData.personal_id,
        });
      } catch {
        // fallback: algunos backends guardan mantenimiento desde update directo
        await utensiliosApi.update(maintenanceItem.id, {
          ...maintenanceItem,
          nextMaintenanceDate: maintenanceData.nextMaintenanceDate,
          maintenanceCompleted: false,
          maintenanceNotes: maintenanceData.maintenanceNotes || undefined,
        });
      }

      await loadEquipment();
      toast.success('Mantenimiento programado correctamente');
      setMaintenanceDialogOpen(false);
    }
  };

  const handleMarkMaintenanceCompleted = async (item: EquipmentItem) => {
    if (item.type !== 'machinery') {
      toast.error('Solo la maquinaria puede marcar mantenimiento');
      return;
    }

    if (!item.nextMaintenanceDate) {
      toast.error('No hay mantenimiento programado para este item');
      return;
    }

    try {
      await utensiliosApi.update(item.id, {
        ...item,
        maintenanceCompleted: true,
        lastMaintenanceDate: new Date().toISOString(),
      });
      await loadEquipment();
      toast.success('Mantenimiento marcado como completado');
    } catch (err) {
      console.error('Error completing maintenance:', err);
      toast.error('No se pudo marcar el mantenimiento');
    }
  };

  const checkMaintenanceNotifications = (items: EquipmentItem[] = equipment) => {
    const now = new Date();
    const today = toStartOfDay(now);

    items.forEach(item => {
      if (item.type === 'machinery' && item.nextMaintenanceDate) {
        const maintenanceDate = parseMaintenanceDate(item.nextMaintenanceDate);
        const maintenanceDay = toStartOfDay(maintenanceDate);

        const hoursUntilMaintenance = Math.floor(
          (maintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        );
        const daysUntilMaintenance = Math.ceil((maintenanceDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (item.status_mantenimiento === 'En proceso') {
          toast.error(`⏰ Mantenimiento atrasado: ${item.name}`, { duration: 10000 });
        } else if (item.status_mantenimiento === 'Próximo') {
          toast.warning(`📅 Próximo mantenimiento: ${item.name}`, { duration: 8000 });
        }
      }
    });
  };

  const filteredEquipment =
    typeFilter === 'all'
      ? equipment
      : typeFilter === 'machinery'
      ? equipment.filter((item) => item.type === 'machinery')
      : equipment.filter((item) => item.type === typeFilter);

  const getAssignment = (equipmentId: string) => {
    const item = equipment.find(e => String(e.id) === String(equipmentId));

    if (!item) return null;

    if (!item.solicitante_id) return null;

    const service = services.find(
      s => String(s.solicitanteId) === String(item.solicitante_id)
    );

    if (!service) return null;

    return {
      serviceId: service.id,
      requester: service.requesterName
    };
  };

  const stats = {
    equipment: equipment.filter(i => i.type === 'equipment').length,
    machinery: equipment.filter(i => i.type === 'machinery').length,
    tools: equipment.filter(i => i.type === 'tool').length,
    available: equipment.filter(i => i.available).length,
    inUse: equipment.filter(i => !i.available).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Equipos y Utensilios
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Gestión de recursos del taller</p>
          {loadingEquipment && <p className="text-sm text-gray-500 mt-2">Cargando datos...</p>}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Agregar Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Nuevo Equipo o Utensilio'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="ej. Taladro Industrial Makita"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    console.log("TYPE SELECTED:", value);
                    setFormData(prev => ({ ...prev, type: value as any }));
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipo</SelectItem>
                    <SelectItem value="tool">Utensilio</SelectItem>
                    <SelectItem value="machinery">Maquinaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="available" className="cursor-pointer">
                  Disponible para asignar
                </Label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingItem ? 'Actualizar' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Programar Mantenimiento - {maintenanceItem?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceDate">Fecha de mantenimiento *</Label>
                <input
                  id="maintenanceDate"
                  type="date"
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 appearance-none [color-scheme:light]"
                  value={
                    maintenanceData.nextMaintenanceDate
                      ? maintenanceData.nextMaintenanceDate.split('T')[0]
                      : ''
                  }
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();

                    today.setHours(0, 0, 0, 0);
                    selectedDate.setHours(0, 0, 0, 0);

                    if (selectedDate < today) {
                      toast.error('La fecha de mantenimiento no puede ser anterior a hoy');
                      return;
                    }
                    setMaintenanceData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))
                  }}
                  required
                />
              </div>

              <div className="space-y-4">
                {/* Técnico */}
                <div className="space-y-2">
                  <Label>Técnico responsable *</Label>
                  <Select
                    value={maintenanceData.personal_id}
                    onValueChange={(value) =>
                      setMaintenanceData(prev => ({ ...prev, personal_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar técnico..." />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.nombre || t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Detalles del mantenimiento..."
                    value={maintenanceData.maintenanceNotes}
                    onChange={(e) =>
                      setMaintenanceData(prev => ({
                        ...prev,
                        maintenanceNotes: e.target.value
                      }))
                    }
                    rows={3}
                  />
                </div>

              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Guardar Mantenimiento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-purple-100">Equipos</p>
                <p className="text-3xl font-bold">{stats.equipment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-indigo-100">Maquinaria</p>
                <p className="text-3xl font-bold">{stats.machinery}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Utensilios</p>
                <p className="text-3xl font-bold">{stats.tools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-green-100">Disponibles</p>
                <p className="text-3xl font-bold">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-orange-100">En Uso</p>
                <p className="text-3xl font-bold">{stats.inUse}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="machinery">Maquinaria</TabsTrigger>
          <TabsTrigger value="equipment">Equipos</TabsTrigger>
          <TabsTrigger value="tool">Utensilios</TabsTrigger>
        </TabsList>

        <TabsContent value={typeFilter} className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
              <CardTitle>Listado de Recursos</CardTitle>
              <CardDescription>
                {typeFilter === 'all'
                  ? 'Todos los equipos y utensilios'
                  : typeFilter === 'equipment'
                  ? 'Maquinaria y equipos'
                  : typeFilter === 'tool'
                  ? 'Utensilios del taller'
                  : 'Maquinaria pesada del taller'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEquipment.map((item) => (
                  <div
                    key={item.id}
                    className={`border-2 rounded-xl p-4 transition-all bg-white ${
                      isUnderMaintenance(item)
                        ? 'border-yellow-300 opacity-70'
                        : 'border-gray-100 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">

                      {/* ICONO */}
                      <div className={`p-3 rounded-xl flex-shrink-0 ${
                        item.type === 'equipment' 
                          ? 'bg-purple-100' 
                          : item.type === 'machinery'
                          ? 'bg-indigo-100'
                          : 'bg-blue-100'
                      }`}>
                        {item.type === 'equipment' ? (
                          <Settings className="h-5 w-5 text-purple-600" />
                        ) : item.type === 'machinery' ? (
                          <Wrench className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Wrench className="h-5 w-5 text-blue-600" />
                        )}
                      </div>

                      {/* TEXTO + BADGE */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {item.name}
                        </h3>

                        <div className="mt-2">
                          <Badge
                            className={`text-xs px-2 py-0.5 border ${
                              isUnderMaintenance(item)
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : item.available
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-orange-100 text-orange-800 border-orange-200'
                            }`}
                          >
                            {isUnderMaintenance(item)
                              ? 'Mantenimiento'
                              : item.available
                              ? 'Disponible'
                              : 'En uso'}
                          </Badge>
                        </div>
                      </div>

                    </div>
                    {(() => {
                        const assignment = getAssignment(item.id);

                        if (!assignment) return null;

                        return (
                          <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-gray-700 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-blue-600" />
                              <span className="font-medium">
                                Asignado a: Servicio #{assignment.serviceId}
                              </span>
                              <span className="text-gray-500">
                                - {assignment.requester}
                              </span>
                            </p>
                          </div>
                        );
                      })()}

                    {item.type === 'machinery' && item.nextMaintenanceDate && (
                      
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Próx. mantenimiento: {parseMaintenanceDate(item.nextMaintenanceDate).toLocaleString('es-ES')}
                        </p>
                        {item.status_mantenimiento === 'En proceso' && (
                          <p className="text-xs text-red-700 font-medium mt-1">
                            Mantenimiento atrasado
                          </p>
                        )}

                        {item.status_mantenimiento === 'Próximo' && (
                          <p className="text-xs text-yellow-700 font-medium mt-1">
                            Próximo mantenimiento
                          </p>
                        )}

                        {item.status_mantenimiento === 'Al día' && (
                          <p className="text-xs text-green-700 font-medium mt-1">
                            Al día
                          </p>
                        )}
                        {item.maintenanceDescription && (
                          <p className="text-xs text-gray-700 mt-1">
                            {item.maintenanceDescription}
                          </p>
                        )}
                      </div>
                    )}
                    {item.type === 'machinery' && (
                      <div className="flex gap-2 mt-2">

                        {/* VER DETALLES */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs flex-1"
                          onClick={async () => {
                            setDetailsItem(item);

                            try {
                              const res = await fetch(`/api/utensilios/${item.id}/mantenimiento`);
                              const data = await res.json();
                              setMaintenanceHistory(data);
                            } catch {
                              setMaintenanceHistory([]);
                            }

                            setDetailsOpen(true);
                          }}
                        >
                          Ver detalles
                        </Button>

                        {/* 🔧 PROGRAMAR MANTENIMIENTO */}
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openMaintenanceDialog(item)}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>

                      </div>
                    )}

                    <div className="mt-4 space-y-2">
                      {/* ACCIONES SECUNDARIAS */}
                      <div className="flex items-center gap-2 flex-wrap">

                        <div className="flex gap-2">

                          {/* ✏️ EDITAR */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* 🗑️ ELIMINAR */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                        </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>

              {filteredEquipment.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay items registrados en esta categoría</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Detalles de mantenimiento</DialogTitle>
          </DialogHeader>

          {detailsItem && (
            <div className="space-y-4 text-sm">

              {maintenanceHistory.length === 0 ? (
                <p className="text-gray-500">Sin historial de mantenimiento</p>
              ) : (
                maintenanceHistory.map((m, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <p className="text-xs text-gray-500">
                      {new Date(m.fecha_mantenimiento).toLocaleString()}
                    </p>

                    <p className="font-medium">
                      Técnico: {m.tecnico || 'No asignado'}
                    </p>

                    <p className="text-gray-700">
                      {m.descripcion || 'Sin notas'}
                    </p>
                  </div>
                ))
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}