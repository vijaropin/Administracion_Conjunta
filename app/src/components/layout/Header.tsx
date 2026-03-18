import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Bell, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useComunicacionStore } from '@/store/comunicacionStore';
import { useConjuntoStore } from '@/store/conjuntoStore';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const { notificaciones } = useComunicacionStore();
  const { conjuntoActual, fetchConjuntoById } = useConjuntoStore();
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (user?.conjuntoId) {
      void fetchConjuntoById(user.conjuntoId);
    }
  }, [user?.conjuntoId, fetchConjuntoById]);

  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leida);
  const nombreConjunto = conjuntoActual?.nombreConjunto || conjuntoActual?.nombre;

  return (
    <header className={className}>
      <div className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
        <div className="lg:hidden w-10" />

        <div className="flex-1">
          <h1 className="text-xl font-semibold lg:text-2xl">
            Administración Conjunta
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {nombreConjunto ? `Conjunto: ${nombreConjunto}` : 'Plataforma integral de gestión de propiedad horizontal'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificacionesNoLeidas.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificacionesNoLeidas.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notificaciones</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {notificaciones.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tienes notificaciones</p>
                ) : (
                  notificaciones.map((notif) => (
                    <div key={notif.id} className={`p-3 rounded-lg border ${!notif.leida ? 'bg-accent' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{notif.titulo}</p>
                          <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.fecha).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        {!notif.leida && <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {user?.nombres?.split(' ')[0]}
                </span>
                <ChevronDown className="h-4 w-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <span className="mr-2">🚪</span>
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
