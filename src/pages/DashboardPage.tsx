import { useAuth } from '@/context/AuthContext';
import DashboardAdmin from '@/components/dashboard/roles/DashboardAdmin';
import DashboardDefault from '@/components/dashboard/roles/DashboardDefault';

export default function DashboardPage() {
  const { user } = useAuth();

  // Renderizar el dashboard según el rol del usuario
  if (user?.role === 'administrador') {
    return <DashboardAdmin user={user} />;
  }

  // Para director_grupo, director_semillero, lider_estudiantil, estudiante
  return <DashboardDefault user={user} />;
}
