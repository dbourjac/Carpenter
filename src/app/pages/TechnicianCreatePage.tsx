import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { getTechnicians } from '../lib/storage';

export function TechnicianCreatePage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    especialidad: '',
    cargo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (!formData.especialidad.trim()) newErrors.especialidad = 'La especialidad es requerida';
    if (!formData.cargo.trim()) newErrors.cargo = 'El cargo es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Corrige los errores del formulario');
      return;
    }

    const technicians = getTechnicians();

    const newTechnician = {
      id: Date.now().toString(),
      ...formData,
    };

    technicians.push(newTechnician);
    localStorage.setItem('technicians', JSON.stringify(technicians));

    toast.success('Técnico creado correctamente');

    navigate('/technicians');
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/technicians')}
          className="hover:bg-blue-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nuevo Técnico
            </span>
          </h1>
          <p className="text-gray-600 mt-1">
            Registra un nuevo técnico en el sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* INFO */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
            <CardTitle>Información del Técnico</CardTitle>
            <CardDescription>Datos básicos del personal</CardDescription>
          </CardHeader>

          <CardContent className="pt-3 space-y-4">

            {/* NOMBRE */}
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                placeholder="ej. Juan Pérez"
                value={formData.nombre}
                onChange={(e) => updateField('nombre', e.target.value)}
                className={`h-11 ${errors.nombre ? 'border-red-500' : ''}`}
              />
              {errors.nombre && <p className="text-sm text-red-600">{errors.nombre}</p>}
            </div>

            {/* TELÉFONO */}
            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input
                placeholder="+1234567890"
                value={formData.telefono}
                onChange={(e) => updateField('telefono', e.target.value)}
                className={`h-11 ${errors.telefono ? 'border-red-500' : ''}`}
              />
              {errors.telefono && <p className="text-sm text-red-600">{errors.telefono}</p>}
            </div>

            {/* ESPECIALIDAD */}
            <div className="space-y-2">
              <Label>Especialidad *</Label>
              <Input
                placeholder="ej. Electricidad"
                value={formData.especialidad}
                onChange={(e) => updateField('especialidad', e.target.value)}
                className={`h-11 ${errors.especialidad ? 'border-red-500' : ''}`}
              />
              {errors.especialidad && <p className="text-sm text-red-600">{errors.especialidad}</p>}
            </div>

            {/* CARGO */}
            <div className="space-y-2">
            <Label>Cargo *</Label>
            <Input
                placeholder="ej. Técnico, Jefe de Taller"
                value={formData.cargo}
                onChange={(e) => updateField('cargo', e.target.value)}
                className={`h-11 ${errors.cargo ? 'border-red-500' : ''}`}
            />
            {errors.cargo && <p className="text-sm text-red-600">{errors.cargo}</p>}
            </div>

          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="flex gap-3">
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Crear Técnico
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate('/technicians')}
          >
            Cancelar
          </Button>
        </div>

      </form>
    </div>
  );
}