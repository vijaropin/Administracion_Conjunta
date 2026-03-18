import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { useFinancieroStore } from '@/store/financieroStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ConsejoResidentes() {
  const { user } = useAuthStore();
  const { unidades, fetchUnidades } = useConjuntoStore();
  const { pagos, fetchPagos } = useFinancieroStore();

  useEffect(() => {
    if (!user?.conjuntoId) return;
    void fetchUnidades(user.conjuntoId);
    void fetchPagos(user.conjuntoId);
  }, [user?.conjuntoId, fetchUnidades, fetchPagos]);

  const ocupadas = unidades.filter((u) => u.estado === 'ocupada').length;
  const desocupadas = unidades.filter((u) => u.estado === 'desocupada').length;
  const morosas = new Set(pagos.filter((p) => p.estado === 'en_mora').map((p) => p.unidadId)).size;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Residentes y Tenedores</h2>
        <p className="text-muted-foreground">Información clave de supervisión sin editar registros.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Unidades ocupadas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{ocupadas}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Unidades desocupadas</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{desocupadas}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Unidades en mora</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{morosas}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Registro de unidades</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {unidades.slice(0, 30).map((u) => (
            <div key={u.id} className="border rounded-md p-2 text-sm flex items-center justify-between">
              <span>Unidad {u.numero} {u.torre ? `- ${u.torre}` : ''}</span>
              <span className="text-muted-foreground">{u.estado}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
