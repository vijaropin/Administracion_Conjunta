import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useComunicacionStore } from '@/store/comunicacionStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock3, Vote } from 'lucide-react';

export function ResidenteAsambleas() {
  const { user } = useAuthStore();
  const { asambleas, votaciones, fetchAsambleas, fetchVotaciones, votar } = useComunicacionStore();
  const [selectedAsambleaId, setSelectedAsambleaId] = useState<string>('');
  const [votandoId, setVotandoId] = useState<string>('');

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchAsambleas(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchAsambleas]);

  useEffect(() => {
    if (selectedAsambleaId) {
      void fetchVotaciones(selectedAsambleaId);
    }
  }, [selectedAsambleaId, fetchVotaciones]);

  useEffect(() => {
    if (!selectedAsambleaId && asambleas.length > 0) {
      setSelectedAsambleaId(asambleas[0].id);
    }
  }, [asambleas, selectedAsambleaId]);


  const votacionesAsamblea = useMemo(
    () => votaciones.filter((v) => v.asambleaId === selectedAsambleaId),
    [votaciones, selectedAsambleaId]
  );

  const votarOpcion = async (votacionId: string, opcion: 'SI' | 'NO') => {
    if (!user?.id) return;
    try {
      setVotandoId(votacionId);
      await votar(votacionId, opcion, user.id, user.unidad);
      await fetchVotaciones(selectedAsambleaId);
    } catch (error) {
      // error state disponible en store
    } finally {
      setVotandoId('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Asambleas</h2>
        <p className="text-muted-foreground">Participa con voto SI/NO dentro del tiempo programado y revisa resultados globales.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Historial de Asambleas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {asambleas.map((asamblea) => (
              <button
                key={asamblea.id}
                type="button"
                onClick={() => setSelectedAsambleaId(asamblea.id)}
                className={`w-full text-left border rounded-lg p-3 hover:bg-accent/40 ${selectedAsambleaId === asamblea.id ? 'border-primary' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">{asamblea.titulo}</p>
                  <Badge variant={asamblea.tipo === 'ordinaria' ? 'default' : 'secondary'}>{asamblea.tipo}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{new Date(asamblea.fecha).toLocaleDateString('es-CO')} • {asamblea.horaInicio} - {asamblea.horaFin}</p>
                <p className="text-xs text-muted-foreground">Estado: {asamblea.estado}</p>
              </button>
            ))}
            {asambleas.length === 0 && <p className="text-sm text-muted-foreground">No hay asambleas publicadas.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Votación de Propietarios</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!selectedAsambleaId && <p className="text-sm text-muted-foreground">Selecciona una asamblea para votar.</p>}
            {votacionesAsamblea.map((votacion) => {
              const yaVoto = votacion.votantes?.includes(user?.id || '');
              const fechaCierre = votacion.fechaCierre ? new Date(votacion.fechaCierre) : null;
              const vencida = !!fechaCierre && new Date() > fechaCierre;
              const activa = votacion.estado === 'activa' && !vencida;
              const si = votacion.votos?.SI || 0;
              const no = votacion.votos?.NO || 0;
              const total = si + no;
              const porcentajeSi = total > 0 ? ((si / total) * 100).toFixed(1) : '0.0';

              return (
                <div key={votacion.id} className="border rounded-lg p-3 space-y-3">
                  <p className="font-medium flex items-center gap-2"><Vote className="h-4 w-4" />{votacion.pregunta}</p>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    Cierre programado: {fechaCierre ? fechaCierre.toLocaleString('es-CO') : 'No definido'}
                  </div>

                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline">Total votos: {total}</Badge>
                    <Badge variant="outline">Aprobación general: {porcentajeSi}% SI</Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => votarOpcion(votacion.id, 'SI')}
                      disabled={!activa || yaVoto || votandoId === votacion.id}
                    >
                      SI
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => votarOpcion(votacion.id, 'NO')}
                      disabled={!activa || yaVoto || votandoId === votacion.id}
                    >
                      NO
                    </Button>
                  </div>

                  {yaVoto && <p className="text-xs text-green-700">Ya registraste tu voto para este punto.</p>}
                  {!activa && <p className="text-xs text-muted-foreground">La votación está cerrada o fuera del tiempo permitido.</p>}
                </div>
              );
            })}
            {selectedAsambleaId && votacionesAsamblea.length === 0 && (
              <p className="text-sm text-muted-foreground">Esta asamblea no tiene puntos de votación activos.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

