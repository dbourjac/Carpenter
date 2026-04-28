import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Eye, Trash2, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { serviceApi } from '../lib/api';
import { ServiceRequest } from '../lib/types';
import { getStatusLabel, getStatusColor, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export function ServicesListPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargamos los servicios del backend al montar el componente
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const data = await serviceApi.getAll();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast.error('No se pudieron cargar los servicios del servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Función para eliminar un servicio
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este servicio permanentemente?')) return;

    try {
      await serviceApi.remove(id);
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Servicio eliminado correctamente');
    } catch (error) {
      toast.error('Error al intentar eliminar el servicio');
    }
  };

  // Filtro de búsqueda por nombre o solicitante
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Servicios</h1>
          <p className="text-gray-600 mt-1">Gestión y seguimiento de órdenes de trabajo</p>
        </div>
        <Button
          onClick={() => navigate('/services/new')}
          className="bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre de servicio o solicitante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500 italic">Cargando servicios desde el servidor...</div>
          ) : filteredServices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No se encontraron servicios registrados.</div>
          ) : (
            <div className="grid gap-4">
              {filteredServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-all group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
                      <Badge className={getStatusColor(service.status)}>{getStatusLabel(service.status)}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Solicitante: <span className="font-medium">{service.requesterName}</span> • {formatDate(service.startDate)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}