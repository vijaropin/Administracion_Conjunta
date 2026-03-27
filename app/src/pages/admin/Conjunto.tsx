import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, CalendarDays, LayoutGrid, Home, Bike, Car } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function AdminConjunto() {
  const { user } = useAuthStore();
  const { conjuntoActual, conjuntos, fetchConjuntos, fetchConjuntoById, loading } = useConjuntoStore();

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchConjuntoById(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchConjuntoById]);

  useEffect(() => {
    void fetchConjuntos();
  }, [fetchConjuntos]);

  if (!user?.conjuntoId) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Mi Conjunto</h2>
        <p className="text-muted-foreground max-w-xl">
          Aún no tienes un conjunto asociado. El administrador debe registrar la información
          del conjunto en la sección de <span className="font-semibold">Configuración</span>.
        </p>
      </div>
    );
  }

  if (loading && !conjuntoActual) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!conjuntoActual) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Mi Conjunto</h2>
        <p className="text-muted-foreground max-w-xl">
          No se encontró información del conjunto. Verifica la configuración o registra
          los datos en la sección de <span className="font-semibold">Configuración</span>.
        </p>
      </div>
    );
  }

  const {
    nombre,
    direccion,
    localidad,
    estrato,
    tipo,
    totalUnidades,
    telefono,
    email,
    nombreConjunto,
    cantidadCasas,
    cantidadBloques,
    cantidadTorres,
    cantidadApartamentos,
    cantidadConsejeros,
    fechaCreacion,
    cuotaAdministracion
  } = conjuntoActual;

  const fechaCreacionDisplay = fechaCreacion
    ? new Date(fechaCreacion as unknown as Date).toLocaleDateString('es-CO')
    : undefined;

  const conjuntosAdministrador = conjuntos.filter((c) => c.administradorId === user?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Mi Conjunto</h2>
        <p className="text-muted-foreground max-w-2xl">
          Resumen de la configuración del conjunto residencial asociado a tu usuario.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conjuntos registrados por el administrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {conjuntosAdministrador.length === 0 && <p className="text-muted-foreground">No hay conjuntos adicionales registrados.</p>}
          {conjuntosAdministrador.map((c) => (
            <div key={c.id} className="border rounded-md p-2 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.nombreConjunto || c.nombre}</p>
                <p className="text-xs text-muted-foreground">{c.direccion} • {c.totalUnidades} unidades</p>
              </div>
              <Badge variant={c.id === conjuntoActual.id ? 'default' : 'outline'}>{c.id === conjuntoActual.id ? 'Actual' : 'Registrado'}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">Identificación del Conjunto</CardTitle>
            </div>
            <Badge variant="outline" className="capitalize">
              {tipo}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-semibold">
              {nombreConjunto || nombre}
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {direccion}
              </span>
              {localidad && (
                <span>
                  Localidad: <span className="font-medium">{localidad}</span>
                </span>
              )}
              <span>
                Estrato: <span className="font-medium">{estrato}</span>
              </span>
              {fechaCreacionDisplay && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Creado el {fechaCreacionDisplay}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">Consejo de Administración</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">{cantidadConsejeros ?? '-'}</p>
            <p className="text-xs text-muted-foreground">Número configurado de miembros del consejo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuota de administración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {cuotaAdministracion?.valorHastaDia16 || cuotaAdministracion?.valorMensual ? (
              <>
                <div className="flex justify-between">
                  <span>Hasta día 16</span>
                  <span className="font-semibold">
                    {formatCurrency(cuotaAdministracion.valorHastaDia16 ?? cuotaAdministracion.valorMensual ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Desde día 17</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      cuotaAdministracion.valorDesdeDia17 ??
                        cuotaAdministracion.valorHastaDia16 ??
                        cuotaAdministracion.valorMensual ??
                        0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Corte mora</span>
                  <span className="font-medium">Día {cuotaAdministracion.diaCorteMora ?? 16}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vence el día</span>
                  <span className="font-medium">{cuotaAdministracion.diaVencimiento}</span>
                </div>
                {cuotaAdministracion.fechaVigenciaHasta && (
                  <div className="flex justify-between">
                    <span>Vigente hasta</span>
                    <span className="font-medium">
                      {new Date(cuotaAdministracion.fechaVigenciaHasta as unknown as Date).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Aún no hay cuota configurada. Regístrala en <span className="font-medium">Configuración</span>.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-medium">Distribución de Unidades</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Casas</span><span className="font-medium">{cantidadCasas ?? '-'}</span></div>
            <div className="flex justify-between"><span>Torres</span><span className="font-medium">{cantidadTorres ?? '-'}</span></div>
            <div className="flex justify-between"><span>Bloques</span><span className="font-medium">{cantidadBloques ?? '-'}</span></div>
            <div className="flex justify-between"><span>Apartamentos</span><span className="font-medium">{cantidadApartamentos ?? '-'}</span></div>
            <div className="flex justify-between pt-2 border-t mt-2">
              <span>Total unidades (configurado)</span>
              <span className="font-semibold">{totalUnidades}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacto Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Teléfono</span><span className="font-medium">{telefono || '-'}</span></div>
            <div className="flex justify-between"><span>Correo electrónico</span><span className="font-medium">{email || '-'}</span></div>
            <p className="text-xs text-muted-foreground mt-4">Esta información se utiliza en comunicados, estados financieros y documentos del conjunto.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conjunto 1</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="font-medium">Cra 105B # 65-81 Sur</p>
            <p>Casas 1 a 170 en 4 bloques.</p>
            <p className="flex items-center gap-1"><Home className="h-4 w-4" /> Portería + entrada peatonal + acceso motos/bicicletas.</p>
            <p className="flex items-center gap-1"><Bike className="h-4 w-4" /> Parqueadero estimado: 15 a 20 motocicletas.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conjunto 2</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="font-medium">Cra 105B # 69-11 Sur</p>
            <p>Casas 171 a 262 en 4 bloques.</p>
            <p className="flex items-center gap-1"><Home className="h-4 w-4" /> Portería + entrada peatonal + acceso vehículos, motos y bicicletas.</p>
            <p className="flex items-center gap-1"><Car className="h-4 w-4" /> Parqueadero estimado: 25 a 30 vehículos y 30 motocicletas.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


