import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useComunicacionStore } from '@/store/comunicacionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Clock3, Plus, Vote, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
};

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const sameAsambleaConfig = (
  asamblea: {
    titulo: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    tipo: 'ordinaria' | 'extraordinaria';
  },
  form: {
    titulo: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    tipo: string;
  }
) => {
  const asambleaDate = toDate(asamblea.fecha).toISOString().slice(0, 10);
  return (
    normalizeText(asamblea.titulo) === normalizeText(form.titulo) &&
    asambleaDate === form.fecha &&
    asamblea.horaInicio === form.horaInicio &&
    asamblea.horaFin === form.horaFin &&
    asamblea.tipo === form.tipo
  );
};

export function AdminAsambleas() {
  const { user } = useAuthStore();
  const {
    asambleas,
    votaciones,
    bitacoraAsamblea,
    fetchAsambleas,
    createAsamblea,
    updateAsamblea,
    fetchVotaciones,
    createVotacion,
    cerrarVotacion,
    fetchBitacoraAsamblea,
    registrarEventoAsamblea,
  } = useComunicacionStore();

  const isAdmin = user?.tipo === 'administrador';
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedAsambleaId, setSelectedAsambleaId] = useState<string>('');
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    horaInicio: '18:00',
    horaFin: '20:00',
    lugar: 'Salón comunal',
    tipo: 'ordinaria',
    quorumRequerido: '100',
    pregunta: '',
    tiempoVotacionMinutos: '120',
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchAsambleas(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchAsambleas]);

  useEffect(() => {
    if (selectedAsambleaId) {
      void fetchVotaciones(selectedAsambleaId);
      void fetchBitacoraAsamblea(selectedAsambleaId);
    }
  }, [selectedAsambleaId, fetchVotaciones, fetchBitacoraAsamblea]);

  useEffect(() => {
    if (asambleas.length === 0) {
      if (selectedAsambleaId) {
        setSelectedAsambleaId('');
      }
      return;
    }

    if (!selectedAsambleaId || !asambleas.some((asamblea) => asamblea.id === selectedAsambleaId)) {
      setSelectedAsambleaId(asambleas[0].id);
    }
  }, [asambleas, selectedAsambleaId]);

  const selectedAsamblea = asambleas.find((a) => a.id === selectedAsambleaId);
  const votacionesAsamblea = useMemo(
    () => votaciones.filter((v) => v.asambleaId === selectedAsambleaId),
    [votaciones, selectedAsambleaId]
  );

  const crearAsamblea = async () => {
    if (!user?.conjuntoId || !user?.id || !isAdmin) return;

    const duplicatedAsamblea = asambleas.find((asamblea) => sameAsambleaConfig(asamblea, form));
    if (duplicatedAsamblea) {
      setSelectedAsambleaId(duplicatedAsamblea.id);
      setOpen(false);
      toast.info('Ya existe una asamblea con esos datos. Se seleccionó el registro existente.');
      return;
    }

    try {
      setCreating(true);
      const asambleaId = await createAsamblea({
        conjuntoId: user.conjuntoId,
        creadoPor: user.id,
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha: new Date(form.fecha),
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        lugar: form.lugar,
        tipo: form.tipo as 'ordinaria' | 'extraordinaria',
        estado: 'programada',
        quorumRequerido: parseInt(form.quorumRequerido, 10),
        quorumAlcanzado: 0,
        habilitarVotacion: false,
        tiempoVotacionMinutos: parseInt(form.tiempoVotacionMinutos, 10),
        votaciones: [],
      });

      const fechaCierre = new Date();
      fechaCierre.setMinutes(fechaCierre.getMinutes() + parseInt(form.tiempoVotacionMinutos, 10));

      await createVotacion({
        conjuntoId: user.conjuntoId,
        asambleaId,
        pregunta: form.pregunta || '¿Aprueba el punto sometido a votación?',
        opciones: ['SI', 'NO'],
        votos: { SI: 0, NO: 0 },
        votantes: [],
        votosRegistrados: [],
        estado: 'activa',
        fechaCierre,
      });

      await updateAsamblea(asambleaId, { estado: 'en_curso', habilitarVotacion: true });

      await registrarEventoAsamblea({
        conjuntoId: user.conjuntoId,
        asambleaId,
        usuarioId: user.id,
        evento: 'creacion_asamblea',
        detalle: `Asamblea ${form.tipo} creada por administrador`,
      });

      await registrarEventoAsamblea({
        conjuntoId: user.conjuntoId,
        asambleaId,
        usuarioId: user.id,
        evento: 'apertura_votacion',
        detalle: 'Votación SI/NO habilitada para propietarios',
      });

      setOpen(false);
      setForm({
        titulo: '',
        descripcion: '',
        fecha: '',
        horaInicio: '18:00',
        horaFin: '20:00',
        lugar: 'Salón comunal',
        tipo: 'ordinaria',
        quorumRequerido: '100',
        pregunta: '',
        tiempoVotacionMinutos: '120',
      });

      await fetchAsambleas(user.conjuntoId);
      setSelectedAsambleaId(asambleaId);
      toast.success('La asamblea quedó creada y habilitada para votación.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo crear y habilitar la asamblea.';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const cerrar = async (votacionId: string) => {
    if (!isAdmin || !user?.id) return;
    await cerrarVotacion(votacionId, user.id);
    if (selectedAsambleaId) {
      await fetchVotaciones(selectedAsambleaId);
      await fetchAsambleas(user?.conjuntoId || '');
      await fetchBitacoraAsamblea(selectedAsambleaId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Asambleas</h2>
          <p className="text-muted-foreground">Creación y control de votación con bitácora inmodificable.</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nueva Asamblea</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Crear Asamblea</DialogTitle></DialogHeader>
              <div className="grid md:grid-cols-2 gap-3 py-2">
                <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordinaria">Ordinaria</SelectItem>
                      <SelectItem value="extraordinaria">Extraordinaria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2"><Label>Descripción</Label><Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
                <div><Label>Fecha</Label><Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
                <div><Label>Lugar</Label><Input value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} /></div>
                <div><Label>Hora inicio</Label><Input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} /></div>
                <div><Label>Hora fin</Label><Input type="time" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} /></div>
                <div><Label>Quórum requerido (votos)</Label><Input type="number" value={form.quorumRequerido} onChange={(e) => setForm({ ...form, quorumRequerido: e.target.value })} /></div>
                <div><Label>Tiempo votación (min)</Label><Input type="number" value={form.tiempoVotacionMinutos} onChange={(e) => setForm({ ...form, tiempoVotacionMinutos: e.target.value })} /></div>
                <div className="md:col-span-2"><Label>Pregunta votación SI/NO</Label><Input value={form.pregunta} onChange={(e) => setForm({ ...form, pregunta: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={crearAsamblea} disabled={!form.titulo || !form.fecha || creating}>
                  {creating ? 'Creando...' : 'Crear y habilitar votación'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="py-4 text-sm text-amber-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Solo el administrador puede crear asambleas y abrir/cerrar votaciones.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Listado de Asambleas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {asambleas.map((asamblea) => {
              const cumpleQuorum = asamblea.quorumAlcanzado >= asamblea.quorumRequerido;
              return (
                <button
                  key={asamblea.id}
                  type="button"
                  onClick={() => setSelectedAsambleaId(asamblea.id)}
                  className={`w-full text-left border rounded-lg p-3 hover:bg-accent/40 ${selectedAsambleaId === asamblea.id ? 'border-primary' : ''}`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-medium">{asamblea.titulo}</p>
                    <Badge variant={asamblea.tipo === 'ordinaria' ? 'default' : 'secondary'}>{asamblea.tipo}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{toDate(asamblea.fecha).toLocaleDateString('es-CO')} • {asamblea.lugar}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge variant={cumpleQuorum ? 'default' : 'destructive'}>
                      {cumpleQuorum ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                      Quórum: {asamblea.quorumAlcanzado}/{asamblea.quorumRequerido}
                    </Badge>
                    <Badge variant="outline">{asamblea.estado}</Badge>
                  </div>
                </button>
              );
            })}
            {asambleas.length === 0 && <p className="text-sm text-muted-foreground">No hay asambleas registradas.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Detalle y Bitácora</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!selectedAsamblea && <p className="text-sm text-muted-foreground">Selecciona una asamblea para ver su votación.</p>}
            {selectedAsamblea && (
              <>
                <div className="border rounded-lg p-3">
                  <p className="font-medium">{selectedAsamblea.titulo}</p>
                  <p className="text-xs text-muted-foreground">{selectedAsamblea.descripcion}</p>
                </div>

                {votacionesAsamblea.map((votacion) => {
                  const totalVotos = (votacion.votos?.SI || 0) + (votacion.votos?.NO || 0);
                  const cierre = votacion.fechaCierre ? toDate(votacion.fechaCierre) : null;
                  return (
                    <div key={votacion.id} className="border rounded-lg p-3 text-sm space-y-2">
                      <p className="font-medium flex items-center gap-2"><Vote className="h-4 w-4" />{votacion.pregunta}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">SI: {votacion.votos?.SI || 0}</Badge>
                        <Badge variant="outline">NO: {votacion.votos?.NO || 0}</Badge>
                        <Badge variant="secondary">Total: {totalVotos}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        Cierre: {cierre ? cierre.toLocaleString('es-CO') : 'Sin cierre'}
                      </div>
                      {isAdmin && votacion.estado === 'activa' && (
                        <Button size="sm" variant="outline" onClick={() => cerrar(votacion.id)}>Cerrar votación</Button>
                      )}
                    </div>
                  );
                })}

                <div>
                  <p className="font-medium text-sm mb-2">Bitácora (solo lectura)</p>
                  <div className="max-h-56 overflow-auto space-y-2">
                    {bitacoraAsamblea.map((e) => (
                      <div key={e.id} className="border rounded p-2 text-xs">
                        <p className="font-medium">{e.evento}</p>
                        <p className="text-muted-foreground">{e.detalle}</p>
                        <p className="text-muted-foreground">{toDate(e.fecha).toLocaleString('es-CO')}</p>
                      </div>
                    ))}
                    {bitacoraAsamblea.length === 0 && <p className="text-xs text-muted-foreground">Sin eventos.</p>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
