import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useParqueaderoStore } from '@/store/parqueaderoStore';
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
  Car, 
  Bike, 
  CircleParking,
  Plus, 
  Search, 
  Filter,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Building
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const tiposVehiculo = [
  { value: 'carro', label: 'Carro', icon: Car },
  { value: 'moto', label: 'Moto', icon: Bike },
  { value: 'bicicleta', label: 'Bicicleta', icon: CircleParking },
];

const categoriasParqueadero = [
  { value: 'propio', label: 'Propio (Venta)' },
  { value: 'comun', label: 'Común (Uso compartido)' },
  { value: 'visitante', label: 'Visitante' },
];

export function AdminParqueaderos() {
  const { user } = useAuthStore();
  const { 
    parqueaderos, 
    vehiculos, 
    estadisticas, 
    fetchParqueaderos, 
    fetchVehiculos,
    createParqueadero,
    createVehiculo,
    liberarParqueadero,
    fetchEstadisticas,
    generarCodigoParqueadero
  } = useParqueaderoStore();
  
  const [activeTab, setActiveTab] = useState('vehiculos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  
  // Dialogs
  const [showNuevoParqueadero, setShowNuevoParqueadero] = useState(false);
  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false);
  
  // Form states
  const [nuevoParqueadero, setNuevoParqueadero] = useState({
    tipo: 'carro',
    categoria: 'propio',
    ubicacion: '',
    areaM2: '',
    tipoConstruccion: 'cubierto',
    tieneServicios: false,
    accesibilidad: 'directa'
  });
  
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    tipo: 'carro',
    placa: '',
    marca: '',
    modelo: '',
    color: '',
    anio: '',
    residenteId: '',
    unidadId: ''
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchParqueaderos(user.conjuntoId);
      fetchVehiculos(user.conjuntoId);
      fetchEstadisticas(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  const filteredParqueaderos = parqueaderos.filter(p => {
    const matchesSearch = 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unidadAsignada?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || p.tipo === filterTipo;
    const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const handleCrearParqueadero = async () => {
    if (!user?.conjuntoId) return;
    
    const codigo = await generarCodigoParqueadero(user.conjuntoId, nuevoParqueadero.tipo);
    
    await createParqueadero({
      conjuntoId: user.conjuntoId,
      codigo,
      tipo: nuevoParqueadero.tipo as any,
      categoria: nuevoParqueadero.categoria as any,
      ubicacion: nuevoParqueadero.ubicacion,
      estado: 'disponible',
      areaM2: nuevoParqueadero.areaM2 ? parseFloat(nuevoParqueadero.areaM2) : undefined,
      tipoConstruccion: nuevoParqueadero.tipoConstruccion as any,
      tieneServicios: nuevoParqueadero.tieneServicios,
      accesibilidad: nuevoParqueadero.accesibilidad as any
    });
    
    setShowNuevoParqueadero(false);
    setNuevoParqueadero({
      tipo: 'carro',
      categoria: 'propio',
      ubicacion: '',
      areaM2: '',
      tipoConstruccion: 'cubierto',
      tieneServicios: false,
      accesibilidad: 'directa'
    });
    fetchParqueaderos(user.conjuntoId);
    fetchEstadisticas(user.conjuntoId);
  };

  const handleCrearVehiculo = async () => {
    if (!user?.conjuntoId) return;
    
    await createVehiculo({
      conjuntoId: user.conjuntoId,
      residenteId: nuevoVehiculo.unidadId,
      unidadId: nuevoVehiculo.unidadId,
      tipo: nuevoVehiculo.tipo as any,
      placa: nuevoVehiculo.placa,
      marca: nuevoVehiculo.marca,
      modelo: nuevoVehiculo.modelo,
      color: nuevoVehiculo.color,
      anio: nuevoVehiculo.anio ? parseInt(nuevoVehiculo.anio) : undefined,
      activo: true,
      fechaRegistro: new Date()
    });
    
    setShowNuevoVehiculo(false);
    setNuevoVehiculo({
      tipo: 'carro',
      placa: '',
      marca: '',
      modelo: '',
      color: '',
      anio: '',
      residenteId: '',
      unidadId: ''
    });
    fetchVehiculos(user.conjuntoId);
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible': return <Badge variant="outline" className="bg-green-50"><CheckCircle className="h-3 w-3 mr-1" /> Disponible</Badge>;
      case 'asignado': return <Badge variant="default"><Users className="h-3 w-3 mr-1" /> Asignado</Badge>;
      case 'mantenimiento': return <Badge variant="secondary"><Building className="h-3 w-3 mr-1" /> Mantenimiento</Badge>;
      default: return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Parqueaderos</h2>
          <p className="text-muted-foreground">
            Administra parqueaderos y vehículos según Decreto 768 de 2025
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNuevoParqueadero(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Parqueadero
          </Button>
          <Button variant="outline" onClick={() => setShowNuevoVehiculo(true)}>
            <Car className="h-4 w-4 mr-2" />
            Registrar Vehículo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Carros</CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.totalCarros || 0}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.ocupadosCarros || 0} ocupados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Motos</CardTitle>
            <Bike className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.totalMotos || 0}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.ocupadosMotos || 0} ocupadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bicicletas</CardTitle>
            <CircleParking className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.totalBicicletas || 0}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.ocupadosBicicletas || 0} ocupadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.porcentajeOcupacion.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(estadisticas?.ingresosPorParqueaderos || 0)} ingresos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parqueaderos">Parqueaderos</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos Registrados</TabsTrigger>
        </TabsList>

        <TabsContent value="parqueaderos" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, ubicación o unidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tiposVehiculo.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[150px]">
                <CheckCircle className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parqueaderos Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredParqueaderos.map((parqueadero) => (
              <Card key={parqueadero.id} className={parqueadero.estado === 'asignado' ? 'border-blue-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{parqueadero.codigo}</span>
                        {getEstadoBadge(parqueadero.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {parqueadero.ubicacion}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{parqueadero.tipo}</Badge>
                        <Badge variant="outline">{parqueadero.categoria}</Badge>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {parqueadero.tipo === 'carro' && <Car className="h-5 w-5 text-primary" />}
                      {parqueadero.tipo === 'moto' && <Bike className="h-5 w-5 text-primary" />}
                      {parqueadero.tipo === 'bicicleta' && <CircleParking className="h-5 w-5 text-primary" />}
                    </div>
                  </div>
                  
                  {parqueadero.estado === 'asignado' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium">Asignado a:</p>
                      <p className="text-sm">Unidad {parqueadero.unidadAsignada}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-4">
                    {parqueadero.estado === 'asignado' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={() => liberarParqueadero(parqueadero.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Liberar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vehiculos">
          <Card>
            <CardHeader>
              <CardTitle>Vehículos Registrados ({vehiculos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium">Placa</th>
                      <th className="text-left py-3 px-4 font-medium">Marca/Modelo</th>
                      <th className="text-left py-3 px-4 font-medium">Color</th>
                      <th className="text-left py-3 px-4 font-medium">Unidad</th>
                      <th className="text-left py-3 px-4 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehiculos.map((vehiculo) => (
                      <tr key={vehiculo.id} className="border-b hover:bg-accent/50">
                        <td className="py-3 px-4">
                          <Badge variant="outline">{vehiculo.tipo}</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">{vehiculo.placa || '-'}</td>
                        <td className="py-3 px-4">{vehiculo.marca} {vehiculo.modelo}</td>
                        <td className="py-3 px-4">{vehiculo.color}</td>
                        <td className="py-3 px-4">{vehiculo.unidadId}</td>
                        <td className="py-3 px-4">
                          <Badge variant={vehiculo.activo ? 'default' : 'secondary'}>
                            {vehiculo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nuevo Parqueadero */}
      <Dialog open={showNuevoParqueadero} onOpenChange={setShowNuevoParqueadero}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Parqueadero</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={nuevoParqueadero.tipo} 
                  onValueChange={(v) => setNuevoParqueadero({...nuevoParqueadero, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposVehiculo.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select 
                  value={nuevoParqueadero.categoria} 
                  onValueChange={(v) => setNuevoParqueadero({...nuevoParqueadero, categoria: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasParqueadero.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación *</Label>
              <Input 
                placeholder="Ej: Sótano 1, Zona A..."
                value={nuevoParqueadero.ubicacion}
                onChange={(e) => setNuevoParqueadero({...nuevoParqueadero, ubicacion: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Área (m²)</Label>
                <Input 
                  type="number"
                  placeholder="12.5"
                  value={nuevoParqueadero.areaM2}
                  onChange={(e) => setNuevoParqueadero({...nuevoParqueadero, areaM2: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Construcción</Label>
                <Select 
                  value={nuevoParqueadero.tipoConstruccion} 
                  onValueChange={(v) => setNuevoParqueadero({...nuevoParqueadero, tipoConstruccion: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cubierto">Cubierto</SelectItem>
                    <SelectItem value="descubierto">Descubierto</SelectItem>
                    <SelectItem value="semicubierto">Semicubierto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleCrearParqueadero}
              disabled={!nuevoParqueadero.ubicacion}
            >
              Crear Parqueadero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nuevo Vehículo */}
      <Dialog open={showNuevoVehiculo} onOpenChange={setShowNuevoVehiculo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Vehículo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={nuevoVehiculo.tipo} 
                  onValueChange={(v) => setNuevoVehiculo({...nuevoVehiculo, tipo: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposVehiculo.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Placa</Label>
                <Input 
                  placeholder="ABC123"
                  value={nuevoVehiculo.placa}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, placa: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input 
                  placeholder="Toyota"
                  value={nuevoVehiculo.marca}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, marca: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input 
                  placeholder="Corolla"
                  value={nuevoVehiculo.modelo}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, modelo: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input 
                  placeholder="Blanco"
                  value={nuevoVehiculo.color}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, color: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Año</Label>
                <Input 
                  type="number"
                  placeholder="2023"
                  value={nuevoVehiculo.anio}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, anio: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Casa *</Label>
                <Input 
                  placeholder="101"
                  value={nuevoVehiculo.unidadId}
                  onChange={(e) => setNuevoVehiculo({...nuevoVehiculo, unidadId: e.target.value, residenteId: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleCrearVehiculo}
              disabled={!nuevoVehiculo.unidadId}
            >
              Registrar Vehículo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

