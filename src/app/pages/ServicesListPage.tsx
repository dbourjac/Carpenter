import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { Plus, Filter, Search, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { getServices } from '../lib/storage';
import { getStatusLabel, getTypeLabel, getPriorityLabel, getStatusColor, getPriorityColor, formatDate } from '../lib/utils';

export function ServicesListPage() {
  const services = getServices();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.requesterArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
      const matchesType = typeFilter === 'all' || service.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || service.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [services, searchQuery, statusFilter, typeFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Servicios
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Gestión completa de solicitudes de servicio</p>
        </div>
        <Link to="/services/new">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, área, descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="preventive">Preventivo</SelectItem>
                  <SelectItem value="corrective">Correctivo</SelectItem>
                  <SelectItem value="installation">Instalación</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Prioridad</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Mostrando <span className="font-semibold text-gray-900">{filteredServices.length}</span> de {services.length} servicios
        </span>
        {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
              setPriorityFilter('all');
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No se encontraron servicios con los filtros aplicados</p>
            </CardContent>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Link key={service.id} to={`/services/${service.id}`}>
              <Card className="border-2 border-gray-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {service.name}
                        </h3>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getStatusColor(service.status)} border`}>
                            {getStatusLabel(service.status)}
                          </Badge>
                          <Badge className={`${getPriorityColor(service.priority)} border`}>
                            {getPriorityLabel(service.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeLabel(service.type)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-700">Solicitante:</span> {service.requesterName}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Área:</span> {service.requesterArea}
                        </div>
                        {service.assignedTechnician && (
                          <div>
                            <span className="font-medium text-gray-700">Técnico:</span> {service.assignedTechnician}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(service.startDate)}</span>
                        </div>
                        {service.location && (
                          <div>
                            <span className="font-medium text-gray-700">Ubicación:</span> {service.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 lg:flex-col lg:items-end shrink-0">
                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        #{service.id}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
