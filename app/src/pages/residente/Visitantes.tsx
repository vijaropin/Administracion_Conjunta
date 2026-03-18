import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
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
  Users, 
  Plus, 
  Car,
  Clock,
  CheckCircle,
  UserCheck,
  Home
} from 'lucide-react';

export function ResidenteVisitantes() {
  const { user } = useAuthStore();
  const { visitantes, fetchVisitantes, createVisitante } = useSeguridadStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVisitante, setNewVisitante] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    tipo: 'visitante',
    placaVehiculo: '',
    observaciones: ''
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchVisitantes(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  const handleCreateVisitante = async () => {
    if (!user?.conjuntoId || !user?.id || !user?.unidad) return;
    
    await createVisitante({
      conjuntoId: user.conjuntoId,
      nombre: newVisitante.nombre,
      documento: newVisitante.documento,
      telefono: newVisitante.telefono,
      unidadDestino: user.unidad,
      residenteAutoriza: `${user.nombres} ${user.apellidos}`,
      fechaIngreso: new Date(),
      tipo: newVisitante.tipo as any,
      placaVehiculo: newVisitante.placaVehiculo || undefined,
      observaciones: newVisitante.observaciones,
      registradoPor: user.id
    });
    
    setIsDialogOpen(false);
    setNewVisitante({
      nombre: '',
      documento: '',
      telefono: '',
      tipo: 'visitante',
      placaVehiculo: '',
      observaciones: ''
    });
  };

  const visitantesActivos = visitantes.filter(v => !v.fechaSalida);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Visitantes</h2>
          <p className="text-muted-foreground">
            Registra y gestiona los visitantes de tu unidad
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Pre-registrar Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pre-registrar Visitante</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input 
                  placeholder="Nombre del visitante"
                  value={newVisitante.nombre}
                  onChange={(e) => setNewVisitante({...newVisitante, nombre: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Documento *</Label>
                  <Input 
                    placeholder="12345678"
                    value={newVisitante.documento}
                    onChange={(e) => setNewVisitante({...newVisitante, documento: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input 
                    placeholder="3001234567"
                    value={newVisitante.telefono}
                    onChange={(e) => setNewVisitante({...newVisitante, telefono: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Visitante *</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={newVisitante.tipo}
                  onChange={(e) => setNewVisitante({...newVisitante, tipo: e.target.value})}
                >
                  <option value="visitante">Visitante</option>
                  <option value="domicilio">Domicilio</option>
                  <option value="servicio">Servicio</option>
                  <option value="proveedor">Proveedor</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Placa Vehículo</Label>
                <Input 
                  placeholder="ABC123"
                  value={newVisitante.placaVehiculo}
                  onChange={(e) => setNewVisitante({...newVisitante, placaVehiculo: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input 
                  placeholder="Notas adicionales..."
                  value={newVisitante.observaciones}
                  onChange={(e) => setNewVisitante({...newVisitante, observaciones: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleCreateVisitante}>
                <UserCheck className="h-4 w-4 mr-2" />
                Pre-registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Visitantes Activos */}
      {visitantesActivos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Dentro del Conjunto</h3>
          <div className="space-y-3">
            {visitantesActivos.map((visitante) => (
              <Card key={visitante.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{visitante.nombre}</p>
                        <Badge variant="outline">{visitante.tipo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          {visitante.unidadDestino}
                        </span>
                        {visitante.placaVehiculo && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {visitante.placaVehiculo}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-green-500">
                      <Clock className="h-3 w-3 mr-1" />
                      Dentro
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historial de Visitantes</h3>
        {visitantes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes visitantes registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visitantes.map((visitante) => (
              <Card key={visitante.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{visitante.nombre}</p>
                        <Badge variant="outline">{visitante.tipo}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Ingreso: {new Date(visitante.fechaIngreso).toLocaleString('es-CO')}</span>
                        {visitante.placaVehiculo && (
                          <span className="flex items-center gap-1">
                            <Car className="h-3 w-3" />
                            {visitante.placaVehiculo}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={visitante.fechaSalida ? 'secondary' : 'default'}>
                      {visitante.fechaSalida ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Salió</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Dentro</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


;
