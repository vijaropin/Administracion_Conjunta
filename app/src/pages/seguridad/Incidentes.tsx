import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { useDocumentoStore } from '@/store/documentoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Paperclip, Plus, X } from 'lucide-react';
import type { Incidente } from '@/types';

type TipoIncidente = Incidente['tipo'];
type PrioridadIncidente = Incidente['prioridad'];

export function SeguridadIncidentes() {
  const { user } = useAuthStore();
  const { incidentes, fetchIncidentes, updateIncidente, createIncidente } = useSeguridadStore();
  const { subirArchivo } = useDocumentoStore();
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjuntos, setAdjuntos] = useState<File[]>([]);
  const [form, setForm] = useState({
    tipo: 'seguridad',
    prioridad: 'media',
    fechaIncidente: '',
    horaIncidente: '',
    ubicacion: '',
    descripcion: '',
    accionesInmediatas: '',
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchIncidentes(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchIncidentes]);

  const list = incidentes.filter((i) => estadoFiltro === 'todos' || i.estado === estadoFiltro);

  const handleAdjuntosChange = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const nuevos = Array.from(files);
    const total = [...adjuntos, ...nuevos];
    if (total.length > 5) {
      setError('Solo se permiten hasta 5 fotos por incidente.');
      return;
    }
    for (const file of nuevos) {
      if (!file.type.startsWith('image/')) {
        setError('Solo puedes adjuntar fotos.');
        return;
      }
    }
    setAdjuntos(total);
  };

  const crearIncidente = async () => {
    if (!user?.conjuntoId || !user?.id) return;
    if (!form.descripcion || !form.ubicacion) {
      setError('Debes diligenciar ubicación y descripción.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const evidencias: string[] = [];
      for (const file of adjuntos) {
        const ruta = `incidentes/${user.conjuntoId}/${user.id}/${Date.now()}_${file.name}`;
        const url = await subirArchivo(file, ruta);
        evidencias.push(url);
      }

      await createIncidente({
        conjuntoId: user.conjuntoId,
        residenteId: user.id,
        unidadId: user.unidad,
        tipo: form.tipo as TipoIncidente,
        categoria: form.tipo === 'seguridad' ? 'seguridad_robo' : form.tipo === 'ruido' ? 'ruido_convivencia' : 'otro',
        reportadoPorNombre: `${user.nombres} ${user.apellidos}`.trim(),
        reportadoPorTelefono: user.telefono,
        reportadoPorEmail: user.email,
        fechaIncidente: form.fechaIncidente ? new Date(form.fechaIncidente) : new Date(),
        horaIncidente: form.horaIncidente || undefined,
        ubicacion: form.ubicacion,
        descripcion: form.descripcion,
        accionesInmediatas: form.accionesInmediatas || undefined,
        evidencias: evidencias.length > 0 ? evidencias : undefined,
        fecha: new Date(),
        estado: 'reportado',
        prioridad: form.prioridad as PrioridadIncidente,
      });

      setForm({
        tipo: 'seguridad',
        prioridad: 'media',
        fechaIncidente: '',
        horaIncidente: '',
        ubicacion: '',
        descripcion: '',
        accionesInmediatas: '',
      });
      setAdjuntos([]);
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el incidente.');
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (id: string, estado: 'en_proceso' | 'cerrado') => {
    await updateIncidente(id, { estado });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incidentes de Seguridad</h2>
          <p className="text-muted-foreground">Minuta digital y seguimiento operativo.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="border rounded-md px-3 py-2 text-sm" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="reportado">Reportado</option>
            <option value="en_proceso">En proceso</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo incidente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Registrar incidente</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seguridad">Seguridad / Robo</SelectItem>
                        <SelectItem value="ruido">Ruido / Convivencia</SelectItem>
                        <SelectItem value="mantenimiento">Daños materiales</SelectItem>
                        <SelectItem value="parqueadero">Parqueadero</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <Select value={form.prioridad} onValueChange={(v) => setForm((p) => ({ ...p, prioridad: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label>Fecha</Label>
                    <Input type="date" value={form.fechaIncidente} onChange={(e) => setForm((p) => ({ ...p, fechaIncidente: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input type="time" value={form.horaIncidente} onChange={(e) => setForm((p) => ({ ...p, horaIncidente: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Ubicación</Label>
                    <Input value={form.ubicacion} onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea rows={4} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
                </div>
                <div>
                  <Label>Acciones inmediatas</Label>
                  <Textarea rows={2} value={form.accionesInmediatas} onChange={(e) => setForm((p) => ({ ...p, accionesInmediatas: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Adjuntos (solo foto)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      void handleAdjuntosChange(e.target.files);
                      e.currentTarget.value = '';
                    }}
                  />
                  {adjuntos.length > 0 && (
                    <div className="space-y-1">
                      {adjuntos.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="text-xs border rounded px-2 py-1 flex items-center justify-between">
                          <span className="truncate pr-2">{file.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => setAdjuntos((prev) => prev.filter((_, i) => i !== index))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={crearIncidente} disabled={!form.descripcion || !form.ubicacion || submitting}>
                  {submitting ? 'Guardando...' : 'Crear incidente'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.map((i) => (
            <div key={i.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium capitalize">{i.tipo}</p>
                <Badge variant={i.estado === 'cerrado' ? 'default' : 'secondary'}>{i.estado}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{i.descripcion}</p>
              {!!i.reportadoPorNombre && (
                <p className="text-xs text-muted-foreground mt-1">Reportado por: {i.reportadoPorNombre}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{new Date(i.fecha).toLocaleString('es-CO')} • {i.ubicacion || 'Ubicación no informada'}</p>
              {!!i.evidencias?.length && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {i.evidencias.map((url, index) => (
                    <Button key={`${i.id}-e-${index}`} size="sm" variant="outline" onClick={() => window.open(url, '_blank')}>
                      <Paperclip className="h-3 w-3 mr-1" />
                      Evidencia {index + 1}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {i.estado === 'reportado' && <Button size="sm" variant="outline" onClick={() => cambiarEstado(i.id, 'en_proceso')}>Marcar en proceso</Button>}
                {i.estado !== 'cerrado' && <Button size="sm" onClick={() => cambiarEstado(i.id, 'cerrado')}>Cerrar</Button>}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">No hay incidentes.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
