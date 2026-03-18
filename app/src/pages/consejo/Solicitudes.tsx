import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toDate = (value: unknown) => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
};

const downloadExcel = (filename: string, header: string[], rows: string[][]) => {
  let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Data"><Table>';
  xml += `<Row>${header.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>`;
  rows.forEach((row) => {
    xml += `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`).join('')}</Row>`;
  });
  xml += '</Table></Worksheet></Workbook>';
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadPdf = (filename: string, lines: string[]) => {
  const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  let y = 800;
  const content = lines.map((line) => {
    const cmd = `BT /F1 10 Tf 40 ${y} Td (${escape(line)}) Tj ET`;
    y -= 12;
    return cmd;
  }).join('\n');
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[5] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 1; i <= 5; i++) { offsets[i] = pdf.length; pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`; }
  const xrefStart = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export function ConsejoSolicitudes() {
  const { user } = useAuthStore();
  const { solicitudes, bitacora, fetchSolicitudes, fetchBitacora, registrarVotoConsejo } = useWorkflowStore();
  const { consejoMiembros, fetchConsejoMiembros } = useConjuntoStore();

  const [selectedId, setSelectedId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [folioActa, setFolioActa] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [filterMes, setFilterMes] = useState('');

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchSolicitudes(user.conjuntoId);
      void fetchConsejoMiembros(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchSolicitudes, fetchConsejoMiembros]);

  useEffect(() => {
    if (selectedId) void fetchBitacora(selectedId);
  }, [selectedId, fetchBitacora]);

  const filtered = useMemo(() => {
    return solicitudes.filter((s) => {
      const fecha = toDate(s.fechaSolicitud);
      const estadoOk = filterEstado === 'todos' || s.estado === filterEstado;
      const desdeOk = !filterDesde || fecha >= new Date(`${filterDesde}T00:00:00`);
      const hastaOk = !filterHasta || fecha <= new Date(`${filterHasta}T23:59:59`);
      const mesOk = !filterMes || `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}` === filterMes;
      return estadoOk && desdeOk && hastaOk && mesOk;
    });
  }, [solicitudes, filterEstado, filterDesde, filterHasta, filterMes]);

  const pendientes = filtered.filter((s) => s.estado === 'pendiente_consejo');
  const historial = filtered.filter((s) => s.estado !== 'pendiente_consejo');

  const consejerosActivos = Math.max(1, consejoMiembros.filter((m) => m.activo).length);
  const quorum = Math.floor(consejerosActivos / 2) + 1;

  const decidir = async (id: string, aprobar: boolean) => {
    if (!user?.id || user.tipo !== 'consejo') return;
    await registrarVotoConsejo(id, user.id, aprobar ? 'aprobar' : 'rechazar', quorum, motivo, folioActa);
    if (user?.conjuntoId) await fetchSolicitudes(user.conjuntoId);
    setMotivo('');
  };

  const exportSolicitudesExcel = () => {
    const header = ['ID', 'Tipo', 'Estado', 'Titulo', 'Monto', 'Casa', 'Aprobaciones', 'Rechazos', 'Quorum', 'FolioActa', 'Fecha'];
    const rows = filtered.map((s) => [
      s.id,
      s.tipo,
      s.estado,
      s.titulo,
      String(s.monto ?? ''),
      s.unidadObjetivo ?? '',
      String(s.consejoAprobaciones?.length || 0),
      String(s.consejoRechazos?.length || 0),
      String(s.consejoQuorumRequerido || quorum),
      s.actaFolio ?? '',
      toDate(s.fechaSolicitud).toLocaleString('es-CO'),
    ]);
    downloadExcel('solicitudes_consejo', header, rows);
  };

  const exportSolicitudesPdf = () => {
    const lines = ['SOLICITUDES CONSEJO', `Fecha: ${new Date().toLocaleDateString('es-CO')}`, `Quorum: ${quorum}/${consejerosActivos}`, '', ...filtered.map((s) => `${s.id.slice(0, 8)} | ${s.estado} | A:${s.consejoAprobaciones?.length || 0}/${s.consejoQuorumRequerido || quorum} | ${s.titulo}`)];
    downloadPdf('solicitudes_consejo', lines);
  };

  const exportBitacoraExcel = () => {
    const header = ['Fecha', 'Accion', 'Rol', 'Detalle'];
    const rows = bitacora.map((b) => [toDate(b.fecha).toLocaleString('es-CO'), b.accion, b.actorRol, b.detalle]);
    downloadExcel('bitacora_solicitud', header, rows);
  };

  const exportBitacoraPdf = () => {
    const lines = ['BITACORA LEGAL', `Solicitud: ${selectedId}`, '', ...bitacora.map((b) => `${toDate(b.fecha).toLocaleString('es-CO')} | ${b.accion} | ${b.detalle}`)];
    downloadPdf('bitacora_solicitud', lines);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Solicitudes del Comité</h2>
        <p className="text-muted-foreground">Consejo vota SI/NO por solicitud y se aprueba por quórum.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros y exportación</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-6 gap-3">
          <div>
            <Label>Estado</Label>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente_consejo">Pendiente consejo</SelectItem>
                <SelectItem value="aprobada_consejo">Aprobada consejo</SelectItem>
                <SelectItem value="rechazada_consejo">Rechazada consejo</SelectItem>
                <SelectItem value="ejecutada_admin">Ejecutada admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Desde</Label><Input type="date" value={filterDesde} onChange={(e) => setFilterDesde(e.target.value)} /></div>
          <div><Label>Hasta</Label><Input type="date" value={filterHasta} onChange={(e) => setFilterHasta(e.target.value)} /></div>
          <div><Label>Mes</Label><Input type="month" value={filterMes} onChange={(e) => setFilterMes(e.target.value)} /></div>
          <div className="md:col-span-2 flex items-end gap-2">
            <Button variant="outline" onClick={exportSolicitudesExcel}><Download className="h-4 w-4 mr-1" />Excel</Button>
            <Button variant="outline" onClick={exportSolicitudesPdf}><Download className="h-4 w-4 mr-1" />PDF</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pendientes de votación ({pendientes.length})</CardTitle>
          <p className="text-sm text-muted-foreground">Quórum requerido: {quorum} de {consejerosActivos} consejeros activos.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendientes.map((s) => {
            const votoPrefix = (user?.id || '') + '|';
            const yaAprobo = (s.consejoAprobaciones || []).some((id: string) => id.startsWith(votoPrefix));
            const yaRechazo = (s.consejoRechazos || []).some((id: string) => id.startsWith(votoPrefix));
            return (
              <div key={s.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{s.titulo}</p>
                  <Badge>{s.tipo}</Badge>
                </div>
                <p className="text-muted-foreground">{s.descripcion}</p>
                <p className="text-xs text-muted-foreground mt-1">Monto: {s.monto ? `$${s.monto.toLocaleString()}` : 'N/D'} • Casa: {s.unidadObjetivo || 'N/D'}</p>
                <p className="text-xs text-muted-foreground">Aprobaciones: {s.consejoAprobaciones?.length || 0}/{s.consejoQuorumRequerido || quorum} • Rechazos: {s.consejoRechazos?.length || 0}/{s.consejoQuorumRequerido || quorum}</p>
                <p className="text-xs text-muted-foreground">Acta folio: {s.actaFolio || 'Sin folio'} • Firmas: {s.actaFirmasConsejo?.length || 0}</p>

                <div className="mt-3 space-y-2">
                  <Label>Motivo/soporte de voto y folio</Label>
                  <Input value={selectedId === s.id ? motivo : ''} onChange={(e) => { setSelectedId(s.id); setMotivo(e.target.value); }} placeholder="Acta/fundamento" />
                  <Input value={selectedId === s.id ? folioActa : ''} onChange={(e) => { setSelectedId(s.id); setFolioActa(e.target.value); }} placeholder="Folio de acta del consejo" />
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => decidir(s.id, true)} disabled={user?.tipo !== 'consejo' || yaAprobo}>Votar SI</Button>
                  <Button size="sm" variant="outline" onClick={() => decidir(s.id, false)} disabled={user?.tipo !== 'consejo' || yaRechazo}>Votar NO</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(s.id)}>Ver bitácora</Button>
                </div>
              </div>
            );
          })}
          {pendientes.length === 0 && <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial ({historial.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {historial.map((s) => (
            <div key={s.id} className="border rounded p-2 text-sm flex items-center justify-between">
              <span>{s.titulo}</span>
              <Badge variant={s.estado === 'rechazada_consejo' ? 'destructive' : 'secondary'}>{s.estado}</Badge>
            </div>
          ))}
          {historial.length === 0 && <p className="text-sm text-muted-foreground">Sin historial.</p>}
        </CardContent>
      </Card>

      {selectedId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bitácora legal (solo lectura)</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportBitacoraExcel}>Excel</Button>
              <Button size="sm" variant="outline" onClick={exportBitacoraPdf}>PDF</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {bitacora.map((b) => (
              <div key={b.id} className="border rounded p-2 text-sm">
                <p className="font-medium">{b.accion}</p>
                <p className="text-muted-foreground">{b.detalle}</p>
                <p className="text-xs text-muted-foreground">{toDate(b.fecha).toLocaleString('es-CO')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}



