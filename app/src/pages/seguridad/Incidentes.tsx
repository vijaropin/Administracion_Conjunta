import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSeguridadStore } from '@/store/seguridadStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function SeguridadIncidentes() {
  const { user } = useAuthStore();
  const { incidentes, fetchIncidentes, updateIncidente } = useSeguridadStore();
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchIncidentes(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchIncidentes]);

  const list = incidentes.filter((i) => estadoFiltro === 'todos' || i.estado === estadoFiltro);

  const cambiarEstado = async (id: string, estado: 'en_proceso' | 'cerrado') => {
    await updateIncidente(id, { estado });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Incidentes de Seguridad</h2>
          <p className="text-muted-foreground">Minuta digital y seguimiento operativo.</p>
        </div>
        <select className="border rounded-md px-3 py-2 text-sm" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="reportado">Reportado</option>
          <option value="en_proceso">En proceso</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {list.map((i) => (
            <div key={i.id} className="border rounded-md p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium capitalize">{i.tipo}</p>
                <Badge variant={i.estado === 'cerrado' ? 'default' : 'secondary'}>{i.estado}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{i.descripcion}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(i.fecha).toLocaleString('es-CO')} • {i.ubicacion || 'Ubicación no informada'}</p>
              <div className="flex gap-2 mt-2">
                {i.estado === 'reportado' && <Button size="sm" variant="outline" onClick={() => cambiarEstado(i.id, 'en_proceso')}>Marcar en proceso</Button>}
                {i.estado !== 'cerrado' && <Button size="sm" onClick={() => cambiarEstado(i.id, 'cerrado')}>Cerrar</Button>}
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">No hay incidentes.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
