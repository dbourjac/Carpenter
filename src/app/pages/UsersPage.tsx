import { useState } from 'react';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { getAllUsers, createUser, updateUser, deleteUser, getCurrentUser, getUserById } from '../lib/storage';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

export function UsersPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState(getAllUsers().filter(u => u.role === 'manager'));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Solo admin puede acceder
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-gray-600">Solo el administrador del sistema puede gestionar jefes de taller.</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
    setErrors({});
    setEditingUserId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    const user = getUserById(id);
    if (!user) {
      toast.error('Jefe de taller no encontrado');
      return;
    }

    setEditingUserId(id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      confirmPassword: '',
      phone: user.phone || '',
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const normalizedEmail = formData.email.trim();

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!normalizedEmail) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) newErrors.email = 'Email inválido';
    else if (users.some(u => u.email === normalizedEmail && u.id !== editingUserId)) {
      newErrors.email = 'Este email ya está registrado';
    }

    if (!editingUserId || formData.password.trim()) {
      if (!formData.password.trim()) newErrors.password = 'La contraseña es requerida';
      else if (formData.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
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

    try {
      if (editingUserId) {
        updateUser(editingUserId, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          ...(formData.password ? { password: formData.password } : {}),
          role: 'manager',
        });
        toast.success(`Jefe de Taller ${formData.name} actualizado correctamente`);
      } else {
        createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          role: 'manager',
        });
        toast.success(`Jefe de Taller ${formData.name} registrado correctamente`);
      }

      setUsers(getAllUsers().filter(u => u.role === 'manager'));
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = (id: string) => {
    if (id === currentUser.id) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }

    const user = getUserById(id);
    if (!user) {
      toast.error('Jefe de taller no encontrado');
      return;
    }

    setDeleteTarget({ id: user.id, name: user.name });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const deleted = deleteUser(deleteTarget.id);
    if (deleted) {
      setUsers(getAllUsers().filter(u => u.role === 'manager'));
      toast.success('Jefe de Taller eliminado correctamente');
    } else {
      toast.error('No se pudo eliminar el usuario');
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestión de Jefes de Taller
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Crear, editar y eliminar jefes de taller del sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg" onClick={openCreateDialog}>
              <Plus className="mr-2 h-5 w-5" />
              Registrar Jefe de Taller
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUserId ? 'Editar Jefe de Taller' : 'Registrar Nuevo Jefe de Taller'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input id="name" placeholder="ej. Juan Pérez" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className={errors.name ? 'border-red-500' : ''} />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input id="email" type="email" placeholder="usuario@empresa.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className={errors.email ? 'border-red-500' : ''} />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (Opcional)</Label>
                <Input id="phone" placeholder="+1234567890" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{editingUserId ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className={errors.password ? 'border-red-500' : ''} />
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña {editingUserId ? '(si cambias la contraseña)' : '*'}</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} className={errors.confirmPassword ? 'border-red-500' : ''} />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingUserId ? 'Guardar Cambios' : 'Registrar Jefe'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
          <CardTitle>Jefes de Taller Registrados</CardTitle>
          <CardDescription>Total de jefes de taller: {users.length}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay jefes de taller registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Teléfono</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600" onClick={() => openEditDialog(user.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600" onClick={() => handleDelete(user.id)} disabled={user.id === currentUser.id} title={user.id === currentUser.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar jefe de taller'}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-lg bg-blue-50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900">Información importante:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Los jefes de taller pueden ver y gestionar todos los módulos del sistema</li>
              <li>El apartado de técnicos se gestiona por separado en la sección de Técnicos</li>
              <li>La contraseña debe tener al menos 6 caracteres</li>
              <li>Los jefes de taller deben usar su email y contraseña para iniciar sesión</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              ¿Está seguro de eliminar a <span className="font-semibold text-gray-900">{deleteTarget?.name}</span>?
              {' '}
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
