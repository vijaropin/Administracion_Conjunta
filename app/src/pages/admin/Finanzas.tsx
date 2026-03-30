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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { exportarBackendPagos } from '@/lib/backend';
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
    registrarPago,
    registrarPagosLote,
    fetchConceptosPago,
    createConceptoPago,
    updateConceptoPago,
    fetchCajasMenores,
    fetchGastosCajaMenor,
    createCajaMenor,
    cerrarCajaMenor,
    createGastoCajaMenor,
    deleteConceptoPago,
  } = useFinancieroStore();
  const { unidades, fetchUnidades } = useConjuntoStore();
  const { subirArchivo } = useDocumentoStore();

  const isAdmin = user?.tipo === 'administrador';
  const isConsejo = user?.tipo === 'consejo';
  const isContadora = user?.tipo === 'contadora';
  const canConfigFinanciera = isAdmin;
  const canGestionCartera = isAdmin || isContadora;
  const defaultVigenciaDesde = new Date().toISOString().slice(0, 10);
  const defaultVigenciaHasta = `${new Date().getFullYear()}-12-31`;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);
  const [isConceptoDialogOpen, setIsConceptoDialogOpen] = useState(false);
  const [isCajaDialogOpen, setIsCajaDialogOpen] = useState(false);
  const [isGastoDialogOpen, setIsGastoDialogOpen] = useState(false);
  const [selectedPagos, setSelectedPagos] = useState<string[]>([]);

  const [newPago, setNewPago] = useState({
    concepto: '',
    conceptoId: '',
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
    fechaVigenciaDesde: defaultVigenciaDesde,
    fechaVigenciaHasta: defaultVigenciaHasta,
  });


  const [isEditarConceptoDialogOpen, setIsEditarConceptoDialogOpen] = useState(false);
  const [conceptoEditando, setConceptoEditando] = useState<{
    id: string;
    nombre: string;
    descripcion: string;
    valorBase: string;
    aplicaInteresMora: boolean;
    fechaVigenciaDesde: string;
    fechaVigenciaHasta: string;
  } | null>(null);

  const [conceptoAEliminar, setConceptoAEliminar] = useState<{ id: string; nombre: string } | null>(null);

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

  const todosSeleccionados =
    filteredPagos.length > 0 && filteredPagos.every((p) => selectedPagos.includes(p.id));

  const totalRecaudado = pagosPagados.reduce((sum, p) => sum + p.valor, 0);
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.valor, 0);
  const totalMora = pagosMora.reduce((sum, p) => sum + p.valor, 0);

  const chartData = [
    { name: 'Pagado', value: totalRecaudado },
    { name: 'Pendiente', value: totalPendiente },
    { name: 'En Mora', value: totalMora },
  ];

  const conceptoSeleccionado = conceptosPago.find((c) => c.id === newPago.conceptoId);
  const cajaActiva = cajasMenores.find((c) => c.estado === 'abierta') ?? cajasMenores[0];

  const conceptosDisponiblesParaPago = useMemo(() => {
    const ahora = new Date();
    return conceptosPago.filter((c) => {
      if (!c.activo) return false;
      if (c.fechaVigenciaDesde) {
        const desde = new Date(c.fechaVigenciaDesde);
        if (ahora < desde) return false;
      }
      if (c.fechaVigenciaHasta) {
        const hasta = new Date(c.fechaVigenciaHasta);
        if (ahora > hasta) return false;
      }
      return true;
    });
  }, [conceptosPago]);

  const conceptoCountPorNombre = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of conceptosPago) {
      const key = c.nombre.trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [conceptosPago]);

  const gastosPorCaja = useMemo(() => {
    const map = new Map<string, number>();
    gastosCajaMenor.forEach((g) => {
      map.set(g.cajaMenorId, (map.get(g.cajaMenorId) || 0) + g.valor);
    });
    return map;
  }, [gastosCajaMenor]);

  const unidadLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    unidades.forEach((u) => {
      map.set(u.id, `${u.numero}${u.torre ? ` - ${u.torre}` : ''}`);
    });
    return map;
  }, [unidades]);

  const handleCerrarCajaMenor = async (cajaId: string) => {
    if (!user?.id || !canGestionCartera) return;
    await cerrarCajaMenor(cajaId, user.id);
  };

  const handleCreatePago = async () => {
    if (!user?.conjuntoId || !canConfigFinanciera) return;
    const unidadSeleccionada = unidades.find((u) => u.id === newPago.unidadId);
    const residenteId = unidadSeleccionada?.residenteId ?? newPago.unidadId;
    const today = new Date();
    const fechaPagoOportuno = new Date(newPago.fechaVencimiento);
    if (Number.isNaN(fechaPagoOportuno.getTime()) || fechaPagoOportuno < new Date(today.toDateString())) {
      window.alert('La fecha de pago oportuno debe ser vigente (hoy o futura).');
      return;
    }
    try {
      await createPago({
        conjuntoId: user.conjuntoId,
        concepto: newPago.concepto,
        valor: parseFloat(newPago.valor),
        unidadId: newPago.unidadId,
        residenteId,
        mes: newPago.mes,
        anio: newPago.anio,
        fechaVencimiento: fechaPagoOportuno,
        estado: 'pendiente',
        aplicaInteresMora: newPago.aplicaInteresMora,
        ...(newPago.tasaInteresMoraMensual
          ? { tasaInteresMoraMensual: parseFloat(newPago.tasaInteresMoraMensual) }
          : {}),
      });

      setIsPagoDialogOpen(false);
      setNewPago({
        concepto: '',
        conceptoId: '',
        valor: '',
        unidadId: '',
        mes: new Date().getMonth() + 1,
        anio: new Date().getFullYear(),
        fechaVencimiento: '',
        aplicaInteresMora: false,
        tasaInteresMoraMensual: '',
      });
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo crear el pago');
    }
  };

  const handleMarcarPagado = async (pagoId: string) => {
    if (!canGestionCartera) return;
    if (!user?.id) return;
    const confirma = window.confirm('¿Está seguro de marcar este pago como pagado?');
    if (!confirma) return;
    const today = new Date().toISOString().slice(0, 10);
    const fechaInput = window.prompt('Ingrese la fecha de cruce (YYYY-MM-DD):', today);
    if (!fechaInput) return;
    const fechaCruce = new Date(`${fechaInput}T00:00:00`);
    if (Number.isNaN(fechaCruce.getTime())) {
      window.alert('Fecha de cruce inválida.');
      return;
    }
    try {
      await registrarPago(pagoId, 'efectivo', user.id, undefined, fechaCruce);
      window.alert('Pago registrado correctamente.');
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo registrar el pago');
    }
  };

  const handleMarcarPagadoLote = async () => {
    if (!canGestionCartera || !user?.id) return;
    if (selectedPagos.length === 0) return;
    const confirma = window.confirm(`¿Está seguro de marcar ${selectedPagos.length} pagos como pagados?`);
    if (!confirma) return;
    const today = new Date().toISOString().slice(0, 10);
    const fechaInput = window.prompt('Ingrese la fecha de cruce para el lote (YYYY-MM-DD):', today);
    if (!fechaInput) return;
    const fechaCruce = new Date(`${fechaInput}T00:00:00`);
    if (Number.isNaN(fechaCruce.getTime())) {
      window.alert('Fecha de cruce inválida.');
      return;
    }
    try {
      await registrarPagosLote(selectedPagos, 'efectivo', user.id, fechaCruce);
      setSelectedPagos([]);
      window.alert('Pagos registrados correctamente.');
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo completar el pago masivo');
    }
  };


  const handleCreateConcepto = async () => {
    if (!user?.conjuntoId || !user?.id || !canConfigFinanciera) return;
    if (!newConcepto.fechaVigenciaDesde || !newConcepto.fechaVigenciaHasta) {
      window.alert('Debe definir vigencia desde y hasta para el concepto');
      return;
    }
    try {
      await createConceptoPago({
        conjuntoId: user.conjuntoId,
        nombre: newConcepto.nombre,
        descripcion: newConcepto.descripcion || undefined,
        valorBase: newConcepto.valorBase ? parseFloat(newConcepto.valorBase) : undefined,
        aplicaInteresMora: newConcepto.aplicaInteresMora,
        activo: true,
        creadoPor: user.id,
        ...(newConcepto.fechaVigenciaDesde
          ? { fechaVigenciaDesde: new Date(newConcepto.fechaVigenciaDesde) }
          : {}),
        ...(newConcepto.fechaVigenciaHasta
          ? { fechaVigenciaHasta: new Date(newConcepto.fechaVigenciaHasta) }
          : {}),
      });
      setIsConceptoDialogOpen(false);
      setNewConcepto({
        nombre: '',
        descripcion: '',
        valorBase: '',
        aplicaInteresMora: false,
        fechaVigenciaDesde: defaultVigenciaDesde,
        fechaVigenciaHasta: defaultVigenciaHasta,
      });
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo crear el concepto');
    }
  };

  const handleToggleConcepto = async (conceptoId: string, activo: boolean) => {
    if (!user?.id || !canConfigFinanciera) return;
    try {
      await updateConceptoPago(conceptoId, { activo }, user.id, activo ? 'Reactivación de concepto' : 'Desactivación de concepto');
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo actualizar el estado del concepto');
    }
  };

  const toInputDate = (value: unknown): string => {
    if (!value) return '';
    try {
      const d =
        value instanceof Date
          ? value
          : typeof value === 'object' && value && 'toDate' in value && typeof (value as any).toDate === 'function'
            ? (value as any).toDate()
            : new Date(value as any);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const handleEditarConcepto = async () => {
    if (!user?.id || !canConfigFinanciera || !conceptoEditando) return;
    if (!conceptoEditando.fechaVigenciaDesde || !conceptoEditando.fechaVigenciaHasta) {
      window.alert('Debe mantener la vigencia desde y hasta del concepto');
      return;
    }

    try {
      await updateConceptoPago(
        conceptoEditando.id,
        {
          nombre: conceptoEditando.nombre,
          descripcion: conceptoEditando.descripcion || undefined,
          valorBase: conceptoEditando.valorBase ? parseFloat(conceptoEditando.valorBase) : undefined,
          aplicaInteresMora: conceptoEditando.aplicaInteresMora,
          ...(conceptoEditando.fechaVigenciaDesde
            ? { fechaVigenciaDesde: new Date(conceptoEditando.fechaVigenciaDesde) }
            : {}),
          ...(conceptoEditando.fechaVigenciaHasta
            ? { fechaVigenciaHasta: new Date(conceptoEditando.fechaVigenciaHasta) }
            : {}),
        },
        user.id,
        'Edición de concepto de pago'
      );

      setIsEditarConceptoDialogOpen(false);
      setConceptoEditando(null);
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo editar el concepto');
    }
  };

  const handleEliminarConcepto = async () => {
    if (!canConfigFinanciera || !conceptoAEliminar) return;
    try {
      await deleteConceptoPago(conceptoAEliminar.id);
      setConceptoAEliminar(null);
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo eliminar el concepto');
    }
  };

  const handleCrearCajaMenor = async () => {
    if (!user?.conjuntoId || !user?.id || !canGestionCartera) return;
    try {
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
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo crear la caja menor');
    }
  };

  const handleCrearGasto = async () => {
    if (!user?.conjuntoId || !user?.id || !cajaActiva || !canGestionCartera) return;

    let soporteUrl;
    let soporteNombre = newGasto.soporteNombre || undefined;

    if (gastoSoporteFile) {
      const ruta = `cajasMenores/${user.conjuntoId}/${cajaActiva.id}/${Date.now()}_${gastoSoporteFile.name}`;
      soporteUrl = await subirArchivo(gastoSoporteFile, ruta);
      soporteNombre = gastoSoporteFile.name;
    }

    try {
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
    } catch (e: any) {
      window.alert(e?.message ?? 'No se pudo registrar el gasto');
    }
  };
  const descargarExcel = async () => {
    try {
      await exportarBackendPagos({ formato: 'excel', estado: filterStatus });
    } catch (error) {
      window.alert('No se pudo descargar el archivo Excel.');
      console.error(error);
    }
  };

  const descargarPdf = async () => {
    try {
      await exportarBackendPagos({ formato: 'pdf', estado: filterStatus });
    } catch (error) {
      window.alert('No se pudo descargar el archivo PDF.');
      console.error(error);
    }
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

        {canConfigFinanciera && (
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
                  <Select
                    value={newPago.conceptoId}
                    onValueChange={(value) => {
                      const concepto = conceptosPago.find((c) => c.id === value);
                      setNewPago((prev) => ({
                        ...prev,
                        conceptoId: value,
                        concepto: concepto?.nombre ?? '',
                        valor: concepto?.valorBase ? String(concepto.valorBase) : prev.valor,
                        aplicaInteresMora: concepto?.aplicaInteresMora ?? false,
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona concepto" /></SelectTrigger>
                    <SelectContent>
                      {conceptosDisponiblesParaPago.map((concepto) => (
                        <SelectItem key={concepto.id} value={concepto.id}>
                          {concepto.nombre}
                        </SelectItem>
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
                        <SelectItem key={u.id} value={u.id}>{u.numero} {u.torre ? `- ${u.torre}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de pago oportuno *</Label>
                  <Input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={newPago.fechaVencimiento}
                    onChange={(e) => setNewPago({ ...newPago, fechaVencimiento: e.target.value })}
                  />
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

      {isContadora && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="py-4 text-sm text-blue-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Perfil de Contadora: puede cruzar pagos y gestionar cartera. La configuración de tarifas y conceptos es solo del Administrador.
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
            {canConfigFinanciera && (
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
                    <div>
                      <Label>Vigencia desde</Label>
                      <Input
                        type="date"
                        value={newConcepto.fechaVigenciaDesde}
                        onChange={(e) => setNewConcepto({ ...newConcepto, fechaVigenciaDesde: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Vigencia hasta</Label>
                      <Input
                        type="date"
                        value={newConcepto.fechaVigenciaHasta}
                        onChange={(e) => setNewConcepto({ ...newConcepto, fechaVigenciaHasta: e.target.value })}
                      />
                    </div>
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
            {canConfigFinanciera && (
              <Dialog open={isEditarConceptoDialogOpen} onOpenChange={setIsEditarConceptoDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar concepto de pago</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={conceptoEditando?.nombre ?? ''}
                        onChange={(e) =>
                          setConceptoEditando((prev) => (prev ? { ...prev, nombre: e.target.value } : prev))
                        }
                      />
                    </div>
                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={conceptoEditando?.descripcion ?? ''}
                        onChange={(e) =>
                          setConceptoEditando((prev) => (prev ? { ...prev, descripcion: e.target.value } : prev))
                        }
                      />
                    </div>
                    <div>
                      <Label>Valor base (opcional)</Label>
                      <Input
                        type="number"
                        value={conceptoEditando?.valorBase ?? ''}
                        onChange={(e) =>
                          setConceptoEditando((prev) => (prev ? { ...prev, valorBase: e.target.value } : prev))
                        }
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={conceptoEditando?.aplicaInteresMora ?? false}
                        onChange={(e) =>
                          setConceptoEditando((prev) =>
                            prev ? { ...prev, aplicaInteresMora: e.target.checked } : prev
                          )
                        }
                      />
                      Aplica interés de mora
                    </label>
                    <div>
                      <Label>Vigencia desde</Label>
                      <Input
                        type="date"
                        value={conceptoEditando?.fechaVigenciaDesde ?? ''}
                        onChange={(e) =>
                          setConceptoEditando((prev) =>
                            prev ? { ...prev, fechaVigenciaDesde: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Vigencia hasta</Label>
                      <Input
                        type="date"
                        value={conceptoEditando?.fechaVigenciaHasta ?? ''}
                        onChange={(e) =>
                          setConceptoEditando((prev) =>
                            prev ? { ...prev, fechaVigenciaHasta: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditarConceptoDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleEditarConcepto} disabled={!conceptoEditando}>
                      Guardar cambios
                    </Button>
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
                  <div className="flex items-center gap-2">
                    <Badge variant={concepto.activo ? 'default' : 'secondary'}>
                      {concepto.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {(conceptoCountPorNombre.get(concepto.nombre.trim().toLowerCase()) ?? 0) > 1 && (
                      <Badge variant="destructive" className="text-xs">
                        Duplicado
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{concepto.descripcion || 'Sin descripción'}.</p>
                <p className="text-xs text-muted-foreground">Historial: {concepto.historialActualizaciones?.length || 0} cambios.</p>
                {canConfigFinanciera && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 mr-2"
                      onClick={() => {
                        setConceptoEditando({
                          id: concepto.id,
                          nombre: concepto.nombre,
                          descripcion: concepto.descripcion ?? '',
                          valorBase: concepto.valorBase != null ? String(concepto.valorBase) : '',
                          aplicaInteresMora: concepto.aplicaInteresMora,
                          fechaVigenciaDesde: toInputDate(concepto.fechaVigenciaDesde),
                          fechaVigenciaHasta: toInputDate(concepto.fechaVigenciaHasta),
                        });
                        setIsEditarConceptoDialogOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => handleToggleConcepto(concepto.id, !concepto.activo)}
                    >
                      {concepto.activo ? 'Desactivar' : 'Reactivar'}
                    </Button>
                    {(conceptoCountPorNombre.get(concepto.nombre.trim().toLowerCase()) ?? 0) > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="mt-2"
                        onClick={() => setConceptoAEliminar({ id: concepto.id, nombre: concepto.nombre })}
                      >
                        Eliminar
                      </Button>
                    )}
                  </>
                )}
                {(concepto.fechaVigenciaDesde || concepto.fechaVigenciaHasta) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Vigencia:{' '}
                    {concepto.fechaVigenciaDesde ? toInputDate(concepto.fechaVigenciaDesde) : '—'} a{' '}
                    {concepto.fechaVigenciaHasta ? toInputDate(concepto.fechaVigenciaHasta) : '—'}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {canConfigFinanciera && (
          <AlertDialog
            open={!!conceptoAEliminar}
            onOpenChange={(open) => {
              if (!open) setConceptoAEliminar(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar concepto</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Está seguro de eliminar el concepto{' '}
                  <span className="font-semibold">
                    {conceptoAEliminar?.nombre ?? ''}
                  </span>
                  ? Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleEliminarConcepto}>Sí, eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Caja Menor
            </CardTitle>
            {canGestionCartera && (
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
                  {canGestionCartera && caja.estado === 'abierta' && (
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
        {canGestionCartera && (
          <Button
            variant="secondary"
            disabled={selectedPagos.length === 0}
            onClick={handleMarcarPagadoLote}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar pagados ({selectedPagos.length})
          </Button>
        )}
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
                  {canGestionCartera && (
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={(e) =>
                          setSelectedPagos(
                            e.target.checked ? filteredPagos.map((p) => p.id) : []
                          )
                        }
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-medium">Consecutivo</th>
                  <th className="text-left py-3 px-4 font-medium">Concepto</th>
                  <th className="text-left py-3 px-4 font-medium">No. Casa</th>
                  <th className="text-left py-3 px-4 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 font-medium">Pago oportuno</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha pago</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Soporte</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagos.map((pago) => (
                  <tr key={pago.id} className="border-b hover:bg-accent/50">
                    {canGestionCartera && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedPagos.includes(pago.id)}
                          onChange={(e) =>
                            setSelectedPagos((prev) =>
                              e.target.checked ? [...prev, pago.id] : prev.filter((id) => id !== pago.id)
                            )
                          }
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 text-xs">
                      <div>{pago.consecutivoGeneral || '-'}</div>
                      <div className="text-muted-foreground">{pago.consecutivoResidente || '-'}</div>
                    </td>
                    <td className="py-3 px-4">{pago.concepto}</td>
                    <td className="py-3 px-4">{unidadLabelMap.get(pago.unidadId) ?? pago.unidadId}</td>
                    <td className="py-3 px-4">{formatCurrency(pago.valor)}</td>
                    <td className="py-3 px-4">{new Date(pago.fechaVencimiento).toLocaleDateString('es-CO')}</td>
                    <td className="py-3 px-4">
                      {pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-CO') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={pago.estado === 'pagado' ? 'default' : pago.estado === 'en_mora' ? 'destructive' : 'secondary'}>
                        {pago.estado === 'pagado' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {pago.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
                        {pago.estado === 'en_mora' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {pago.estado}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {pago.comprobante ? (
                        <Button size="sm" variant="ghost" onClick={() => window.open(pago.comprobante, '_blank')}>
                          <Download className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin soporte</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {pago.estado !== 'pagado' && canGestionCartera && (
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
