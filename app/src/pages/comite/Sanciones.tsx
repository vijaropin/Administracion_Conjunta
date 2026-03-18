import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConvivenciaStore } from '@/store/convivenciaStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Gavel, 
  Search, 
  Filter,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Eye
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const tiposSancion = [
  { value: 'llamado_atencion_verbal', label: 'Llamado de Atención Verbal' },
  { value: 'llamado_atencion_escrito', label: 'Llamado de Atención Escrito' },
  { value: 'multa', label: 'Multa Económica' },
  { value: 'suspension_servicios', label: 'Suspensión de Servicios' },
  { value: 'prohibicion_uso_areas', label: 'Prohibición de Uso de Áreas' },
];

export function ComiteSanciones() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { conflictos, fetchConflictos } = useConvivenciaStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchConflictos(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  // Extraer todas las sanciones de los conflictos
  const sanciones = conflictos
    .filter(c => c.sancion)
    .map(c => ({
      ...c.sancion,
      casoId: c.id,
      numeroCaso: c.numeroCaso,
      unidadInvolucrada: c.unidadInvolucrada1,
      residenteInvolucrado: c.residenteInvolucrado1,
      tipoConflicto: c.tipo
    }));

  const filteredSanciones = sanciones.filter(s => {
    const matchesSearch = 
      s.numeroCaso?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.unidadInvolucrada?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.residenteInvolucrado?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || s.tipo === filterTipo;
    const matchesEstado = filterEstado === 'todos' || 
      (filterEstado === 'cumplida' && s.cumplida) ||
      (filterEstado === 'pendiente' && !s.cumplida) ||
      (filterEstado === 'apelada' && s.apelada);
    return matchesSearch && matchesTipo && matchesEstado;
  });

  const sancionesPendientes = sanciones.filter(s => !s.cumplida && !s.apelada);
  const sancionesCumplidas = sanciones.filter(s => s.cumplida);
  const sancionesApeladas = sanciones.filter(s => s.apelada);
  const totalMultas = sanciones
    .filter(s => s.tipo === 'multa' && s.cumplida)
    .reduce((sum, s) => sum + (s.valorMulta || 0), 0);

  const getTipoBadge = (tipo: string | undefined) => {
    if (!tipo) return <Badge variant="outline">-</Badge>;
    const labels: { [key: string]: string } = {
      llamado_atencion_verbal: 'Llamado Verbal',
      llamado_atencion_escrito: 'Llamado Escrito',
      multa: 'Multa',
      suspension_servicios: 'Suspensión',
      prohibicion_uso_areas: 'Prohibición'
    };
    return <Badge variant="outline">{labels[tipo] || tipo}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sanciones</h2>
          <p className="text-muted-foreground">
            Gestión de sanciones impuestas por el Comité de Convivencia
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sanciones</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sanciones.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sancionesPendientes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cumplidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sancionesCumplidas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Multas Cobradas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMultas)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por caso, unidad o residente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposSancion.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <CheckCircle className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="cumplida">Cumplida</SelectItem>
            <SelectItem value="apelada">Apelada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sanciones List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sanciones ({filteredSanciones.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Caso</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Unidad</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha Emisión</th>
                  <th className="text-left py-3 px-4 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSanciones.map((sancion, idx) => (
                  <tr key={idx} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">{sancion.numeroCaso}</td>
                    <td className="py-3 px-4">{getTipoBadge(sancion.tipo)}</td>
                    <td className="py-3 px-4">
                      {sancion.unidadInvolucrada}
                      <p className="text-xs text-muted-foreground">{sancion.residenteInvolucrado}</p>
                    </td>
                    <td className="py-3 px-4">
                      {sancion.fechaEmision && new Date(sancion.fechaEmision).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3 px-4">
                      {sancion.tipo === 'multa' && sancion.valorMulta ? (
                        <span className="font-medium">{formatCurrency(sancion.valorMulta)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Badge variant={sancion.cumplida ? 'default' : 'secondary'}>
                          {sancion.cumplida ? 'Cumplida' : 'Pendiente'}
                        </Badge>
                        {sancion.apelada && (
                          <Badge variant="destructive">Apelada</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => sancion.casoId ? navigate(`/comite/casos/${sancion.casoId}`) : null}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Caso
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredSanciones.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No se encontraron sanciones con los filtros aplicados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sanciones Apeladas */}
      {sancionesApeladas.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Sanciones en Apelación ({sancionesApeladas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sancionesApeladas.map((sancion, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{sancion.numeroCaso}</span>
                      {getTipoBadge(sancion.tipo)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Unidad: {sancion.unidadInvolucrada}
                    </p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => sancion.casoId ? navigate(`/comite/casos/${sancion.casoId}`) : null}
                  >
                    Revisar Apelación
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
