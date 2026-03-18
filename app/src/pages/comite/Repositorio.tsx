import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ComiteRepositorio() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Repositorio Normativo</h2>
        <p className="text-muted-foreground">Marco de conciliación del Comité de Convivencia (Ley 675/2001).</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Función del Comité</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>El Comité cumple función conciliadora y no sancionatoria.</p>
          <p>Si no hay acuerdo, el expediente debe remitirse al Consejo/Administrador para trámite conforme reglamento.</p>
          <p>Debe preservarse la confidencialidad y tratamiento de datos personales (Ley 1581/2012).</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Debido Proceso</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Recepción de caso de convivencia.</p>
          <p>2. Citación a audiencia de conciliación.</p>
          <p>3. Acta de compromisos firmada por partes.</p>
          <p>4. Si falla conciliación, remisión a Consejo.</p>
        </CardContent>
      </Card>
    </div>
  );
}
