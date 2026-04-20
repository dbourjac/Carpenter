import { useState } from 'react';
import { Plus, Edit, Trash2, Package, Wrench, Boxes } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  getInventory, 
  createInventoryItem, 
  updateInventoryItem, 
  deleteInventoryItem 
} from '../lib/storage';
import { InventoryItem } from '../lib/types';
import { toast } from 'sonner';

export function InventoryPage() {
  const [inventory, setInventory] = useState(getInventory());
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    category: 'material' as 'material' | 'tool' | 'equipment',
    quantity: '',
    unit: 'pcs',
    minStock: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'material',
      quantity: '',
      unit: 'pcs',
      minStock: '',
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity.toString(),
        unit: item.unit,
        minStock: item.minStock?.toString() || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.quantity) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      minStock: formData.minStock ? parseFloat(formData.minStock) : undefined,
    };

    if (editingItem) {
      const updated = updateInventoryItem(editingItem.id, itemData);
      if (updated) {
        setInventory(getInventory());
        toast.success('Item actualizado correctamente');
      }
    } else {
      createInventoryItem(itemData);
      setInventory(getInventory());
      toast.success('Item agregado al inventario');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar este item?')) {
      deleteInventoryItem(id);
      setInventory(getInventory());
      toast.success('Item eliminado');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'material': return <Package className="h-5 w-5" />;
      case 'tool': return <Wrench className="h-5 w-5" />;
      case 'equipment': return <Boxes className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'material': return 'Material';
      case 'tool': return 'Herramienta';
      case 'equipment': return 'Equipo';
      default: return category;
    }
  };

  const filteredInventory = categoryFilter === 'all' 
    ? inventory 
    : inventory.filter(item => item.category === categoryFilter);

  const stats = {
    materials: inventory.filter(i => i.category === 'material').length,
    tools: inventory.filter(i => i.category === 'tool').length,
    equipment: inventory.filter(i => i.category === 'equipment').length,
    lowStock: inventory.filter(i => i.minStock && i.quantity <= i.minStock).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestión de materiales, herramientas y equipos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-5 w-5" />
              Agregar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Item' : 'Nuevo Item de Inventario'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="tool">Herramienta</SelectItem>
                    <SelectItem value="equipment">Equipo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="sets">sets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo (opcional)</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingItem ? 'Actualizar' : 'Agregar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Materiales</p>
                <p className="text-2xl font-semibold">{stats.materials}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Wrench className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Herramientas</p>
                <p className="text-2xl font-semibold">{stats.tools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Boxes className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Equipos</p>
                <p className="text-2xl font-semibold">{stats.equipment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-semibold">{stats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="material">Materiales</TabsTrigger>
          <TabsTrigger value="tool">Herramientas</TabsTrigger>
          <TabsTrigger value="equipment">Equipos</TabsTrigger>
        </TabsList>

        <TabsContent value={categoryFilter} className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Mínimo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-lg">
                              {getCategoryIcon(item.category)}
                            </div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.quantity} {item.unit}</span>
                            {item.minStock && item.quantity <= item.minStock && (
                              <Badge variant="destructive" className="text-xs">
                                Bajo
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {item.minStock ? `${item.minStock} ${item.unit}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
