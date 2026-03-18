import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Plus } from 'lucide-react';

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
  for (let i = 1; i <= 5; i++) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export function ComiteSolicitudes() {
  const { user } = useAuthStore();
  const { solicitudes, bitacora, fetchSolicitudes, fetchBitacora, crearSolicitud } = useWorkflowStore();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [form, setForm] = useState({
    tipo: 'multa_convivencia',
    titulo: '',
    descripcion: '',
    monto: '',
    unidadObjetivo: '',
    conflictoId: '',
  });

  useEffect(() => {
    if (user?.conjuntoId) void fetchSolicitudes(user.conjuntoId);
  }, [user?.conjuntoId, fetchSolicitudes]);

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

  const crear = async () => {
    if (!user?.conjuntoId || !user?.id) return;
    await crearSolicitud({
      conjuntoId: user.conjuntoId,
      tipo: form.tipo as 'caja_menor' | 'multa_convivencia',
      titulo: form.titulo,
      descripcion: form.descripcion,
      monto: form.monto ? parseFloat(form.monto) : undefined,
      unidadObjetivo: form.unidadObjetivo || undefined,
      conflictoId: form.conflictoId || undefined,
      solicitadaPor: user.id,
      solicitadaPorRol: 'comite_convivencia',
    });
    setOpen(false);
    setForm({ tipo: 'multa_convivencia', titulo: '', descripcion: '', monto: '', unidadObjetivo: '', conflictoId: '' });
    await fetchSolicitudes(user.conjuntoId);
  };

  const exportSolicitudesExcel = () => {
    const header = ['ID', 'Tipo', 'Estado', 'Titulo', 'Monto', 'NoCasa', 'Fecha'];
    const rows = filtered.map((s) => [
      s.id,
      s.tipo,
      s.estado,
      s.titulo,
      String(s.monto ?? ''),
      s.unidadObjetivo ?? '',
      toDate(s.fechaSolicitud).toLocaleString('es-CO'),
    ]);
    downloadExcel('solicitudes_comite', header, rows);
  };

  const exportSolicitudesPdf = () => {
    const lines = [
      'SOLICITUDES COMITE',
      `Fecha: ${new Date().toLocaleDateString('es-CO')}`,
      '',
      ...filtered.map((s) => `${s.id.slice(0, 8)} | ${s.estado} | ${s.tipo} | ${s.titulo}`),
    ];
    downloadPdf('solicitudes_comite', lines);
  };

  const exportBitacoraExcel = () => {
    const header = ['Fecha', 'Accion', 'Rol', 'Detalle'];
    const rows = bitacora.map((b) => [
      toDate(b.fecha).toLocaleString('es-CO'),
      b.accion,
      b.actorRol,
      b.detalle,
    ]);
    downloadExcel('bitacora_solicitud', header, rows);
  };

  const exportBitacoraPdf = () => {
    const lines = [
      'BITACORA LEGAL',
      `Solicitud: ${selectedId}`,
      '',
      ...bitacora.map((b) => `${toDate(b.fecha).toLocaleString('es-CO')} | ${b.accion} | ${b.detalle}`),
    ];
    downloadPdf('bitacora_solicitud', lines);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Solicitudes Formales</h2>
          <p className="text-muted-foreground">Comité envía solicitudes al Consejo para aprobación formal.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nueva Solicitud</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Crear solicitud Comité → Consejo</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="caja_menor">Aprobación de caja menor</SelectItem>
                    <SelectItem value="multa_convivencia">Aplicación de multa de convivencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
              <div><Label>Descripción</Label><Textarea rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monto solicitado</Label><Input type="number" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></div>
                <div><Label>No. Casa (si aplica multa)</Label><Input value={form.unidadObjetivo} onChange={(e) => setForm({ ...form, unidadObjetivo: e.target.value })} /></div>
              </div>
              <div><Label>ID Caso convivencia (opcional)</Label><Input value={form.conflictoId} onChange={(e) => setForm({ ...form, conflictoId: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={crear} disabled={!form.titulo || !form.descripcion}>Enviar al Consejo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros y exportación</CardTitle>
        </CardHeader>
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
        <CardHeader><CardTitle>Solicitudes ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((s) => (
            <button key={s.id} type="button" onClick={() => setSelectedId(s.id)} className="w-full text-left border rounded-lg p-3 hover:bg-accent/40">
              <div className="flex items-center justify-between">
                <p className="font-medium">{s.titulo}</p>
                <Badge variant={s.estado === 'rechazada_consejo' ? 'destructive' : s.estado === 'ejecutada_admin' ? 'default' : 'secondary'}>{s.estado}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{s.tipo} • {s.monto ? `$${s.monto.toLocaleString()}` : 'sin monto'} • {toDate(s.fechaSolicitud).toLocaleDateString('es-CO')}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">Sin solicitudes con filtros actuales.</p>}
        </CardContent>
      </Card>

      {selectedId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bitácora legal (inmodificable)</CardTitle>
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
            {bitacora.length === 0 && <p className="text-sm text-muted-foreground">Sin eventos.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
