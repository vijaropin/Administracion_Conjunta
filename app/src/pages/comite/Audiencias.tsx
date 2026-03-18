import { useEffect, useState } from 'react';
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
  DialogTrigger,
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
  Calendar, 
  Plus, 
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  Handshake
} from 'lucide-react';


const tiposAudiencia = [
  { value: 'conciliacion', label: 'Audiencia de Conciliación' },
  { value: 'arbitraje', label: 'Audiencia de Arbitraje' },
  { value: 'notificacion', label: 'Audiencia de Notificación' },
];

const resultadosAudiencia = [
  { value: 'conciliacion', label: 'Conciliación Exitosa' },
  { value: 'no_conciliacion', label: 'No Hubo Conciliación' },
  { value: 'apertura_proceso', label: 'Apertura de Proceso' },
  { value: 'diferimiento', label: 'Diferimiento' },
];

export function ComiteAudiencias() {
  const { user } = useAuthStore();
  const { conflictos, audiencias, fetchConflictos, fetchAudiencias, createAudiencia, updateAudiencia } = useConvivenciaStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAudiencia, setSelectedAudiencia] = useState<any>(null);
  const [showResultadoDialog, setShowResultadoDialog] = useState(false);
  
  const [nuevaAudiencia, setNuevaAudiencia] = useState({
    conflictoId: '',
    fecha: '',
    hora: '',
    lugar: '',
    tipo: 'conciliacion',
    asistentes: '',
    comitePresente: ''
  });
  
  const [resultado, setResultado] = useState({
    resultado: '',
    acuerdos: '',
    acta: ''
  });

  useEffect(() => {
    const cargar = async () => {
      if (!user?.conjuntoId) return;
      await fetchConflictos(user.conjuntoId);
      await await fetchAudiencias(user.conjuntoId);
    };
    void cargar();
  }, [user?.conjuntoId, fetchConflictos, fetchAudiencias]);

  const handleCrearAudiencia = async () => {
    if (!user?.id) return;
    
    await createAudiencia({
      conflictoId: nuevaAudiencia.conflictoId,
      fecha: new Date(nuevaAudiencia.fecha),
      hora: nuevaAudiencia.hora,
      lugar: nuevaAudiencia.lugar,
      tipo: nuevaAudiencia.tipo as any,
      asistentes: nuevaAudiencia.asistentes.split(',').map(a => a.trim()),
      unidadesInvolucradas: [],
      resultado: 'diferimiento',
      comitePresente: nuevaAudiencia.comitePresente.split(',').map(c => c.trim())
    });
    
    setIsDialogOpen(false);
    setNuevaAudiencia({
      conflictoId: '',
      fecha: '',
      hora: '',
      lugar: '',
      tipo: 'conciliacion',
      asistentes: '',
      comitePresente: ''
    });
  };

  const handleRegistrarResultado = async () => {
    if (!selectedAudiencia) return;
    
    await updateAudiencia(selectedAudiencia.id, {
      resultado: resultado.resultado as any,
      acuerdos: resultado.acuerdos,
      acta: resultado.acta
    });
    
    setShowResultadoDialog(false);
    setSelectedAudiencia(null);
    setResultado({ resultado: '', acuerdos: '', acta: '' });
    if (user?.conjuntoId) {
      await fetchAudiencias(user.conjuntoId);
    }
  };

  const getTipoBadge = (tipo: string) => {
    const labels: { [key: string]: string } = {
      conciliacion: 'Conciliación',
      arbitraje: 'Arbitraje',
      notificacion: 'Notificación'
    };
    return <Badge variant="outline">{labels[tipo] || tipo}</Badge>;
  };

  const getResultadoBadge = (resultado: string) => {
    const variants: { [key: string]: string } = {
      conciliacion: 'default',
      no_conciliacion: 'secondary',
      apertura_proceso: 'destructive',
      diferimiento: 'outline'
    };
    const labels: { [key: string]: string } = {
      conciliacion: 'Conciliación Exitosa',
      no_conciliacion: 'No Hubo Conciliación',
      apertura_proceso: 'Apertura de Proceso',
      diferimiento: 'Diferimiento'
    };
    return <Badge variant={variants[resultado] as any}>{labels[resultado] || resultado}</Badge>;
  };

  const audienciasPendientes = audiencias.filter(a => a.resultado === 'diferimiento');
  const audienciasPasadas = audiencias.filter(a => a.resultado !== 'diferimiento');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audiencias</h2>
          <p className="text-muted-foreground">
            Gestiona las audiencias de conciliación y arbitraje
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Programar Audiencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Programar Nueva Audiencia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Caso Relacionado *</Label>
                <Select 
                  value={nuevaAudiencia.conflictoId} 
                  onValueChange={(v) => setNuevaAudiencia({...nuevaAudiencia, conflictoId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un caso" />
                  </SelectTrigger>
                  <SelectContent>
                    {conflictos.filter(c => c.estado !== 'archivado').map(caso => (
                      <SelectItem key={caso.id} value={caso.id}>
                        {caso.numeroCaso} - {caso.tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Audiencia *</Label>
                <Select 
                  value={nuevaAudiencia.tipo} 
                  onValueChange={(v) => setNuevaAudiencia({...nuevaAudiencia, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposAudiencia.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input 
                    type="date"
                    value={nuevaAudiencia.fecha}
                    onChange={(e) => setNuevaAudiencia({...nuevaAudiencia, fecha: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora *</Label>
                  <Input 
                    type="time"
                    value={nuevaAudiencia.hora}
                    onChange={(e) => setNuevaAudiencia({...nuevaAudiencia, hora: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lugar *</Label>
                <Input 
                  placeholder="Ej: Salón comunal, oficina de administración..."
                  value={nuevaAudiencia.lugar}
                  onChange={(e) => setNuevaAudiencia({...nuevaAudiencia, lugar: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Asistentes (separados por coma)</Label>
                <Input 
                  placeholder="Nombres de los asistentes..."
                  value={nuevaAudiencia.asistentes}
                  onChange={(e) => setNuevaAudiencia({...nuevaAudiencia, asistentes: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Miembros del Comité Presentes</Label>
                <Input 
                  placeholder="Nombres de los miembros del comité..."
                  value={nuevaAudiencia.comitePresente}
                  onChange={(e) => setNuevaAudiencia({...nuevaAudiencia, comitePresente: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={handleCrearAudiencia}
                disabled={!nuevaAudiencia.conflictoId || !nuevaAudiencia.fecha || !nuevaAudiencia.hora || !nuevaAudiencia.lugar}
              >
                Programar Audiencia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Audiencias Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Audiencias Programadas ({audienciasPendientes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audienciasPendientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay audiencias programadas
            </p>
          ) : (
            <div className="space-y-3">
              {audienciasPendientes.map((audiencia) => {
                const caso = conflictos.find(c => c.id === audiencia.conflictoId);
                return (
                  <div key={audiencia.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        {getTipoBadge(audiencia.tipo)}
                        <span className="font-medium">{caso?.numeroCaso}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(audiencia.fecha).toLocaleDateString('es-CO')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {audiencia.hora}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {audiencia.lugar}
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setSelectedAudiencia(audiencia);
                        setShowResultadoDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Registrar Resultado
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Audiencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Audiencias ({audienciasPasadas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {audienciasPasadas.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay audiencias registradas
            </p>
          ) : (
            <div className="space-y-3">
              {audienciasPasadas.map((audiencia) => {
                const caso = conflictos.find(c => c.id === audiencia.conflictoId);
                return (
                  <div key={audiencia.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {getTipoBadge(audiencia.tipo)}
                          <span className="font-medium">{caso?.numeroCaso}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(audiencia.fecha).toLocaleDateString('es-CO')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {audiencia.hora}
                          </span>
                        </div>
                      </div>
                      {getResultadoBadge(audiencia.resultado)}
                    </div>
                    {audiencia.acuerdos && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                          <Handshake className="h-4 w-4" />
                          Acuerdos Alcanzados
                        </p>
                        <p className="text-sm text-green-700 mt-1">{audiencia.acuerdos}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Registrar Resultado */}
      <Dialog open={showResultadoDialog} onOpenChange={setShowResultadoDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Resultado de Audiencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resultado *</Label>
              <Select 
                value={resultado.resultado} 
                onValueChange={(v) => setResultado({...resultado, resultado: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el resultado" />
                </SelectTrigger>
                <SelectContent>
                  {resultadosAudiencia.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {resultado.resultado === 'conciliacion' && (
              <div className="space-y-2">
                <Label>Acuerdos Alcanzados</Label>
                <Textarea 
                  placeholder="Describe los acuerdos a los que llegaron las partes..."
                  value={resultado.acuerdos}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResultado({...resultado, acuerdos: e.target.value})}
                  rows={4}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Acta de la Audiencia</Label>
              <Textarea 
                placeholder="Resumen de lo tratado en la audiencia..."
                value={resultado.acta}
                onChange={(e) => setResultado({...resultado, acta: e.target.value})}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleRegistrarResultado} disabled={!resultado.resultado}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Guardar Resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

