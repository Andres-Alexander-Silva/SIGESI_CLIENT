// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthState, LoginCredentials, UserRole } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthContextType extends AuthState {
  /** Rol activo seleccionado por el usuario en la pantalla de selección */
  activeRole: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  navigate: (path: string, options?: { replace?: boolean }) => void;
}

export function AuthProvider({ children, navigate }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const [activeRole, setActiveRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const tokens = authService.getStoredTokens();
    const user = authService.getStoredUser();
    const storedRole = authService.getStoredActiveRole();

    if (tokens && user) {
      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
      // Restaurar el rol activo de la sesión anterior
      setActiveRole(storedRole);
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { tokens, user, roles } = await authService.login(credentials);

    authService.storeAuth(tokens, user);

    setState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    });

    // Limpiar rol activo de sesión anterior
    setActiveRole(null);
    authService.clearActiveRole();

    // Unificar: usar roles del resultado o, como fallback, los del user (ya mapeados en auth.service)
    const effectiveRoles = roles?.length ? roles : (user.roles ?? []);

    if (effectiveRoles.length > 1) {
      // Múltiples roles → pantalla de selección
      navigate("/select-role", { replace: true });
    } else if (effectiveRoles.length === 1) {
      // Un único rol → seleccionarlo automáticamente y pasar al dashboard
      const singleRole = effectiveRoles[0] as UserRole;
      authService.storeActiveRole(singleRole);
      setActiveRole(singleRole);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const selectRole = (selectedRole: UserRole) => {
    authService.storeActiveRole(selectedRole);
    setActiveRole(selectedRole);
    navigate("/dashboard", { replace: true });
  };

  const logout = async () => {
    if (state.tokens?.refresh) {
      await authService.logout(state.tokens.refresh).catch(() => {});
    }
    authService.clearAuth();
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });
    setActiveRole(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ ...state, activeRole, login, logout, selectRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
