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
  Scale, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Clock,
  AlertTriangle,
  Gavel,
  Archive,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tiposConflicto = [
  { value: 'ruido', label: 'Ruido y perturbación', icon: '🔊' },
  { value: 'mascotas', label: 'Mascotas', icon: '🐕' },
  { value: 'parqueadero', label: 'Parqueadero', icon: '🚗' },
  { value: 'areas_comunes', label: 'Áreas comunes', icon: '🏞️' },
  { value: 'modificaciones', label: 'Modificaciones', icon: '🔨' },
  { value: 'basura', label: 'Basura', icon: '🗑️' },
  { value: 'otro', label: 'Otro', icon: '📋' },
];

const prioridades = [
  { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-800' },
  { value: 'media', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critica', label: 'Crítica', color: 'bg-red-100 text-red-800' },
];

export function ComiteCasos() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conflictos, fetchConflictos, createConflicto } = useConvivenciaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nuevoCaso, setNuevoCaso] = useState({
    tipo: '',
    descripcion: '',
    unidadInvolucrada1: '',
    residenteInvolucrado1: '',
    unidadInvolucrada2: '',
    residenteInvolucrado2: '',
    fechaIncidente: '',
    lugar: '',
    prioridad: 'media',
    testigos: ''
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchConflictos(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchConflictos]);

  const filteredCasos = conflictos.filter(caso => {
    const matchesSearch = 
      caso.numeroCaso.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.unidadInvolucrada1.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todos' || caso.estado === filterEstado;
    const matchesTipo = filterTipo === 'todos' || caso.tipo === filterTipo;
    return matchesSearch && matchesEstado && matchesTipo;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'recibido': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Recibido</Badge>;
      case 'en_revision': return <Badge variant="outline"><Eye className="h-3 w-3 mr-1" /> En Revisión</Badge>;
      case 'en_mediacio': return <Badge variant="default"><Users className="h-3 w-3 mr-1" /> En Mediación</Badge>;
      case 'sancionado': return <Badge className="bg-red-500"><Gavel className="h-3 w-3 mr-1" /> Sancionado</Badge>;
      case 'archivado': return <Badge variant="outline"><Archive className="h-3 w-3 mr-1" /> Archivado</Badge>;
      case 'apelado': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Apelado</Badge>;
      default: return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleCrearCaso = async () => {
    if (!user?.conjuntoId) return;
    
    await createConflicto({
      conjuntoId: user.conjuntoId,
      tipo: nuevoCaso.tipo as any,
      descripcion: nuevoCaso.descripcion,
      unidadInvolucrada1: nuevoCaso.unidadInvolucrada1,
      residenteInvolucrado1: nuevoCaso.residenteInvolucrado1,
      unidadInvolucrada2: nuevoCaso.unidadInvolucrada2 || undefined,
      residenteInvolucrado2: nuevoCaso.residenteInvolucrado2 || undefined,
      fechaIncidente: new Date(nuevoCaso.fechaIncidente),
      fechaReporte: new Date(),
      lugar: nuevoCaso.lugar,
      prioridad: nuevoCaso.prioridad as any,
      estado: 'recibido',
      comiteAsignado: [user.id],
      testigos: nuevoCaso.testigos ? nuevoCaso.testigos.split(',').map(t => t.trim()) : []
    });
    
    setIsDialogOpen(false);
    await fetchConflictos(user.conjuntoId);
    setNuevoCaso({
      tipo: '',
      descripcion: '',
      unidadInvolucrada1: '',
      residenteInvolucrado1: '',
      unidadInvolucrada2: '',
      residenteInvolucrado2: '',
      fechaIncidente: '',
      lugar: '',
      prioridad: 'media',
      testigos: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Casos</h2>
          <p className="text-muted-foreground">
            Administra los conflictos y quejas entre residentes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Caso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Caso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Conflicto *</Label>
                  <Select 
                    value={nuevoCaso.tipo} 
                    onValueChange={(v) => setNuevoCaso({...nuevoCaso, tipo: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposConflicto.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad *</Label>
                  <Select 
                    value={nuevoCaso.prioridad} 
                    onValueChange={(v) => setNuevoCaso({...nuevoCaso, prioridad: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción del Conflicto *</Label>
                <Textarea 
                  placeholder="Describe detalladamente el conflicto o queja..."
                  value={nuevoCaso.descripcion}
                  onChange={(e) => setNuevoCaso({...nuevoCaso, descripcion: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidad Involucrada 1 *</Label>
                  <Input 
                    placeholder="Ej: 101"
                    value={nuevoCaso.unidadInvolucrada1}
                    onChange={(e) => setNuevoCaso({...nuevoCaso, unidadInvolucrada1: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Residente Involucrado 1 *</Label>
                  <Input 
                    placeholder="Nombre del residente"
                    value={nuevoCaso.residenteInvolucrado1}
                    onChange={(e) => setNuevoCaso({...nuevoCaso, residenteInvolucrado1: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unidad Involucrada 2 (opcional)</Label>
                  <Input 
                    placeholder="Ej: 102"
                    value={nuevoCaso.unidadInvolucrada2}
                    onChange={(e) => setNuevoCaso({...nuevoCaso, unidadInvolucrada2: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Residente Involucrado 2 (opcional)</Label>
                  <Input 
                    placeholder="Nombre del residente"
                    value={nuevoCaso.residenteInvolucrado2}
                    onChange={(e) => setNuevoCaso({...nuevoCaso, residenteInvolucrado2: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha del Incidente *</Label>
                  <Input 
                    type="date"
                    value={nuevoCaso.fechaIncidente}
                    onChange={(e) => setNuevoCaso({...nuevoCaso, fechaIncidente: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lugar</Label>
                  <Input 
                    placeholder="Ej: Zona común, parqueadero..."
                    value={nuevoCaso.lugar}
                    onChange={(e) => setNuevoCaso({...nuevoCaso, lugar: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Testigos (separados por coma)</Label>
                <Input 
                  placeholder="Nombre de testigos, si los hay..."
                  value={nuevoCaso.testigos}
                  onChange={(e) => setNuevoCaso({...nuevoCaso, testigos: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={handleCrearCaso}
                disabled={!nuevoCaso.tipo || !nuevoCaso.descripcion || !nuevoCaso.unidadInvolucrada1 || !nuevoCaso.residenteInvolucrado1 || !nuevoCaso.fechaIncidente}
              >
                Registrar Caso
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, descripción o unidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="recibido">Recibido</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="en_mediacio">En Mediación</SelectItem>
            <SelectItem value="sancionado">Sancionado</SelectItem>
            <SelectItem value="archivado">Archivado</SelectItem>
            <SelectItem value="apelado">Apelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <Scale className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposConflicto.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Casos List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Casos ({filteredCasos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">N° Caso</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Unidades</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 font-medium">Prioridad</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCasos.map((caso) => (
                  <tr key={caso.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">{caso.numeroCaso}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{caso.tipo}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {caso.unidadInvolucrada1}
                      {caso.unidadInvolucrada2 && ` vs ${caso.unidadInvolucrada2}`}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(caso.fechaReporte).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={prioridades.find(p => p.value === caso.prioridad)?.color}>
                        {caso.prioridad}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{getEstadoBadge(caso.estado)}</td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/comite/casos/${caso.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCasos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron casos con los filtros aplicados
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

