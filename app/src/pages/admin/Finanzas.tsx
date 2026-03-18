import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { useDocumentoStore } from '@/store/documentoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Receipt,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function Finanzas() {
  const { user } = useAuthStore();
  const {
    pagos,
    pagosPendientes,
    pagosPagados,
    pagosMora,
    loading,
    error,
    conceptosPago,
    cajasMenores,
    gastosCajaMenor,
    fetchPagos,
    createPago,
    updatePago,
    fetchConceptosPago,
    createConceptoPago,
    updateConceptoPago,
    fetchCajasMenores,
    fetchGastosCajaMenor,
    createCajaMenor,
    cerrarCajaMenor,
    createGastoCajaMenor,
  } = useFinancieroStore();
  const { unidades, fetchUnidades } = useConjuntoStore();
  const { subirArchivo } = useDocumentoStore();

  const isAdmin = user?.tipo === 'administrador';
  const isConsejo = user?.tipo === 'consejo';
  const isContadora = user?.tipo === 'contadora';
  const canWrite = isAdmin || isContadora;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);
  const [isConceptoDialogOpen, setIsConceptoDialogOpen] = useState(false);
  const [isCajaDialogOpen, setIsCajaDialogOpen] = useState(false);
  const [isGastoDialogOpen, setIsGastoDialogOpen] = useState(false);

  const [newPago, setNewPago] = useState({
    concepto: '',
    valor: '',
    unidadId: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    fechaVencimiento: '',
    aplicaInteresMora: false,
    tasaInteresMoraMensual: '',
  });

  const [newConcepto, setNewConcepto] = useState({
    nombre: '',
    descripcion: '',
    valorBase: '',
    aplicaInteresMora: false,
  });

  const [newCaja, setNewCaja] = useState({ montoAprobado: '', fechaAprobacion: '', observaciones: '' });
  const [newGasto, setNewGasto] = useState({ concepto: '', valor: '', fechaGasto: '', soporteNombre: '' });
  const [gastoSoporteFile, setGastoSoporteFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchPagos(user.conjuntoId);
    void fetchConceptosPago(user.conjuntoId);
    void fetchCajasMenores(user.conjuntoId);
    void fetchUnidades(user.conjuntoId);
  }, [user?.conjuntoId, fetchPagos, fetchConceptosPago, fetchCajasMenores, fetchUnidades]);

  useEffect(() => {
    if (cajasMenores[0]?.id) {
      void fetchGastosCajaMenor(cajasMenores[0].id);
    }
  }, [cajasMenores, fetchGastosCajaMenor]);

  const filteredPagos = useMemo(() => {
    return pagos.filter((pago) => {
      const matchesSearch =
        pago.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pago.unidadId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pago.consecutivoGeneral ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'todos' || pago.estado === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [pagos, searchTerm, filterStatus]);

  const totalRecaudado = pagosPagados.reduce((sum, p) => sum + p.valor, 0);
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.valor, 0);
  const totalMora = pagosMora.reduce((sum, p) => sum + p.valor, 0);

  const chartData = [
    { name: 'Pagado', value: totalRecaudado },
    { name: 'Pendiente', value: totalPendiente },
    { name: 'En Mora', value: totalMora },
  ];

  const conceptoSeleccionado = conceptosPago.find((c) => c.nombre === newPago.concepto);
  const cajaActiva = cajasMenores.find((c) => c.estado === 'abierta') ?? cajasMenores[0];

  const gastosPorCaja = useMemo(() => {
    const map = new Map<string, number>();
    gastosCajaMenor.forEach((g) => {
      map.set(g.cajaMenorId, (map.get(g.cajaMenorId) || 0) + g.valor);
    });
    return map;
  }, [gastosCajaMenor]);

  const handleCerrarCajaMenor = async (cajaId: string) => {
    if (!user?.id || !canWrite) return;
    await cerrarCajaMenor(cajaId, user.id);
  };

  const handleCreatePago = async () => {
    if (!user?.conjuntoId || !canWrite) return;

    await createPago({
      conjuntoId: user.conjuntoId,
      concepto: newPago.concepto,
      valor: parseFloat(newPago.valor),
      unidadId: newPago.unidadId,
      residenteId: newPago.unidadId,
      mes: newPago.mes,
      anio: newPago.anio,
      fechaVencimiento: new Date(newPago.fechaVencimiento),
      estado: 'pendiente',
      aplicaInteresMora: newPago.aplicaInteresMora,
      tasaInteresMoraMensual: newPago.tasaInteresMoraMensual ? parseFloat(newPago.tasaInteresMoraMensual) : undefined,
    });

    setIsPagoDialogOpen(false);
    setNewPago({
      concepto: '',
      valor: '',
      unidadId: '',
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      fechaVencimiento: '',
      aplicaInteresMora: false,
      tasaInteresMoraMensual: '',
    });
  };

  const handleMarcarPagado = async (pagoId: string) => {
    if (!canWrite) return;
    await updatePago(pagoId, { estado: 'pagado', fechaPago: new Date() });
  };

  const handleCreateConcepto = async () => {
    if (!user?.conjuntoId || !user?.id || !canWrite) return;
    await createConceptoPago({
      conjuntoId: user.conjuntoId,
      nombre: newConcepto.nombre,
      descripcion: newConcepto.descripcion,
      valorBase: newConcepto.valorBase ? parseFloat(newConcepto.valorBase) : undefined,
      aplicaInteresMora: newConcepto.aplicaInteresMora,
      activo: true,
      creadoPor: user.id,
    });
    setIsConceptoDialogOpen(false);
    setNewConcepto({ nombre: '', descripcion: '', valorBase: '', aplicaInteresMora: false });
  };

  const handleToggleConcepto = async (conceptoId: string, activo: boolean) => {
    if (!user?.id || !canWrite) return;
    await updateConceptoPago(conceptoId, { activo }, user.id, activo ? 'Reactivación de concepto' : 'Desactivación de concepto');
  };

  const handleCrearCajaMenor = async () => {
    if (!user?.conjuntoId || !user?.id || !canWrite) return;
    await createCajaMenor({
      conjuntoId: user.conjuntoId,
      montoAprobado: parseFloat(newCaja.montoAprobado),
      fechaAprobacion: new Date(newCaja.fechaAprobacion),
      aprobadoPor: user.id,
      estado: 'abierta',
      observaciones: newCaja.observaciones || undefined,
    });
    setIsCajaDialogOpen(false);
    setNewCaja({ montoAprobado: '', fechaAprobacion: '', observaciones: '' });
  };

  const handleCrearGasto = async () => {
    if (!user?.conjuntoId || !user?.id || !cajaActiva || !canWrite) return;

    let soporteUrl;
    let soporteNombre = newGasto.soporteNombre || undefined;

    if (gastoSoporteFile) {
      const ruta = `cajasMenores/${user.conjuntoId}/${cajaActiva.id}/${Date.now()}_${gastoSoporteFile.name}`;
      soporteUrl = await subirArchivo(gastoSoporteFile, ruta);
      soporteNombre = gastoSoporteFile.name;
    }

    await createGastoCajaMenor({
      cajaMenorId: cajaActiva.id,
      conjuntoId: user.conjuntoId,
      concepto: newGasto.concepto,
      valor: parseFloat(newGasto.valor),
      fechaGasto: new Date(newGasto.fechaGasto),
      soporteNombre,
      soporteUrl,
      registradoPor: user.id,
    });
    setIsGastoDialogOpen(false);
    setNewGasto({ concepto: '', valor: '', fechaGasto: '', soporteNombre: '' });
    setGastoSoporteFile(null);
  };
const descargarExcel = () => {
    const header = ['Consecutivo General', 'Consecutivo Residente', 'Concepto', 'Unidad', 'Residente', 'Valor', 'Estado', 'Fecha Vencimiento'];
    const rows = filteredPagos.map((p) => [
      p.consecutivoGeneral || '',
      p.consecutivoResidente || '',
      p.concepto,
      p.unidadId,
      p.residenteId,
      String(p.valor),
      p.estado,
      new Date(p.fechaVencimiento).toLocaleDateString('es-CO'),
    ]);

    let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Pagos"><Table>';
    xml += `<Row>${header.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>`;
    rows.forEach((row) => {
      xml += `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`).join('')}</Row>`;
    });
    xml += '</Table></Worksheet></Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarPdf = () => {
    const lines = [
      'REPORTE DE PAGOS',
      `Fecha: ${new Date().toLocaleDateString('es-CO')}`,
      '',
      'Consecutivo | Unidad | Concepto | Valor | Estado',
      ...filteredPagos.slice(0, 60).map((p) => `${p.consecutivoGeneral || '-'} | ${p.unidadId} | ${p.concepto} | ${p.valor} | ${p.estado}`),
    ];

    const escape = (text: string) =>
      text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    let y = 800;
    const content = lines.map((line) => {
      const cmd = `BT /F1 10 Tf 40 ${y} Td (${escape(line)}) Tj ET`;
      y -= 12;
      return cmd;
    }).join('\n');

    const objects = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[5] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let i = 1; i <= 5; i++) {
      offsets[i] = pdf.length;
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefStart = pdf.length;
    pdf += `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión Financiera</h2>
          <p className="text-muted-foreground">Pagos, conceptos contables y caja menor del conjunto.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando finanzas...
        </div>
      )}

        {canWrite && (
          <Dialog open={isPagoDialogOpen} onOpenChange={setIsPagoDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pago
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Pago</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Concepto *</Label>
                  <Select value={newPago.concepto} onValueChange={(value) => {
                    const concepto = conceptosPago.find((c) => c.nombre === value);
                    setNewPago((prev) => ({
                      ...prev,
                      concepto: value,
                      valor: concepto?.valorBase ? String(concepto.valorBase) : prev.valor,
                      aplicaInteresMora: concepto?.aplicaInteresMora ?? false,
                    }));
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecciona concepto" /></SelectTrigger>
                    <SelectContent>
                      {conceptosPago.filter((c) => c.activo).map((concepto) => (
                        <SelectItem key={concepto.id} value={concepto.nombre}>{concepto.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input type="number" value={newPago.valor} onChange={(e) => setNewPago({ ...newPago, valor: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>No. Casa *</Label>
                  <Select value={newPago.unidadId} onValueChange={(value) => setNewPago({ ...newPago, unidadId: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona casa" /></SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.numero}>{u.numero} {u.torre ? `- ${u.torre}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de vencimiento *</Label>
                  <Input type="date" value={newPago.fechaVencimiento} onChange={(e) => setNewPago({ ...newPago, fechaVencimiento: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPago.aplicaInteresMora}
                    onChange={(e) => setNewPago((prev) => ({ ...prev, aplicaInteresMora: e.target.checked }))}
                  />
                  <span className="text-sm">Aplicar interés de mora</span>
                </div>
                {newPago.aplicaInteresMora && (
                  <div className="space-y-2">
                    <Label>Tasa de mora mensual (%)</Label>
                    <Input type="number" value={newPago.tasaInteresMoraMensual} onChange={(e) => setNewPago({ ...newPago, tasaInteresMoraMensual: e.target.value })} />
                  </div>
                )}
                {conceptoSeleccionado && conceptoSeleccionado.historialActualizaciones.length > 0 && (
                  <p className="text-xs text-muted-foreground">Concepto con historial de cambios registrado.</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPagoDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreatePago}>Crear Pago</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      {isConsejo && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="py-4 text-sm text-amber-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Perfil de Consejo: solo lectura en finanzas. La gestión de pagos la realiza Administrador/Contadora.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecaudado)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendiente)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mora</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatCurrency(totalMora)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cartera</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalRecaudado + totalPendiente + totalMora)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conceptos de Pago</CardTitle>
            {canWrite && (
              <Dialog open={isConceptoDialogOpen} onOpenChange={setIsConceptoDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Nuevo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo concepto de pago</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={newConcepto.nombre}
                        onChange={(e) => setNewConcepto({ ...newConcepto, nombre: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={newConcepto.descripcion}
                        onChange={(e) => setNewConcepto({ ...newConcepto, descripcion: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Valor base (opcional)</Label>
                      <Input
                        type="number"
                        value={newConcepto.valorBase}
                        onChange={(e) => setNewConcepto({ ...newConcepto, valorBase: e.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={newConcepto.aplicaInteresMora}
                        onChange={(e) =>
                          setNewConcepto({ ...newConcepto, aplicaInteresMora: e.target.checked })
                        }
                      />
                      Aplica interés de mora
                    </label>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConceptoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateConcepto}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {conceptosPago.map((concepto) => (
              <div key={concepto.id} className="border rounded-md p-2 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{concepto.nombre}</p>
                  <Badge variant={concepto.activo ? 'default' : 'secondary'}>{concepto.activo ? 'Activo' : 'Inactivo'}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{concepto.descripcion || 'Sin descripción'}.</p>
                <p className="text-xs text-muted-foreground">Historial: {concepto.historialActualizaciones?.length || 0} cambios.</p>
                {canWrite && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => handleToggleConcepto(concepto.id, !concepto.activo)}
                  >
                    {concepto.activo ? 'Desactivar' : 'Reactivar'}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Caja Menor
            </CardTitle>
            {canWrite && (
              <div className="flex gap-2">
                <Dialog open={isCajaDialogOpen} onOpenChange={setIsCajaDialogOpen}>
                  <DialogTrigger asChild><Button size="sm">Nueva caja</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Aprobar caja menor</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                      <div><Label>Monto aprobado</Label><Input type="number" value={newCaja.montoAprobado} onChange={(e) => setNewCaja({ ...newCaja, montoAprobado: e.target.value })} /></div>
                      <div><Label>Fecha de aprobación</Label><Input type="date" value={newCaja.fechaAprobacion} onChange={(e) => setNewCaja({ ...newCaja, fechaAprobacion: e.target.value })} /></div>
                      <div><Label>Observaciones</Label><Input value={newCaja.observaciones} onChange={(e) => setNewCaja({ ...newCaja, observaciones: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsCajaDialogOpen(false)}>Cancelar</Button><Button onClick={handleCrearCajaMenor}>Guardar</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
                {cajaActiva && (
                  <Dialog open={isGastoDialogOpen} onOpenChange={setIsGastoDialogOpen}>
                    <DialogTrigger asChild><Button size="sm" variant="outline">Registrar gasto</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Gasto de caja menor</DialogTitle></DialogHeader>
                      <div className="space-y-3 py-2">
                        <div><Label>Concepto</Label><Input value={newGasto.concepto} onChange={(e) => setNewGasto({ ...newGasto, concepto: e.target.value })} /></div>
                        <div><Label>Valor</Label><Input type="number" value={newGasto.valor} onChange={(e) => setNewGasto({ ...newGasto, valor: e.target.value })} /></div>
                        <div><Label>Fecha gasto</Label><Input type="date" value={newGasto.fechaGasto} onChange={(e) => setNewGasto({ ...newGasto, fechaGasto: e.target.value })} /></div>
                        <div><Label>Soporte (opcional)</Label><Input type="file" accept="image/*,.pdf" onChange={(e) => setGastoSoporteFile(e.target.files?.[0] || null)} /></div>
                        <div><Label>Nombre soporte</Label><Input value={newGasto.soporteNombre} onChange={(e) => setNewGasto({ ...newGasto, soporteNombre: e.target.value })} /></div>
                      </div>
                      <DialogFooter><Button variant="outline" onClick={() => setIsGastoDialogOpen(false)}>Cancelar</Button><Button onClick={handleCrearGasto}>Guardar</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {cajasMenores.map((caja) => {
              const gastado = gastosPorCaja.get(caja.id) || 0;
              const saldo = caja.montoAprobado - gastado;
              return (
                <div key={caja.id} className="border rounded-md p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{formatCurrency(caja.montoAprobado)}</p>
                    <Badge variant={caja.estado === 'abierta' ? 'default' : 'secondary'}>{caja.estado}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Aprobada: {new Date(caja.fechaAprobacion).toLocaleDateString('es-CO')}</p>
                  <div className="text-xs mt-2 space-y-1">
                    <div className="flex justify-between"><span>Aprobado</span><span>{formatCurrency(caja.montoAprobado)}</span></div>
                    <div className="flex justify-between"><span>Gastado</span><span>{formatCurrency(gastado)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Saldo</span><span>{formatCurrency(saldo)}</span></div>
                  </div>
                  {canWrite && caja.estado === 'abierta' && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => handleCerrarCajaMenor(caja.id)}>Cerrar mes</Button>
                  )}
                </div>
              );
            })}
            <div className="border rounded-md p-2 text-sm">
              <p className="font-medium mb-2 flex items-center gap-1"><Receipt className="h-4 w-4" />Gastos recientes</p>
              {gastosCajaMenor.slice(0, 5).map((g) => (
                <div key={g.id} className="flex justify-between text-xs py-1 border-b last:border-b-0">
                  <span>{g.concepto}</span>
                  <span>{formatCurrency(g.valor)}</span>
                </div>
              ))}
              {gastosCajaMenor.length === 0 && <p className="text-xs text-muted-foreground">Sin gastos registrados.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por concepto, No. casa o consecutivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
            <SelectItem value="en_mora">En Mora</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={descargarExcel}><Download className="h-4 w-4 mr-2" />Excel</Button>
        <Button variant="outline" onClick={descargarPdf}><Download className="h-4 w-4 mr-2" />PDF</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Pagos</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Consecutivo</th>
                  <th className="text-left py-3 px-4 font-medium">Concepto</th>
                  <th className="text-left py-3 px-4 font-medium">No. Casa</th>
                  <th className="text-left py-3 px-4 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 font-medium">Vencimiento</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagos.map((pago) => (
                  <tr key={pago.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 text-xs">
                      <div>{pago.consecutivoGeneral || '-'}</div>
                      <div className="text-muted-foreground">{pago.consecutivoResidente || '-'}</div>
                    </td>
                    <td className="py-3 px-4">{pago.concepto}</td>
                    <td className="py-3 px-4">{pago.unidadId}</td>
                    <td className="py-3 px-4">{formatCurrency(pago.valor)}</td>
                    <td className="py-3 px-4">{new Date(pago.fechaVencimiento).toLocaleDateString('es-CO')}</td>
                    <td className="py-3 px-4">
                      <Badge variant={pago.estado === 'pagado' ? 'default' : pago.estado === 'en_mora' ? 'destructive' : 'secondary'}>
                        {pago.estado === 'pagado' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {pago.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
                        {pago.estado === 'en_mora' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {pago.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {pago.estado !== 'pagado' && canWrite && (
                        <Button size="sm" variant="outline" onClick={() => handleMarcarPagado(pago.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marcar Pagado
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}























