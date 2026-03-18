import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useConvivenciaStore } from '@/store/convivenciaStore';
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
  ArrowLeft,
  Calendar,
  Users,
  Gavel,
  FileText,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Archive,
  Send
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { HistorialCaso, Resolucion, Sancion } from '@/types';

const tiposSancion = [
  { value: 'llamado_atencion_verbal', label: 'Llamado de Atención Verbal' },
  { value: 'llamado_atencion_escrito', label: 'Llamado de Atención Escrito' },
  { value: 'multa', label: 'Multa Económica' },
  { value: 'suspension_servicios', label: 'Suspensión de Servicios' },
  { value: 'prohibicion_uso_areas', label: 'Prohibición de Uso de Áreas Comunes' },
];

export function CasoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    fetchConflictoById, 
    agregarSeguimiento, 
    emitirResolucion, 
    emitirSancion,
    apelarSancion
    // cerrarCaso - disponible para uso futuro
  } = useConvivenciaStore();
  
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('detalle');
  
  // Dialogs
  const [showSeguimientoDialog, setShowSeguimientoDialog] = useState(false);
  const [showResolucionDialog, setShowResolucionDialog] = useState(false);
  const [showSancionDialog, setShowSancionDialog] = useState(false);
  const [showApelacionDialog, setShowApelacionDialog] = useState(false);
  
  // Form states
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState({ accion: '', descripcion: '' });
  const [resolucion, setResolucion] = useState<Partial<Resolucion>>({
    decision: 'procede',
    fundamentos: '',
    recomendaciones: ''
  });
  const [sancion, setSancion] = useState<Partial<Sancion>>({
    tipo: 'llamado_atencion_escrito',
    descripcion: '',
    valorMulta: 0
  });
  const [fundamentosApelacion, setFundamentosApelacion] = useState('');

  useEffect(() => {
    loadCaso();
  }, [id]);

  const loadCaso = async () => {
    if (!id) return;
    setLoading(true);
    const data = await fetchConflictoById(id);
    if (data) {
      setCaso(data);
    }
    setLoading(false);
  };

  const handleAgregarSeguimiento = async () => {
    if (!id || !user) return;
    
    await agregarSeguimiento(id, {
      accion: nuevoSeguimiento.accion,
      descripcion: nuevoSeguimiento.descripcion,
      realizadoPor: user.id,
      tipo: 'seguimiento'
    });
    
    setShowSeguimientoDialog(false);
    setNuevoSeguimiento({ accion: '', descripcion: '' });
    loadCaso();
  };

  const handleEmitirResolucion = async () => {
    if (!id || !user) return;
    
    await emitirResolucion(id, {
      ...resolucion,
      fecha: new Date(),
      emitidaPor: user.id,
      notificada: false
    } as Resolucion);
    
    setShowResolucionDialog(false);
    loadCaso();
  };

  const handleEmitirSancion = async () => {
    if (!id || !user) return;
    
    await emitirSancion(id, {
      ...sancion,
      fechaEmision: new Date(),
      emitidaPor: user.id,
      cumplida: false,
      apelada: false
    } as Sancion);
    
    setShowSancionDialog(false);
    loadCaso();
  };

  const handleApelar = async () => {
    if (!id) return;
    
    await apelarSancion(id, fundamentosApelacion);
    setShowApelacionDialog(false);
    loadCaso();
  };

  // Función para cerrar caso - disponible para uso futuro
  // const handleCerrarCaso = async () => {
  //   if (!id) return;
  //   await cerrarCaso(id, 'Caso cerrado por acuerdo de las partes');
  //   loadCaso();
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Caso no encontrado</p>
        <Button onClick={() => navigate('/comite/casos')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Casos
        </Button>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    const variants: { [key: string]: string } = {
      recibido: 'secondary',
      en_revision: 'outline',
      en_mediacio: 'default',
      sancionado: 'destructive',
      archivado: 'outline',
      apelado: 'destructive'
    };
    return <Badge variant={variants[estado] as any}>{estado.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/comite/casos')} className="mb-2 -ml-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{caso.numeroCaso}</h2>
            {getEstadoBadge(caso.estado)}
            <Badge className={
              caso.prioridad === 'critica' ? 'bg-red-500' :
              caso.prioridad === 'alta' ? 'bg-orange-500' :
              caso.prioridad === 'media' ? 'bg-yellow-500' : 'bg-green-500'
            }>
              {caso.prioridad}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Reportado el {new Date(caso.fechaReporte).toLocaleDateString('es-CO')}
          </p>
        </div>
        <div className="flex gap-2">
          {caso.estado !== 'archivado' && caso.estado !== 'sancionado' && (
            <>
              <Button variant="outline" onClick={() => setShowSeguimientoDialog(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Seguimiento
              </Button>
              <Button variant="outline" onClick={() => setShowResolucionDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Resolución
              </Button>
              <Button onClick={() => setShowSancionDialog(true)}>
                <Gavel className="h-4 w-4 mr-2" />
                Sancionar
              </Button>
            </>
          )}
          {caso.sancion && !caso.sancion.apelada && (
            <Button variant="outline" onClick={() => setShowApelacionDialog(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Apelar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detalle">Detalle del Caso</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="resolucion">Resolución</TabsTrigger>
          <TabsTrigger value="sancion">Sanción</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Tipo de Conflicto</Label>
                  <p className="font-medium capitalize">{caso.tipo.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Descripción</Label>
                  <p className="text-sm">{caso.descripcion}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha del Incidente</Label>
                  <p>{new Date(caso.fechaIncidente).toLocaleDateString('es-CO')}</p>
                </div>
                {caso.lugar && (
                  <div>
                    <Label className="text-muted-foreground">Lugar</Label>
                    <p>{caso.lugar}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Partes Involucradas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-accent rounded-lg">
                  <Label className="text-muted-foreground">Unidad Principal</Label>
                  <p className="font-medium">{caso.unidadInvolucrada1}</p>
                  <p className="text-sm">{caso.residenteInvolucrado1}</p>
                </div>
                {caso.unidadInvolucrada2 && (
                  <div className="p-3 bg-accent rounded-lg">
                    <Label className="text-muted-foreground">Unidad Secundaria</Label>
                    <p className="font-medium">{caso.unidadInvolucrada2}</p>
                    <p className="text-sm">{caso.residenteInvolucrado2}</p>
                  </div>
                )}
                {caso.testigos && caso.testigos.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Testigos</Label>
                    <p className="text-sm">{caso.testigos.join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Miembros del Comité Asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {caso.comiteAsignado && caso.comiteAsignado.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {caso.comiteAsignado.map((_miembro: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Miembro {idx + 1}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Sin miembros asignados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle>Historial del Caso</CardTitle>
            </CardHeader>
            <CardContent>
              {caso.historial && caso.historial.length > 0 ? (
                <div className="space-y-4">
                  {caso.historial.map((item: HistorialCaso, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {item.tipo === 'creacion' && <FileText className="h-5 w-5 text-primary" />}
                          {item.tipo === 'seguimiento' && <MessageSquare className="h-5 w-5 text-primary" />}
                          {item.tipo === 'audiencia' && <Calendar className="h-5 w-5 text-primary" />}
                          {item.tipo === 'resolucion' && <CheckCircle className="h-5 w-5 text-primary" />}
                          {item.tipo === 'sancion' && <Gavel className="h-5 w-5 text-primary" />}
                          {item.tipo === 'apelacion' && <AlertTriangle className="h-5 w-5 text-primary" />}
                          {item.tipo === 'cierre' && <Archive className="h-5 w-5 text-primary" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.accion}</p>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.fecha).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.descripcion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay historial registrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolucion">
          <Card>
            <CardHeader>
              <CardTitle>Resolución del Caso</CardTitle>
            </CardHeader>
            <CardContent>
              {caso.resolucion ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Decisión</Label>
                    <Badge className="mt-1">
                      {caso.resolucion.decision.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fundamentos</Label>
                    <p className="text-sm mt-1">{caso.resolucion.fundamentos}</p>
                  </div>
                  {caso.resolucion.recomendaciones && (
                    <div>
                      <Label className="text-muted-foreground">Recomendaciones</Label>
                      <p className="text-sm mt-1">{caso.resolucion.recomendaciones}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Fecha de Emisión</Label>
                    <p>{new Date(caso.resolucion.fecha).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay resolución emitida para este caso</p>
                  <Button onClick={() => setShowResolucionDialog(true)} className="mt-4">
                    Emitir Resolución
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sancion">
          <Card>
            <CardHeader>
              <CardTitle>Sanción Aplicada</CardTitle>
            </CardHeader>
            <CardContent>
              {caso.sancion ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Tipo de Sanción</Label>
                    <Badge variant="destructive" className="mt-1">
                      {caso.sancion.tipo.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="text-sm mt-1">{caso.sancion.descripcion}</p>
                  </div>
                  {caso.sancion.valorMulta && caso.sancion.valorMulta > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Valor de la Multa</Label>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(caso.sancion.valorMulta)}
                      </p>
                    </div>
                  )}
                  {caso.sancion.fechaInicio && caso.sancion.fechaFin && (
                    <div>
                      <Label className="text-muted-foreground">Vigencia</Label>
                      <p>
                        Del {new Date(caso.sancion.fechaInicio).toLocaleDateString('es-CO')} al{' '}
                        {new Date(caso.sancion.fechaFin).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={caso.sancion.cumplida ? 'default' : 'secondary'}>
                        {caso.sancion.cumplida ? 'Cumplida' : 'Pendiente'}
                      </Badge>
                      {caso.sancion.apelada && (
                        <Badge variant="destructive">Apelada</Badge>
                      )}
                    </div>
                  </div>
                  {caso.sancion.fundamentosApelacion && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <Label className="text-red-600">Fundamentos de Apelación</Label>
                      <p className="text-sm mt-1">{caso.sancion.fundamentosApelacion}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay sanción aplicada para este caso</p>
                  <Button onClick={() => setShowSancionDialog(true)} className="mt-4">
                    Emitir Sanción
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nuevo Seguimiento */}
      <Dialog open={showSeguimientoDialog} onOpenChange={setShowSeguimientoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Seguimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Acción Realizada</Label>
              <Input 
                placeholder="Ej: Contacto telefónico, visita..."
                value={nuevoSeguimiento.accion}
                onChange={(e) => setNuevoSeguimiento({...nuevoSeguimiento, accion: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción Detallada</Label>
              <Textarea 
                placeholder="Describe lo realizado..."
                value={nuevoSeguimiento.descripcion}
                onChange={(e) => setNuevoSeguimiento({...nuevoSeguimiento, descripcion: e.target.value})}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAgregarSeguimiento}>
              <Send className="h-4 w-4 mr-2" />
              Guardar Seguimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Emitir Resolución */}
      <Dialog open={showResolucionDialog} onOpenChange={setShowResolucionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Emitir Resolución</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decisión *</Label>
              <Select 
                value={resolucion.decision} 
                onValueChange={(v) => setResolucion({...resolucion, decision: v as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="procede">Procede la queja</SelectItem>
                  <SelectItem value="no_procede">No procede la queja</SelectItem>
                  <SelectItem value="conciliacion">Conciliación entre partes</SelectItem>
                  <SelectItem value="requiere_mas_informacion">Requiere más información</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fundamentos *</Label>
              <Textarea 
                placeholder="Fundamentos legales y de hecho..."
                value={resolucion.fundamentos}
                onChange={(e) => setResolucion({...resolucion, fundamentos: e.target.value})}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Recomendaciones</Label>
              <Textarea 
                placeholder="Recomendaciones para las partes..."
                value={resolucion.recomendaciones}
                onChange={(e) => setResolucion({...resolucion, recomendaciones: e.target.value})}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleEmitirResolucion} disabled={!resolucion.fundamentos}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Emitir Resolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Emitir Sanción */}
      <Dialog open={showSancionDialog} onOpenChange={setShowSancionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Emitir Sanción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Sanción *</Label>
              <Select 
                value={sancion.tipo} 
                onValueChange={(v) => setSancion({...sancion, tipo: v as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposSancion.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción de la Sanción *</Label>
              <Textarea 
                placeholder="Describe la sanción y sus condiciones..."
                value={sancion.descripcion}
                onChange={(e) => setSancion({...sancion, descripcion: e.target.value})}
                rows={4}
              />
            </div>
            {sancion.tipo === 'multa' && (
              <div className="space-y-2">
                <Label>Valor de la Multa *</Label>
                <Input 
                  type="number"
                  placeholder="150000"
                  value={sancion.valorMulta}
                  onChange={(e) => setSancion({...sancion, valorMulta: parseFloat(e.target.value)})}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleEmitirSancion} disabled={!sancion.descripcion}>
              <Gavel className="h-4 w-4 mr-2" />
              Emitir Sanción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Apelar Sanción */}
      <Dialog open={showApelacionDialog} onOpenChange={setShowApelacionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apelar Sanción</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fundamentos de la Apelación *</Label>
              <Textarea 
                placeholder="Explica por qué consideras que la sanción es injusta..."
                value={fundamentosApelacion}
                onChange={(e) => setFundamentosApelacion(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleApelar} variant="destructive" disabled={!fundamentosApelacion}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Presentar Apelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
