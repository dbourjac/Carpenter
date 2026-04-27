import { useNavigate } from 'react-router';
import { User, LogOut, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { getCurrentUser, logout } from '../lib/storage';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mi Perfil
          </span>
        </h1>
        <p className="text-gray-600 mt-1">Información de usuario y configuración</p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-full">
              <User className="h-12 w-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.email}</p>
            </div>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-sm">
              {user.role === 'admin' ? 'Administrador' : 'Jefe de Taller'}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">ID de Usuario</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Rol</p>
              <p className="font-medium capitalize">{user.role === 'admin' ? 'Administrador' : 'Jefe de Taller'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos y Accesos
          </CardTitle>
          <CardDescription>
            Funcionalidades disponibles según tu rol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {user.role === 'manager' ? (
              <>
                <PermissionItem granted title="Ver todos los servicios" />
                <PermissionItem granted title="Crear nuevas solicitudes" />
                <PermissionItem granted title="Asignar técnicos a servicios" />
                <PermissionItem granted title="Actualizar estado de servicios" />
                <PermissionItem granted title="Gestionar inventario completo" />
                <PermissionItem granted title="Generar reportes" />
                <PermissionItem granted title="Acceso a configuración del sistema" />
              </>
            ) : (
              <>
                <PermissionItem granted title="Registrar y editar jefes de taller" />
                <PermissionItem granted title="Eliminar jefes de taller" />
                <PermissionItem granted title="Ver usuarios registrados" />
                <PermissionItem denied title="Acceso a módulos operativos" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Versión</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Última actualización</p>
              <p className="font-medium">Abril 2026</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Entorno</p>
              <p className="font-medium">Producción</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge className="bg-green-100 text-green-800">Operativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionItem({ granted, title }: { granted: boolean; title: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
      <div className={`w-2 h-2 rounded-full ${granted ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className={granted ? 'text-gray-900' : 'text-gray-500'}>{title}</span>
    </div>
  );
}