import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Wallet, Receipt, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function ContadoraDashboard() {
  const { user } = useAuthStore();
  const {
    pagos,
    pagosMora,
    pagosPagados,
    pagosPendientes,
    cajasMenores,
    gastosCajaMenor,
    fetchPagos,
    fetchCajasMenores,
    fetchGastosCajaMenor,
  } = useFinancieroStore();

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchPagos(user.conjuntoId);
    void fetchCajasMenores(user.conjuntoId);
  }, [user?.conjuntoId, fetchPagos, fetchCajasMenores]);

  useEffect(() => {
    if (cajasMenores[0]?.id) {
      void fetchGastosCajaMenor(cajasMenores[0].id);
    }
  }, [cajasMenores, fetchGastosCajaMenor]);

  const totalCartera = pagos.reduce((sum, p) => sum + p.valor, 0);
  const totalRecaudado = pagosPagados.reduce((sum, p) => sum + p.valor, 0);
  const totalPendiente = pagosPendientes.concat(pagosMora).reduce((sum, p) => sum + p.valor, 0);
  const cajaActiva = cajasMenores.find((c) => c.estado === 'abierta') ?? cajasMenores[0];
  const totalGastosCaja = gastosCajaMenor.reduce((sum, g) => sum + g.valor, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Módulo Contable</h2>
        <p className="text-muted-foreground">Vista analítica de cartera, recaudo, caja menor y control financiero.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-sm">Cartera total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalCartera)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-sm">Recaudo</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-700">{formatCurrency(totalRecaudado)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-sm">Pendiente + Mora</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-amber-700">{formatCurrency(totalPendiente)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-sm">Pagos registrados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{pagos.length}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Caja Menor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!cajaActiva && <p className="text-sm text-muted-foreground">No hay caja menor registrada.</p>}
            {cajaActiva && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Monto aprobado</span>
                  <span className="font-semibold">{formatCurrency(cajaActiva.montoAprobado)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fecha de aprobación</span>
                  <span>{new Date(cajaActiva.fechaAprobacion).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gastado</span>
                  <span className="font-semibold">{formatCurrency(totalGastosCaja)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Disponible</span>
                  <span className="font-semibold">{formatCurrency(Math.max(0, cajaActiva.montoAprobado - totalGastosCaja))}</span>
                </div>
                <Badge variant={cajaActiva.estado === 'abierta' ? 'default' : 'secondary'}>{cajaActiva.estado}</Badge>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pagos.slice(0, 8).map((pago) => (
              <div key={pago.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                <div>
                  <p className="font-medium">{pago.concepto}</p>
                  <p className="text-xs text-muted-foreground">{pago.consecutivoGeneral ?? 'Sin consecutivo'} • Unidad {pago.unidadId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(pago.valor)}</p>
                  <Badge variant={pago.estado === 'pagado' ? 'default' : 'secondary'}>{pago.estado}</Badge>
                </div>
              </div>
            ))}
            {pagos.length === 0 && <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gastos de Caja Menor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {gastosCajaMenor.slice(0, 10).map((gasto) => (
            <div key={gasto.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
              <div>
                <p className="font-medium">{gasto.concepto}</p>
                <p className="text-xs text-muted-foreground">{new Date(gasto.fechaGasto).toLocaleDateString('es-CO')}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(gasto.valor)}</p>
                {gasto.soporteNombre && (
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <Receipt className="h-3 w-3" />
                    {gasto.soporteNombre}
                  </p>
                )}
              </div>
            </div>
          ))}
          {gastosCajaMenor.length === 0 && <p className="text-sm text-muted-foreground">No hay gastos de caja menor registrados.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
