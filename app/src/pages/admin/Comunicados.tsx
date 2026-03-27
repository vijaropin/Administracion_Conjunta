import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useComunicacionStore } from '@/store/comunicacionStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Search,
  Send,
  Megaphone,
  AlertTriangle,
  Calendar,
  Wrench,
  Eye
} from 'lucide-react';
import type { Comunicado } from '@/types';

export function Comunicados() {
  const { user } = useAuthStore();
  const {
    comunicados,
    fetchComunicados,
    createComunicado,
    marcarLeido,
    sugerencias,
    fetchSugerencias,
    createSugerencia,
  } = useComunicacionStore();
  const canPublish = Boolean(user?.conjuntoId && user?.id);
  const canSendSugerencia = Boolean(user?.conjuntoId);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedComunicado, setSelectedComunicado] = useState<Comunicado | null>(null);
  const [sugerenciaInput, setSugerenciaInput] = useState('');
  const [newComunicado, setNewComunicado] = useState({
    titulo: '',
    contenido: '',
    tipo: 'general',
    destinatarios: 'todos',
    torreDestino: '',
    unidadDestino: ''
  });

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchComunicados(user.conjuntoId);
      void fetchSugerencias(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchComunicados, fetchSugerencias]);

  const filteredComunicados = useMemo(() => comunicados.filter((comunicado) =>
    comunicado.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comunicado.contenido.toLowerCase().includes(searchTerm.toLowerCase())
  ), [comunicados, searchTerm]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'urgente': return <AlertTriangle className="h-4 w-4" />;
      case 'asamblea': return <Calendar className="h-4 w-4" />;
      case 'mantenimiento': return <Wrench className="h-4 w-4" />;
      default: return <Megaphone className="h-4 w-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'urgente': return 'destructive';
      case 'asamblea': return 'default';
      case 'mantenimiento': return 'secondary';
      default: return 'outline';
    }
  };

  const handleCreateComunicado = async () => {
    if (!user?.conjuntoId || !user?.id || !canPublish) return;
    if (!newComunicado.titulo.trim() || !newComunicado.contenido.trim()) {
      window.alert('El título y el contenido son obligatorios.');
      return;
    }
    if (newComunicado.destinatarios === 'torre' && !newComunicado.torreDestino.trim()) {
      window.alert('Debes indicar la torre de destino.');
      return;
    }
    if (newComunicado.destinatarios === 'unidad' && !newComunicado.unidadDestino.trim()) {
      window.alert('Debes indicar la unidad de destino.');
      return;
    }

    await createComunicado({
      conjuntoId: user.conjuntoId,
      autorId: user.id,
      titulo: newComunicado.titulo.trim(),
      contenido: newComunicado.contenido.trim(),
      fecha: new Date(),
      tipo: newComunicado.tipo as any,
      destinatarios: newComunicado.destinatarios as any,
      torreDestino: newComunicado.torreDestino.trim() || undefined,
      unidadDestino: newComunicado.unidadDestino.trim() || undefined,
      leidoPor: []
    });

    setIsDialogOpen(false);
    const destino =
      newComunicado.destinatarios === 'todos'
        ? 'todos los residentes'
        : newComunicado.destinatarios === 'torre'
          ? `la torre ${newComunicado.torreDestino}`
          : newComunicado.destinatarios === 'unidad'
            ? `la unidad ${newComunicado.unidadDestino}`
            : newComunicado.destinatarios;
    window.alert(`Comunicado enviado correctamente a ${destino}.`);
    setNewComunicado({
      titulo: '',
      contenido: '',
      tipo: 'general',
      destinatarios: 'todos',
      torreDestino: '',
      unidadDestino: ''
    });
  };

  const handleSendSugerencia = async () => {
    if (!user?.conjuntoId || !canSendSugerencia) return;
    const contenido = sugerenciaInput.trim();
    if (!contenido) {
      window.alert('La sugerencia no puede estar vacía.');
      return;
    }

    try {
      await createSugerencia({
        conjuntoId: user.conjuntoId,
        usuarioId: user.id || '',
        contenido,
        fecha: new Date(),
        usuarioNombre: `${user.nombres} ${user.apellidos}`.trim(),
        usuarioUnidad: user.unidad || undefined,
        usuarioTorre: user.torre || undefined,
      });

      setSugerenciaInput('');
      window.alert('Sugerencia enviada correctamente.');
    } catch (error: any) {
      window.alert(error?.message || 'No fue posible enviar la sugerencia. Intenta nuevamente.');
    }
  };

  const handleOpenComunicado = async (comunicado: Comunicado) => {
    setSelectedComunicado(comunicado);
    if (!user?.id || comunicado.leidoPor?.includes(user.id)) return;

    await marcarLeido(comunicado.id, user.id);
    setSelectedComunicado((actual) =>
      actual?.id === comunicado.id
        ? { ...actual, leidoPor: [...(actual.leidoPor || []), user.id] }
        : actual
    );
  };

  const formatSugerenciaRemitente = (usuarioId: string, usuarioNombre?: string) => {
    if (usuarioNombre?.trim()) return usuarioNombre.trim();
    return `Usuario ${usuarioId.slice(0, 8)}`;
  };

  const formatSugerenciaUbicacion = (torre?: string, unidad?: string) => {
    const parts = [
      torre?.trim() ? `Torre ${torre.trim()}` : null,
      unidad?.trim() ? `Unidad ${unidad.trim()}` : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' • ') : 'Ubicación no reportada';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comunicados</h2>
          <p className="text-muted-foreground">
            Gestiona la comunicación con los residentes
          </p>
        </div>
        {canPublish && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Comunicado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Comunicado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Título del comunicado"
                    value={newComunicado.titulo}
                    onChange={(e) => setNewComunicado({ ...newComunicado, titulo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={newComunicado.tipo}
                    onValueChange={(v) => setNewComunicado({ ...newComunicado, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="asamblea">Asamblea</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Destinatarios *</Label>
                  <Select
                    value={newComunicado.destinatarios}
                    onValueChange={(v) => setNewComunicado({ ...newComunicado, destinatarios: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los residentes</SelectItem>
                      <SelectItem value="torre">Torre específica</SelectItem>
                      <SelectItem value="unidad">Unidad específica</SelectItem>
                      <SelectItem value="seguridad">Personal de seguridad</SelectItem>
                      <SelectItem value="comite_convivencia">Comité de convivencia</SelectItem>
                      <SelectItem value="consejo_administracion">Consejo de administración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newComunicado.destinatarios === 'torre' && (
                  <div className="space-y-2">
                    <Label>Torre *</Label>
                    <Input
                      placeholder="Ej: Torre 1"
                      value={newComunicado.torreDestino}
                      onChange={(e) => setNewComunicado({ ...newComunicado, torreDestino: e.target.value })}
                    />
                  </div>
                )}

                {newComunicado.destinatarios === 'unidad' && (
                  <div className="space-y-2">
                    <Label>Unidad *</Label>
                    <Input
                      placeholder="Ej: 101"
                      value={newComunicado.unidadDestino}
                      onChange={(e) => setNewComunicado({ ...newComunicado, unidadDestino: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Contenido *</Label>
                  <Textarea
                    placeholder="Escribe el contenido del comunicado..."
                    value={newComunicado.contenido}
                    onChange={(e) => setNewComunicado({ ...newComunicado, contenido: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCreateComunicado}>
                  <Send className="h-4 w-4 mr-2" />
                  Publicar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar comunicados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Comunicados List */}
      <div className="grid gap-4">
        {filteredComunicados.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No hay comunicados para mostrar.</p>
            </CardContent>
          </Card>
        ) : (
          filteredComunicados.map((comunicado) => (
            <Card key={comunicado.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getTipoColor(comunicado.tipo) as any} className="flex items-center gap-1">
                        {getTipoIcon(comunicado.tipo)}
                        {comunicado.tipo}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comunicado.fecha).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{comunicado.titulo}</h3>
                    <p className="text-muted-foreground line-clamp-2">{comunicado.contenido}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-sm text-muted-foreground">
                        Para: {comunicado.destinatarios === 'todos' ? 'Todos' :
                          comunicado.destinatarios === 'torre' ? `Torre ${comunicado.torreDestino}` :
                            comunicado.destinatarios === 'unidad' ? ('Unidad ' + comunicado.unidadDestino) :
                              comunicado.destinatarios === 'seguridad' ? 'Personal de seguridad' :
                                comunicado.destinatarios === 'comite_convivencia' ? 'Comité de convivencia' :
                                  comunicado.destinatarios === 'consejo_administracion' ? 'Consejo de administración' : 'Todos'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {comunicado.leidoPor?.length || 0} lecturas
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleOpenComunicado(comunicado)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedComunicado} onOpenChange={() => setSelectedComunicado(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={selectedComunicado ? getTipoColor(selectedComunicado.tipo) as any : 'default'}>
                {selectedComunicado?.tipo}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedComunicado && new Date(selectedComunicado.fecha).toLocaleDateString('es-CO')}
              </span>
            </div>
            <DialogTitle>{selectedComunicado?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {selectedComunicado?.contenido}
            </p>
          </div>
          <DialogFooter>
            <span className="text-sm text-muted-foreground">
              {selectedComunicado?.leidoPor?.length || 0} personas han leído este comunicado
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sugerencias Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">Sugerencias</h3>
          <p className="text-muted-foreground">
            Envía y consulta las sugerencias registradas en el conjunto.
          </p>
        </div>

        {canSendSugerencia && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <Label htmlFor="sugerencia-input">Nueva sugerencia</Label>
              <Textarea
                id="sugerencia-input"
                placeholder="Escribe tu sugerencia aquí..."
                value={sugerenciaInput}
                onChange={(e) => setSugerenciaInput(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end">
                <Button onClick={() => void handleSendSugerencia()}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar sugerencia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sugerencias.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Aún no hay sugerencias registradas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sugerencias.map((sugerencia) => (
              <Card key={sugerencia.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {new Date(sugerencia.fecha).toLocaleString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <Badge variant="outline">
                      {formatSugerenciaUbicacion(sugerencia.usuarioTorre, sugerencia.usuarioUnidad)}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium">
                    Enviada por: {formatSugerenciaRemitente(sugerencia.usuarioId, sugerencia.usuarioNombre)}
                  </p>
                  <p className="text-base text-muted-foreground whitespace-pre-wrap">{sugerencia.contenido}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


