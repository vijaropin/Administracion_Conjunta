import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Usuario } from '@/types';

type PerfilUsuario = Usuario['tipo'];

const PERFIL_OPTIONS: { value: PerfilUsuario; label: string }[] = [
  { value: 'propietario_residente', label: 'Propietario Residente' },
  { value: 'arrendatario', label: 'Arrendatario' },
  { value: 'propietario_no_residente', label: 'Propietario No Residente' },
  { value: 'residente', label: 'Residente' },
  { value: 'consejo', label: 'Consejo de Administración' },
  { value: 'comite_convivencia', label: 'Comité de Convivencia' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'contadora', label: 'Contadora' },
  { value: 'servicios_generales', label: 'Servicios Generales' },
];
const PERFILES_RESIDENCIALES = new Set<PerfilUsuario>([
  'residente',
  'propietario_residente',
  'arrendatario',
  'propietario_no_residente',
]);

export function AdminResidentes() {
  const { user } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [perfilFiltro, setPerfilFiltro] = useState<string>('todos');
  const [editando, setEditando] = useState<(Usuario & { seguridadPerfil?: 'control_acceso' | 'incidentes' }) | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    if (!user?.conjuntoId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'usuarios'), where('conjuntoId', '==', user.conjuntoId));
      const snapshot = await getDocs(q);
      setUsuarios(snapshot.docs.map((d) => {
        const data = d.data() as Usuario;
        return { ...data, id: d.id };
      }));
    } finally {
      setLoading(false);
    }
  }, [user?.conjuntoId]);

  useEffect(() => {
    void fetchUsuarios();
  }, [fetchUsuarios]);

  const list = useMemo(() => {
    return usuarios.filter((u) => {
      const matchesSearch =
        `${u.nombres} ${u.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
        (u.unidad || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase());
      const matchesPerfil = perfilFiltro === 'todos' || u.tipo === perfilFiltro;
      return matchesSearch && matchesPerfil;
    });
  }, [usuarios, search, perfilFiltro]);

  const perfilesPorCasa = useMemo(() => {
    const map = new Map<string, number>();
    usuarios.forEach((u) => {
      const casa = (u.unidad || '').trim();
      if (!casa) return;
      map.set(casa, (map.get(casa) || 0) + 1);
    });
    return map;
  }, [usuarios]);

  const abrirEdicion = (u: Usuario) => {
    setEditando({ ...(u as Usuario & { seguridadPerfil?: 'control_acceso' | 'incidentes' }) });
    setOpenDialog(true);
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    const unidadNormalizada = (editando.unidad || '').trim();
    if (PERFILES_RESIDENCIALES.has(editando.tipo) && unidadNormalizada) {
      const totalPerfilesCasa = usuarios.filter(
        (u) =>
          u.id !== editando.id &&
          (u.unidad || '').trim() === unidadNormalizada &&
          PERFILES_RESIDENCIALES.has(u.tipo as PerfilUsuario)
      ).length;
      if (totalPerfilesCasa >= 4) {
        window.alert('La casa ya tiene 4 perfiles residenciales. Ajusta el perfil o la casa antes de guardar.');
        return;
      }
    }
    await updateDoc(doc(db, 'usuarios', editando.id), {
      nombres: editando.nombres,
      apellidos: editando.apellidos,
      telefono: editando.telefono,
      tipo: editando.tipo,
      unidad: editando.unidad,
      torre: editando.torre,
      activo: editando.activo,
      ...(editando.tipo === 'seguridad' ? { seguridadPerfil: editando.seguridadPerfil || 'control_acceso' } : {}),
    });
    setOpenDialog(false);
    setEditando(null);
    await fetchUsuarios();
    window.alert('Perfil de usuario actualizado correctamente.');
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    const confirmacion = window.confirm(
      activo ? '¿Desea desactivar este perfil de usuario?' : '¿Desea reactivar este perfil de usuario?'
    );
    if (!confirmacion) return;
    await updateDoc(doc(db, 'usuarios', id), { activo: !activo });
    await fetchUsuarios();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Residentes y Perfiles</h2>
        <p className="text-muted-foreground">
          Consulta por casa y perfil, y gestiona modificaciones o desactivaciones por solicitud del propietario.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Usuarios registrados</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{usuarios.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Casas con más de 4 perfiles</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{Array.from(perfilesPorCasa.values()).filter((c) => c > 4).length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Perfiles activos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{usuarios.filter((u) => u.activo).length}</p></CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Input
          className="md:col-span-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o No. Casa..."
        />
        <Select value={perfilFiltro} onValueChange={setPerfilFiltro}>
          <SelectTrigger><SelectValue placeholder="Filtrar por perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {PERFIL_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Registro de usuarios por casa</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Nombre</th>
                  <th className="text-left py-2">Correo</th>
                  <th className="text-left py-2">Perfil</th>
                  <th className="text-left py-2">Bloque / Casa</th>
                  <th className="text-left py-2">Estado</th>
                  <th className="text-left py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.nombres} {u.apellidos}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2"><Badge variant="outline">{u.tipo}</Badge></td>
                    <td className="py-2">
                      {(u.torre || '-')} / {u.unidad || '-'}
                      {!!u.unidad && (perfilesPorCasa.get(u.unidad) || 0) > 4 && (
                        <Badge variant="destructive" className="ml-2">Exceso</Badge>
                      )}
                    </td>
                    <td className="py-2">
                      <Badge variant={u.activo ? 'default' : 'secondary'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="py-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => abrirEdicion(u)}>Editar</Button>
                      <Button size="sm" variant={u.activo ? 'destructive' : 'secondary'} onClick={() => toggleActivo(u.id, u.activo)}>
                        {u.activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editando && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nombres</Label><Input value={editando.nombres} onChange={(e) => setEditando({ ...editando, nombres: e.target.value })} /></div>
                <div><Label>Apellidos</Label><Input value={editando.apellidos} onChange={(e) => setEditando({ ...editando, apellidos: e.target.value })} /></div>
              </div>
              <div><Label>Teléfono</Label><Input value={editando.telefono} onChange={(e) => setEditando({ ...editando, telefono: e.target.value })} /></div>
              <div><Label>Perfil</Label>
                <Select value={editando.tipo} onValueChange={(value: PerfilUsuario) => setEditando({ ...editando, tipo: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERFIL_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editando.tipo === 'seguridad' && (
                <div><Label>Perfil operativo seguridad</Label>
                  <Select
                    value={editando.seguridadPerfil || 'control_acceso'}
                    onValueChange={(value: 'control_acceso' | 'incidentes') =>
                      setEditando({ ...editando, seguridadPerfil: value })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="control_acceso">Control de acceso (salida/cobro)</SelectItem>
                      <SelectItem value="incidentes">Solo incidentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Bloque No.</Label><Input value={editando.torre || ''} onChange={(e) => setEditando({ ...editando, torre: e.target.value })} /></div>
                <div><Label>No. Casa</Label><Input value={editando.unidad || ''} onChange={(e) => setEditando({ ...editando, unidad: e.target.value })} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={guardarEdicion}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
