import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  MessageSquare,
  Shield,
  Calendar,
  Users,
  Settings,
  Menu,
  LogOut,
  Vote,
  Scale,
  Car,
  FileText,
  Wrench,
  Heart,
  Wallet,
  Receipt,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isAdministrador = user?.tipo === 'administrador';
  const isConsejo = user?.tipo === 'consejo';
  const isResidente =
    user?.tipo === 'residente' ||
    user?.tipo === 'propietario_residente' ||
    user?.tipo === 'arrendatario' ||
    user?.tipo === 'propietario_no_residente';
  const isComite = user?.tipo === 'comite_convivencia';
  const isServicios = user?.tipo === 'servicios_generales';
  const isContadora = user?.tipo === 'contadora';

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/conjunto', label: 'Mi Conjunto', icon: Building2 },
    { href: '/admin/finanzas', label: 'Finanzas', icon: DollarSign },
    { href: '/admin/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/admin/asambleas', label: 'Asambleas', icon: Vote },
    { href: '/admin/seguridad', label: 'Seguridad', icon: Shield },
    { href: '/admin/parqueaderos', label: 'Parqueaderos', icon: Car },
    { href: '/admin/animales', label: 'Animales de Compañía', icon: Heart },
    { href: '/admin/documentos', label: 'Documentos', icon: FileText },
    { href: '/admin/reservas', label: 'Reservas', icon: Calendar },
    { href: '/admin/residentes', label: 'Residentes', icon: Users },
    { href: '/comite/casos', label: 'Convivencia', icon: Scale },
    { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
    { href: '/admin/solicitudes', label: 'Solicitudes Consejo', icon: Scale },
  ];

  const consejoLinks = [
    { href: '/consejo/dashboard', label: 'Dashboard Consejo', icon: LayoutDashboard },
    { href: '/consejo/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/consejo/asambleas', label: 'Asambleas', icon: Vote },
    { href: '/consejo/seguridad', label: 'Seguridad', icon: Shield },
    { href: '/consejo/residentes', label: 'Residentes', icon: Users },
    { href: '/consejo/solicitudes', label: 'Solicitudes', icon: Scale },
    { href: '/comite/casos', label: 'Casos Convivencia', icon: Scale },
    { href: '/comite/audiencias', label: 'Audiencias', icon: Calendar },
  ];

  const contadoraLinks = [
    { href: '/contadora/dashboard', label: 'Dashboard Contable', icon: Wallet },
    { href: '/contadora/finanzas', label: 'Pagos y Cartera', icon: DollarSign },
    { href: '/contadora/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/contadora/documentos', label: 'Soportes', icon: Receipt },
  ];

  const residenteLinks = [
    { href: '/residente/dashboard', label: 'Inicio', icon: LayoutDashboard },
    { href: '/residente/pagos', label: 'Mis Pagos', icon: DollarSign },
    { href: '/residente/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/residente/asambleas', label: 'Asambleas', icon: Vote },
    { href: '/residente/visitantes', label: 'Visitantes', icon: Users },
    { href: '/residente/reservas', label: 'Reservas', icon: Calendar },
    { href: '/residente/incidentes', label: 'Incidentes', icon: Shield },
  ];

  const comiteLinks = [
    { href: '/comite/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/comite/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/comite/casos', label: 'Casos de Convivencia', icon: Scale },
    { href: '/comite/audiencias', label: 'Audiencias', icon: Calendar },
    { href: '/comite/repositorio', label: 'Repositorio Normativo', icon: BookOpen },
    { href: '/comite/solicitudes', label: 'Solicitudes al Consejo', icon: Scale },
  ];

  const seguridadLinks = [
    { href: '/seguridad/dashboard', label: 'Control', icon: LayoutDashboard },
    { href: '/seguridad/visitantes', label: 'Visitantes', icon: Users },
    { href: '/seguridad/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/seguridad/incidentes', label: 'Incidentes', icon: Shield },
  ];

  const serviciosLinks = [
    { href: '/servicios/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/servicios/comunicados', label: 'Comunicados', icon: MessageSquare },
    { href: '/servicios/novedades', label: 'Mis Novedades', icon: Shield },
    { href: '/servicios/solicitudes', label: 'Solicitudes', icon: Wrench },
  ];

  const links = isAdministrador
    ? adminLinks
    : isConsejo
      ? consejoLinks
      : isContadora
        ? contadoraLinks
        : isResidente
          ? residenteLinks
          : isComite
            ? comiteLinks
            : isServicios
              ? serviciosLinks
              : seguridadLinks;

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Building2 className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-semibold">Admin Conjunta</span>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <NavLink
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">{user?.nombres?.charAt(0)}{user?.apellidos?.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nombres} {user?.apellidos}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.tipo}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className={cn('hidden lg:flex h-screen w-64 flex-col border-r bg-background', className)}>
        <SidebarContent />
      </div>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}


