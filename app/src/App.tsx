import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Toaster } from '@/components/ui/sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ComiteLayout } from '@/components/layout/ComiteLayout';
import { ResidenteLayout } from '@/components/layout/ResidenteLayout';
import { ServiciosLayout } from '@/components/layout/ServiciosLayout';
import { initAuthListener, useAuthStore } from '@/store/authStore';

import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';

import { AdminAnimales } from '@/pages/admin/Animales';
import { AdminAsambleas } from '@/pages/admin/Asambleas';
import { Comunicados } from '@/pages/admin/Comunicados';
import { AdminConfiguracion } from '@/pages/admin/Configuracion';
import { AdminConjunto } from '@/pages/admin/Conjunto';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminDocumentos } from '@/pages/admin/Documentos';
import { Finanzas } from '@/pages/admin/Finanzas';
import { AdminParqueaderos } from '@/pages/admin/Parqueaderos';
import { AdminReservas } from '@/pages/admin/Reservas';
import { Seguridad as AdminSeguridad } from '@/pages/admin/Seguridad';
import { AdminSolicitudes } from '@/pages/admin/Solicitudes';

import { ComiteAudiencias } from '@/pages/comite/Audiencias';
import { CasoDetalle } from '@/pages/comite/CasoDetalle';
import { ComiteCasos } from '@/pages/comite/Casos';
import { ComiteDashboard } from '@/pages/comite/Dashboard';
import { ComiteRepositorio } from '@/pages/comite/Repositorio';
import { ComiteSolicitudes } from '@/pages/comite/Solicitudes';

import { ConsejoDashboard } from '@/pages/consejo/Dashboard';
import { ConsejoResidentes } from '@/pages/consejo/Residentes';
import { ConsejoSeguridad } from '@/pages/consejo/Seguridad';
import { ConsejoSolicitudes } from '@/pages/consejo/Solicitudes';

import { ContadoraDashboard } from '@/pages/contadora/Dashboard';

import { ResidenteAsambleas } from '@/pages/residente/Asambleas';
import { ResidenteDashboard } from '@/pages/residente/Dashboard';
import { ResidenteIncidentes } from '@/pages/residente/Incidentes';
import { ResidentePagos } from '@/pages/residente/Pagos';
import { ResidenteReservas } from '@/pages/residente/Reservas';
import { ResidenteVisitantes } from '@/pages/residente/Visitantes';

import { SeguridadDashboard } from '@/pages/seguridad/Dashboard';
import { SeguridadIncidentes } from '@/pages/seguridad/Incidentes';

import { ServiciosDashboard } from '@/pages/servicios/Dashboard';

function ProtectedRoute({ children, allowedTypes }: { children: React.ReactNode; allowedTypes: string[] }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedTypes.includes(user.tipo)) {
    if (user.tipo === 'administrador') return <Navigate to="/admin/dashboard" replace />;
    if (user.tipo === 'consejo') return <Navigate to="/consejo/dashboard" replace />;
    if (user.tipo === 'residente') return <Navigate to="/residente/dashboard" replace />;
    if (user.tipo === 'comite_convivencia') return <Navigate to="/comite/dashboard" replace />;
    if (user.tipo === 'servicios_generales') return <Navigate to="/servicios/dashboard" replace />;
    if (user.tipo === 'seguridad') return <Navigate to="/seguridad/dashboard" replace />;
    if (user.tipo === 'contadora') return <Navigate to="/contadora/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function ModuloEnDesarrollo({ titulo, descripcion = 'Modulo en desarrollo' }: { titulo: string; descripcion?: string }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">{titulo}</h2>
      <p className="text-muted-foreground">{descripcion}</p>
    </div>
  );
}

function App() {
  useEffect(() => {
    initAuthListener();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        <Route path="/admin" element={<ProtectedRoute allowedTypes={['administrador']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="comunicados" element={<Comunicados />} />
          <Route path="seguridad" element={<AdminSeguridad />} />
          <Route path="parqueaderos" element={<AdminParqueaderos />} />
          <Route path="animales" element={<AdminAnimales />} />
          <Route path="documentos" element={<AdminDocumentos />} />
          <Route path="conjunto" element={<AdminConjunto />} />
          <Route path="unidades" element={<ModuloEnDesarrollo titulo="Unidades" />} />
          <Route path="asambleas" element={<AdminAsambleas />} />
          <Route path="reservas" element={<AdminReservas />} />
          <Route path="residentes" element={<ModuloEnDesarrollo titulo="Residentes" />} />
          <Route path="configuracion" element={<AdminConfiguracion />} />
          <Route path="solicitudes" element={<AdminSolicitudes />} />
        </Route>

        <Route path="/consejo" element={<ProtectedRoute allowedTypes={['consejo', 'administrador']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ConsejoDashboard />} />
          <Route path="asambleas" element={<AdminAsambleas />} />
          <Route path="seguridad" element={<ConsejoSeguridad />} />
          <Route path="residentes" element={<ConsejoResidentes />} />
          <Route path="solicitudes" element={<ConsejoSolicitudes />} />
        </Route>

        <Route path="/seguridad" element={<ProtectedRoute allowedTypes={['seguridad', 'administrador']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SeguridadDashboard />} />
          <Route path="visitantes" element={<AdminSeguridad />} />
          <Route path="incidentes" element={<SeguridadIncidentes />} />
        </Route>

        <Route path="/residente" element={<ProtectedRoute allowedTypes={['residente']}><ResidenteLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ResidenteDashboard />} />
          <Route path="pagos" element={<ResidentePagos />} />
          <Route path="visitantes" element={<ResidenteVisitantes />} />
          <Route path="reservas" element={<ResidenteReservas />} />
          <Route path="incidentes" element={<ResidenteIncidentes />} />
          <Route path="comunicados" element={<ModuloEnDesarrollo titulo="Comunicados" />} />
          <Route path="asambleas" element={<ResidenteAsambleas />} />
          <Route path="configuracion" element={<Navigate to="/residente/dashboard" replace />} />
        </Route>

        <Route path="/comite" element={<ProtectedRoute allowedTypes={['comite_convivencia', 'administrador', 'consejo']}><ComiteLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ComiteDashboard />} />
          <Route path="casos" element={<ComiteCasos />} />
          <Route path="casos/:id" element={<CasoDetalle />} />
          <Route path="audiencias" element={<ComiteAudiencias />} />
          <Route path="repositorio" element={<ComiteRepositorio />} />
          <Route path="solicitudes" element={<ComiteSolicitudes />} />
        </Route>

        <Route path="/servicios" element={<ProtectedRoute allowedTypes={['servicios_generales', 'administrador']}><ServiciosLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ServiciosDashboard />} />
          <Route path="novedades" element={<ServiciosDashboard />} />
          <Route path="solicitudes" element={<ServiciosDashboard />} />
        </Route>

        <Route path="/contadora" element={<ProtectedRoute allowedTypes={['contadora', 'administrador']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ContadoraDashboard />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="documentos" element={<AdminDocumentos />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
