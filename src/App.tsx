import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppThemeProvider } from '@/context/ThemeContext';
import { PermissionsProvider } from '@/context/PermissionsContext';
import router from '@/routes';

export default function App() {
  return (
    <AppThemeProvider>
      <AuthProvider>
        {/* PermissionsProvider debe ir dentro de AuthProvider
            porque observa isAuthenticated para cargar/limpiar permisos */}
        <PermissionsProvider>
          <RouterProvider router={router} />
        </PermissionsProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
