import { useState } from 'react';
import { Plus, Edit, Trash2, Wrench, CheckCircle, XCircle, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { 
  getEquipment, 
  createEquipmentItem, 
  updateEquipmentItem, 
  deleteEquipmentItem 
} from '../lib/storage';
import { EquipmentItem } from '../lib/types';
import { toast } from 'sonner';

export function EquipmentPage() {
  const [equipment, setEquipment] = useState(getEquipment());
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'equipment' as 'equipment' | 'tool',
    available: true,
    description: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'equipment',
      available: true,
      description: '',
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
        description: item.description || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    const itemData = {
      name: formData.name,
      type: formData.type,
      available: formData.available,
      description: formData.description || undefined,
    };

    if (editingItem) {
      const updated = updateEquipmentItem(editingItem.id, itemData);
      if (updated) {
        setEquipment(getEquipment());
        toast.success('Item actualizado correctamente');
      }
    } else {
      createEquipmentItem(itemData);
      setEquipment(getEquipment());
      toast.success('Item agregado correctamente');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este item?')) {
      deleteEquipmentItem(id);
      setEquipment(getEquipment());
      toast.success('Item eliminado');
    }
  };

  const toggleAvailability = (item: EquipmentItem) => {
    const updated = updateEquipmentItem(item.id, { available: !item.available });
    if (updated) {
      setEquipment(getEquipment());
      toast.success(updated.available ? 'Marcado como disponible' : 'Marcado como no disponible');
    }
  };

  const filteredEquipment = typeFilter === 'all' 
    ? equipment 
    : equipment.filter(item => item.type === typeFilter);

  const stats = {
    equipment: equipment.filter(i => i.type === 'equipment').length,
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
              Equipos y Herramientas
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Gestión de recursos del taller</p>
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
                {editingItem ? 'Editar Item' : 'Nuevo Equipo o Herramienta'}
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
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equipment">Equipo (Maquinaria)</SelectItem>
                    <SelectItem value="tool">Herramienta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Detalles adicionales sobre el item..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-blue-100">Herramientas</p>
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
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="equipment">Equipos</TabsTrigger>
          <TabsTrigger value="tool">Herramientas</TabsTrigger>
        </TabsList>

        <TabsContent value={typeFilter} className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
              <CardTitle>Listado de Recursos</CardTitle>
              <CardDescription>
                {typeFilter === 'all' ? 'Todos los equipos y herramientas' :
                 typeFilter === 'equipment' ? 'Maquinaria y equipos' : 'Herramientas del taller'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEquipment.map((item) => (
                  <div
                    key={item.id}
                    className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${
                        item.type === 'equipment' 
                          ? 'bg-purple-100' 
                          : 'bg-blue-100'
                      }`}>
                        {item.type === 'equipment' ? (
                          <Settings className={`h-6 w-6 ${
                            item.type === 'equipment' ? 'text-purple-600' : 'text-blue-600'
                          }`} />
                        ) : (
                          <Wrench className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <Badge 
                        className={`${
                          item.available 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        } border`}
                      >
                        {item.available ? 'Disponible' : 'En Uso'}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description || 'Sin descripción'}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleAvailability(item)}
                      >
                        {item.available ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Marcar en uso
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Disponible
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
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
    </div>
  );
}
