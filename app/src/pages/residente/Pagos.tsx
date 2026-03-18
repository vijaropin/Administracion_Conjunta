import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DollarSign, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Pago } from '@/types';

export function ResidentePagos() {
  const { user } = useAuthStore();
  const { pagos, fetchPagosByResidente, fetchPagosByUnidad, registrarPago } = useFinancieroStore();
  
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [isPagoDialogOpen, setIsPagoDialogOpen] = useState(false);
  const [metodoPago, setMetodoPago] = useState('transferencia');

  useEffect(() => {
    if (user?.unidad) {
      fetchPagosByUnidad(user.unidad);
    } else if (user?.id) {
      fetchPagosByResidente(user.id);
    }
  }, [user?.id, user?.unidad, fetchPagosByResidente, fetchPagosByUnidad]);

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'en_mora');
  const pagosHistorial = pagos.filter(p => p.estado === 'pagado');
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.valor, 0);

  const handlePagar = async () => {
    if (!selectedPago) return;
    
    await registrarPago(selectedPago.id, metodoPago);
    setIsPagoDialogOpen(false);
    setSelectedPago(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mis Pagos</h2>
        <p className="text-muted-foreground">
          Gestiona tus pagos de administración
        </p>
      </div>

      {/* Resumen */}
      <Card className={totalPendiente > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Pendiente</p>
              <p className={`text-3xl font-bold ${totalPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(totalPendiente)}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              totalPendiente > 0 ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${totalPendiente > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          {totalPendiente > 0 && (
            <p className="text-sm text-red-600 mt-2">
              Tienes {pagosPendientes.length} pago(s) pendiente(s)
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pagos Pendientes */}
      {pagosPendientes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Pagos Pendientes</h3>
          <div className="space-y-3">
            {pagosPendientes.map((pago) => (
              <Card key={pago.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{pago.concepto}</p>
                        <Badge variant={pago.estado === 'en_mora' ? 'destructive' : 'secondary'}>
                          {pago.estado === 'en_mora' ? <AlertCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {pago.estado}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Vence: {new Date(pago.fechaVencimiento).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(pago.valor)}</p>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedPago(pago);
                          setIsPagoDialogOpen(true);
                        }}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historial de Pagos</h3>
        {pagosHistorial.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes pagos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pagosHistorial.map((pago) => (
              <Card key={pago.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{pago.concepto}</p>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pagado
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pagado el: {pago.fechaPago && new Date(pago.fechaPago).toLocaleDateString('es-CO')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Método: {pago.metodoPago}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">{formatCurrency(pago.valor)}</p>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Recibo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pago Dialog */}
      <Dialog open={isPagoDialogOpen} onOpenChange={setIsPagoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Realizar Pago</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-accent p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground">Concepto</p>
              <p className="font-medium">{selectedPago?.concepto}</p>
              <p className="text-sm text-muted-foreground mt-2">Valor a pagar</p>
              <p className="text-2xl font-bold">{selectedPago && formatCurrency(selectedPago.valor)}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={metodoPago === 'transferencia' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('transferencia')}
                  className="flex flex-col items-center py-4"
                >
                  <span className="text-xs">Transferencia</span>
                </Button>
                <Button
                  variant={metodoPago === 'online' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('online')}
                  className="flex flex-col items-center py-4"
                >
                  <CreditCard className="h-4 w-4 mb-1" />
                  <span className="text-xs">Online</span>
                </Button>
                <Button
                  variant={metodoPago === 'efectivo' ? 'default' : 'outline'}
                  onClick={() => setMetodoPago('efectivo')}
                  className="flex flex-col items-center py-4"
                >
                  <span className="text-xs">Efectivo</span>
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handlePagar}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

