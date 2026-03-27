import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { useDocumentoStore } from '@/store/documentoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { AlertTriangle, Plus, Shield, Clock, CheckCircle2, Paperclip, X } from 'lucide-react';
import type { Incidente } from '@/types';

type TipoIncidente = Incidente['tipo'];
type PrioridadIncidente = Incidente['prioridad'];

const tipoIncidenteOptions = [
  { value: 'seguridad', label: 'Seguridad / Robo' },
  { value: 'ruido', label: 'Ruido / Convivencia' },
  { value: 'mantenimiento', label: 'Daños materiales' },
  { value: 'otro', label: 'Otro' },
];

export function ResidenteIncidentes() {
  const { user } = useAuthStore();
  const { incidentes, fetchIncidentes, createIncidente } = useSeguridadStore();
  const { subirArchivo } = useDocumentoStore();
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
    testigos: '',
    accionesInmediatas: '',
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchIncidentes(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchIncidentes]);

  const misIncidentes = incidentes.filter((i) => i.residenteId === user?.id || i.unidadId === user?.unidad);

  const handleAdjuntosChange = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const nuevos = Array.from(files);
    const total = [...adjuntos, ...nuevos];
    if (total.length > 5) {
      setError('Solo puedes adjuntar hasta 5 fotos por reporte.');
      return;
    }
    for (const file of nuevos) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten fotos en el reporte de incidentes.');
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
        reportadoPorNombre: `${user.nombres} ${user.apellidos}`,
        reportadoPorTelefono: user.telefono,
        reportadoPorEmail: user.email,
        fechaIncidente: form.fechaIncidente ? new Date(form.fechaIncidente) : new Date(),
        horaIncidente: form.horaIncidente,
        ubicacion: form.ubicacion,
        descripcion: form.descripcion,
        testigos: form.testigos || undefined,
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
        testigos: '',
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incidentes</h2>
          <p className="text-muted-foreground">Reporte de incidentes según el manual de convivencia.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Reportar Incidente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Nuevo Reporte de Incidente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tipoIncidenteOptions.map((op) => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
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
                  <Input value={form.ubicacion} onChange={(e) => setForm((p) => ({ ...p, ubicacion: e.target.value }))} placeholder="Ej: pasillo torre B" />
                </div>
              </div>
              <div>
                <Label>Descripción detallada</Label>
                <Textarea rows={4} value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))} />
              </div>
              <div>
                <Label>Testigos (nombres/contacto)</Label>
                <Input value={form.testigos} onChange={(e) => setForm((p) => ({ ...p, testigos: e.target.value }))} />
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
                {submitting ? 'Enviando...' : 'Enviar reporte'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Reportes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {misIncidentes.length === 0 && (
            <p className="text-sm text-muted-foreground">No has reportado incidentes.</p>
          )}
          {misIncidentes.map((incidente) => (
            <div key={incidente.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium capitalize">{incidente.tipo}</span>
                </div>
                <Badge variant={incidente.estado === 'resuelto' || incidente.estado === 'cerrado' ? 'default' : 'secondary'}>
                  {incidente.estado === 'resuelto' || incidente.estado === 'cerrado' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                  {incidente.estado}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{incidente.descripcion}</p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {new Date(incidente.fecha).toLocaleString('es-CO')}
              </p>
              {!!incidente.evidencias?.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {incidente.evidencias.map((url, idx) => (
                    <Button key={`${incidente.id}-e-${idx}`} variant="outline" size="sm" onClick={() => window.open(url, '_blank')}>
                      <Paperclip className="h-3 w-3 mr-1" />
                      Evidencia {idx + 1}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

