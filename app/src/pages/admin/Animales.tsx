import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useAnimalStore } from '@/store/animalStore';
import { useConjuntoStore } from '@/store/conjuntoStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dog,
  Cat,
  Heart,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  FileText,
  Home,
  Shield,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import { formatDate, formatDateShort, isOverdue } from '@/lib/utils';
import { RAZAS_MANEJO_ESPECIAL } from '@/types';
import { toast } from 'sonner';
import type { AnimalCompania } from '@/types';

export function AdminAnimales() {
  const { user } = useAuthStore();
  const {
    animales,
    estadisticas,
    fetchAnimales,
    createAnimal,
    uploadCertificadoVacunacion,
    deleteCertificadoVacunacion,
    uploadPoliza,
    deletePoliza,
    uploadFoto,
    fetchEstadisticas,
    loading
  } = useAnimalStore();

  const { unidades, fetchUnidades } = useConjuntoStore();

  const [activeTab, setActiveTab] = useState('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterUnidad, setFilterUnidad] = useState<string>('todos');
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalCompania | null>(null);

  // Dialogs
  const [showNuevoAnimal, setShowNuevoAnimal] = useState(false);
  const [showDetalleAnimal, setShowDetalleAnimal] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [showPoliza, setShowPoliza] = useState(false);

  // Form states
  const [nuevoAnimal, setNuevoAnimal] = useState({
    nombre: '',
    tipo: 'perro' as 'perro' | 'gato' | 'otro',
    especie: '',
    raza: '',
    caracteristicasFisicas: '',
    sexo: 'macho' as 'macho' | 'hembra',
    fechaNacimiento: '',
    unidadId: '',
    residenteId: '',
    observaciones: '',
    tieneMicrochip: false,
    numeroMicrochip: '',
    fechaImplantacionMicrochip: '',
    veterinarioMicrochip: '',
    requierePoliza: false
  });

  const [nuevoCertificado, setNuevoCertificado] = useState({
    tipoVacuna: '',
    fechaAplicacion: '',
    fechaVencimiento: '',
    veterinario: '',
    observaciones: ''
  });

  const [nuevaPoliza, setNuevaPoliza] = useState({
    numero: '',
    aseguradora: '',
    fechaInicio: '',
    fechaVencimiento: '',
    observaciones: ''
  });

  const [archivoCertificado, setArchivoCertificado] = useState<File | null>(null);
  const [archivoPoliza, setArchivoPoliza] = useState<File | null>(null);
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);

  useEffect(() => {
    if (user?.conjuntoId) {
      fetchAnimales(user.conjuntoId);
      fetchUnidades(user.conjuntoId);
      fetchEstadisticas(user.conjuntoId);
    }
  }, [user?.conjuntoId]);

  const filteredAnimales = animales.filter(a => {
    const matchesSearch =
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.raza.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.unidadId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || a.tipo === filterTipo;
    const matchesUnidad = filterUnidad === 'todos' || a.unidadId === filterUnidad;
    return matchesSearch && matchesTipo && matchesUnidad;
  });

  const requierePoliza = (raza: string) => {
    return RAZAS_MANEJO_ESPECIAL.some(r =>
      raza.toLowerCase().includes(r.toLowerCase()) ||
      r.toLowerCase().includes(raza.toLowerCase())
    );
  };

  const handleCrearAnimal = async () => {
    if (!user?.conjuntoId) return;

    if (!nuevoAnimal.nombre || !nuevoAnimal.raza || !nuevoAnimal.unidadId || !nuevoAnimal.residenteId) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    if (requierePoliza(nuevoAnimal.raza) && !nuevoAnimal.requierePoliza) {
      toast.warning('Esta raza requiere póliza de responsabilidad civil. Se marcará como requerida.');
    }

    try {
      const animalData: Omit<AnimalCompania, 'id'> = {
        conjuntoId: user.conjuntoId,
        unidadId: nuevoAnimal.unidadId,
        residenteId: nuevoAnimal.residenteId,
        nombre: nuevoAnimal.nombre,
        raza: nuevoAnimal.raza,
        caracteristicasFisicas: nuevoAnimal.caracteristicasFisicas,
        tipo: nuevoAnimal.tipo,
        especie: nuevoAnimal.tipo === 'otro' ? nuevoAnimal.especie : undefined,
        sexo: nuevoAnimal.sexo,
        fechaNacimiento: nuevoAnimal.fechaNacimiento ? new Date(nuevoAnimal.fechaNacimiento) : undefined,
        microchip: nuevoAnimal.tieneMicrochip && nuevoAnimal.numeroMicrochip ? {
          numero: nuevoAnimal.numeroMicrochip,
          fechaImplantacion: new Date(nuevoAnimal.fechaImplantacionMicrochip || new Date()),
          veterinario: nuevoAnimal.veterinarioMicrochip || undefined,
          observaciones: undefined
        } : undefined,
        certificadosVacunacion: [],
        polizaResponsabilidadCivil: requierePoliza(nuevoAnimal.raza) ? {
          numero: '',
          aseguradora: '',
          fechaInicio: new Date(),
          fechaVencimiento: new Date(),
          requerida: true,
          observaciones: 'Pendiente de cargar'
        } : undefined,
        observaciones: nuevoAnimal.observaciones || undefined,
        fechaRegistro: new Date(),
        activo: true
      };

      const animalId = await createAnimal(animalData);

      // Upload foto si existe
      if (archivoFoto) {
        await uploadFoto(animalId, archivoFoto);
      }

      toast.success('Animal registrado exitosamente');
      setShowNuevoAnimal(false);
      resetForm();
      fetchAnimales(user.conjuntoId);
      fetchEstadisticas(user.conjuntoId);
    } catch (error: any) {
      toast.error('Error al registrar animal: ' + error.message);
    }
  };

  const resetForm = () => {
    setNuevoAnimal({
      nombre: '',
      tipo: 'perro',
      especie: '',
      raza: '',
      caracteristicasFisicas: '',
      sexo: 'macho',
      fechaNacimiento: '',
      unidadId: '',
      residenteId: '',
      observaciones: '',
      tieneMicrochip: false,
      numeroMicrochip: '',
      fechaImplantacionMicrochip: '',
      veterinarioMicrochip: '',
      requierePoliza: false
    });
    setArchivoFoto(null);
  };

  const handleAgregarCertificado = async () => {
    if (!selectedAnimal) return;

    if (!nuevoCertificado.tipoVacuna || !nuevoCertificado.fechaAplicacion || !nuevoCertificado.fechaVencimiento) {
      toast.error('Por favor complete todos los campos requeridos del certificado');
      return;
    }

    try {
      await uploadCertificadoVacunacion(
        selectedAnimal.id,
        {
          tipoVacuna: nuevoCertificado.tipoVacuna,
          fechaAplicacion: new Date(nuevoCertificado.fechaAplicacion),
          fechaVencimiento: new Date(nuevoCertificado.fechaVencimiento),
          veterinario: nuevoCertificado.veterinario || undefined,
          observaciones: nuevoCertificado.observaciones || undefined
        },
        archivoCertificado || undefined
      );

      toast.success('Certificado agregado exitosamente');
      setShowCertificado(false);
      setNuevoCertificado({
        tipoVacuna: '',
        fechaAplicacion: '',
        fechaVencimiento: '',
        veterinario: '',
        observaciones: ''
      });
      setArchivoCertificado(null);
      if (user?.conjuntoId) {
        fetchAnimales(user.conjuntoId);
        fetchEstadisticas(user.conjuntoId);
      }
    } catch (error: any) {
      toast.error('Error al agregar certificado: ' + error.message);
    }
  };

  const handleAgregarPoliza = async () => {
    if (!selectedAnimal) return;

    if (!nuevaPoliza.numero || !nuevaPoliza.aseguradora || !nuevaPoliza.fechaInicio || !nuevaPoliza.fechaVencimiento) {
      toast.error('Por favor complete todos los campos requeridos de la póliza');
      return;
    }

    try {
      await uploadPoliza(
        selectedAnimal.id,
        {
          numero: nuevaPoliza.numero,
          aseguradora: nuevaPoliza.aseguradora,
          fechaInicio: new Date(nuevaPoliza.fechaInicio),
          fechaVencimiento: new Date(nuevaPoliza.fechaVencimiento),
          requerida: requierePoliza(selectedAnimal.raza),
          observaciones: nuevaPoliza.observaciones || undefined
        },
        archivoPoliza || undefined
      );

      toast.success('Póliza agregada exitosamente');
      setShowPoliza(false);
      setNuevaPoliza({
        numero: '',
        aseguradora: '',
        fechaInicio: '',
        fechaVencimiento: '',
        observaciones: ''
      });
      setArchivoPoliza(null);
      if (user?.conjuntoId) {
        fetchAnimales(user.conjuntoId);
        fetchEstadisticas(user.conjuntoId);
      }
    } catch (error: any) {
      toast.error('Error al agregar póliza: ' + error.message);
    }
  };

  const handleEliminarCertificado = async (certificadoId: string) => {
    if (!selectedAnimal) return;
    if (!confirm('¿Está seguro de eliminar este certificado?')) return;

    try {
      await deleteCertificadoVacunacion(selectedAnimal.id, certificadoId);
      toast.success('Certificado eliminado');
      if (user?.conjuntoId) {
        fetchAnimales(user.conjuntoId);
        fetchEstadisticas(user.conjuntoId);
      }
    } catch (error: any) {
      toast.error('Error al eliminar certificado: ' + error.message);
    }
  };

  const handleEliminarPoliza = async () => {
    if (!selectedAnimal) return;
    if (!confirm('¿Está seguro de eliminar la póliza?')) return;

    try {
      await deletePoliza(selectedAnimal.id);
      toast.success('Póliza eliminada');
      if (user?.conjuntoId) {
        fetchAnimales(user.conjuntoId);
        fetchEstadisticas(user.conjuntoId);
      }
    } catch (error: any) {
      toast.error('Error al eliminar póliza: ' + error.message);
    }
  };

  const getEstadoCertificado = (fechaVencimiento: Date) => {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return { estado: 'vencido', color: 'destructive', dias: diasRestantes };
    } else if (diasRestantes <= 30) {
      return { estado: 'por_vencer', color: 'warning', dias: diasRestantes };
    }
    return { estado: 'vigente', color: 'default', dias: diasRestantes };
  };

  const getUnidadLabel = (unidadId: string) => {
    const unidad = unidades.find(u => u.id === unidadId);
    return unidad ? `${unidad.numero}${unidad.torre ? ` - Torre ${unidad.torre}` : ''}` : unidadId;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Censo de Animales de Compañía</h2>
          <p className="text-muted-foreground">
            Gestión de animales según Decreto 768 de 2025
          </p>
        </div>
        <Button onClick={() => setShowNuevoAnimal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Animal
        </Button>
      </div>

      {/* Alertas de vencimientos */}
      {estadisticas && (estadisticas.certificadosVencidos > 0 || estadisticas.polizasVencidas > 0 ||
        estadisticas.certificadosPorVencer > 0 || estadisticas.polizasPorVencer > 0) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atención: Documentos próximos a vencer o vencidos</AlertTitle>
            <AlertDescription>
              {estadisticas.certificadosVencidos > 0 && (
                <span>{estadisticas.certificadosVencidos} certificado(s) vencido(s). </span>
              )}
              {estadisticas.certificadosPorVencer > 0 && (
                <span>{estadisticas.certificadosPorVencer} certificado(s) por vencer. </span>
              )}
              {estadisticas.polizasVencidas > 0 && (
                <span>{estadisticas.polizasVencidas} póliza(s) vencida(s). </span>
              )}
              {estadisticas.polizasPorVencer > 0 && (
                <span>{estadisticas.polizasPorVencer} póliza(s) por vencer.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animales</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.totalAnimales || 0}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.totalPerros || 0} perros, {estadisticas?.totalGatos || 0} gatos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Microchip</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.animalesConMicrochip || 0}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.totalAnimales ?
                Math.round((estadisticas.animalesConMicrochip / estadisticas.totalAnimales) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Póliza</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.animalesConPoliza || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pólizas de responsabilidad civil
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {estadisticas?.certificadosVencidos || 0} vencidos
            </div>
            <p className="text-xs text-muted-foreground">
              {estadisticas?.certificadosPorVencer || 0} por vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lista">Lista de Animales</TabsTrigger>
          <TabsTrigger value="registro">Registro Nuevo</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, raza o unidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="perro">Perros</SelectItem>
                <SelectItem value="gato">Gatos</SelectItem>
                <SelectItem value="otro">Otros</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUnidad} onValueChange={setFilterUnidad}>
              <SelectTrigger className="w-[200px]">
                <Home className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Unidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las unidades</SelectItem>
                {unidades.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.numero}{u.torre ? ` - Torre ${u.torre}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Animales Registrados ({filteredAnimales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Raza</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Microchip</TableHead>
                      <TableHead>Certificados</TableHead>
                      <TableHead>Póliza</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnimales.map((animal) => {
                      const certificadosVigentes = animal.certificadosVacunacion.filter(c => {
                        const estado = getEstadoCertificado(c.fechaVencimiento);
                        return estado.estado === 'vigente';
                      }).length;
                      const certificadosVencidos = animal.certificadosVacunacion.filter(c => {
                        const estado = getEstadoCertificado(c.fechaVencimiento);
                        return estado.estado === 'vencido';
                      }).length;
                      const polizaVencida = animal.polizaResponsabilidadCivil &&
                        isOverdue(animal.polizaResponsabilidadCivil.fechaVencimiento);

                      return (
                        <TableRow key={animal.id}>
                          <TableCell className="font-medium">{animal.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {animal.tipo === 'perro' && <Dog className="h-3 w-3 mr-1" />}
                              {animal.tipo === 'gato' && <Cat className="h-3 w-3 mr-1" />}
                              {animal.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{animal.raza}</TableCell>
                          <TableCell>{getUnidadLabel(animal.unidadId)}</TableCell>
                          <TableCell>
                            {animal.microchip ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Sí
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm">{certificadosVigentes} vigentes</span>
                              {certificadosVencidos > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {certificadosVencidos} vencidos
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {animal.polizaResponsabilidadCivil ? (
                              polizaVencida ? (
                                <Badge variant="destructive">Vencida</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500">Vigente</Badge>
                              )
                            ) : requierePoliza(animal.raza) ? (
                              <Badge variant="destructive">Requerida</Badge>
                            ) : (
                              <Badge variant="outline">No requerida</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAnimal(animal);
                                setShowDetalleAnimal(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registro">
          <Card>
            <CardHeader>
              <CardTitle>Formulario de Registro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del Animal *</Label>
                    <Input
                      placeholder="Ej: Max, Luna..."
                      value={nuevoAnimal.nombre}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={nuevoAnimal.tipo}
                      onValueChange={(v) => setNuevoAnimal({ ...nuevoAnimal, tipo: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perro">Perro</SelectItem>
                        <SelectItem value="gato">Gato</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {nuevoAnimal.tipo === 'otro' && (
                  <div className="space-y-2">
                    <Label>Especie *</Label>
                    <Input
                      placeholder="Ej: Conejo, Hámster..."
                      value={nuevoAnimal.especie}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, especie: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raza *</Label>
                    <Input
                      placeholder="Ej: Labrador, Persa..."
                      value={nuevoAnimal.raza}
                      onChange={(e) => {
                        const raza = e.target.value;
                        setNuevoAnimal({
                          ...nuevoAnimal,
                          raza,
                          requierePoliza: requierePoliza(raza)
                        });
                      }}
                    />
                    {requierePoliza(nuevoAnimal.raza) && (
                      <p className="text-sm text-orange-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Esta raza requiere póliza de responsabilidad civil
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Sexo *</Label>
                    <Select
                      value={nuevoAnimal.sexo}
                      onValueChange={(v) => setNuevoAnimal({ ...nuevoAnimal, sexo: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="macho">Macho</SelectItem>
                        <SelectItem value="hembra">Hembra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Características Físicas *</Label>
                  <Textarea
                    placeholder="Descripción del tamaño, color, marcas distintivas..."
                    value={nuevoAnimal.caracteristicasFisicas}
                    onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, caracteristicasFisicas: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input
                      type="date"
                      value={nuevoAnimal.fechaNacimiento}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, fechaNacimiento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Foto del Animal</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setArchivoFoto(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidad (Apartamento/Casa) *</Label>
                    <Select
                      value={nuevoAnimal.unidadId}
                      onValueChange={(v) => setNuevoAnimal({ ...nuevoAnimal, unidadId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione unidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.numero}{u.torre ? ` - Torre ${u.torre}` : ''} ({u.tipo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>ID del Propietario Responsable *</Label>
                    <Input
                      placeholder="ID del residente"
                      value={nuevoAnimal.residenteId}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, residenteId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={nuevoAnimal.tieneMicrochip}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, tieneMicrochip: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label>El animal tiene microchip</Label>
                  </div>

                  {nuevoAnimal.tieneMicrochip && (
                    <div className="grid grid-cols-3 gap-4 ml-6">
                      <div className="space-y-2">
                        <Label>Número de Microchip *</Label>
                        <Input
                          placeholder="Número de microchip"
                          value={nuevoAnimal.numeroMicrochip}
                          onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, numeroMicrochip: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fecha de Implantación</Label>
                        <Input
                          type="date"
                          value={nuevoAnimal.fechaImplantacionMicrochip}
                          onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, fechaImplantacionMicrochip: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Veterinario</Label>
                        <Input
                          placeholder="Nombre del veterinario"
                          value={nuevoAnimal.veterinarioMicrochip}
                          onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, veterinarioMicrochip: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Observaciones</Label>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    value={nuevoAnimal.observaciones}
                    onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, observaciones: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleCrearAnimal}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Registrando...' : 'Registrar Animal'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estadisticas">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Dog className="h-4 w-4" />
                      Perros
                    </span>
                    <span className="font-bold">{estadisticas?.totalPerros || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Cat className="h-4 w-4" />
                      Gatos
                    </span>
                    <span className="font-bold">{estadisticas?.totalGatos || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Otros</span>
                    <span className="font-bold">{estadisticas?.totalOtros || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Certificados Vencidos</span>
                    <Badge variant="destructive">{estadisticas?.certificadosVencidos || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Certificados por Vencer (30 días)</span>
                    <Badge variant="outline" className="bg-orange-50">
                      {estadisticas?.certificadosPorVencer || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pólizas Vencidas</span>
                    <Badge variant="destructive">{estadisticas?.polizasVencidas || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pólizas por Vencer (30 días)</span>
                    <Badge variant="outline" className="bg-orange-50">
                      {estadisticas?.polizasPorVencer || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Nuevo Animal */}
      <Dialog open={showNuevoAnimal} onOpenChange={setShowNuevoAnimal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Animal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form as in registro tab */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Animal *</Label>
                <Input
                  placeholder="Ej: Max, Luna..."
                  value={nuevoAnimal.nombre}
                  onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={nuevoAnimal.tipo}
                  onValueChange={(v) => setNuevoAnimal({ ...nuevoAnimal, tipo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perro">Perro</SelectItem>
                    <SelectItem value="gato">Gato</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {nuevoAnimal.tipo === 'otro' && (
              <div className="space-y-2">
                <Label>Especie *</Label>
                <Input
                  placeholder="Ej: Conejo, Hámster..."
                  value={nuevoAnimal.especie}
                  onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, especie: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Raza *</Label>
                <Input
                  placeholder="Ej: Labrador, Persa..."
                  value={nuevoAnimal.raza}
                  onChange={(e) => {
                    const raza = e.target.value;
                    setNuevoAnimal({
                      ...nuevoAnimal,
                      raza,
                      requierePoliza: requierePoliza(raza)
                    });
                  }}
                />
                {requierePoliza(nuevoAnimal.raza) && (
                  <p className="text-sm text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Esta raza requiere póliza de responsabilidad civil
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Sexo *</Label>
                <Select
                  value={nuevoAnimal.sexo}
                  onValueChange={(v) => setNuevoAnimal({ ...nuevoAnimal, sexo: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Características Físicas *</Label>
              <Textarea
                placeholder="Descripción del tamaño, color, marcas distintivas..."
                value={nuevoAnimal.caracteristicasFisicas}
                onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, caracteristicasFisicas: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input
                  type="date"
                  value={nuevoAnimal.fechaNacimiento}
                  onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, fechaNacimiento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Foto del Animal</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoFoto(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidad (Apartamento/Casa) *</Label>
                <Select
                  value={nuevoAnimal.unidadId}
                  onValueChange={(v) => setNuevoAnimal({ ...nuevoAnimal, unidadId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.numero}{u.torre ? ` - Torre ${u.torre}` : ''} ({u.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ID del Propietario Responsable *</Label>
                <Input
                  placeholder="ID del residente"
                  value={nuevoAnimal.residenteId}
                  onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, residenteId: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={nuevoAnimal.tieneMicrochip}
                  onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, tieneMicrochip: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label>El animal tiene microchip</Label>
              </div>

              {nuevoAnimal.tieneMicrochip && (
                <div className="grid grid-cols-3 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label>Número de Microchip *</Label>
                    <Input
                      placeholder="Número de microchip"
                      value={nuevoAnimal.numeroMicrochip}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, numeroMicrochip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Implantación</Label>
                    <Input
                      type="date"
                      value={nuevoAnimal.fechaImplantacionMicrochip}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, fechaImplantacionMicrochip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Veterinario</Label>
                    <Input
                      placeholder="Nombre del veterinario"
                      value={nuevoAnimal.veterinarioMicrochip}
                      onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, veterinarioMicrochip: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={nuevoAnimal.observaciones}
                onChange={(e) => setNuevoAnimal({ ...nuevoAnimal, observaciones: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleCrearAnimal}
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Animal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalle Animal */}
      <Dialog open={showDetalleAnimal} onOpenChange={setShowDetalleAnimal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Animal: {selectedAnimal?.nombre}</DialogTitle>
          </DialogHeader>
          {selectedAnimal && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">{selectedAnimal.tipo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Raza</Label>
                  <p className="font-medium">{selectedAnimal.raza}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sexo</Label>
                  <p className="font-medium capitalize">{selectedAnimal.sexo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Unidad</Label>
                  <p className="font-medium">{getUnidadLabel(selectedAnimal.unidadId)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Características Físicas</Label>
                  <p className="font-medium">{selectedAnimal.caracteristicasFisicas}</p>
                </div>
              </div>

              {/* Microchip */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Microchip</h3>
                </div>
                {selectedAnimal.microchip ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Número</Label>
                      <p className="font-medium">{selectedAnimal.microchip.numero}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fecha Implantación</Label>
                      <p className="font-medium">{formatDate(selectedAnimal.microchip.fechaImplantacion)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Veterinario</Label>
                      <p className="font-medium">{selectedAnimal.microchip.veterinario || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No registrado</p>
                )}
              </div>

              {/* Certificados */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Certificados de Vacunación</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowCertificado(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Certificado
                  </Button>
                </div>
                {selectedAnimal.certificadosVacunacion.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAnimal.certificadosVacunacion.map((cert) => {
                      const estado = getEstadoCertificado(cert.fechaVencimiento);
                      return (
                        <Card key={cert.id} className={estado.estado === 'vencido' ? 'border-destructive' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{cert.tipoVacuna}</span>
                                  <Badge variant={estado.estado === 'vencido' ? 'destructive' : estado.estado === 'por_vencer' ? 'outline' : 'default'}>
                                    {estado.estado === 'vencido' ? 'Vencido' :
                                      estado.estado === 'por_vencer' ? `Vence en ${estado.dias} días` :
                                        'Vigente'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <span>Aplicación: {formatDateShort(cert.fechaAplicacion)}</span>
                                  <span>Vencimiento: {formatDateShort(cert.fechaVencimiento)}</span>
                                  {cert.veterinario && <span>Veterinario: {cert.veterinario}</span>}
                                </div>
                                {cert.archivoUrl && (
                                  <a
                                    href={cert.archivoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Ver certificado
                                  </a>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEliminarCertificado(cert.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No hay certificados registrados</p>
                )}
              </div>

              {/* Póliza */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Póliza de Responsabilidad Civil</h3>
                  {selectedAnimal.polizaResponsabilidadCivil ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNuevaPoliza({
                          numero: selectedAnimal.polizaResponsabilidadCivil?.numero || '',
                          aseguradora: selectedAnimal.polizaResponsabilidadCivil?.aseguradora || '',
                          fechaInicio: selectedAnimal.polizaResponsabilidadCivil?.fechaInicio ?
                            new Date(selectedAnimal.polizaResponsabilidadCivil.fechaInicio).toISOString().split('T')[0] : '',
                          fechaVencimiento: selectedAnimal.polizaResponsabilidadCivil?.fechaVencimiento ?
                            new Date(selectedAnimal.polizaResponsabilidadCivil.fechaVencimiento).toISOString().split('T')[0] : '',
                          observaciones: selectedAnimal.polizaResponsabilidadCivil?.observaciones || ''
                        });
                        setShowPoliza(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => {
                        setNuevaPoliza({
                          numero: '',
                          aseguradora: '',
                          fechaInicio: '',
                          fechaVencimiento: '',
                          observaciones: ''
                        });
                        setShowPoliza(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Póliza
                    </Button>
                  )}
                </div>
                {selectedAnimal.polizaResponsabilidadCivil ? (
                  <Card className={isOverdue(selectedAnimal.polizaResponsabilidadCivil.fechaVencimiento) ? 'border-destructive' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">N° {selectedAnimal.polizaResponsabilidadCivil.numero}</span>
                            <Badge variant={isOverdue(selectedAnimal.polizaResponsabilidadCivil.fechaVencimiento) ? 'destructive' : 'default'}>
                              {isOverdue(selectedAnimal.polizaResponsabilidadCivil.fechaVencimiento) ? 'Vencida' : 'Vigente'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <span>Aseguradora: {selectedAnimal.polizaResponsabilidadCivil.aseguradora}</span>
                            <span>Inicio: {formatDateShort(selectedAnimal.polizaResponsabilidadCivil.fechaInicio)}</span>
                            <span className="col-span-2">Vencimiento: {formatDateShort(selectedAnimal.polizaResponsabilidadCivil.fechaVencimiento)}</span>
                          </div>
                          {selectedAnimal.polizaResponsabilidadCivil.archivoUrl && (
                            <a
                              href={selectedAnimal.polizaResponsabilidadCivil.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                            >
                              <FileText className="h-4 w-4" />
                              Ver póliza
                            </a>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleEliminarPoliza}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div>
                    {requierePoliza(selectedAnimal.raza) ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Póliza Requerida</AlertTitle>
                        <AlertDescription>
                          Esta raza requiere póliza de responsabilidad civil. Por favor agregue la póliza.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <p className="text-muted-foreground">No se requiere póliza para esta raza</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Certificado */}
      <Dialog open={showCertificado} onOpenChange={setShowCertificado}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Certificado de Vacunación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Vacuna *</Label>
              <Input
                placeholder="Ej: Rabia, Pentavalente..."
                value={nuevoCertificado.tipoVacuna}
                onChange={(e) => setNuevoCertificado({ ...nuevoCertificado, tipoVacuna: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Aplicación *</Label>
                <Input
                  type="date"
                  value={nuevoCertificado.fechaAplicacion}
                  onChange={(e) => setNuevoCertificado({ ...nuevoCertificado, fechaAplicacion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento *</Label>
                <Input
                  type="date"
                  value={nuevoCertificado.fechaVencimiento}
                  onChange={(e) => setNuevoCertificado({ ...nuevoCertificado, fechaVencimiento: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Veterinario</Label>
              <Input
                placeholder="Nombre del veterinario"
                value={nuevoCertificado.veterinario}
                onChange={(e) => setNuevoCertificado({ ...nuevoCertificado, veterinario: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Archivo del Certificado</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setArchivoCertificado(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={nuevoCertificado.observaciones}
                onChange={(e) => setNuevoCertificado({ ...nuevoCertificado, observaciones: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAgregarCertificado}>
              Agregar Certificado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar/Editar Póliza */}
      <Dialog open={showPoliza} onOpenChange={setShowPoliza}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAnimal?.polizaResponsabilidadCivil ? 'Editar' : 'Agregar'} Póliza de Responsabilidad Civil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número de Póliza *</Label>
                <Input
                  placeholder="Número de póliza"
                  value={nuevaPoliza.numero}
                  onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, numero: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Aseguradora *</Label>
                <Input
                  placeholder="Nombre de la aseguradora"
                  value={nuevaPoliza.aseguradora}
                  onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, aseguradora: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={nuevaPoliza.fechaInicio}
                  onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento *</Label>
                <Input
                  type="date"
                  value={nuevaPoliza.fechaVencimiento}
                  onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, fechaVencimiento: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Archivo de la Póliza</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setArchivoPoliza(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={nuevaPoliza.observaciones}
                onChange={(e) => setNuevaPoliza({ ...nuevaPoliza, observaciones: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleAgregarPoliza}>
              {selectedAnimal?.polizaResponsabilidadCivil ? 'Actualizar' : 'Agregar'} Póliza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


