import { useState } from 'react';
import { FileText, Download, Printer, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { getServices } from '../lib/storage';
import { getStatusLabel, getTypeLabel, getPriorityLabel, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export function ReportsPage() {
  const services = getServices();
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [reportType, setReportType] = useState<string>('service');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });

  const selectedService = services.find(s => s.id === selectedServiceId);

  const handleGeneratePDF = () => {
    const data = getFilteredServices();

    if (data.length === 0) {
      toast.error('No hay datos para este reporte');
      return;
    }
    
    // In a real app, this would generate and download a PDF
    toast.success('Generando reporte PDF... (función de demostración)');
  };

  const handleGenerateExcel = () => {
    toast.success('Generando reporte Excel... (demo)');
  };

  const handlePrint = () => {
    if (!selectedService) {
      toast.error('Seleccione un servicio primero');
      return;
    }
    window.print();
  };

  const getFilteredServices = () => {
    const now = new Date();

    switch (reportType) {
      case 'daily':
        return services.filter(s => {
          const date = new Date(s.startDate);
          return date.toDateString() === now.toDateString();
        });

      case 'weekly':
        return services.filter(s => {
          const date = new Date(s.startDate);
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo;
        });

      case 'range':
        return services.filter(s => {
          const date = new Date(s.startDate);
          return (
            (!dateRange.start || date >= new Date(dateRange.start)) &&
            (!dateRange.end || date <= new Date(dateRange.end))
          );
        });

      case 'accumulated':
        return services;

      default:
        return selectedService ? [selectedService] : [];
    }
  };

  const stats = {
    totalServices: services.length,
    pending: services.filter(s => s.status === 'pending').length,
    inProgress: services.filter(s => s.status === 'in-progress').length,
    completed: services.filter(s => s.status === 'completed').length,
    preventive: services.filter(s => s.type === 'preventive').length,
    corrective: services.filter(s => s.type === 'corrective').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reportes
          </span>
        </h1>
        <p className="text-gray-600 mt-1">Generación de reportes y análisis del taller</p>
      </div>

      {/* Summary Statistics */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumen General
          </CardTitle>
          <CardDescription>Estadísticas globales del taller</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Servicios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalServices}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Preventivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.preventive}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Correctivos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.corrective}</p>
            </div>
          </div>
        </CardContent>
      </Card>

    <Card>
      <CardHeader>
        <CardTitle>Tipo de Reporte</CardTitle>
        <CardDescription>Selecciona cómo deseas generar el reporte</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">Por servicio</SelectItem>
            <SelectItem value="daily">Diario</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="range">Por rango de fechas</SelectItem>
            <SelectItem value="accumulated">Acumulado</SelectItem>
          </SelectContent>
        </Select>

        {reportType === 'range' && (
          <div className="flex gap-3 mt-4">
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        )}
      </CardContent>
    </Card>

      {/* Service Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Reporte por Servicio
          </CardTitle>
          <CardDescription>
            Genera un reporte detallado de un servicio específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      #{service.id} - {service.description || service.requesterName} 
                      ({formatDate(service.startDate)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>

              <Button onClick={handleGeneratePDF}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>

              <Button onClick={handleGenerateExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {selectedService && (
            <div className="border rounded-lg p-6 space-y-6 bg-white print:border-0">
              {/* Report Header */}
              <div className="text-center border-b pb-6">
                <h2 className="text-2xl font-bold text-gray-900">REPORTE DE SERVICIO</h2>
                <p className="text-gray-600 mt-2">Sistema de Gestión de Taller</p>
                <p className="text-sm text-gray-500 mt-1">
                  Generado el {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Servicio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID de Servicio</p>
                    <p className="font-medium">{selectedService.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-medium">{getTypeLabel(selectedService.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="font-medium">{getStatusLabel(selectedService.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Técnico Asignado</p>
                    <p className="font-medium">{selectedService.assignedTechnician || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Inicio</p>
                    <p className="font-medium">{formatDate(selectedService.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Fin</p>
                    <p className="font-medium">{formatDate(selectedService.endDate)}</p>
                  </div>
                </div>

                {selectedService.description && (
                  <div>
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="font-medium">{selectedService.description}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Requester Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Solicitante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium">{selectedService.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Área</p>
                    <p className="font-medium">{selectedService.requesterArea}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{selectedService.requesterPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedService.requesterEmail}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Materials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Materiales Utilizados</h3>
                {selectedService.materials.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Material</th>
                          <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Cantidad</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Unidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedService.materials.map((material, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{material.name}</td>
                            <td className="px-4 py-2 text-right">{material.quantity}</td>
                            <td className="px-4 py-2">{material.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No se registraron materiales</p>
                )}
              </div>

              <Separator />

              {/* Tools */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Herramientas Asignadas</h3>
                {selectedService.tools.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {selectedService.tools.map((tool, index) => (
                      <li key={index} className="text-gray-700">{tool}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No se registraron herramientas</p>
                )}
              </div>

              <Separator />

              {/* Evidence */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Evidencias Fotográficas</h3>
                {selectedService.evidenceImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedService.evidenceImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Evidencia ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No se cargaron evidencias</p>
                )}
              </div>

              {/* Footer */}
              <div className="border-t pt-6 mt-8 text-center text-sm text-gray-600">
                <p>Este reporte fue generado automáticamente por el Sistema de Gestión de Taller</p>
                <p className="mt-1">Fecha de generación: {new Date().toLocaleString('es-ES')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}