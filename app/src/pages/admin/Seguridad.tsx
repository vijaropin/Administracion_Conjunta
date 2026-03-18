import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Users,
  Car,
  LogOut,
  Clock,
  CheckCircle,
  UserCheck
} from 'lucide-react';


export function Seguridad() {
  const { user } = useAuthStore();
  const { visitantes, fetchVisitantes, createVisitante, registrarSalida } = useSeguridadStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [,] = useState<'visitantes' | 'incidentes'>('visitantes');
  const [newVisitante, setNewVisitante] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    unidadDestino: '',
    residenteAutoriza: '',
    tipo: 'visitante',
    placaVehiculo: '',
    observaciones: ''
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchVisitantes(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  const filteredVisitantes = visitantes.filter(visitante => 
    visitante.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitante.documento.includes(searchTerm) ||
    visitante.unidadDestino.includes(searchTerm)
  );

  const visitantesDentro = filteredVisitantes.filter(v => !v.fechaSalida);

  const handleCreateVisitante = async () => {
    if (!user?.conjuntoId || !user?.id) return;
    
    await createVisitante({
      conjuntoId: user.conjuntoId,
      nombre: newVisitante.nombre,
      documento: newVisitante.documento,
      telefono: newVisitante.telefono,
      unidadDestino: newVisitante.unidadDestino,
      residenteAutoriza: newVisitante.residenteAutoriza,
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
      unidadDestino: '',
      residenteAutoriza: '',
      tipo: 'visitante',
      placaVehiculo: '',
      observaciones: ''
    });
  };

  const handleSalida = async (visitanteId: string) => {
    await registrarSalida(visitanteId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Control de Seguridad</h2>
          <p className="text-muted-foreground">
            Gestiona el ingreso y salida de visitantes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Visitante</DialogTitle>
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
                <Select 
                  value={newVisitante.tipo} 
                  onValueChange={(v) => setNewVisitante({...newVisitante, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visitante">Visitante</SelectItem>
                    <SelectItem value="domicilio">Domicilio</SelectItem>
                    <SelectItem value="servicio">Servicio</SelectItem>
                    <SelectItem value="proveedor">Proveedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidad Destino *</Label>
                  <Input 
                    placeholder="Ej: 101"
                    value={newVisitante.unidadDestino}
                    onChange={(e) => setNewVisitante({...newVisitante, unidadDestino: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Residente Autoriza *</Label>
                  <Input 
                    placeholder="Nombre residente"
                    value={newVisitante.residenteAutoriza}
                    onChange={(e) => setNewVisitante({...newVisitante, residenteAutoriza: e.target.value})}
                  />
                </div>
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
                Registrar Ingreso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dentro del Conjunto</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitantesDentro.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoy</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitantes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Vehículo</CardTitle>
            <Car className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitantes.filter(v => v.placaVehiculo).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, documento o unidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Visitantes List */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Visitantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Documento</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Destino</th>
                  <th className="text-left py-3 px-4 font-medium">Ingreso</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitantes.map((visitante) => (
                  <tr key={visitante.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">{visitante.nombre}</td>
                    <td className="py-3 px-4">{visitante.documento}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{visitante.tipo}</Badge>
                    </td>
                    <td className="py-3 px-4">{visitante.unidadDestino}</td>
                    <td className="py-3 px-4">
                      {new Date(visitante.fechaIngreso).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={visitante.fechaSalida ? 'secondary' : 'default'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {visitante.fechaSalida ? (
                          <><CheckCircle className="h-3 w-3" /> Salió</>
                        ) : (
                          <><Clock className="h-3 w-3" /> Dentro</>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {!visitante.fechaSalida && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSalida(visitante.id)}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Registrar Salida
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
