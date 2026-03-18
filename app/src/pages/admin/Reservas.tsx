import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export function AdminReservas() {
  const { user } = useAuthStore();
  const { reservas, fetchReservas, updateReserva } = useSeguridadStore();
  const { zonasComunes, fetchZonasComunes } = useConjuntoStore();

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchReservas(user.conjuntoId);
    void fetchZonasComunes(user.conjuntoId);
  }, [user?.conjuntoId, fetchReservas, fetchZonasComunes]);

  const cambiarEstado = async (id: string, estado: 'confirmada' | 'cancelada') => {
    await updateReserva(id, { estado, fechaRespuesta: new Date() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reservas</h2>
        <p className="text-muted-foreground">Solicitudes de residentes para aprobación, rechazo o seguimiento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes ({reservas.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reservas.length === 0 && <p className="text-sm text-muted-foreground">No hay reservas registradas.</p>}
          {reservas.map((reserva) => {
            const zona = zonasComunes.find((z) => z.id === reserva.zonaId);
            return (
              <div key={reserva.id} className="border rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">Casa {reserva.unidadId} • {zona?.nombre || 'Zona común'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reserva.fecha).toLocaleDateString('es-CO')} • {reserva.horaInicio} - {reserva.horaFin}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solicitada: {reserva.fechaSolicitud ? new Date(reserva.fechaSolicitud).toLocaleString('es-CO') : 'N/D'}
                    </p>
                  </div>
                  <Badge variant={reserva.estado === 'confirmada' ? 'default' : reserva.estado === 'pendiente' ? 'secondary' : 'outline'}>
                    {reserva.estado}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  {reserva.estado === 'pendiente' && (
                    <>
                      <Button size="sm" onClick={() => cambiarEstado(reserva.id, 'confirmada')}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />Aprobar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => cambiarEstado(reserva.id, 'cancelada')}>
                        <XCircle className="h-4 w-4 mr-1" />Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
