import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConvivenciaStore } from '@/store/convivenciaStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Scale, 
  Gavel, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ComiteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    conflictosPendientes, 
    conflictosCriticos, 
    estadisticas, 
    fetchConflictos, 
    fetchEstadisticas 
  } = useConvivenciaStore();

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchConflictos(user.conjuntoId);
      fetchEstadisticas(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  const casosPorTipoData = estadisticas ? Object.entries(estadisticas.casosPorTipo).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value
  })) : [];

  const casosPorMesData = estadisticas ? Object.entries(estadisticas.casosPorMes).map(([name, value]) => ({
    name,
    value
  })) : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comité de Convivencia</h2>
          <p className="text-muted-foreground">
            Panel de conciliación para gestión de conflictos de convivencia (sin función sancionatoria).
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/comite/casos')}>
            <FileText className="h-4 w-4 mr-2" />
            Nuevo Caso
          </Button>
          <Button variant="outline" onClick={() => navigate('/comite/audiencias')}>
            <Calendar className="h-4 w-4 mr-2" />
            Programar Audiencia
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Casos</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.totalCasos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Desde el inicio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.casosPendientes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conflictosCriticos.length}</div>
            <p className="text-xs text-muted-foreground">
              Prioridad alta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Resolución</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.tasaResolucion.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Casos resueltos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Remitidos al Consejo</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.sancionesAplicadas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conciliaciones Exitosas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.conciliacionesExitosas || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.tiempoPromedioResolucion || 0} días</div>
            <p className="text-xs text-muted-foreground">
              Para resolver un caso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Casos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={casosPorTipoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {casosPorTipoData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Casos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={casosPorMesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0088FE" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Casos Críticos */}
      {conflictosCriticos.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Casos Críticos que Requieren Atención Inmediata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflictosCriticos.slice(0, 3).map((caso) => (
                <div 
                  key={caso.id} 
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100"
                  onClick={() => navigate(`/comite/casos/${caso.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{caso.numeroCaso}</span>
                      <Badge variant="destructive">{caso.tipo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{caso.descripcion}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver Detalle
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casos Pendientes */}
      <Card>
        <CardHeader>
          <CardTitle>Casos Pendientes de Revisión</CardTitle>
        </CardHeader>
        <CardContent>
          {conflictosPendientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay casos pendientes. ¡Excelente trabajo!
            </p>
          ) : (
            <div className="space-y-3">
              {conflictosPendientes.slice(0, 5).map((caso) => (
                <div 
                  key={caso.id} 
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                  onClick={() => navigate(`/comite/casos/${caso.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{caso.numeroCaso}</span>
                      <Badge variant={caso.prioridad === 'alta' ? 'destructive' : 'secondary'}>
                        {caso.prioridad}
                      </Badge>
                      <Badge variant="outline">{caso.tipo}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Unidad: {caso.unidadInvolucrada1} | Reportado: {new Date(caso.fechaReporte).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Atender
                  </Button>
                </div>
              ))}
            </div>
          )}
          {conflictosPendientes.length > 5 && (
            <Button 
              variant="ghost" 
              className="w-full mt-4"
              onClick={() => navigate('/comite/casos')}
            >
              Ver todos los casos pendientes ({conflictosPendientes.length})
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


