// src/routes/index.tsx
import { createBrowserRouter, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { Outlet } from "react-router-dom";
import { ReactNode } from "react";

import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import PasswordRecoveryPage from "@/pages/PasswordRecoveryPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/config/UsersPage";
import MenusPage from "@/pages/config/MenusPage";
import OpcionesPage from "@/pages/config/OpcionesPage";
import PermisosPage from "@/pages/config/PermisosPage";
import SemillerosPage from "@/pages/core/SemillerosPage";
import ProyectosPage from "@/pages/core/ProyectosPage";
import SelectRolePage from "@/pages/SelectRolePage";
import { Box, Typography } from "@mui/material";
import LineasPage from "@/pages/core/LineasPage";
import GruposPage from "@/pages/core/GruposPage";
import InscripcionesPage from "@/pages/core/InscripcionPage";
import MiembrosPage from "@/pages/core/MiembrosPage";
import ActividadesPage from "@/pages/core/ActividadesPage";
import AvancesPage from "@/pages/core/AvancesPage";

// ── NUEVO: módulo de reportes ──────────────────────────────────────────────────
import ReportesPageWrapper from "@/pages/reportes/ReportesPageWrapper";
import ProduccionAcademicaPage from "@/pages/core/ProduccionAcademicaPage";
import ProgramasAcademicosPage from "@/pages/core/ProgramasAcademicosPage";
import CronogramaProyectoPage from "@/pages/core/CronogramaProyectoPage";
import EvaluacionesProyectoPage from "@/pages/core/EvaluacionesProyectoPage";

function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return <AuthProvider navigate={navigate}>{children}</AuthProvider>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProviderWrapper>
        <Outlet />
      </AuthProviderWrapper>
    ),
    children: [
      // ── Rutas públicas ──────────────────────────────────────────────────────
      { path: "login", element: <LoginPage /> },
      { path: "recuperacion", element: <PasswordRecoveryPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },

      // ── Rutas protegidas ────────────────────────────────────────────────────
      {
        path: "/",
        element: (
          <PermissionsProvider>
            <ProtectedRoute />
          </PermissionsProvider>
        ),
        children: [
          { path: "select-role", element: <SelectRolePage /> },

          {
            element: <MainLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: "dashboard", element: <DashboardPage /> },

              // Módulos principales
              { path: "semilleros", element: <SemillerosPage /> },
              { path: "proyectos", element: <ProyectosPage /> },
              { path: "grupos", element: <GruposPage /> },
              { path: "lineas_investigacion", element: <LineasPage /> },
              { path: "inscripcion", element: <InscripcionesPage /> },
              { path: "gestionar_miembros", element: <MiembrosPage /> },
              { path: "actividades", element: <ActividadesPage /> },
              { path: "avances", element: <AvancesPage /> },
              { path: "produccion_academica", element: <ProduccionAcademicaPage /> },
              { path: "programas_academicos", element: <ProgramasAcademicosPage /> },
              { path: "cronograma_proyecto", element: <CronogramaProyectoPage /> },
              { path: "evaluaciones_proyecto", element: <EvaluacionesProyectoPage /> },

              // ── Reportes ─────────────────────────────────────────────────────
              // URL: /reportes
              // Roles con acceso: administrador, director_grupo,
              //                   director_semillero, lider_estudiantil,
              //                   estudiante
              // El componente wrapper lee el rol activo del contexto y decide
              // qué vista renderizar internamente (VistaDirector / VistaAdministrador
              // / VistaEstudiante).
              { path: "reportes", element: <ReportesPageWrapper /> },

              // Configuración
              { path: "configuracion/usuarios", element: <UsersPage /> },
              { path: "configuracion/menus", element: <MenusPage /> },
              { path: "configuracion/opciones", element: <OpcionesPage /> },
              { path: "configuracion/permisos", element: <PermisosPage /> },

              // Fallback interno
              { path: "*", element: <Navigate to="/dashboard" replace /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback general
  { path: "*", element: <Navigate to="/login" replace /> },
]);

function PlaceholderPage({ title }: { title: string }) {
  return (
    <Box sx={{ py: 10, textAlign: "center" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">
        Este módulo estará disponible próximamente.
      </Typography>
    </Box>
  );
}

export default router;
