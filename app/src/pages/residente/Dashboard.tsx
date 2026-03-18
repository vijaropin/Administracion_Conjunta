import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { useComunicacionStore } from '@/store/comunicacionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  MessageSquare, 
  Calendar, 
  Users,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function ResidenteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pagos, fetchPagosByResidente } = useFinancieroStore();
  const { comunicados, fetchComunicados } = useComunicacionStore();

  useEffect(() => {
    if (user?.id) {
      fetchPagosByResidente(user.id);
    }
    if (user?.conjuntoId) {
      fetchComunicados(user.conjuntoId);
    }
  }, [user?.id, user?.conjuntoId]);

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'en_mora');
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.valor, 0);
  const comunicadosNoLeidos = comunicados.filter(c => !c.leidoPor?.includes(user?.id || ''));

  const quickActions = [
    { 
      label: 'Ver Mis Pagos', 
      icon: DollarSign, 
      onClick: () => navigate('/residente/pagos'),
      color: 'bg-blue-500'
    },
    { 
      label: 'Registrar Visitante', 
      icon: Users, 
      onClick: () => navigate('/residente/visitantes'),
      color: 'bg-green-500'
    },
    { 
      label: 'Reservar Zona', 
      icon: Calendar, 
      onClick: () => navigate('/residente/reservas'),
      color: 'bg-purple-500'
    },
    { 
      label: 'Reportar Incidente', 
      icon: AlertCircle, 
      onClick: () => navigate('/residente/incidentes'),
      color: 'bg-orange-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">¡Hola, {user?.nombres?.split(' ')[0]}!</h2>
        <p className="text-muted-foreground">
          Bienvenido a tu portal de residente. Aquí puedes gestionar todo lo relacionado con tu unidad.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className="flex flex-col items-center p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
            >
              <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center mb-2`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalPendiente)}</div>
            <p className="text-xs text-muted-foreground">
              {pagosPendientes.length} pagos pendientes
            </p>
            {totalPendiente > 0 && (
              <Button 
                size="sm" 
                className="mt-3 w-full"
                onClick={() => navigate('/residente/pagos')}
              >
                Pagar Ahora
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comunicados</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comunicadosNoLeidos.length}</div>
            <p className="text-xs text-muted-foreground">
              Sin leer
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="mt-3 w-full"
              onClick={() => navigate('/residente/comunicados')}
            >
              Ver Comunicados
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Reservas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Reservas activas
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="mt-3 w-full"
              onClick={() => navigate('/residente/reservas')}
            >
              Nueva Reserva
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mis Últimos Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tienes pagos registrados
              </p>
            ) : (
              <div className="space-y-3">
                {pagos.slice(0, 5).map((pago) => (
                  <div key={pago.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{pago.concepto}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pago.fechaVencimiento).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(pago.valor)}</p>
                      <Badge 
                        variant={pago.estado === 'pagado' ? 'default' : pago.estado === 'en_mora' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {pago.estado === 'pagado' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {pago.estado === 'pendiente' && <Clock className="h-3 w-3 mr-1" />}
                        {pago.estado === 'en_mora' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {pago.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Comunicados</CardTitle>
          </CardHeader>
          <CardContent>
            {comunicados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay comunicados recientes
              </p>
            ) : (
              <div className="space-y-3">
                {comunicados.slice(0, 5).map((comunicado) => (
                  <div key={comunicado.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{comunicado.titulo}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {comunicado.contenido}
                        </p>
                      </div>
                      <Badge 
                        variant={comunicado.tipo === 'urgente' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {comunicado.tipo}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(comunicado.fecha).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
