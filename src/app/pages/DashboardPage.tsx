import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Plus,
  FileText,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { serviceApi, getPersonal } from '../lib/api';
import { ServiceRequest } from '../lib/types';
import { getStatusLabel, getPriorityLabel, getPriorityColor, formatRelativeDate, sortServices } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useLocation } from 'react-router';

export function DashboardPage() {
  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [technicians, setTechnicians] = useState<{ id: string; nombre?: string; name?: string }[]>([]);
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          const [servicesData, techniciansData] = await Promise.all([
            serviceApi.getAll(),
            getPersonal(),
          ]);

          setServices(servicesData);
          setTechnicians(techniciansData);

        } catch (err: any) {
          console.error(err);
          setError(err?.message || 'Error al cargar datos');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [location.key]);

  const getTechnicianName = (id: string) => {
    const tech = technicians.find(t => String(t.id) === String(id));
    return tech?.nombre ?? tech?.name ?? 'Sin asignar';
  };

  const stats = useMemo(() => {
    const pending = services.filter(s => s.status === 'pending').length;
    const inProgress = services.filter(s => s.status === 'in-progress').length;
    const now = new Date();
    const completedThisMonth = services.filter(s => {
      if (s.status !== 'completed') return false;
      const date = new Date(s.endDate || s.startDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
    const highPriority = services.filter(s => s.priority === 'high').length;
    
    const byType = [
      { name: 'Preventivo', value: services.filter(s => s.type === 'preventive').length, fill: '#3b82f6' },
      { name: 'Correctivo', value: services.filter(s => s.type === 'corrective').length, fill: '#ef4444' },
      { name: 'Instalación', value: services.filter(s => s.type === 'installation').length, fill: '#8b5cf6' },
      { name: 'Otro', value: services.filter(s => s.type === 'other').length, fill: '#6b7280' },
    ];

    return { pending, inProgress, completedThisMonth, highPriority, byType };
  }, [services]);

  const statusData = [
    { name: 'Pendiente', value: stats.pending, color: '#f59e0b' },
    { name: 'En Progreso', value: stats.inProgress, color: '#3b82f6' },
    { name: 'Completado', value: stats.completedThisMonth, color: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
        <Clock className="h-6 w-6 animate-spin" />
        <span>Cargando servicios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-red-500">
        <AlertTriangle className="h-8 w-8" />
        <span className="font-medium">{error}</span>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }
 
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Panel de Control
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Resumen general del taller y servicios</p>
        </div>
        <Button 
          size="lg"
          onClick={() => window.location.href = "/services/new"}
          className="bg-gradient-to-r from-blue-600 to-blue-700 
          shadow-lg 
          transition-all duration-200 cursor-pointer

          hover:brightness-110 
          hover:shadow-2xl 
          hover:-translate-y-[2px] 
          active:scale-95"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/services?status=pending" className="block h-full">
        <Card className="interactive-card interactive-card-overlay border-0 shadow-xl ring-2 ring-orange-300/40 bg-gradient-to-br from-orange-400 to-orange-500 text-white overflow-hidden relative h-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-yellow-100">
              Pendientes
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-200" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.pending}</div>
            <div className="mt-1 space-y-1">
              <span className="text-xs text-white/80">
                {stats.pending} pendientes
              </span>

              {stats.highPriority > 0 && (
                <span className="text-xs bg-red-500/90 text-white px-2 py-0.5 rounded-full font-medium">
                  {stats.highPriority} urgente
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        </Link>

        <Link to="/services?status=in-progress" className="block h-full">
        <Card className="interactive-card interactive-card-overlay border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative h-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-blue-100">
              En Progreso
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-200" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-blue-100 mt-1">Siendo atendidos</p>
          </CardContent>
        </Card>
        </Link>

        <Link to="/services?status=completed&period=month" className="block h-full">
        <Card className="interactive-card interactive-card-overlay border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white overflow-hidden relative h-full">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-green-100">
              Completados
              <span className="block text-xs text-green-200 font-normal">
                este mes
              </span>
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-200" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stats.completedThisMonth}</div>
            <p className="text-xs text-green-100 mt-1">Servicios finalizados</p>
          </CardContent>
        </Card>
        </Link>

      </div>

      {/* Recent Services */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servicios Recientes</CardTitle>
              <CardDescription>Últimas solicitudes registradas en el sistema</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/services"}
              className="transition-all duration-200 cursor-pointer

              hover:bg-gray-200 
              hover:shadow-md 
              hover:-translate-y-[1px] 
              active:scale-95"
            >
              Ver Todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 bg-transparent">
          <div className="space-y-3 scrollbar-thin scrollbar-thumb-gray-300 pr-2">
            {services.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No hay servicios registrados
              </div>
            ) : (
              sortServices(services).slice(0, 5)
                .map((service) => (
                  <Link 
                    key={service.id} 
                    to={`/services/${service.id}`}
                    className={`block w-full p-4 border-2 rounded-xl bg-white transition-all duration-200 cursor-pointer 
                    hover:bg-gray-300 hover:shadow-xl hover:-translate-y-[2px] ${
                      service.priority === 'high'
                        ? 'border-red-400 shadow-md'
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 w-full h-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2 leading-none">

                          <div className="flex items-center gap-2">
                            {service.priority === 'high' && (
                              <span className="text-red-500 text-sm">●</span>
                            )}
                            <span className="font-semibold text-gray-900 truncate">
                              {service.name}
                            </span>
                          </div>

                          {/* STATUS */}
                          <Badge className={`${
                            service.status === 'completed'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : service.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          } border`}>
                            {getStatusLabel(service.status)}
                          </Badge>

                          {/* PRIORIDAD */}
                          <Badge
                            className={`${getPriorityColor(service.priority)} border ${
                              service.priority === 'high' ? 'animate-pulse' : ''
                            }`}
                          >
                            {getPriorityLabel(service.priority)}
                          </Badge>
                        </div>

                        {/* INFO */}
                        <p className="text-sm text-gray-600">
                          {service.requesterName} • {service.requesterArea}
                          {service.assignedTechnician && ` • Técnico: ${getTechnicianName(service.assignedTechnician)}`}
                        </p>
                      </div>

                      {/* FECHA */}
                      <div className="text-sm text-gray-500 text-right shrink-0">
                        {formatRelativeDate(service.startDate)}
                      </div>
                    </div>
                  </Link>
                ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>Vista general del estado de servicios</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50/50 border-b">
            <CardTitle>Servicios por Tipo</CardTitle>
            <CardDescription>Categorización de solicitudes</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
