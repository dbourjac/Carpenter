import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPersonal, serviceApi, updatePersonal } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatDate } from '../lib/utils';
import { Link } from "react-router";

export function TechnicianDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [technician, setTechnician] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    cargo: '',
    especialidad: ''
  });
    useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔹 traer técnicos
        const personal = await getPersonal();
        const found = personal.find((t: any) => String(t.id) === id);
        setTechnician(found);
        setFormData({
          nombre: found?.nombre || '',
          telefono: found?.telefono || '',
          cargo: found?.cargo || '',
          especialidad: found?.especialidad || ''
        });

        // 🔹 traer servicios
        const allServices = await serviceApi.getAll();
        setServices(allServices);

      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

  const [services, setServices] = useState<any[]>([]);
  if (!technician) {
    return <p className="p-4">Cargando...</p>;
  }
  const assignedServices = services.filter(
    (s) => String(s.assignedTechnician) === String(technician.id)
  );

  const activeServices = assignedServices.filter(
    (s) => s.status !== 'completed'
  );

  let status = 'available';
  const handleSave = async () => {
    try {
      console.log("ENVIANDO:", formData);

      await updatePersonal(technician.id, formData);

      console.log("OK GUARDADO");

      setTechnician((prev: any) => ({
        ...prev,
        ...formData,
      }));

      setIsEditing(false);

    } catch (error) {
      console.error("ERROR GUARDAR:", error);
    }
  };
  if (activeServices.length >= 3) status = 'saturated';
  else if (activeServices.length >= 1) status = 'busy';

  return (
    <div className="space-y-3 max-w-6xl">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/technicians')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900">
              {technician.nombre}
            </h1>

            {status === 'available' && (
              <Badge className="bg-green-100 text-green-800">
                Disponible
              </Badge>
            )}
            {status === 'busy' && (
              <Badge className="bg-blue-100 text-blue-800">
                Ocupado
              </Badge>
            )}
            {status === 'saturated' && (
              <Badge className="bg-red-100 text-red-800">
                Saturado
              </Badge>
            )}
          </div>

          <p className="text-gray-500 text-sm mt-1">
            Detalles del técnico
          </p>

          <Button
            onClick={() => setIsEditing(true)}
            className="mt-2"
          >
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* IZQUIERDA */}
        <div className="lg:col-span-2 space-y-3">

          {/* INFO GENERAL */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b h-12 flex items-center px-4">
              <CardTitle className="text-base">
                Información General
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 pb-2">
                <div className="grid grid-cols-2 gap-1.5">

                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-900">
                    {isEditing ? (
                      <input
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      technician.nombre
                    )}
                  </p>
                </div>

                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="font-mono text-gray-900">
                    #{technician.id}
                  </p>
                </div>

                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Teléfono</p>
                  <p className="text-gray-900">
                    {isEditing ? (
                      <input
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      technician.telefono
                    )}
                  </p>
                </div>

                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Especialidad</p>
                  <p className="text-gray-900">
                    {isEditing ? (
                      <input
                        value={formData.especialidad}
                        onChange={(e) =>
                          setFormData({ ...formData, especialidad: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      technician.especialidad
                    )}
                  </p>
                </div>

                <div className="px-3 py-2 bg-gray-50 rounded-lg col-span-2">
                  <p className="text-xs text-gray-500">Cargo</p>
                  <p className="text-gray-900">
                    {isEditing ? (
                      <input
                        value={formData.cargo}
                        onChange={(e) =>
                          setFormData({ ...formData, cargo: e.target.value })
                        }
                        className="w-full border rounded px-2 py-1"
                      />
                    ) : (
                      technician.cargo
                    )}
                  </p>
                </div>

              </div>
              {isEditing && (
                <div className="flex gap-2 mt-3 px-3">
                  <Button onClick={handleSave}>
                    Guardar
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SERVICIOS */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 border-b h-12 flex items-center px-4">
              <CardTitle className="text-base">
                Servicios Asignados
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-1.5 space-y-1.5">
              {assignedServices.length === 0 ? (
                <p className="text-gray-500 text-center py-6">
                  No tiene servicios asignados
                </p>
              ) : (
                assignedServices.map(service => (
                  <Link
                    key={service.id}
                    to={`/services/${service.id}`}
                    className="block w-full p-3 border-2 rounded-xl bg-white 
                    transition-all duration-200 cursor-pointer
                    hover:bg-gray-300 hover:shadow-xl hover:-translate-y-[2px]
                    border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold leading-tight">
                          {service.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {service.requesterName} • {service.requesterArea}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        {formatDate(service.startDate)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

        </div>

        {/* DERECHA */}
        <div className="space-y-4">

          {/* RESUMEN */}
          <Card className="border border-gray-300 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white h-12 flex items-center px-4 py-0">
              <CardTitle className="text-white text-base leading-none flex items-center h-full">
                Resumen
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-1 pb-2 space-y-2">

              <div className="px-3 py-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  Servicios activos
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {activeServices.length}
                </p>
              </div>

              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Total servicios
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignedServices.length}
                </p>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}