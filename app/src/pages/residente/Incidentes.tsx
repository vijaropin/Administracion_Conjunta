import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
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
import { AlertTriangle, Plus, Shield, Clock, CheckCircle2 } from 'lucide-react';

const tipoIncidenteOptions = [
  { value: 'seguridad', label: 'Seguridad / Robo' },
  { value: 'ruido', label: 'Ruido / Convivencia' },
  { value: 'mantenimiento', label: 'Daños materiales' },
  { value: 'otro', label: 'Otro' },
];

export function ResidenteIncidentes() {
  const { user } = useAuthStore();
  const { incidentes, fetchIncidentes, createIncidente } = useSeguridadStore();
  const [open, setOpen] = useState(false);
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

  const crearIncidente = async () => {
    if (!user?.conjuntoId || !user?.id) return;
    await createIncidente({
      conjuntoId: user.conjuntoId,
      residenteId: user.id,
      unidadId: user.unidad,
      tipo: form.tipo as any,
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
      fecha: new Date(),
      estado: 'reportado',
      prioridad: form.prioridad as any,
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
    setOpen(false);
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={crearIncidente} disabled={!form.descripcion || !form.ubicacion}>Enviar reporte</Button>
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
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

