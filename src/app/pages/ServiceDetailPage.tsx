import {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router';
import {ArrowLeft, Save, Plus, X, Upload, Trash2, MapPin, Calendar, User as UserIcon, AlertCircle} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {Badge} from '../components/ui/badge';
import {Separator} from '../components/ui/separator';
import {Textarea} from '../components/ui/textarea';
import { seguimientoApi, serviceApi, getPersonal, utensiliosApi } from '../lib/api';
import {getEquipment} from '../lib/storage';
import {
    getStatusLabel,
    getTypeLabel,
    getPriorityLabel,
    getStatusColor,
    getPriorityColor,
    formatDate
} from '../lib/utils';
import {ServiceStatus, ServicePriority, ServiceRequest} from '../lib/types';
import {toast} from 'sonner';
import { EquipmentItem } from '../lib/types';

const isUnderMaintenance = (item: EquipmentItem) => {
  if (!item.nextMaintenanceDate) return false;

  const now = new Date();
  const date = new Date(item.nextMaintenanceDate);

  return now >= date;
};

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
    const [imageToDelete, setImageToDelete] = useState<{ ev: any } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([]);
    const [serviceEquipment, setServiceEquipment] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        const loadTechnicians = async () => {
            try {
                const data = await getPersonal();
                setTechnicians(data);
            } catch (error) {
                console.error('Error cargando técnicos');
            }
        };
        loadTechnicians();
    }, []);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const data = await serviceApi.getById(id!);
                setService(data);
                setStatus(data.status);
                setPriority(data.priority);
                setAssignedTechnician(String(data.assignedTechnician || ''));
                setLocation(data.location || '');
                setEstimatedCompletion(
                    data.estimatedCompletionDate
                        ? data.estimatedCompletionDate.split('T')[0]
                        : ''
                );
            } catch (error) {
                toast.error('Servicio no encontrado');
                navigate('/services');
            }
        };
        fetchService();
    }, [id, navigate]);

    useEffect(() => {
        const loadServiceEquipment = async () => {
            try {
            const res = await fetch(`/api/servicios/${id}/utensilios`, {
                credentials: 'include'
            });
            const data = await res.json();

            const utensilios = Array.isArray(data)
            ? data
            : Array.isArray(data.utensilios)
            ? data.utensilios
            : Array.isArray(data.data)
            ? data.data
            : [];

            setServiceEquipment(utensilios);
            } catch (error) {
            console.error('Error cargando utensilios del servicio');
            setServiceEquipment([]);
            }
        };

        if (id) loadServiceEquipment();
    }, [id]);

    useEffect(() => {
        const loadSeguimiento = async () => {
            try {
                const data = await seguimientoApi.getByServiceId(id!);

                const item = Array.isArray(data) ? data[0] : data;

                if (!item) {
                console.warn('No hay seguimiento para este servicio');
                return;
                }

                setSeguimientoId(String(item.id));
                setObservations(item.observaciones || '');

                if (item?.fecha_fin_estimada) {
                setEstimatedCompletion(
                    item.fecha_fin_estimada
                        ? item.fecha_fin_estimada.split('T')[0]
                        : ''
                );
                }

            } catch (error) {
                console.error('Error cargando seguimiento');
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
    const evidenciasInicio = evidencias.filter(e => e.tipo === 'inicio');
    const evidenciasFin = evidencias.filter(e => e.tipo === 'fin');

    const handleUpdateBasicInfo = async () => {
        try {
            if (seguimientoId) {
            await seguimientoApi.update(seguimientoId, {
                fecha_fin_estimada: estimatedCompletion || null,
                observaciones: observations || null,
                personal_id: assignedTechnician || null,
                ubicacion: location || null
            });
            }
            if (status === 'completed' && service.status !== 'completed') {
            await serviceApi.completar(
                service.id,
                new Date().toISOString().split('T')[0]
            );
            }
            await serviceApi.update(service.id, {
            name: service.name,
            type: service.type,
            description: service.description,
            startDate: service.startDate,
            endDate: service.endDate,
            solicitanteId: service.solicitanteId,
            status,
            priority,
            assignedTechnician: assignedTechnician || null,
            location: location || null,
            estimatedCompletionDate: estimatedCompletion || null,
            });

            const refreshed = await serviceApi.getById(service.id);
            const seguimientoData = await seguimientoApi.getByServiceId(service.id);
            const item = Array.isArray(seguimientoData) ? seguimientoData[0] : seguimientoData;

            if (item?.fecha_fin_estimada) {
            setEstimatedCompletion(
                item.fecha_fin_estimada
                    ? item.fecha_fin_estimada.split('T')[0]
                    : ''
            );
            }
            setService(refreshed);
            setStatus(refreshed.status);
            setPriority(refreshed.priority);

            toast.success('Información actualizada correctamente');

        } catch (error) {
            toast.error('Error al actualizar');
        }
        };

    const handleUpdateObservations = async () => {
        if (!seguimientoId) {
            toast.error('No se encontró el registro de seguimiento');
            return;
        }
        try {
            await seguimientoApi.updateObservaciones(seguimientoId, {
                observaciones: observations
            });
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
            const updated = await serviceApi.addUtensilio(service.id, {
                utensilio_id: Number(newEquipment),
                personal_id: assignedTechnician ? assignedTechnician : undefined,
                solicitante_id: service.solicitanteId || undefined
                });
                const selectedItem = availableEquipment.find(
                    e => String(e.id) === String(newEquipment)
                    );

                    if (!selectedItem) {
                    toast.error('Equipo no encontrado');
                    return;
                    }

                    await utensiliosApi.update(String(newEquipment), {
                        name: selectedItem.name,
                        type: selectedItem.type,
                        available: false,

                        solicitante_id: service.solicitanteId || null,
                        operador_id: assignedTechnician || null
                    });
            const res = await fetch(`/api/servicios/${service.id}/utensilios`, {
                credentials: 'include'
            });
            const data = await res.json();

            const utensilios = Array.isArray(data)
            ? data
            : Array.isArray(data.utensilios)
            ? data.utensilios
            : Array.isArray(data.data)
            ? data.data
            : [];

            setServiceEquipment(utensilios);
            const updatedEquipment = await utensiliosApi.getAll();

            setAvailableEquipment(
            Array.isArray(updatedEquipment)
                ? updatedEquipment
                : []
            );

            setNewEquipment('');

            toast.success('Equipo agregado correctamente');
        } catch (error) {
            toast.error('Error al agregar equipo');
        }
    };

    const handleRemoveEquipment = async (utensilioId: number) => {
        try {
            await serviceApi.removeUtensilio(service!.id, utensilioId);
            const selectedItem = availableEquipment.find(
                e => String(e.id) === String(utensilioId)
                );

                if (selectedItem) {
                await utensiliosApi.update(String(utensilioId), {
                    name: selectedItem.name,
                    type: selectedItem.type,
                    available: true,

                    solicitante_id: null,
                    operador_id: null
                });
            }

            const res = await fetch(`/api/servicios/${service!.id}/utensilios`, {
                credentials: 'include'
            });
            const data = await res.json();

            const utensilios = Array.isArray(data)
            ? data
            : Array.isArray(data.utensilios)
            ? data.utensilios
            : Array.isArray(data.data)
            ? data.data
            : [];

            setServiceEquipment(utensilios);

            toast.success('Equipo desasignado');
        } catch (error) {
            toast.error('Error al eliminar equipo');
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) setImageFile(file);
        };

        const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
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
                setEvidencias(Array.isArray(data) ? data : []);
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                toast.success('Imagen cargada exitosamente');
            } catch (error) {
                toast.error('Error al subir imagen');
            }
        };
    };

    const handleRemoveImage = async (ev: any) => {
        try {
            await serviceApi.deleteEvidencia(service!.id, ev.id);

            const data = await serviceApi.getEvidencias(service!.id);
            setEvidencias(Array.isArray(data) ? data : []);

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
                        <h1 className="text-3xl font-bold text-gray-900">
                            {service.nombre_servicio || service.name}
                        </h1>
                        <Badge className={`${getStatusColor(service.status)} border`}>
                            {getStatusLabel(service.status)}
                        </Badge>
                        <Badge className={`${getPriorityColor(service.priority)} border`}>
                            {getPriorityLabel(service.priority)}
                        </Badge>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                                const confirmDelete = window.confirm('¿Eliminar este servicio?');

                                if (!confirmDelete) return;

                                try {
                                await serviceApi.remove(service.id);
                                toast.success('Servicio eliminado');
                                navigate('/services');
                                } catch (error) {
                                toast.error('Error al eliminar servicio');
                                }
                            }}
                            >
                            Eliminar
                        </Button>
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
                                    <p className="font-semibold text-green-900">Servicio Finalizado</p>
                                    <p className="text-sm text-green-700">
                                        Fecha de finalización: {formatDate(service.endDate)}
                                    </p>
                                </div>
                            )}
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>Datos básicos del servicio</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Tipo de Servicio</p>
                                    <p className="font-semibold text-gray-900">{service.type ? getTypeLabel(service.type) : 'Sin tipo'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">ID de Servicio</p>
                                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                                        #{service.id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Fecha de Inicio</p>
                                    <p className="font-semibold text-gray-900">{formatDate(service.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Fecha de Fin</p>
                                    <p className="font-semibold text-gray-900">
                                        {service.status === 'completed'
                                            ? formatDate(service.endDate)
                                            : 'Aún no finalizado'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Fecha Estimada Finalización</p>
                                    <p className="font-semibold text-gray-900">
                                        {estimatedCompletion
                                            ? new Date(
                                                estimatedCompletion + 'T12:00:00'
                                                ).toLocaleDateString('es-MX')
                                            : 'No definida'}
                                    </p>
                                </div>
                            </div>
                            <Separator/>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Descripción</p>
                              <p className="text-gray-900">
                                {service.description || 'Sin descripción'}
                              </p>
                            </div>
                                <Separator/>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Observaciones</p>
                                    <p className="text-gray-900">
                                    {observations || 'Sin observaciones'}
                                    </p>
                                </div>
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

                    {/* Equipment/Tools Assigned */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                            <CardTitle>Equipos y Herramientas Asignadas</CardTitle>
                            <CardDescription>Recursos utilizados en este servicio</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {serviceEquipment.length > 0 && (
                                <div className="space-y-2">
                                    {serviceEquipment.map((item: any, index) => (
                                        <div key={index}
                                             className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"/>
                                                <span className="font-medium text-gray-900">{item.tipo_utensilio || item.nombre || 'Sin nombre'}</span>
                                            </div>
                                            <Button variant="ghost" size="sm"
                                                    onClick={() => handleRemoveEquipment(item.id)}>
                                                <X className="h-4 w-4 text-red-600"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Separator/>
                            <div className="space-y-2">
                                <Label>Agregar Equipo/Herramienta</Label>
                                <div
                                className="flex gap-2 border-2 border-dashed border-gray-300 p-3 rounded-lg hover:border-orange-400 transition"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                >
                                    <Select value={newEquipment} onValueChange={setNewEquipment}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Seleccionar del inventario..."/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableEquipment.filter(e => e.available && !isUnderMaintenance(e)).map((item) => (
                                                <SelectItem key={item.id} value={String(item.id)}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleAddEquipment}>
                                        <Plus className="h-4 w-4 mr-1"/>Agregar
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">O escriba manualmente:</p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nombre del equipo o herramienta"
                                        value={newEquipment}
                                        onChange={(e) => setNewEquipment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
                                    />
                                    <Button onClick={handleAddEquipment}>
                                        <Plus className="h-4 w-4"/>
                                    </Button>
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
                            {/* INICIO */}
                                {evidenciasInicio.length > 0 && (
                                <div>
                                    <p className="font-semibold text-sm mb-2 text-gray-700">Antes</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {evidenciasInicio.map((ev: any) => (
                                        <div
                                        key={ev.id}
                                        className="relative group transition-opacity duration-300 hover:opacity-80"
                                        >
                                        <img
                                        src={ev.url_image}
                                        onClick={() => setPreviewImage(ev.url_image)}
                                        className="w-full h-32 object-cover rounded-lg border cursor-zoom-in hover:scale-105 transition"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-2 right-2 bg-white/80 hover:bg-white shadow rounded-full"
                                            onClick={() => setImageToDelete({ ev })}
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                )}

                                {/* FIN */}
                                {evidenciasFin.length > 0 && (
                                <div>
                                    <p className="font-semibold text-sm mb-2 text-gray-700">Después</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {evidenciasFin.map((ev) => (
                                        <div
                                        key={ev.id}
                                        className="relative group transition-opacity duration-300 hover:opacity-80"
                                        >
                                        <img
                                        src={ev.url_image}
                                        onClick={() => setPreviewImage(ev.url_image)}
                                        className="w-full h-32 object-cover rounded-lg border cursor-zoom-in hover:scale-105 transition"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute top-2 right-2 bg-white/80 hover:bg-white shadow rounded-full"
                                            onClick={() => setImageToDelete({ ev })}
                                        >
                                            <X className="h-4 w-4 text-red-600" />
                                        </Button>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                                )}
                            <div className="space-y-2">
                                <Label>Cargar Imagen</Label>
                                <Select value={evidenciaTipo}
                                        onValueChange={(v) => setEvidenciaTipo(v as 'inicio' | 'fin')}>
                                    <SelectTrigger>
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inicio">Inicio</SelectItem>
                                        <SelectItem value="fin">Fin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-500 cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground"
                                    />
                                    {imageFile && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setImageFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                        >
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    )}
                                    <Button onClick={handleUploadImage} className="bg-orange-600 hover:bg-orange-700">
                                        <Upload className="mr-2 h-4 w-4"/>Subir
                                    </Button>
                                </div>
                                {imageFile && (
                                    <div className="mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Vista previa:</p>
                                        <img
                                        src={URL.createObjectURL(imageFile)}
                                        className="w-32 h-32 object-cover rounded-lg border"
                                        />
                                    </div>
                                )}
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
                                <Select value={status} onValueChange={(value) => setStatus(value as ServiceStatus)}>
                                    <SelectTrigger id="status">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="in-progress">En Progreso</SelectItem>
                                        <SelectItem value="completed">Completado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Prioridad</Label>
                                <Select value={priority}
                                        onValueChange={(value) => setPriority(value as ServicePriority)}>
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
                                <Select value={assignedTechnician} onValueChange={setAssignedTechnician}>
                                    <SelectTrigger id="technician">
                                        <SelectValue placeholder="Seleccionar técnico..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map((tech) => (
                                            <SelectItem key={tech.id} value={String(tech.id)}>
                                                {tech.name || tech.nombre}
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
                                       onChange={(e) => setLocation(e.target.value)}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estimatedCompletion" className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4"/>Fecha Estimada Finalización
                                </Label>
                                <Input
                                    id="estimatedCompletion"
                                    type="date"
                                    value={estimatedCompletion || ''}
                                    onChange={(e) => {
                                        console.log('📅 nueva fecha estimada:', e.target.value);
                                        setEstimatedCompletion(e.target.value);
                                    }}
                                    />
                            </div>
                            <Button onClick={handleUpdateBasicInfo}
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
                                          rows={6} className="resize-none"/>
                                <p className="text-xs text-gray-500">
                                Recuerda guardar para aplicar los cambios
                                </p>
                            </div>
                            <Button onClick={handleUpdateObservations} variant="outline"
                                    className="w-full bg-gradient-to-r from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400 text-black font-semibold">
                                <Save className="mr-2 h-4 w-4"/> Actualizar Observaciones
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/*confirmación para eliminar imagen */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                    src={previewImage}
                    className="max-h-[90%] max-w-[90%] rounded-lg shadow-xl"
                    />
                </div>
            )}
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
                                    await handleRemoveImage(imageToDelete.ev);
                                    setImageToDelete(null);
                                }}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}