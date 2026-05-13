import { useAuth } from "@/context/AuthContext";
import { DashboardScope } from "@/services/dashboard.service";
import DashboardAdmin from "@/components/dashboard/roles/DashboardAdmin";
import DashboardDefault from "@/components/dashboard/roles/DashboardDefault";

/** Mapea el rol activo del usuario al scope que espera la API */
function resolveScope(role: string | null | undefined): DashboardScope {
  if (role === "administrador") return "administrador";
  if (role === "director_grupo") return "grupo";
  // director_semillero, lider_estudiantil, estudiante → scope semillero
  return "semillero";
}

export default function DashboardPage() {
  const { user, activeRole } = useAuth();

  const scope = resolveScope(activeRole ?? user?.roles?.[0]);

  if (scope === "administrador") {
    return <DashboardAdmin user={user} scope={scope} />;
  }

  return <DashboardDefault user={user} scope={scope} />;
}
