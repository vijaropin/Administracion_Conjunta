import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useParqueaderoStore } from '@/store/parqueaderoStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Shield, AlertTriangle } from 'lucide-react';

export function SeguridadDashboard() {
  const { user } = useAuthStore();
  const { vehiculos, fetchVehiculos } = useParqueaderoStore();
  const { incidentes, fetchIncidentes } = useSeguridadStore();

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchVehiculos(user.conjuntoId);
    void fetchIncidentes(user.conjuntoId);
  }, [user?.conjuntoId, fetchVehiculos, fetchIncidentes]);

  const vehiculosAutorizados = vehiculos.filter((v) => v.activo).length;
  const incidentesAbiertos = incidentes.filter((i) => i.estado === 'reportado' || i.estado === 'en_proceso').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Panel de Seguridad</h2>
        <p className="text-muted-foreground">Control vehicular, visitantes e incidentes (sin acceso financiero ni datos sensibles).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Vehículos autorizados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{vehiculosAutorizados}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Incidentes abiertos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{incidentesAbiertos}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Estado operativo</CardTitle></CardHeader>
          <CardContent><Badge>Activo</Badge></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Control de Acceso Vehicular</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {vehiculos.slice(0, 10).map((v) => (
            <div key={v.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{v.placa || 'Sin placa'} • {v.tipo}</p>
                <p className="text-xs text-muted-foreground">Casa {v.unidadId} • Parqueadero {v.parqueaderoId || 'Sin asignar'} • {v.marca || '-'} {v.modelo || ''}</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1"><Car className="h-3 w-3" />Autorizado</Badge>
            </div>
          ))}
          {vehiculos.length === 0 && <p className="text-sm text-muted-foreground">No hay vehículos registrados.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Incidentes recientes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {incidentes.slice(0, 8).map((i) => (
            <div key={i.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{i.tipo}</p>
                <p className="text-xs text-muted-foreground">{i.ubicacion || 'Ubicación no informada'}</p>
              </div>
              <Badge variant={i.estado === 'cerrado' || i.estado === 'resuelto' ? 'default' : 'secondary'}>
                {i.estado === 'cerrado' || i.estado === 'resuelto' ? <Shield className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                {i.estado}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

