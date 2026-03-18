import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Save, ShieldCheck } from 'lucide-react';

interface ConjuntoFormState {
  nombre: string;
  direccion: string;
  localidad: string;
  estrato: string;
  tipo: 'casas' | 'torres' | 'mixto';
  totalUnidades: string;
  telefono: string;
  email: string;
  nombreConjunto: string;
  cantidadCasas: string;
  cantidadBloques: string;
  cantidadTorres: string;
  cantidadApartamentos: string;
  cantidadConsejeros: string;
  fechaCreacion: string;
  // Cuota administración (FASE 1B)
  cuotaValorMensual: string;
  cuotaDiaVencimiento: string;
  cuotaAplicaInteresMora: boolean;
  cuotaTasaInteresMoraMensual: string;
  // Accesos rápidos (FASE 1B)
  accesosRapidosAdmin: string[];
}

const emptyForm: ConjuntoFormState = {
  nombre: '',
  direccion: '',
  localidad: '',
  estrato: '',
  tipo: 'mixto',
  totalUnidades: '',
  telefono: '',
  email: '',
  nombreConjunto: '',
  cantidadCasas: '',
  cantidadBloques: '',
  cantidadTorres: '',
  cantidadApartamentos: '',
  cantidadConsejeros: '',
  fechaCreacion: '',
  cuotaValorMensual: '',
  cuotaDiaVencimiento: '10',
  cuotaAplicaInteresMora: false,
  cuotaTasaInteresMoraMensual: '',
  accesosRapidosAdmin: []
};

