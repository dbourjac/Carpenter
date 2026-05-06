import { useEffect, useState } from 'react';
import { FileText, Download, Printer, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { reportesApi, serviceApi, seguimientoApi } from '../lib/api';
import { getStatusLabel, getTypeLabel, getPriorityLabel, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export function ReportsPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [reportType, setReportType] = useState<string>('daily');
  const [isGenerated, setIsGenerated] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [ranking, setRanking] = useState<any[]>([]);
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [resumenTipo, setResumenTipo] = useState<any[]>([]);
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [fullService, setFullService] = useState<any>(null);
  const [seguimiento, setSeguimiento] = useState<any>(null);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [utensilios, setUtensilios] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const uniqueTechnicians = [
    ...new Set(
      services
        .map(s => s.nombre_personal)
        .filter(Boolean)
    )
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoadingServices(true);

      try {
        let dash = null;
        let rankingData = [];
        let mant = [];
        let resumen = [];

        let servicios = [];

        try {
          servicios = await serviceApi.getAll();
        } catch (e) {
          console.error('services falló', e);
        }

        try {
          dash = await reportesApi.getDashboard();
        } catch (e) {
          console.error('dashboard falló', e);
        }

        try {
          rankingData = await reportesApi.getRankingPersonal();
        } catch (e) {
          console.error('ranking falló', e);
        }

        try {
          mant = await reportesApi.getMantenimientos();
        } catch (e) {
          console.error('mantenimientos falló', e);
        }

        try {
          resumen = await reportesApi.getResumenTipo();
        } catch (e) {
          console.error('resumen falló', e);
        }

        setServices(servicios || []);
        setDashboard(dash);
        setRanking(rankingData);
        setMantenimientos(Array.isArray(mant) ? mant : mant?.data || []);
        setResumenTipo(Array.isArray(resumen) ? resumen : []);

      } catch (err) {
        console.error(err);
        toast.error('Error cargando reportes');
      } finally {
        setLoadingServices(false);
      }
    };

    loadData();
  }, [dateRange]);

  const selectedService = services.find(s => String(s.id) === String(selectedServiceId));
    const serviceData = fullService || selectedService;
    useEffect(() => {
    if (!selectedServiceId) return;

    const loadExtraData = async () => {
      try {
        const full = await serviceApi.getById(selectedServiceId);
        setFullService(full);

        const seg = await seguimientoApi.getByServiceId(selectedServiceId);
        const item = Array.isArray(seg) ? seg[0] : seg;
        setSeguimiento(item);

        const ev = await serviceApi.getEvidencias(selectedServiceId);
        setEvidencias(Array.isArray(ev) ? ev : []);

        const res = await fetch(`/api/servicios/${selectedServiceId}/utensilios`, {
          credentials: 'include'
        });
        const data = await res.json();
        setUtensilios(Array.isArray(data) ? data : []);

      } catch (err) {
        console.error('Error cargando datos extra', err);
      }
    };

    loadExtraData();
  }, [selectedServiceId]);

  const handleGeneratePDF = () => {
    const data = getFilteredServices();
    if (data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    window.print();
  };

  const handleGenerateExcel = () => {
    const data = getFilteredServices();

    if (data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    let htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { text-align: center; }
          .section { margin-top: 20px; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td, th { border: 1px solid #ccc; padding: 6px; }
        </style>
      </head>
      <body>
        <h1>Reporte de Servicios</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
    `;

    data.forEach(s => {
      htmlContent += `
        <div class="section">
          <h2>${s.nombre_servicio || s.name || `Servicio #${s.id}`}</h2>

          <p><b>Tipo:</b> ${
            String(s.tipo_hs_servicio || '').toLowerCase().includes('prevent')
              ? 'Preventivo'
              : 'Correctivo'
          }</p>

          <p><b>Estado:</b> ${s.status_final}</p>
          <p><b>Técnico:</b> ${s.nombre_personal || 'No asignado'}</p>
          <p><b>Fecha inicio:</b> ${formatDate(s.fecha_inicio)}</p>
          <p><b>Fecha fin:</b> ${
            s.status_final === 'Completado'
              ? formatDate(s.fecha_fin)
              : 'No finalizado'
          }</p>

          <h3>Solicitante</h3>
          <p>${s.requesterName || 'N/A'} - ${s.nombre_area || ''}</p>
          <p>${s.requesterPhone || ''} - ${s.requesterEmail || ''}</p>

          <h3>Detalles</h3>
          <p><b>Observaciones:</b> ${seguimiento?.observaciones || 'Sin observaciones'}</p>
          <p><b>Descripción:</b> ${s.descripcion || ''}</p>

          <h4>Equipos</h4>
          ${
            utensilios.length > 0
              ? utensilios.map(u => `<p>${u.tipo_utensilio || u.nombre}</p>`).join('')
              : '<p>No hay equipos</p>'
          }

          <h4>Evidencias</h4>
          ${
            evidencias.length > 0
              ? evidencias.map(e => `<img src="${e.url_image}" style="width:300px;margin:5px;" />`).join('')
              : '<p>No hay evidencias</p>'
          }

          <hr/>
        </div>
      `;
    });
    htmlContent += `</body></html>`;

    const blob = new Blob(["\uFEFF" + htmlContent], {
      type: 'application/vnd.ms-excel'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reporte_servicios.xls';
    link.click();

    toast.success('Reporte Excel generado');
  };

  const handlePrint = () => {
    if (!isGenerated) {
      toast.error('Primero genera el reporte');
      return;
    }

    window.print();
  };

  const getFilteredServices = () => {
    const now = new Date();

    return services.filter(s => {
      const rawDate = s.startDate || s.fecha_inicio || s.createdAt;
    if (!rawDate) {
      return true;
    }

      const date = new Date(rawDate);

    if (isNaN(date.getTime())) {
      return true;
    }
      

      const today = new Date();
      today.setHours(0,0,0,0);

      const serviceDate = new Date(date);
      serviceDate.setHours(0,0,0,0);

      let matchesDate = true;

      if (reportType === 'daily') {
        matchesDate =
          serviceDate.getTime() === today.getTime();
      }

      if (reportType === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);

        matchesDate =
          serviceDate >= weekAgo && serviceDate <= today;
      }

      if (reportType === 'range') {
        const start = dateRange.start ? new Date(dateRange.start) : null;
        const end = dateRange.end ? new Date(dateRange.end) : null;

        if (start) start.setHours(0,0,0,0);
        if (end) end.setHours(0,0,0,0);

        matchesDate =
          (!start || serviceDate >= start) &&
          (!end || serviceDate <= end);
      }

      if (reportType === 'service') {
        matchesDate = selectedService
          ? String(s.id) === String(selectedService.id)
          : false;
      }

      const matchesTechnician =
        !technicianFilter ||
        (
          s.nombre_personal ||
          s.assignedTechnician ||
          ''
        ).toLowerCase().includes(technicianFilter.toLowerCase());

      return matchesDate && matchesTechnician;
    });
  };

  const filteredServices = getFilteredServices();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reportes
          </span>
        </h1>
        <p className="text-gray-600 mt-1">Generación de reportes y análisis del taller</p>
        {loadingServices && <p className="text-sm text-gray-500 mt-2">Cargando datos...</p>}
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
              <p className="text-2xl font-bold text-gray-900">{dashboard?.resumen?.pendientes + dashboard?.resumen?.en_progreso + dashboard?.resumen?.completados || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{dashboard?.resumen?.pendientes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{dashboard?.resumen?.en_progreso}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{dashboard?.resumen?.completados}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Preventivos</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumenTipo.find(r => r.tipo?.toLowerCase().includes('prevent'))?.total ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Correctivos</p>
              <p className="text-2xl font-bold text-gray-900">
                {resumenTipo.find(r => r.tipo?.toLowerCase().includes('repar'))?.total ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Técnicos</CardTitle>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-sm text-gray-500">Sin datos</p>
          ) : (
            ranking.map((p) => (
              <div key={p.id} className="flex justify-between border-b py-2">
                <span>{p.nombre}</span>
                <span>{p.servicios_completados} servicios</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Service Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">

          {/* IZQUIERDA */}
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />

              {reportType === 'service'
                ? 'Reporte por Servicio'
                : reportType === 'daily'
                ? 'Reporte Diario'
                : reportType === 'weekly'
                ? 'Reporte Semanal'
                : reportType === 'range'
                ? 'Reporte por Rango'
                : 'Reporte Acumulado'}
            </CardTitle>

            <CardDescription>
              {reportType === 'service'
                ? 'Genera un reporte detallado de un servicio específico'
                : 'Visualiza los servicios según el tipo de reporte seleccionado'}
            </CardDescription>
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-2">

            <Select
              value={reportType}
              onValueChange={(value) => {
                setReportType(value);
                setIsGenerated(false);
                setSelectedServiceId('');
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="range">Por rango</SelectItem>
                <SelectItem value="accumulated">Acumulado</SelectItem>
                <SelectItem value="service">Por servicio</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {reportType !== 'service' && (
                <div>
                  <label className="text-sm text-gray-600">Filtrar por técnico</label>
                </div>
              )}
              <input
                list="technicians"
                className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                placeholder="Selecciona técnico..."
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
              />

              <datalist id="technicians">
                {uniqueTechnicians.map((t, i) => (
                  <option key={i} value={t} />
                ))}
              </datalist>
            {reportType === 'range' && (
              <div className="flex flex-col sm:flex-row gap-3">

                {/* Fecha inicio */}
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Fecha inicio</label>
                  <input
                    type="date"
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white text-gray-900 appearance-none [color-scheme:light]"
                    value={dateRange.start}
                    onChange={(e) => {
                      const newStart = e.target.value;
                          if (dateRange.end && newStart > dateRange.end) {
                        toast.error('La fecha de inicio no puede ser después de la fecha de fin');
                        return;
                      }
                      setDateRange(prev => ({ ...prev, start: newStart }))
                    }}
                  />
                </div>

                {/* Fecha fin */}
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Fecha fin</label>
                  <input
                    type="date"
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm bg-white text-gray-900 appearance-none [color-scheme:light]"
                    value={dateRange.end}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                          if (dateRange.start && newEnd < dateRange.start) {
                        toast.error('La fecha de fin no puede ser anterior a la fecha de inicio');
                        return;
                      }
                      setDateRange(prev => ({ ...prev, end: newEnd }))
                    }}
                  />
                </div>
              </div>
            )}
            {reportType === 'service' && (
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <Select
                    value={selectedServiceId}
                    onValueChange={(value) => {
                      setSelectedServiceId(value);
                      setIsGenerated(false);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          {service.nombre_servicio || service.name || `Servicio #${service.id}`}
                          {' • '}
                          {formatDate(service.fecha_inicio)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (
                    <div className="text-sm text-gray-600 mt-2">
                      {selectedService.nombre_personal || 'Sin técnico'} •{' '}
                      {selectedService.requesterArea || selectedService.nombre_area || 'Sin área'}
                    </div>
                  )}
                </div>
              </div>
            )}
            {reportType === 'service' && !selectedService && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  Selecciona un servicio para ver el reporte
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleGeneratePDF}>
                <Download className="mr-2 h-4 w-4" />
                Imprimir / Guardar PDF
              </Button>

              <Button onClick={handleGenerateExcel} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          </div>

          {reportType === 'service' && serviceData && (
            <div className="print-area border rounded-xl p-8 space-y-8 bg-white shadow-sm print:border-0">
              {/* Report Header */}
              <div className="text-center border-b pb-6">
                <h2 className="text-2xl font-bold text-gray-900">REPORTE DE SERVICIO</h2>
                <p className="text-gray-600 mt-2">Agenda de Carpintería Unison</p>
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
                    <p className="font-medium">
                      {serviceData.nombre_servicio || serviceData.name || `Servicio #${serviceData.id}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-medium">{getTypeLabel(
                      serviceData.tipo_hs_servicio?.toLowerCase().includes('prevent')
                        ? 'preventive'
                        : 'corrective'
                    )}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <p className="font-medium">{getStatusLabel(
                      serviceData.status_final === 'Completado'
                        ? 'completed'
                        : serviceData.status_final === 'Pendiente'
                        ? 'pending'
                        : 'in-progress'
                    )}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Técnico Asignado</p>
                    <p className="font-medium">{serviceData.nombre_personal || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Inicio</p>
                    <p className="font-medium">{formatDate(serviceData.fecha_inicio)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Fin</p>
                    <p className="font-medium">
                      {serviceData.status_final === 'Completado'
                        ? formatDate(serviceData.fecha_fin)
                        : 'No finalizado'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Requester Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información del Solicitante</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <p className="text-sm text-gray-600">Nombre</p>
                      <p className="font-medium">
                        {serviceData.requesterName || 'No disponible'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Área</p>
                      <p className="font-medium">
                        {serviceData.requesterArea || serviceData.nombre_area || 'No disponible'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium">
                        {serviceData.requesterPhone || 'No disponible'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">
                        {serviceData.requesterEmail || 'No disponible'}
                      </p>
                  </div>
                </div>
              </div>

              <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detalles del Servicio
                  </h3>

                  {/* Observaciones */}
                  <div>
                    <p className="text-sm text-gray-600">Observaciones</p>
                    <p className="font-medium">
                      {seguimiento?.observaciones || 'Sin observaciones'}
                    </p>
                  </div>

                  {/* Descripción */}
                  <div>
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="font-medium">
                      {serviceData.description || serviceData.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  {/* Equipos */}
                  <div>
                    <p className="text-sm text-gray-600">Equipos utilizados</p>

                    {utensilios.length > 0 ? (
                      utensilios.map((u: any) => (
                        <p key={u.id} className="font-medium">
                          {u.tipo_utensilio || u.nombre || 'Sin nombre'}
                        </p>
                      ))
                    ) : (
                      <p>No hay equipos asignados</p>
                    )}
                  </div>

                  {/* Evidencias GRANDES 🔥 */}
                  <div>
                    <p className="text-sm text-gray-600">Evidencias</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {evidencias.length > 0 ? (
                        evidencias.map((e, i) => (
                          <img
                            key={i}
                            src={e.url_image}
                            className="w-full h-auto object-contain rounded-lg shadow"
                          />
                        ))
                      ) : (
                        <p>No hay evidencias</p>
                      )}
                    </div>
                  </div>
                </div>

              {/* Footer */}
              <div className="border-t pt-6 mt-8 text-center text-sm text-gray-600">
                <p>Este reporte fue generado automáticamente por la Agenda de Carpintería Unison</p>
                <p className="mt-1">Fecha de generación: {new Date().toLocaleString('es-ES')}</p>
              </div>
            </div>
          )}
          {reportType !== 'service' && (
            <div className="print-area border rounded-xl p-8 bg-white shadow-sm space-y-6 print:border-0">

              {/* HEADER */}
              <div className="text-center border-b pb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  REPORTE DE SERVICIOS
                </h2>
                <p className="text-gray-600 mt-2">
                  Agenda de Carpintería Unison
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Generado el {new Date().toLocaleDateString('es-ES')}
                </p>
              </div>

              {/* INFO */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Reporte {reportType} ({filteredServices.length} resultados)
                </h3>

                <div className="space-y-4">
                  {getFilteredServices().map(service => (
                    <div key={service.id} className="border rounded-lg p-4">
                      
                      <p className="font-semibold text-blue-700">
                        {service.nombre_servicio || service.name || `Servicio #${service.id}`}
                      </p>

                      <p><strong>Tipo:</strong> {getTypeLabel(
                          (service.tipo_hs_servicio || service.type || '').toLowerCase().includes('prevent')
                            ? 'preventive'
                            : 'corrective'
                        )}</p>
                      <p><strong>Estado:</strong> {getStatusLabel(
                          (service.status_final || service.status) === 'Completado'
                            ? 'completed'
                            : service.status_final === 'Pendiente'
                            ? 'pending'
                            : 'in-progress'
                        )}</p>
                      <p><strong>Técnico:</strong> {service.nombre_personal || 'No asignado'}</p>
                      <p><strong>Fecha inicio:</strong> {formatDate(service.fecha_inicio)}</p>
                      <p>
                        <strong>Fecha fin:</strong>{' '}
                        {service.status_final === 'Completado'
                          ? formatDate(service.fecha_fin)
                          : 'No finalizado'}
                      </p>
                      <p><strong>Descripción:</strong> {service.descripcion || service.description || 'N/A'}</p>

                      <div className="mt-2 text-sm text-gray-600">
                        {service.requesterName} • {service.requesterArea}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER */}
              <div className="border-t pt-4 text-center text-sm text-gray-600">
                <p>Reporte generado automáticamente</p>
                <p>{new Date().toLocaleString('es-ES')}</p>
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}