import { useMemo } from 'react';
import { Link } from 'react-router';
import { Plus, Wrench } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getTechnicians } from '../lib/storage';
import { getServices } from '../lib/storage';

export function TechniciansPage() {
  const technicians = getTechnicians();
  const services = getServices();

  const getWorkload = (name: string) => {
    return services.filter(s => s.assignedTechnician === name).length;
  };

  const getStatusColor = (status: string) => {
    if (status === 'available') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'busy') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'available') return 'Disponible';
    if (status === 'busy') return 'Ocupado';
    return 'Inactivo';
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Técnicos
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión del personal técnico del taller
          </p>
        </div>

        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Técnico
        </Button>
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {technicians.map((tech) => (
          <Card
            key={tech.id}
            className="border-2 border-gray-100 bg-white transition-all duration-200 cursor-pointer 
            hover:bg-gray-100 hover:shadow-xl hover:-translate-y-[2px]"
          >
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row justify-between gap-4">

                <div className="flex-1 space-y-2">

                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">
                      {tech.name}
                    </h3>

                    <Badge className={`${getStatusColor(tech.status)} border`}>
                      {getStatusLabel(tech.status)}
                    </Badge>

                    <Badge variant="outline">
                      {tech.specialty}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>📞 {tech.phone}</div>
                    <div>✉️ {tech.email}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end text-sm text-gray-500">
                  <div className="bg-gray-100 px-3 py-1 rounded">
                    {getWorkload(tech.name)} servicios
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}