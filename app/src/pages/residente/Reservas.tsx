import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Calendar, 
  Plus, 
  Clock,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function ResidenteReservas() {
  const { user } = useAuthStore();
  const { zonasComunes, fetchZonasComunes } = useConjuntoStore();
  const { reservas, fetchReservasByResidente, createReserva, cancelarReserva } = useSeguridadStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState<string>('');
  const [newReserva, setNewReserva] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    observaciones: ''
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchZonasComunes(user.conjuntoId);
    }
    if (user?.id) {
      fetchReservasByResidente(user.id);
    }
  }, [user?.conjuntoId, user?.id]);

  const zonasReservables = zonasComunes.filter((z) => z.activo && z.requiereReserva && z.nombre.toLowerCase().includes('salon comunal 2 piso'));
  const zonasDisponibles = zonasReservables.length > 0 ? zonasReservables : zonasComunes.filter((z) => z.activo && z.requiereReserva);

  const handleCreateReserva = async () => {
    if (!user?.conjuntoId || !user?.id || !user?.unidad || !selectedZona) return;
    
    const zona = zonasDisponibles.find(z => z.id === selectedZona);
    
    await createReserva({
      conjuntoId: user.conjuntoId,
      zonaId: selectedZona,
      residenteId: user.id,
      unidadId: user.unidad,
      fecha: new Date(newReserva.fecha),
      horaInicio: newReserva.horaInicio,
      horaFin: newReserva.horaFin,
      estado: 'pendiente',
      valor: zona?.valorReserva,
      observaciones: newReserva.observaciones,
      fechaSolicitud: new Date()
    });
    
    setIsDialogOpen(false);
    setNewReserva({
      fecha: '',
      horaInicio: '',
      horaFin: '',
      observaciones: ''
    });
    setSelectedZona('');
  };

  const handleCancelar = async (reservaId: string) => {
    await cancelarReserva(reservaId);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Confirmada</Badge>;
      case 'pendiente':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
      case 'cancelada':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  // const reservasActivas = reservas.filter(r => r.estado === 'confirmada' || r.estado === 'pendiente');
  // const reservasPasadas = reservas.filter(r => r.estado === 'completada' || r.estado === 'cancelada');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
          <p className="text-muted-foreground">
            Reserva las zonas comunes de tu conjunto
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Zona Común *</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedZona}
                  onChange={(e) => setSelectedZona(e.target.value)}
                >
                  <option value="">Selecciona una zona</option>
                  {zonasDisponibles.map(zona => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nombre} {zona.valorReserva ? `- ${formatCurrency(zona.valorReserva)}` : '- Gratis'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input 
                  type="date"
                  value={newReserva.fecha}
                  onChange={(e) => setNewReserva({...newReserva, fecha: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio *</Label>
                  <Input 
                    type="time"
                    value={newReserva.horaInicio}
                    onChange={(e) => setNewReserva({...newReserva, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin *</Label>
                  <Input 
                    type="time"
                    value={newReserva.horaFin}
                    onChange={(e) => setNewReserva({...newReserva, horaFin: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input 
                  placeholder="Notas adicionales..."
                  value={newReserva.observaciones}
                  onChange={(e) => setNewReserva({...newReserva, observaciones: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreateReserva}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Solicitar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Zonas Disponibles */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Zonas Disponibles</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zonasDisponibles.map(zona => (
            <Card key={zona.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{zona.nombre}</p>
                    <p className="text-sm text-muted-foreground">{zona.descripcion}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Cap: {zona.capacidad}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {zona.horarioApertura} - {zona.horarioCierre}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {zona.valorReserva ? formatCurrency(zona.valorReserva) : 'Gratis'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mis Reservas */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Mis Reservas</h3>
        {reservas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes reservas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reservas.map((reserva) => {
              const zona = zonasComunes.find(z => z.id === reserva.zonaId);
              return (
                <Card key={reserva.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{zona?.nombre || 'Zona'}</p>
                          {getEstadoBadge(reserva.estado)}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(reserva.fecha).toLocaleDateString('es-CO')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {reserva.horaInicio} - {reserva.horaFin}
                          </span>
                        </div>
                        {reserva.valor && (
                          <p className="text-sm mt-1">
                            Valor: {formatCurrency(reserva.valor)}
                          </p>
                        )}
                      </div>
                      {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelar(reserva.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

