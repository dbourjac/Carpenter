import {useState, useEffect, useMemo} from 'react';
import {useNavigate} from 'react-router';
import {ArrowLeft, Plus, Save, X} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Textarea} from '../components/ui/textarea';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '../components/ui/select';
import {serviceApi, solicitanteApi, technicianApi, seguimientoApi, utensiliosApi} from '../lib/api';
import {ServiceType, ServicePriority, EquipmentItem} from '../lib/types';
import {toast} from 'sonner';
import {Separator} from "../components/ui/separator.tsx";

export function ServiceCreatePage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        type: 'corrective' as ServiceType,
        priority: 'medium' as ServicePriority,
        startDate: '',
        //endDate: '',
        estimatedCompletionDate: '',
        requesterName: '',
        requesterPhone: '',
        requesterEmail: '',
        requesterArea: '',
        assignedTechnician: '',
        location: '',
        description: '',
        observations: '',
        equipment: [],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [availableEquipment, setAvailableEquipment] = useState<EquipmentItem[]>([]);
    const [selectEquipment, setSelectEquipment] = useState('');
    const [manualEquipment, setManualEquipment] = useState('');

    useEffect(() => {
        const loadEquipment = async () => {
            try {
                const data = await utensiliosApi.getAll();
                setAvailableEquipment(data);
            } catch (error) {
                console.error('Error cargando equipos');
            }
        };
        loadEquipment();
    }, []);

    useEffect(() => {
        const loadTechnicians = async () => {
            try {
                const data = await technicianApi.getAll();
                setTechnicians(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error al cargar técnicos:', error);
            }
        };
        loadTechnicians();
    }, []);

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
        if (!formData.assignedTechnician.trim()) {
            newErrors.assignedTechnician = 'El técnico asignado es requerido';
        }
        if (!formData.equipment || formData.equipment.length === 0) {
            newErrors.equipment = 'Debe asignar al menos un equipo o herramienta';
        }
        if (formData.startDate && formData.estimatedCompletionDate && formData.estimatedCompletionDate < formData.startDate) {
            newErrors.endDate = 'La fecha de finalización estimada debe ser posterior a la de inicio';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const filteredEquipment = useMemo(() => {
        if (!manualEquipment.trim()) return [];
        return availableEquipment.filter(e =>
            e.status_utensilio === 'Disponible' &&
            e.name.toLowerCase().includes(manualEquipment.toLowerCase()) &&
            !formData.equipment.some(eq => eq.name === e.name)
        );
    }, [manualEquipment, availableEquipment, formData.equipment]);

    const handleAddEquipment = () => {
        const value = selectEquipment || manualEquipment;

        if (!value.trim()) {
            toast.error('Seleccione o ingrese un equipo');
            return;
        }

        const equipo = availableEquipment.find(e => e.name === value);
        const id = equipo?.id || value;
        const nombre = equipo?.name || value;

        setFormData(prev => ({
            ...prev,
            equipment: [...prev.equipment, {id: String(id), name: nombre}]
        }));
        setSelectEquipment('');
        setManualEquipment('');
    };

    const handleRemoveEquipment = (id: string, index: number) => {
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
            // 1. Crear el solicitante
            const requester = await solicitanteApi.create({
                name: formData.requesterName,
                email: formData.requesterEmail,
                phone: formData.requesterPhone,
                area: formData.requesterArea,
            });
            // 2. Crear el servicio
            const newService = await serviceApi.create({
                name: formData.name,
                type: formData.type,
                priority: formData.priority,
                status: 'pending',
                startDate: formData.startDate,
                endDate: undefined,
                estimatedCompletionDate: formData.estimatedCompletionDate || undefined,
                solicitanteId: requester.id,
                assignedTechnician: formData.assignedTechnician || undefined,
                location: formData.location || undefined,
                description: formData.description || undefined,
                observations: formData.observations || undefined,
            });
            // 3. Agregar utensilios
            if (formData.equipment && formData.equipment.length > 0) {
                for (const equipo of formData.equipment) {
                    try {
                        await serviceApi.addUtensilio(newService.id, {
                            utensilio_id: parseInt(equipo.id),
                            solicitante_id: requester.id
                        });
                    } catch (error) {
                        console.error('Error agregando utensilio:', error);
                    }
                }
            }
            toast.success('Servicio creado exitosamente');
            setTimeout(() => window.location.reload());
            navigate(`/services/${newService.id}`);
        } catch
            (error: any) {
            console.error('Error al crear servicio:', error.response?.data || error.message);
            toast.error('No se pudo conectar con el servidor');
        }
    };

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({...prev, [field]: value}));
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: ''}));
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
                    className="hover:bg-blue-50">
                    <ArrowLeft className="h-5 w-5"/>
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
                {/* Información del Servicio */}
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
                                <Select value={formData.type} onValueChange={(value) => updateField('type', value)}>
                                    <SelectTrigger id="type" className="h-11">
                                        <SelectValue/>
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
                                <Select value={formData.priority}
                                        onValueChange={(value) => updateField('priority', value)}>
                                    <SelectTrigger id="priority" className="h-11">
                                        <SelectValue/>
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
                                    className="h-11"
                                />
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

                {/* Información del Solicitante */}
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
                                {errors.requesterName &&
                                    <p className="text-sm text-red-600">{errors.requesterName}</p>}
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
                                {errors.requesterArea &&
                                    <p className="text-sm text-red-600">{errors.requesterArea}</p>}
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
                                {errors.requesterPhone &&
                                    <p className="text-sm text-red-600">{errors.requesterPhone}</p>}
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
                                {errors.requesterEmail &&
                                    <p className="text-sm text-red-600">{errors.requesterEmail}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Asignación de técnico */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                        <CardTitle>Asignación</CardTitle>
                        <CardDescription>Asignar responsable al servicio</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="assignedTechnician">Técnico Asignado *</Label>
                            <Select
                                value={formData.assignedTechnician}
                                onValueChange={(value) => updateField('assignedTechnician', value)}
                            >
                                <SelectTrigger
                                    id="assignedTechnician"
                                    className={`h-11 ${errors.assignedTechnician ? 'border-red-500' : ''}`}
                                >
                                    <SelectValue placeholder="Seleccione un técnico"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={String(tech.id)}>
                                            {tech.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.assignedTechnician && (
                                <p className="text-sm text-red-600">{errors.assignedTechnician}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="observations">Observaciones Iniciales</Label>
                            <Textarea
                                id="observations"
                                placeholder="Notas o detalles adicionales sobre el servicio..."
                                value={formData.observations}
                                onChange={(e) => updateField('observations', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Asignar Equipment/Tools*/}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50/50 border-b">
                        <CardTitle>Equipos y Herramientas Asignadas</CardTitle>
                        <CardDescription>Recursos utilizados en este servicio</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {/* Lista de equipos */}
                        {formData.equipment.length > 0 && (
                            <div className="space-y-2">
                                {formData.equipment.map((equipo, index) => (
                                    <div key={index}
                                         className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"/>
                                            <span className="font-medium text-gray-900">{equipo.name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm"
                                                onClick={() => handleRemoveEquipment(equipo.id, index)}>
                                            <X className="h-4 w-4 text-red-600"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Separator/>
                        {/* agregar equipo con Select */}
                        <div className="space-y-2">
                            <Label>Seleccionar del Inventario</Label>
                            <div className="flex gap-2">
                                <Select value={selectEquipment} onValueChange={setSelectEquipment}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Seleccionar..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableEquipment
                                            .filter(e => e.status_utensilio === 'Disponible')
                                            .filter(e => !formData.equipment.some(eq => eq.name === e.name))
                                            .map((item) => (
                                                <SelectItem key={item.id} value={item.name}>
                                                    {item.name}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                                <Button type="button" onClick={handleAddEquipment}>
                                    <Plus className="h-4 w-4 mr-1"/>Agregar
                                </Button>
                            </div>
                        </div>
                        <Separator/>
                        {/* agregar equipo con Input Manual */}
                        <div className="space-y-2">
                            <Label>O escriba manualmente</Label>
                            <div className="relative">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nombre del equipo..."
                                        value={manualEquipment}
                                        onChange={(e) => setManualEquipment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
                                        className="flex-1"
                                    />

                                    <Button type="button" onClick={handleAddEquipment}>
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </div>

                                {/* Sugerencias */}
                                {filteredEquipment.length > 0 && manualEquipment.trim() && (
                                    <div
                                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        {filteredEquipment.slice(0, 5).map((equipo) => (
                                            <div key={equipo.id}
                                                 className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-b-0"
                                                 onClick={() => setManualEquipment(equipo.name)}>
                                                {equipo.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {/* Acciones */}
                <div className="flex gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                        <Save className="mr-2 h-5 w-5"/>
                        Crear Servicio
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => navigate('/services')}>
                        Cancelar
                    </Button>
                </div>
            </form>
        </div>
    );
}