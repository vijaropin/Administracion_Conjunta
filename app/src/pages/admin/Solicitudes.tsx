import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { useDocumentoStore } from '@/store/documentoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload } from 'lucide-react';

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

export function AdminSolicitudes() {
  const { user } = useAuthStore();
  const { solicitudes, bitacora, fetchSolicitudes, fetchBitacora, ejecutarAdministrador, actualizarAnexos } = useWorkflowStore();
  const { createCajaMenor, createPago } = useFinancieroStore();
  const { subirArchivo } = useDocumentoStore();

  const [selectedId, setSelectedId] = useState('');
  const [detalle, setDetalle] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [filterMes, setFilterMes] = useState('');
  const [actaFiles, setActaFiles] = useState<Record<string, File | null>>({});
  const [soporteFiles, setSoporteFiles] = useState<Record<string, File | null>>({});

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

  const aprobadas = filtered.filter((s) => s.estado === 'aprobada_consejo');

  const cargarAnexos = async (solicitudId: string) => {
    if (!user?.id || !user?.conjuntoId) return;

    const actaFile = actaFiles[solicitudId];
    const soporteFile = soporteFiles[solicitudId];

    const anexos: any = {};

    if (actaFile) {
      const ruta = `solicitudesGestion/${user.conjuntoId}/${solicitudId}/acta_${Date.now()}_${actaFile.name}`;
      anexos.anexoActaUrl = await subirArchivo(actaFile, ruta);
      anexos.anexoActaNombre = actaFile.name;
    }

    if (soporteFile) {
      const ruta = `solicitudesGestion/${user.conjuntoId}/${solicitudId}/soporte_${Date.now()}_${soporteFile.name}`;
      anexos.anexoSoporteUrl = await subirArchivo(soporteFile, ruta);
      anexos.anexoSoporteNombre = soporteFile.name;
    }

    if (Object.keys(anexos).length === 0) return;

    await actualizarAnexos(solicitudId, user.id, 'administrador', anexos);
    await fetchSolicitudes(user.conjuntoId);
  };

  const ejecutar = async (id: string) => {
    if (!user?.id || !user?.conjuntoId) return;
    const solicitud = solicitudes.find((s) => s.id === id);
    if (!solicitud) return;

    let cajaMenorId: string | undefined;
    let pagoId: string | undefined;

    if (solicitud.tipo === 'caja_menor') {
      if (!solicitud.monto) return;
      cajaMenorId = await createCajaMenor({
        conjuntoId: user.conjuntoId,
        montoAprobado: solicitud.monto,
        fechaAprobacion: new Date(),
        aprobadoPor: user.id,
        estado: 'abierta',
        observaciones: `Creada por ejecución de solicitud ${solicitud.id}`,
      });
    }

    if (solicitud.tipo === 'multa_convivencia') {
      if (!solicitud.monto || !solicitud.unidadObjetivo) return;
      pagoId = await createPago({
        conjuntoId: user.conjuntoId,
        unidadId: solicitud.unidadObjetivo,
        residenteId: solicitud.unidadObjetivo,
        concepto: `Multa convivencia aprobada (${solicitud.id.slice(0, 6)})`,
        valor: solicitud.monto,
        fechaVencimiento: new Date(),
        estado: 'pendiente',
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        aplicaInteresMora: true,
      });
    }

    await ejecutarAdministrador(id, user.id, detalle || 'Ejecución administrativa formal', { cajaMenorId, pagoId });
    await fetchSolicitudes(user.conjuntoId);
    setDetalle('');
  };

  const exportSolicitudesExcel = () => {
    const header = ['ID', 'Tipo', 'Estado', 'Titulo', 'Monto', 'Casa', 'Acta', 'Soporte', 'Fecha'];
    const rows = filtered.map((s) => [
      s.id,
      s.tipo,
      s.estado,
      s.titulo,
      String(s.monto ?? ''),
      s.unidadObjetivo ?? '',
      s.anexoActaNombre ?? '',
      s.anexoSoporteNombre ?? '',
      toDate(s.fechaSolicitud).toLocaleString('es-CO'),
    ]);
    downloadExcel('solicitudes_admin', header, rows);
  };

  const exportSolicitudesPdf = () => {
    const lines = ['SOLICITUDES ADMIN', `Fecha: ${new Date().toLocaleDateString('es-CO')}`, '', ...filtered.map((s) => `${s.id.slice(0, 8)} | ${s.estado} | ${s.titulo}`)];
    downloadPdf('solicitudes_admin', lines);
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
        <h2 className="text-3xl font-bold tracking-tight">Ejecución de Solicitudes</h2>
        <p className="text-muted-foreground">Administrador ejecuta lo aprobado por Consejo y deja trazabilidad legal.</p>
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
        <CardHeader><CardTitle>Aprobadas por Consejo ({aprobadas.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {aprobadas.map((s) => {
            const faltanActa = s.requiereActa && !s.anexoActaUrl;
            const faltanSoporte = s.requiereSoporte && !s.anexoSoporteUrl;
            const bloqueada = faltanActa || faltanSoporte;

            return (
              <div key={s.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{s.titulo}</p>
                  <Badge>{s.tipo}</Badge>
                </div>
                <p className="text-muted-foreground">{s.descripcion}</p>
                <p className="text-xs text-muted-foreground mt-1">Monto: {s.monto ? `$${s.monto.toLocaleString()}` : 'N/D'} • Casa: {s.unidadObjetivo || 'N/D'}</p>

                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label>Acta (PDF/imagen)</Label>
                    <Input type="file" accept="application/pdf,image/*" onChange={(e) => setActaFiles((prev) => ({ ...prev, [s.id]: e.target.files?.[0] || null }))} />
                    {s.anexoActaUrl && <a className="text-xs underline text-primary" href={s.anexoActaUrl} target="_blank" rel="noreferrer">Ver acta cargada</a>}
                  </div>
                  <div>
                    <Label>Soporte (PDF/imagen)</Label>
                    <Input type="file" accept="application/pdf,image/*" onChange={(e) => setSoporteFiles((prev) => ({ ...prev, [s.id]: e.target.files?.[0] || null }))} />
                    {s.anexoSoporteUrl && <a className="text-xs underline text-primary" href={s.anexoSoporteUrl} target="_blank" rel="noreferrer">Ver soporte cargado</a>}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => cargarAnexos(s.id)}>
                    <Upload className="h-4 w-4 mr-1" />Cargar anexos
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  <Label>Detalle de ejecución</Label>
                  <Input value={selectedId === s.id ? detalle : ''} onChange={(e) => { setSelectedId(s.id); setDetalle(e.target.value); }} placeholder="Ej: acto administrativo, referencia de ejecución" />
                </div>

                {bloqueada && (
                  <p className="text-xs text-red-600 mt-2">Ejecución bloqueada: faltan anexos obligatorios (acta y/o soporte).</p>
                )}

                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => ejecutar(s.id)} disabled={bloqueada}>Ejecutar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(s.id)}>Ver bitácora</Button>
                </div>
              </div>
            );
          })}
          {aprobadas.length === 0 && <p className="text-sm text-muted-foreground">No hay solicitudes aprobadas pendientes de ejecución.</p>}
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
