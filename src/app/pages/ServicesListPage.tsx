import {useState, useEffect} from 'react';
import {useNavigate, useSearchParams} from 'react-router';
import {Plus, Search, Eye, Trash2, Filter} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '../components/ui/card';
import {Badge} from '../components/ui/badge';
import {serviceApi} from '../lib/api';
import {ServiceRequest} from '../lib/types';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {getStatusLabel, getStatusColor, formatDate, getPriorityColor, getPriorityLabel} from '../lib/utils';
import {toast} from 'sonner';

export function ServicesListPage() {
    const navigate = useNavigate();
    const [services, setServices] = useState<ServiceRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>(
        (searchParams.get('status') as any) ?? 'all'
    );    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

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

    useEffect(() => {
        console.log(services.map(s => ({ name: s.name, status: s.status })));
    }, [services]);

    // Función para eliminar un servicio
    const handleDelete = async () => {
        if (!serviceToDelete) return;
        try {
            await serviceApi.remove(serviceToDelete);
            setServices(prev => prev.filter(s => s.id !== serviceToDelete));
            setServiceToDelete(null);
            toast.success('Servicio eliminado correctamente');
        } catch (error) {
            toast.error('Error al intentar eliminar el servicio');
        }
    };

    // Filtro de búsqueda por nombre o solicitante
    const filteredServices = services
        .filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.requesterName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(service => statusFilter=== 'all' || service.status === statusFilter)
        .filter(service => priorityFilter === 'all' || service.priority === priorityFilter);

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
                    <Plus className="mr-2 h-4 w-4"/> Nuevo Servicio
                </Button>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gray-50/50">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                            <Input
                                placeholder="Buscar por nombre de servicio o solicitante..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-xs text-gray-500">Prioridad</Label>
                            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                                <SelectTrigger className="w-40 h-11 bg-white">
                                    <SelectValue placeholder="Prioridad"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="low">Baja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <Label className="text-xs text-gray-500">Estado</Label>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                                <SelectTrigger className="w-40 h-11 bg-white">
                                    <SelectValue placeholder="Estado"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="in-progress">En Progreso</SelectItem>
                                    <SelectItem value="completed">Completado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
    <CardContent className="pt-6">
        {loading ? (
            <div className="py-12 text-center text-gray-500 italic">Cargando servicios desde el
                servidor...</div>
        ) : filteredServices.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No se encontraron servicios registrados.</div>
        ) : (
            <div className="grid gap-4">
                {filteredServices.map((service) => (
                    <div key={service.id}
                         className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition-all group">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-gray-900">{service.name}</h3>
                                <Badge
                                    className={getStatusColor(service.status)}>{getStatusLabel(service.status)}</Badge>
                                <Badge
                                    className={`${getPriorityColor(service.priority)} border ${
                                        service.priority === 'high' ? 'animate-pulse' : ''
                                    }`}>
                                    {getPriorityLabel(service.priority)}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Solicitante: <span
                                className="font-medium">{service.requesterName}</span> • {formatDate(service.startDate)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => navigate(`/services/${service.id}`)}
                                className="hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Eye className="h-4 w-4"/>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setServiceToDelete(service.id)}
                            >
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </CardContent>
</Card>
            {serviceToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">¿Eliminar servicio?</h3>
                        <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setServiceToDelete(null)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

</div>
)
    ;
}