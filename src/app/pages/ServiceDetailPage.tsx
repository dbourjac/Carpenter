import {useState, useEffect, useRef, useMemo} from 'react';
import {useParams, useNavigate} from 'react-router';
import {
    ArrowLeft,
    Save,
    Plus,
    X,
    Upload,
    Trash2,
    MapPin,
    Calendar,
    User as UserIcon,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {Badge} from '../components/ui/badge';
import {Separator} from '../components/ui/separator';
import {Textarea} from '../components/ui/textarea';
import {seguimientoApi, serviceApi, technicianApi, utensiliosApi} from '../lib/api';
import {
    getStatusLabel,
    getTypeLabel,
    getPriorityLabel,
    getStatusColor,
    getPriorityColor,
    formatDate
} from '../lib/utils';
import {ServiceStatus, ServicePriority, ServiceRequest, EquipmentItem} from '../lib/types';
import {toast} from 'sonner';

export function ServiceDetailPage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<ServiceRequest | null>(null);
    const [status, setStatus] = useState<ServiceStatus>('pending');
    const [priority, setPriority] = useState<ServicePriority>('medium');
    const [assignedTechnician, setAssignedTechnician] = useState('');
    const [location, setLocation] = useState('');
    const [estimatedCompletion, setEstimatedCompletion] = useState('');
    const [observations, setObservations] = useState('');
    const [newEquipment, setNewEquipment] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [seguimientoId, setSeguimientoId] = useState<string | null>(null);
    const [evidenciaTipo, setEvidenciaTipo] = useState<'inicio' | 'fin'>('inicio');
    const [evidencias, setEvidencias] = useState<{ id: number; url_image: string; tipo: 'inicio' | 'fin' }[]>([]);
    const [imageToDelete, setImageToDelete] = useState<{ ev: any; index: number } | null>(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([]);
    const [toolToDelete, setToolToDelete] = useState<{ item: string; index: number; id?: string } | null>(null);

    const filteredEquipment = useMemo(() => {
        if (!newEquipment.trim()) return [];
        return availableEquipment.filter(e =>
            e.status_utensilio === 'Disponible' &&
            e.name.toLowerCase().includes(newEquipment.toLowerCase())
        );
    }, [newEquipment, availableEquipment]);

    useEffect(() => {
        const loadTechnicians = async () => {
            try {
                const data = await technicianApi.getAll();
                setTechnicians(data);
            } catch (error) {
                console.error('Error cargando técnicos');
            }
        };
        loadTechnicians();
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
        setNewEquipment("");
        loadEquipment();
    }, [id]);

    useEffect(() => {
        const loadServiceEquipment = async () => {
            try {
                const data = await serviceApi.getUtensilios(id!);
                //console.log('[equipos del servicio cargados]', data);
                if (service && data.length > 0) {
                    setService(prev => prev ? {
                        ...prev,
                        equipment: data.map(e => e.tipo_utensilio || e.nombre || e.name)
                    } : null);
                }
            } catch (error) {
                console.error('Error cargando equipos del servicio');
            }
        };
        if (service && id) loadServiceEquipment();
    }, [id, service?.id]);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const data = await serviceApi.getById(id!);
                setService(data);
                setStatus(data.status);
                setPriority(data.priority);
                setAssignedTechnician(String(data.assignedTechnician || ''));
                setLocation(data.location || '');
                setEstimatedCompletion(data.estimatedCompletionDate?.split('T')[0] || '');

            } catch (error) {
                toast.error('Servicio no encontrado');
                navigate('/services');
            }
        };
        fetchService();
    }, [id, navigate]);

    useEffect(() => {
        const loadSeguimiento = async () => {
            try {
                const data = await seguimientoApi.getById(id!);
                //console.log('[seguimiento data]', data);
                const item = Array.isArray(data) ? data[0] : data;
                //console.log('[seguimiento item]', data);
                setSeguimientoId(String(item?.id ?? ''));
                setObservations(item?.observaciones ?? '');
                if (item?.fecha_fin_estimada) {
                    setEstimatedCompletion(item.fecha_fin_estimada.split('T')[0]);
                }
            } catch (error) {
                console.error('Error cargando seguimiento', error);
            }
        };
        loadSeguimiento();
    }, [id]);

    useEffect(() => {
        const loadEvidencias = async () => {
            try {
                const data = await serviceApi.getEvidencias(id!);
                setEvidencias(data);
            } catch (error) {
                console.error('Error cargando evidencias');
            }
        };
        loadEvidencias();
    }, [id]);


    if (!service) return null;

    const handleUpdateBasicInfo = async () => {
        try {
            let updated;

            if (status === 'completed' && service.status !== 'completed') {
                // Completar servicio
                updated = await serviceApi.completar(service.id, {
                    fecha_fin: new Date().toISOString().split('T')[0],
                    notas: completionNotes,
                });
            } else if (status !== service.status) {
                // Solo cambió status
                updated = await serviceApi.cambiarStatus(service.id, status);
            } else if (priority !== service.priority) {
                // Solo cambió prioridad
                updated = await serviceApi.cambiarPrioridad(service.id, priority);
            } else {
                // Cambios en otros campos
                updated = await serviceApi.update(service.id, {
                    name: service.name,
                    type: service.type,
                    description: service.description,
                    startDate: service.startDate,
                    endDate: service.endDate,
                    solicitanteId: service.solicitanteId,
                    status,
                    priority,
                    assignedTechnician: assignedTechnician || undefined,
                    location: location || undefined,
                    estimatedCompletionDate: estimatedCompletion || undefined,
                });
            }
            setService(updated);
            toast.success('Información actualizada correctamente');
            setTimeout(() => window.location.reload(), 500);
        } catch (error: any) {
            const mensaje = error.response?.data?.message || 'Error al actualizar';
            toast.error(mensaje);
        }
    };

    const handleUpdateObservations = async () => {
        if (!seguimientoId) {
            toast.error('No se encontró el registro de seguimiento');
            return;
        }
        try {
            await seguimientoApi.updateObservaciones(seguimientoId, observations);
            toast.success('Observaciones actualizadas');
        } catch (error) {
            toast.error('Error al actualizar observaciones');
        }
    };

    const handleAddEquipment = async () => {
        if (!newEquipment.trim()) {
            toast.error('Seleccione o ingrese un equipo');
            return;
        }

        try {
            // Busca el equipo por nombre para obtener su ID
            const equipo = availableEquipment.find(e => e.name === newEquipment);

            if (!equipo) {
                toast.error('Equipo no encontrado');
                return;
            }

            const updated = await serviceApi.addUtensilio(service.id, {
                utensilio_id: equipo.id,
                solicitante_id: service.solicitanteId
            });

            // Recarga equipos del servicio
            const equipos = await serviceApi.getUtensilios(service.id);
            setService(prev => prev ? {
                ...prev,
                equipment: equipos.map(e => e.tipo_utensilio || e.nombre || e.name)
            } : null);

            // Recarga equipos disponibles
            const disponibles = await utensiliosApi.getAll();
            setAvailableEquipment(Array.isArray(disponibles) ? disponibles : []);

            setNewEquipment('');
            toast.success('Equipo agregado');
        } catch (error: any) {
            console.error('[addUtensilio error]', error);
            toast.error(error.response?.data?.message || 'Error al agregar equipo');
        }
    };

    const handleRemoveEquipment = async (item: string, index: number) => {
        const equipo = availableEquipment.find(e => e.name === item);
        setToolToDelete({item, index, id: equipo?.id});
    };

    const handleUploadImage = async () => {
        if (!imageFile) {
            toast.error('Seleccione una imagen');
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onload = async () => {
            try {
                const base64Image = reader.result as string;
                await serviceApi.addEvidencia(service!.id, {
                    imagen: base64Image,
                    tipo: evidenciaTipo,
                });
                const data = await serviceApi.getEvidencias(service!.id);
                setEvidencias(data);
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                toast.success('Imagen cargada exitosamente');
            } catch (error) {
                toast.error('Error al subir imagen');
            }
        };
    };

    const handleRemoveImage = async (ev: any, index: number) => {
        try {
            await serviceApi.deleteEvidencia(service!.id, ev.id || index);
            const data = await serviceApi.getEvidencias(service!.id);
            setEvidencias(data);
            toast.success('Imagen eliminada');
        } catch (error) {
            toast.error('Error al eliminar imagen');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/services')} className="hover:bg-blue-50">
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                        <Badge className={`${getStatusColor(service.status)} border`}>
                            {getStatusLabel(service.status)}
                        </Badge>
                        <Badge className={`${getPriorityColor(service.priority)} border`}>
                            {getPriorityLabel(service.priority)}
                        </Badge>
                    </div>
                    <p className="text-gray-600 mt-1">Detalles completos del servicio</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Information */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
                            {service.status === 'completed' && (
                                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-6 w-6 text-green-600"/>
                                        <div>
                                            <p className="font-semibold text-green-900">Servicio Finalizado</p>
                                            <p className="text-sm text-green-700">
                                                Fecha de finalización: {formatDate(service.endDate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>Datos básicos del servicio</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Tipo de Servicio</p>
                                    <p className="font-semibold text-gray-900">{getTypeLabel(service.type)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">ID de Servicio</p>
                                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">#{service.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Fecha de Inicio</p>
                                    <p className="font-semibold text-gray-900">{formatDate(service.startDate)}</p>
                                </div>
                            </div>
                            {service.description && (
                                <>
                                    <Separator/>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Descripción</p>
                                        <p className="text-gray-900">{service.description}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Requester Information */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 border-b">
                            <CardTitle>Datos del Solicitante</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                        <UserIcon className="h-5 w-5 text-purple-600"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{service.requesterName}</p>
                                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                                            <p>📧 {service.requesterEmail}</p>
                                            <p>📞 {service.requesterPhone}</p>
                                            <p>🏢 {service.requesterArea}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/*Equipment/Tools Assigned */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                            <CardTitle>Equipos y Herramientas Asignadas</CardTitle>
                            <CardDescription>Recursos utilizados en este servicio</CardDescription>
                            <Label className="text-sm font-semibold">Equipos del Servicio:</Label>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {/* Equipos asignados al servicio */}
                            {service.equipment && service.equipment.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {service.equipment.map((item, index) => (
                                        <div key={index}
                                             className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"/>
                                                <span className="font-medium text-gray-900">{item}</span>
                                            </div>
                                            <Button variant="ghost" size="sm"
                                                    onClick={() => handleRemoveEquipment(item, index)}
                                                    disabled={service.status === 'completed'}>
                                                <X className="h-4 w-4 text-red-600"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Separator/>
                            {/* Agregar nuevos equipos */}
                            <div className="space-y-2">
                                <Label>Agregar Equipo/Herramienta</Label>
                                <div className="flex gap-2">
                                    <Select value={newEquipment} onValueChange={setNewEquipment}
                                            disabled={service.status === 'completed'}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Seleccionar del inventario..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(availableEquipment || [])
                                                .filter(e => e.status_utensilio === 'Disponible')
                                                .map((item) => (
                                                    <SelectItem key={item.id} value={String(item.id)}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" onClick={handleAddEquipment}
                                            disabled={service.status === 'completed'}>
                                        <Plus className="h-4 w-4 mr-1"/>Agregar
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-500">O escriba manualmente:</p>
                                    <div className="relative flex gap-2">
                                        <Input
                                            placeholder="Nombre del equipo o herramienta"
                                            value={newEquipment}
                                            onChange={(e) => setNewEquipment(e.target.value)}
                                            disabled={service.status === 'completed'}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
                                            className="flex-1"
                                        />

                                        {/* Sugerencias mientras escribe */}
                                        {filteredEquipment.length > 0 && newEquipment.trim() && (
                                            <div
                                                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                                {filteredEquipment.slice(0, 5).map((equipo) => (
                                                    <div key={equipo.id}
                                                         className="p-2 hover:bg-blue-50 cursor-pointer text-sm"
                                                         onClick={() => setNewEquipment(equipo.name)}>
                                                        {equipo.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <Button type="button" onClick={handleAddEquipment}
                                                disabled={service.status === 'completed'}>
                                            <Plus className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evidence */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50/50 border-b">
                            <CardTitle>Evidencias Fotográficas</CardTitle>
                            <CardDescription>Imágenes del trabajo (antes y después)</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {evidencias.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {evidencias.map((ev, index) => (
                                        <div key={ev.id ?? index} className="relative group">
                                            <img
                                                src={ev.url_image}
                                                alt={`Evidencia ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                onClick={() => setImageToDelete({ev, index})}
                                                disabled={service.status === 'completed'}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Cargar Imagen</Label>
                                <Select value={evidenciaTipo}
                                        onValueChange={(v) => setEvidenciaTipo(v as 'inicio' | 'fin')}
                                        disabled={service.status === 'completed'}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inicio">Inicio</SelectItem>
                                        <SelectItem value="fin">Fin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                    <input ref={fileInputRef} type="file" accept="image/*"
                                           onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                           disabled={service.status === 'completed'}
                                           className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-500 cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground"/>
                                    {imageFile && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setImageFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            disabled={service.status === 'completed'}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    )}
                                    <Button onClick={handleUploadImage} className="bg-orange-600 hover:bg-orange-700"
                                            disabled={service.status === 'completed'}>
                                        <Upload className="mr-2 h-4 w-4"/>Subir
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Status Control */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-yellow-50/50 border-b">
                            <CardTitle className="text-black">Control del Servicio</CardTitle>
                            <CardDescription className="text-gray-900">Gestionar estado y asignación</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-4">
                                <Label htmlFor="status" className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4"/>Estado
                                </Label>
                                <Select value={status} onValueChange={(value) => setStatus(value as ServiceStatus)}
                                        disabled={service.status === 'completed'}>
                                    <SelectTrigger id="status">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="in-progress">En Progreso</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                    </SelectContent>
                                </Select>
                                {status === 'completed' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="completionNotes">Notas al Completar</Label>
                                        <Textarea
                                            id="completionNotes"
                                            placeholder="Notas que se guardarán en historial..."
                                            value={completionNotes}
                                            onChange={(e) => setCompletionNotes(e.target.value)}
                                            disabled={service.status === 'completed'}
                                            rows={3}
                                            className="resize-none"/>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridad</Label>
                                <Select value={priority}
                                        onValueChange={(value) => setPriority(value as ServicePriority)}
                                        disabled={service.status === 'completed'}>
                                    <SelectTrigger id="priority">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Baja</SelectItem>
                                        <SelectItem value="medium">Media</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator/>
                            <div className="space-y-2">
                                <Label htmlFor="technician" className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4"/>Técnico Asignado
                                </Label>
                                <Select value={assignedTechnician} onValueChange={setAssignedTechnician}
                                        disabled={service.status === 'completed'}>
                                    <SelectTrigger id="technician">
                                        <SelectValue placeholder="Seleccionar técnico..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map((tech) => (
                                            <SelectItem key={tech.id} value={String(tech.id)}>
                                                {tech.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4"/>Ubicación
                                </Label>
                                <Input id="location" placeholder="ej. Planta Baja - Sección 3" value={location}
                                       onChange={(e) => setLocation(e.target.value)}
                                       disabled={service.status === 'completed'}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estimatedCompletion" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4"/>Fecha Estimada Finalización
                                </Label>
                                <Input id="estimatedCompletion" type="date" value={estimatedCompletion}
                                       onChange={(e) => setEstimatedCompletion(e.target.value)}
                                       disabled={service.status === 'completed'}/>
                            </div>
                            <Button onClick={handleUpdateBasicInfo}
                                    disabled={service.status === 'completed'}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                                <Save className="mr-2 h-4 w-4"/>Guardar Cambios
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Tracking/Observations */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-yellow-50/50 border-b">
                            <CardTitle>Seguimiento</CardTitle>
                            <CardDescription>Observaciones y notas</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-4">
                                <Label htmlFor="observations">Observaciones</Label>
                                <Textarea id="observations"
                                          placeholder="Notas sobre el progreso, problemas encontrados, soluciones aplicadas..."
                                          value={observations} onChange={(e) => setObservations(e.target.value)}
                                          disabled={service.status === 'completed'}
                                          rows={6} className="resize-none"/>
                            </div>
                            <Button onClick={handleUpdateObservations} variant="outline"
                                    disabled={service.status === 'completed'}
                                    className="w-full bg-gradient-to-r from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400 text-black font-semibold">
                                <Save className="mr-2 h-4 w-4"/> Actualizar Observaciones
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/*confirmación para eliminar imagen */}
            {imageToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">¿Eliminar imagen?</h3>
                        <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setImageToDelete(null)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    await handleRemoveImage(imageToDelete.ev, imageToDelete.index);
                                    setImageToDelete(null);
                                }}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/*confirmación para eliminar herramienta */}
            {toolToDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">¿Eliminar herramienta?</h3>
                        <p className="text-sm text-gray-600">
                            ¿Deseas eliminar "{toolToDelete.item}" del servicio?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setToolToDelete(null)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    try {
                                        await serviceApi.removeUtensilio(service!.id, toolToDelete.id);
                                        const equiposActualizados = await serviceApi.getUtensilios(service.id);
                                        setService(prev => prev ? {
                                            ...prev,
                                            equipment: equiposActualizados.map(e => e.tipo_utensilio || e.nombre || e.name)
                                        } : null);
                                        toast.success('Herramienta eliminada');
                                        setToolToDelete(null);

                                        // Recarga DESPUÉS de eliminar
                                        //setTimeout(() => window.location.reload(), 500);
                                    } catch (error) {
                                        toast.error('Error al eliminar herramienta');
                                    }
                                }}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}