const ACCESOS_RAPIDOS_DISPONIBLES: { href: string; label: string }[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/conjunto', label: 'Mi Conjunto' },
  { href: '/admin/unidades', label: 'Unidades' },
  { href: '/admin/finanzas', label: 'Finanzas' },
  { href: '/admin/comunicados', label: 'Comunicados' },
  { href: '/admin/seguridad', label: 'Seguridad' },
  { href: '/admin/parqueaderos', label: 'Parqueaderos' },
  { href: '/admin/animales', label: 'Animales' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/reservas', label: 'Reservas' },
  { href: '/admin/residentes', label: 'Residentes' },
  { href: '/admin/configuracion', label: 'Configuración' }
];

export function AdminConfiguracion() {
  const { user, updateUser } = useAuthStore();
  const {
    conjuntoActual,
    fetchConjuntoById,
    createConjunto,
    updateConjunto,
    loading
  } = useConjuntoStore();

  const [form, setForm] = useState<ConjuntoFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.tipo === 'administrador';

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchConjuntoById(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchConjuntoById]);

  useEffect(() => {
    if (conjuntoActual) {
      setForm({
        nombre: conjuntoActual.nombre ?? '',
        direccion: conjuntoActual.direccion ?? '',
        localidad: conjuntoActual.localidad ?? '',
        estrato: conjuntoActual.estrato?.toString() ?? '',
        tipo: conjuntoActual.tipo ?? 'mixto',
        totalUnidades: conjuntoActual.totalUnidades?.toString() ?? '',
        telefono: conjuntoActual.telefono ?? '',
        email: conjuntoActual.email ?? '',
        nombreConjunto: conjuntoActual.nombreConjunto ?? '',
        cantidadCasas: conjuntoActual.cantidadCasas?.toString() ?? '',
        cantidadBloques: conjuntoActual.cantidadBloques?.toString() ?? '',
        cantidadTorres: conjuntoActual.cantidadTorres?.toString() ?? '',
        cantidadApartamentos: conjuntoActual.cantidadApartamentos?.toString() ?? '',
        cantidadConsejeros: conjuntoActual.cantidadConsejeros?.toString() ?? '',
        fechaCreacion: conjuntoActual.fechaCreacion
          ? new Date(conjuntoActual.fechaCreacion as unknown as Date).toISOString().slice(0, 10)
          : '',
        cuotaValorMensual: conjuntoActual.cuotaAdministracion?.valorMensual?.toString?.() ?? '',
        cuotaDiaVencimiento: conjuntoActual.cuotaAdministracion?.diaVencimiento?.toString?.() ?? '10',
        cuotaAplicaInteresMora: conjuntoActual.cuotaAdministracion?.aplicaInteresMora ?? false,
        cuotaTasaInteresMoraMensual: conjuntoActual.cuotaAdministracion?.tasaInteresMoraMensual?.toString?.() ?? '',
        accesosRapidosAdmin: conjuntoActual.accesosRapidosAdmin ?? []
      });
    } else {
      setForm((prev) => ({
        ...emptyForm,
        tipo: prev.tipo
      }));
    }
  }, [conjuntoActual]);

  const handleChange = (field: keyof ConjuntoFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAccesoRapido = (href: string) => {
    setForm((prev) => {
      const exists = prev.accesosRapidosAdmin.includes(href);
      return {
        ...prev,
        accesosRapidosAdmin: exists
          ? prev.accesosRapidosAdmin.filter((h) => h !== href)
          : [...prev.accesosRapidosAdmin, href]
      };
    });
  };

  const handleSubmit = async () => {
    if (!user || !isAdmin) return;

    setSaving(true);
    try {
      const cuotaAdministracion =
        form.cuotaValorMensual || form.cuotaDiaVencimiento
          ? {
              valorMensual: form.cuotaValorMensual ? parseFloat(form.cuotaValorMensual) : 0,
              diaVencimiento: form.cuotaDiaVencimiento ? parseInt(form.cuotaDiaVencimiento, 10) : 10,
              aplicaInteresMora: form.cuotaAplicaInteresMora,
              tasaInteresMoraMensual: form.cuotaTasaInteresMoraMensual
                ? parseFloat(form.cuotaTasaInteresMoraMensual)
                : undefined,
              fechaVigenciaDesde: new Date()
            }
          : undefined;

      const payload = {
        nombre: form.nombre || form.nombreConjunto || 'Conjunto residencial',
        direccion: form.direccion,
        localidad: form.localidad,
        estrato: form.estrato ? parseInt(form.estrato, 10) : 0,
        tipo: form.tipo,
        totalUnidades: form.totalUnidades ? parseInt(form.totalUnidades, 10) : 0,
        administradorId: user.id,
        fechaRegistro: conjuntoActual?.fechaRegistro ?? new Date(),
        activo: true,
        logo: conjuntoActual?.logo,
        telefono: form.telefono,
        email: form.email,
        nombreConjunto: form.nombreConjunto || undefined,
        cantidadCasas: form.cantidadCasas ? parseInt(form.cantidadCasas, 10) : undefined,
        cantidadBloques: form.cantidadBloques ? parseInt(form.cantidadBloques, 10) : undefined,
        cantidadTorres: form.cantidadTorres ? parseInt(form.cantidadTorres, 10) : undefined,
        cantidadApartamentos: form.cantidadApartamentos ? parseInt(form.cantidadApartamentos, 10) : undefined,
        cantidadConsejeros: form.cantidadConsejeros ? parseInt(form.cantidadConsejeros, 10) : undefined,
        fechaCreacion: form.fechaCreacion ? new Date(form.fechaCreacion) : conjuntoActual?.fechaCreacion,
        cuotaAdministracion: cuotaAdministracion ?? conjuntoActual?.cuotaAdministracion,
        accesosRapidosAdmin: form.accesosRapidosAdmin
      };

      if (user.conjuntoId && conjuntoActual) {
        await updateConjunto(user.conjuntoId, payload);
      } else {
        const nuevoId = await createConjunto(payload);
        await updateUser({ conjuntoId: nuevoId });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Configuración del Conjunto</h2>
        <p className="text-muted-foreground max-w-3xl">
          Registra y actualiza la información estructural del conjunto residencial. Estos datos
          se utilizan en el dashboard, módulos financieros y reportes legales conforme a la Ley 675 de 2001.
        </p>
      </div>

      {!isAdmin && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="py-4 flex items-center gap-3 text-sm text-amber-800">
            <ShieldCheck className="h-5 w-5" />
            <p>
              Solo el <span className="font-semibold">Administrador</span> puede modificar la configuración.
              Tu rol actual tiene acceso de solo lectura.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="conjunto" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conjunto">Conjunto</TabsTrigger>
          <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
          <TabsTrigger value="accesos">Accesos rápidos</TabsTrigger>
        </TabsList>

        <TabsContent value="conjunto" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium">Datos generales</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del conjunto *</Label>
                  <Input
                    value={form.nombreConjunto}
                    onChange={(e) => handleChange('nombreConjunto', e.target.value)}
                    placeholder="Ej: Conjunto Residencial El Bosque"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={form.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    placeholder="Ej: Cra 105B # 65-81 Sur"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Localidad</Label>
                    <Input
                      value={form.localidad}
                      onChange={(e) => handleChange('localidad', e.target.value)}
                      placeholder="Localidad / Barrio"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estrato</Label>
                    <Input
                      type="number"
                      value={form.estrato}
                      onChange={(e) => handleChange('estrato', e.target.value)}
                      placeholder="4"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de conjunto</Label>
                    <Select
                      value={form.tipo}
                      onValueChange={(v: 'casas' | 'torres' | 'mixto') => handleChange('tipo', v)}
                      disabled={!isAdmin || loading || saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casas">Casas</SelectItem>
                        <SelectItem value="torres">Torres</SelectItem>
                        <SelectItem value="mixto">Mixto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Total de unidades</Label>
                    <Input
                      type="number"
                      value={form.totalUnidades}
                      onChange={(e) => handleChange('totalUnidades', e.target.value)}
                      placeholder="Ej: 262"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Configuración física</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de casas</Label>
                    <Input
                      type="number"
                      value={form.cantidadCasas}
                      onChange={(e) => handleChange('cantidadCasas', e.target.value)}
                      placeholder="Ej: 170"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de bloques</Label>
                    <Input
                      type="number"
                      value={form.cantidadBloques}
                      onChange={(e) => handleChange('cantidadBloques', e.target.value)}
                      placeholder="Ej: 4"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de torres</Label>
                    <Input
                      type="number"
                      value={form.cantidadTorres}
                      onChange={(e) => handleChange('cantidadTorres', e.target.value)}
                      placeholder="Ej: 4"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de apartamentos</Label>
                    <Input
                      type="number"
                      value={form.cantidadApartamentos}
                      onChange={(e) => handleChange('cantidadApartamentos', e.target.value)}
                      placeholder="Ej: 262"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de consejeros</Label>
                    <Input
                      type="number"
                      value={form.cantidadConsejeros}
                      onChange={(e) => handleChange('cantidadConsejeros', e.target.value)}
                      placeholder="Ej: 5"
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de creación del conjunto</Label>
                    <Input
                      type="date"
                      value={form.fechaCreacion}
                      onChange={(e) => handleChange('fechaCreacion', e.target.value)}
                      disabled={!isAdmin || loading || saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contacto y datos administrativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono administrativo</Label>
                  <Input
                    value={form.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="Ej: 3200000000"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correo electrónico</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Ej: administracion@conjunto.com"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSubmit} disabled={loading || saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {user?.conjuntoId && conjuntoActual ? 'Guardar cambios' : 'Registrar conjunto'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cuotas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cuota de administración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor mensual (COP)</Label>
                  <Input
                    type="number"
                    value={form.cuotaValorMensual}
                    onChange={(e) => handleChange('cuotaValorMensual', e.target.value)}
                    placeholder="Ej: 150000"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Día de vencimiento</Label>
                  <Input
                    type="number"
                    value={form.cuotaDiaVencimiento}
                    onChange={(e) => handleChange('cuotaDiaVencimiento', e.target.value)}
                    placeholder="Ej: 10"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.cuotaAplicaInteresMora}
                  onChange={(e) => setForm((prev) => ({ ...prev, cuotaAplicaInteresMora: e.target.checked }))}
                  className="rounded"
                  disabled={!isAdmin || loading || saving}
                />
                <span className="text-sm">Aplicar interés de mora</span>
              </div>

              {form.cuotaAplicaInteresMora && (
                <div className="space-y-2">
                  <Label>Tasa de interés de mora mensual (%)</Label>
                  <Input
                    type="number"
                    value={form.cuotaTasaInteresMoraMensual}
                    onChange={(e) => handleChange('cuotaTasaInteresMoraMensual', e.target.value)}
                    placeholder="Ej: 2.0"
                    disabled={!isAdmin || loading || saving}
                  />
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSubmit} disabled={loading || saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cuota
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accesos" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Accesos rápidos (Dashboard)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona los accesos rápidos que se mostrarán en el dashboard del Administrador.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {ACCESOS_RAPIDOS_DISPONIBLES.map((a) => {
                  const checked = form.accesosRapidosAdmin.includes(a.href);
                  return (
                    <label key={a.href} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAccesoRapido(a.href)}
                        className="rounded"
                        disabled={!isAdmin || loading || saving}
                      />
                      <span className="text-sm font-medium">{a.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{a.href}</span>
                    </label>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSubmit} disabled={loading || saving}>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar accesos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

