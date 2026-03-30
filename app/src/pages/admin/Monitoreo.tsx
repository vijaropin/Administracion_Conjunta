import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Clock3, Download, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMonitoreoStore } from '@/store/monitoreoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formatDuration = (ms: number) => {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${ms} ms`;
};

const formatStopwatch = (ms: number) => {
  const minutos = Math.floor(ms / 60000);
  const segundos = Math.floor((ms % 60000) / 1000);
  const centesimas = Math.floor((ms % 1000) / 10);
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}.${String(centesimas).padStart(2, '0')}`;
};

const moduloLabel: Record<'pagos' | 'votaciones' | 'avisos', string> = {
  pagos: 'Pagos',
  votaciones: 'Votaciones',
  avisos: 'Avisos',
};

export function AdminMonitoreo() {
  const { user } = useAuthStore();
  const { logs, loading, error, fetchLogs } = useMonitoreoStore();
  const inicioCronometro = useRef(Date.now());
  const [cronometroMs, setCronometroMs] = useState(0);
  const [filtroModulo, setFiltroModulo] = useState<'todos' | 'pagos' | 'votaciones' | 'avisos'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'ok' | 'error'>('todos');

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchLogs(user.conjuntoId);
  }, [user?.conjuntoId, fetchLogs]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCronometroMs(Date.now() - inicioCronometro.current);
    }, 120);
    return () => window.clearInterval(timer);
  }, []);

  const logsFiltrados = useMemo(
    () =>
      logs.filter((log) => {
        const matchesModulo = filtroModulo === 'todos' || log.modulo === filtroModulo;
        const matchesEstado = filtroEstado === 'todos' || log.estado === filtroEstado;
        return matchesModulo && matchesEstado;
      }),
    [logs, filtroEstado, filtroModulo]
  );

  const promedioGeneral = useMemo(() => {
    if (logsFiltrados.length === 0) return 0;
    return Math.round(logsFiltrados.reduce((sum, log) => sum + log.duracionMs, 0) / logsFiltrados.length);
  }, [logsFiltrados]);

  const ultimaOperacion = logsFiltrados[0];

  const exportarCsv = () => {
    if (logsFiltrados.length === 0) return;
    const headers = ['Fecha', 'Módulo', 'Acción', 'Duración (ms)', 'Estado', 'Usuario', 'Detalle'];
    const escapeCsv = (value: string | number) => {
      const text = String(value ?? '');
      if (text.includes(',') || text.includes('"') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows = logsFiltrados.map((log) => [
      log.fecha.toLocaleString('es-CO'),
      moduloLabel[log.modulo],
      log.accion,
      log.duracionMs,
      log.estado,
      log.usuarioId || 'N/A',
      log.detalle || '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_tiempos_respuesta_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoreo de tiempos</h2>
          <p className="text-muted-foreground">
            Cronómetro y bitácora de ejecución para pagos, votaciones y avisos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => user?.conjuntoId && fetchLogs(user.conjuntoId)} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportarCsv} disabled={logsFiltrados.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cronómetro activo</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatStopwatch(cronometroMs)}</p>
            <p className="text-xs text-muted-foreground">Útil para tomar pantallazo de evidencia.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros visibles</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{logsFiltrados.length}</p>
            <p className="text-xs text-muted-foreground">Filtrados por módulo/estado.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDuration(promedioGeneral)}</p>
            <p className="text-xs text-muted-foreground">Tiempo promedio de respuesta.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última operación</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">{ultimaOperacion?.accion || 'Sin datos'}</p>
            <p className="text-xs text-muted-foreground">
              {ultimaOperacion ? `${moduloLabel[ultimaOperacion.modulo]} · ${formatDuration(ultimaOperacion.duracionMs)}` : 'Ejecuta acciones para medir.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Bitácora de tiempos de respuesta</CardTitle>
          <div className="flex gap-2">
            <Select value={filtroModulo} onValueChange={(value) => setFiltroModulo(value as typeof filtroModulo)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pagos">Pagos</SelectItem>
                <SelectItem value="votaciones">Votaciones</SelectItem>
                <SelectItem value="avisos">Avisos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroEstado} onValueChange={(value) => setFiltroEstado(value as typeof filtroEstado)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground mb-3">Cargando registros...</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium">Fecha</th>
                  <th className="text-left py-2 pr-3 font-medium">Módulo</th>
                  <th className="text-left py-2 pr-3 font-medium">Acción</th>
                  <th className="text-right py-2 pr-3 font-medium">Duración</th>
                  <th className="text-left py-2 pr-3 font-medium">Estado</th>
                  <th className="text-left py-2 pr-3 font-medium">Usuario</th>
                  <th className="text-left py-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logsFiltrados.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2 pr-3">{log.fecha.toLocaleString('es-CO')}</td>
                    <td className="py-2 pr-3">{moduloLabel[log.modulo]}</td>
                    <td className="py-2 pr-3">{log.accion}</td>
                    <td className="py-2 pr-3 text-right font-mono">{formatDuration(log.duracionMs)}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={log.estado === 'ok' ? 'default' : 'destructive'}>{log.estado}</Badge>
                    </td>
                    <td className="py-2 pr-3">{log.usuarioId || 'N/A'}</td>
                    <td className="py-2">{log.detalle || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && logsFiltrados.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              No hay registros para los filtros seleccionados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

