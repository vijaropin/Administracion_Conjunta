import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useServiciosStore } from '@/store/serviciosStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  AlertTriangle,
  ClipboardList,
  Package,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
  Send,
  Calendar,
  XCircle
} from 'lucide-react';

const tiposNovedad = [
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'jardineria', label: 'Jardinería' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'otro', label: 'Otro' },
];

const prioridades = [
  { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-800' },
  { value: 'media', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

const tiposSolicitud = [
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'jardineria', label: 'Jardinería' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'otro', label: 'Otro' },
];

export function ServiciosDashboard() {
  const { user } = useAuthStore();
  const { 
    novedades, 
    solicitudes, 
    tareas,
    fetchNovedadesByUsuario,
    fetchSolicitudesByUsuario,
    fetchTareasByUsuario,
    createNovedad,
    createSolicitud,
    completarTarea
  } = useServiciosStore();
  
  const [activeTab, setActiveTab] = useState('novedades');
  
  // Dialogs
  const [showNuevaNovedad, setShowNuevaNovedad] = useState(false);
  const [showNuevaSolicitud, setShowNuevaSolicitud] = useState(false);
  
  // Form states
  const [nuevaNovedad, setNuevaNovedad] = useState({
    tipo: '',
    prioridad: 'media',
    descripcion: '',
    ubicacion: ''
  });
  
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    tipo: '',
    urgencia: 'media',
    justificacion: '',
    items: [{ id: crypto.randomUUID(), nombre: '', cantidad: 1, unidad: '' }]
  });

  useEffect(() => {
    if (user?.id) {
      fetchNovedadesByUsuario(user.id);
      fetchSolicitudesByUsuario(user.id);
      fetchTareasByUsuario(user.id);
    }
  }, [user?.id]);

  const handleCrearNovedad = async () => {
    if (!user?.conjuntoId || !user?.id) return;
    
    await createNovedad({
      conjuntoId: user.conjuntoId,
      reportadoPor: user.id,
      tipo: nuevaNovedad.tipo as any,
      prioridad: nuevaNovedad.prioridad as any,
      descripcion: nuevaNovedad.descripcion,
      ubicacion: nuevaNovedad.ubicacion,
      fechaReporte: new Date(),
      estado: 'reportada'
    });
    
    setShowNuevaNovedad(false);
    setNuevaNovedad({ tipo: '', prioridad: 'media', descripcion: '', ubicacion: '' });
    fetchNovedadesByUsuario(user.id);
  };

  const handleCrearSolicitud = async () => {
    if (!user?.conjuntoId || !user?.id) return;
    
    const itemsValidos = nuevaSolicitud.items.filter(i => i.nombre && i.cantidad > 0);
    const totalEstimado = itemsValidos.reduce((sum, item) => sum + (item.cantidad * 10000), 0);
    
    await createSolicitud({
      conjuntoId: user.conjuntoId,
      solicitadoPor: user.id,
      tipo: nuevaSolicitud.tipo as any,
      items: itemsValidos,
      justificacion: nuevaSolicitud.justificacion,
      urgencia: nuevaSolicitud.urgencia as any,
      fechaSolicitud: new Date(),
      estado: 'pendiente',
      totalEstimado
    });
    
    setShowNuevaSolicitud(false);
    setNuevaSolicitud({ tipo: '', urgencia: 'media', justificacion: '', items: [{ id: crypto.randomUUID(), nombre: '', cantidad: 1, unidad: '' }] });
    fetchSolicitudesByUsuario(user.id);
  };

  const agregarItem = () => {
    setNuevaSolicitud({
      ...nuevaSolicitud,
      items: [...nuevaSolicitud.items, { id: crypto.randomUUID(), nombre: '', cantidad: 1, unidad: '' }]
    });
  };

  const actualizarItem = (index: number, campo: string, valor: string | number) => {
    const nuevosItems = [...nuevaSolicitud.items];
    nuevosItems[index] = { ...nuevosItems[index], [campo]: valor };
    setNuevaSolicitud({ ...nuevaSolicitud, items: nuevosItems });
  };

  const eliminarItem = (index: number) => {
    const nuevosItems = nuevaSolicitud.items.filter((_, i) => i !== index);
    setNuevaSolicitud({ ...nuevaSolicitud, items: nuevosItems });
  };

  const getEstadoNovedadBadge = (estado: string) => {
    switch (estado) {
      case 'reportada': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Reportada</Badge>;
      case 'en_proceso': return <Badge variant="default"><Clock className="h-3 w-3 mr-1" /> En Proceso</Badge>;
      case 'resuelta': return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Resuelta</Badge>;
      case 'cerrada': return <Badge variant="outline">Cerrada</Badge>;
      default: return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getEstadoSolicitudBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Badge variant="secondary">Pendiente</Badge>;
      case 'aprobada': return <Badge className="bg-green-500">Aprobada</Badge>;
      case 'rechazada': return <Badge variant="destructive">Rechazada</Badge>;
      case 'en_compra': return <Badge variant="default">En Compra</Badge>;
      case 'entregada': return <Badge className="bg-blue-500">Entregada</Badge>;
      default: return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Servicios Generales</h2>
          <p className="text-muted-foreground">
            Bienvenido, {user?.nombres}. Gestiona tus novedades, solicitudes y tareas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNuevaNovedad(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reportar Novedad
          </Button>
          <Button variant="outline" onClick={() => setShowNuevaSolicitud(true)}>
            <Package className="h-4 w-4 mr-2" />
            Solicitar Implementos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Novedades</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{novedades.length}</div>
            <p className="text-xs text-muted-foreground">
              {novedades.filter(n => n.estado === 'reportada' || n.estado === 'en_proceso').length} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Solicitudes</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitudes.length}</div>
            <p className="text-xs text-muted-foreground">
              {solicitudes.filter(s => s.estado === 'pendiente').length} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Tareas</CardTitle>
            <ClipboardList className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tareas.length}</div>
            <p className="text-xs text-muted-foreground">
              {tareas.filter(t => t.estado === 'programada' || t.estado === 'en_ejecucion').length} pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tareas.filter(t => t.estado === 'completada').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="novedades">Mis Novedades</TabsTrigger>
          <TabsTrigger value="solicitudes">Mis Solicitudes</TabsTrigger>
          <TabsTrigger value="tareas">Mis Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="novedades" className="space-y-4">
          {novedades.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No has reportado novedades</p>
                <Button onClick={() => setShowNuevaNovedad(true)} className="mt-4">
                  Reportar Primera Novedad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {novedades.map((novedad) => (
                <Card key={novedad.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{novedad.tipo}</Badge>
                          <Badge className={prioridades.find(p => p.value === novedad.prioridad)?.color}>
                            {novedad.prioridad}
                          </Badge>
                          {getEstadoNovedadBadge(novedad.estado)}
                        </div>
                        <p className="font-medium mt-2">{novedad.descripcion}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {novedad.ubicacion}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(novedad.fechaReporte).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {novedad.respuesta && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Respuesta:</p>
                        <p className="text-sm text-green-700">{novedad.respuesta}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="solicitudes" className="space-y-4">
          {solicitudes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No has realizado solicitudes</p>
                <Button onClick={() => setShowNuevaSolicitud(true)} className="mt-4">
                  Realizar Primera Solicitud
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {solicitudes.map((solicitud) => (
                <Card key={solicitud.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{solicitud.tipo}</Badge>
                          {getEstadoSolicitudBadge(solicitud.estado)}
                          <Badge variant={solicitud.urgencia === 'alta' ? 'destructive' : 'secondary'}>
                            Urgencia: {solicitud.urgencia}
                          </Badge>
                        </div>
                        <p className="font-medium mt-2">{solicitud.justificacion}</p>
                        <div className="mt-2">
                          <p className="text-sm text-muted-foreground">Items solicitados:</p>
                          <ul className="text-sm mt-1">
                            {solicitud.items.map((item, idx) => (
                              <li key={idx}>• {item.nombre} ({item.cantidad} {item.unidad})</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Total estimado: ${solicitud.totalEstimado.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tareas" className="space-y-4">
          {tareas.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tienes tareas asignadas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tareas.map((tarea) => (
                <Card key={tarea.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{tarea.tipo}</Badge>
                          <Badge variant={tarea.estado === 'completada' ? 'default' : 'secondary'}>
                            {tarea.estado}
                          </Badge>
                          <Badge variant="outline">{tarea.frecuencia}</Badge>
                        </div>
                        <p className="font-medium mt-2">{tarea.descripcion}</p>
                        {tarea.area && (
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {tarea.area}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Programada: {new Date(tarea.fechaProgramada).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      {tarea.estado !== 'completada' && (
                        <Button 
                          size="sm"
                          onClick={() => completarTarea(tarea.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Nueva Novedad */}
      <Dialog open={showNuevaNovedad} onOpenChange={setShowNuevaNovedad}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reportar Novedad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={nuevaNovedad.tipo} 
                  onValueChange={(v) => setNuevaNovedad({...nuevaNovedad, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposNovedad.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Select 
                  value={nuevaNovedad.prioridad} 
                  onValueChange={(v) => setNuevaNovedad({...nuevaNovedad, prioridad: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioridades.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación *</Label>
              <Input 
                placeholder="Ej: Torre 1, Piso 3, Zona común..."
                value={nuevaNovedad.ubicacion}
                onChange={(e) => setNuevaNovedad({...nuevaNovedad, ubicacion: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea 
                placeholder="Describe la novedad detalladamente..."
                value={nuevaNovedad.descripcion}
                onChange={(e) => setNuevaNovedad({...nuevaNovedad, descripcion: e.target.value})}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleCrearNovedad}
              disabled={!nuevaNovedad.tipo || !nuevaNovedad.ubicacion || !nuevaNovedad.descripcion}
            >
              <Send className="h-4 w-4 mr-2" />
              Reportar Novedad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Solicitud */}
      <Dialog open={showNuevaSolicitud} onOpenChange={setShowNuevaSolicitud}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Implementos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={nuevaSolicitud.tipo} 
                  onValueChange={(v) => setNuevaSolicitud({...nuevaSolicitud, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSolicitud.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Urgencia *</Label>
                <Select 
                  value={nuevaSolicitud.urgencia} 
                  onValueChange={(v) => setNuevaSolicitud({...nuevaSolicitud, urgencia: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Justificación *</Label>
              <Textarea 
                placeholder="Explica por qué necesitas estos implementos..."
                value={nuevaSolicitud.justificacion}
                onChange={(e) => setNuevaSolicitud({...nuevaSolicitud, justificacion: e.target.value})}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={agregarItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Item
                </Button>
              </div>
              {nuevaSolicitud.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Input 
                    placeholder="Nombre del item"
                    value={item.nombre}
                    onChange={(e) => actualizarItem(idx, 'nombre', e.target.value)}
                    className="flex-1"
                  />
                  <Input 
                    type="number"
                    placeholder="Cant"
                    value={item.cantidad}
                    onChange={(e) => actualizarItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                    className="w-20"
                  />
                  <Input 
                    placeholder="Unidad"
                    value={item.unidad}
                    onChange={(e) => actualizarItem(idx, 'unidad', e.target.value)}
                    className="w-24"
                  />
                  {nuevaSolicitud.items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => eliminarItem(idx)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleCrearSolicitud}
              disabled={!nuevaSolicitud.tipo || !nuevaSolicitud.justificacion || nuevaSolicitud.items.every(i => !i.nombre)}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

