// src/pages/DashboardPage.tsx
import { useAuth } from "@/context/AuthContext";
import { DashboardScope } from "@/services/dashboard.service";
import DashboardAdmin from "@/components/dashboard/roles/DashboardAdmin";
import DashboardDefault from "@/components/dashboard/roles/DashboardDefault";
import DashboardDirectorSemillero from "@/components/dashboard/roles/DashboardDirectorSemillero";
import DashboardEstudiante from "@/components/dashboard/roles/DashboardEstudiante";

/** Mapea el rol activo del usuario al scope que espera la API */
function resolveScope(role: string | null | undefined): DashboardScope {
  if (role === "administrador") return "administrador";
  if (role === "director_grupo") return "grupo";
  return "semillero";
}

export default function DashboardPage() {
  const { user, activeRole } = useAuth();
  const role = activeRole ?? user?.roles?.[0];
  const scope = resolveScope(role);

  // Administrador — dashboard completo con métricas institucionales
  if (scope === "administrador") {
    return <DashboardAdmin user={user} scope={scope} />;
  }

  // Director de semillero y líder estudiantil — dashboard de seguimiento de proyectos
  if (role === "director_semillero" || role === "lider_estudiantil") {
    return <DashboardDirectorSemillero user={user} scope={scope} />;
  }

  // Estudiante — dashboard personal simplificado
  if (role === "estudiante") {
    return <DashboardEstudiante user={user} scope={scope} />;
  }

  // Director de grupo y otros — dashboard por defecto (existente)
  return <DashboardDefault user={user} scope={scope} />;
}
