import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function ConsejoDashboard() {
  const { user } = useAuthStore();
  const { stats, fetchStats } = useDashboardStore();
  const { pagos, fetchPagos } = useFinancieroStore();

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchStats(user.conjuntoId);
    void fetchPagos(user.conjuntoId);
  }, [user?.conjuntoId, fetchStats, fetchPagos]);

  const carteraMora = pagos.filter((p) => p.estado === 'en_mora').reduce((s, p) => s + p.valor, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Consejo de Administración</h2>
        <p className="text-muted-foreground">Vista de supervisión, control y vigilancia (solo lectura).</p>
      </div>

      <Card className="border-blue-200 bg-blue-50/60">
        <CardContent className="py-4 text-sm text-blue-900 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          El Consejo supervisa gestión y presupuesto. No ejecuta operaciones administrativas directas.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Unidades</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.totalUnidades}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Recaudo mes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(stats.recaudoMes)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cartera pendiente</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(stats.recaudoPendiente)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Mora</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(carteraMora)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Control de Morosidad y Gestión</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Morosos actuales: <span className="font-medium">{stats.morosos}</span></p>
          <p className="text-sm text-muted-foreground">Incidentes abiertos: <span className="font-medium">{stats.incidentesAbiertos}</span></p>
          <p className="text-sm text-muted-foreground">Visitantes hoy: <span className="font-medium">{stats.visitantesHoy}</span></p>
          <Badge variant="outline" className="mt-1"><Wallet className="h-3 w-3 mr-1" />Revisión presupuestal</Badge>
          <Badge variant="outline" className="ml-2"><AlertCircle className="h-3 w-3 mr-1" />Seguimiento administrador</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
