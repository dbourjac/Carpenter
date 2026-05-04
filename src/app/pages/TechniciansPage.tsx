import { Link } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { getPersonal, serviceApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus } from 'lucide-react';


export function TechniciansPage() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const personal = await getPersonal();
        setTechnicians(personal);

        const allServices = await serviceApi.getAll();
        setServices(allServices);

      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const techniciansWithLoad = useMemo(() => {
    return technicians.map((tech) => {
      const assigned = services.filter(
        (s) => String(s.assignedTechnician) === String(tech.id)
      );

      const activeServices = assigned.filter(
        (s) => s.status !== 'completed'
      ).length;

      let status = 'available';
      if (activeServices >= 3) status = 'saturated';
      else if (activeServices >= 1) status = 'busy';

      return {
        ...tech,
        activeServices,
        status,
      };
    });
  }, [technicians, services]);

  const filteredTechnicians = useMemo(() => {
    return techniciansWithLoad
      .filter((tech) =>
        (tech.nombre || tech.name || '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .sort((a, b) => {
        const order = { saturated: 0, busy: 1, available: 2 };
        return order[a.status] - order[b.status];
      });
  }, [techniciansWithLoad, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Técnicos</h1>
          <p className="text-gray-600 mt-1">
            Gestión del personal técnico del taller
          </p>
        </div>

        <Button
          onClick={() => window.location.href = '/technicians/new'}
          className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Técnico
        </Button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar técnico..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      <div className="space-y-2">
        {filteredTechnicians.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No hay técnicos encontrados
            </CardContent>
          </Card>
        ) : (
          filteredTechnicians.map((tech) => (
            <Link
              key={tech.id}
              to={`/technicians/${tech.id}`}
              className={`block w-full p-5 border-2 rounded-xl bg-white transition-all duration-200 cursor-pointer
              hover:bg-gray-300 hover:shadow-xl hover:-translate-y-[2px] ${
                tech.status === 'saturated'
                  ? 'border-red-400 shadow-md'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">
                      {tech.nombre || tech.name || 'Sin nombre'}
                    </h3>

                    {tech.status === 'available' && (
                      <Badge className="bg-green-100 text-green-800">
                        Disponible
                      </Badge>
                    )}
                    {tech.status === 'busy' && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Ocupado
                      </Badge>
                    )}
                    {tech.status === 'saturated' && (
                      <Badge className="bg-red-100 text-red-800">
                        Saturado
                      </Badge>
                    )}

                    <Badge variant="outline">
                      {tech.especialidad || 'Sin especialidad'}
                    </Badge>
                    
                    <Badge className="bg-gray-100 text-gray-800">
                      {tech.cargo}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div>📞 {tech.telefono}</div>
                    <div className="text-xs text-gray-500">
                      Trabajando en {tech.activeServices} servicios activos
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end text-sm text-gray-500">
                  <div className="bg-gray-100 px-3 py-1 rounded">
                    {tech.activeServices} servicios
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}