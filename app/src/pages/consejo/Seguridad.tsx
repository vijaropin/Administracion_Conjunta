import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ConsejoSeguridad() {
  const { user } = useAuthStore();
  const { incidentes, fetchIncidentes } = useSeguridadStore();

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchIncidentes(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchIncidentes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reportes de Seguridad</h2>
        <p className="text-muted-foreground">Seguimiento por estado: revisado, aprobado, gestionado o cerrado.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Incidentes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {incidentes.map((i) => (
            <div key={i.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{i.tipo}</p>
                <p className="text-xs text-muted-foreground">{new Date(i.fecha).toLocaleString('es-CO')}</p>
              </div>
              <Badge variant={i.estado === 'cerrado' ? 'default' : 'secondary'}>{i.estado}</Badge>
            </div>
          ))}
          {incidentes.length === 0 && <p className="text-sm text-muted-foreground">No hay reportes.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
