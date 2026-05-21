// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AuthState, LoginCredentials, UserRole } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthContextType extends AuthState {
  /** Rol activo seleccionado por el usuario */
  activeRole: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Selecciona (o cambia) el rol activo; llama al backend */
  selectRole: (role: UserRole) => Promise<void>;
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

  /**
   * identityToken: token temporal que devuelve el login cuando hay SELECT_ROLE.
   * Se guarda en ref (no en state) porque no necesitamos re-render y no debe
   * persistir entre recargas de página.
   */
  const identityTokenRef = useRef<string | undefined>(undefined);

  // Rehidratar sesión al recargar página
  useEffect(() => {
    const tokens = authService.getStoredTokens();
    const user = authService.getStoredUser();
    const storedRole = authService.getStoredActiveRole();

    if (tokens && user) {
      setState({ user, tokens, isAuthenticated: true, isLoading: false });
      setActiveRole(storedRole);
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // ── login ──────────────────────────────────────────────────────────────────
  const login = async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);

    // Guardamos al usuario en el estado para que SelectRolePage
    // pueda mostrar su nombre y los roles disponibles.
    setState({
      user: result.user,
      tokens: result.tokens ?? null,
      isAuthenticated: !result.needsRoleSelection,
      isLoading: false,
    });

    setActiveRole(null);
    authService.clearActiveRole();

    if (result.needsRoleSelection) {
      // Guardamos el identityToken en la ref para usarlo en selectRole
      identityTokenRef.current = result.identityToken;

      const roles = result.user.available_roles;
      if (roles.length === 1) {
        // Un solo rol disponible → seleccionarlo automáticamente
        await _applyRoleSelection(roles[0].code, result.identityToken);
      } else {
        navigate("/select-role", { replace: true });
      }
    } else {
      // El backend ya devolvió tokens definitivos (sin SELECT_ROLE)
      if (result.tokens) authService.storeAuth(result.tokens, result.user);
      const effectiveRoles = result.user.available_roles;
      if (effectiveRoles.length === 1) {
        const solo = effectiveRoles[0].code;
        authService.storeActiveRole(solo);
        setActiveRole(solo);
      }
      navigate("/dashboard", { replace: true });
    }
  };

  // ── _applyRoleSelection: llamada interna que hace el POST y actualiza estado ─
  const _applyRoleSelection = async (role: UserRole, idToken?: string) => {
    const { tokens, activeRole: newRole, available_roles } =
      await authService.selectRole(role, idToken ?? identityTokenRef.current);

    // Actualizar el user con los available_roles confirmados por el backend
    const updatedUser = state.user
      ? { ...state.user, available_roles }
      : state.user;

    if (updatedUser) {
      authService.storeAuth(tokens, updatedUser);
    }
    authService.storeActiveRole(newRole);
    identityTokenRef.current = undefined; // limpiar token temporal

    setState((prev) => ({
      ...prev,
      user: updatedUser,
      tokens,
      isAuthenticated: true,
    }));
    setActiveRole(newRole);
    navigate("/dashboard", { replace: true });
  };

  // ── selectRole: expuesto al exterior ──────────────────────────────────────
  const selectRole = async (role: UserRole) => {
    await _applyRoleSelection(role);
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (state.tokens?.refresh) {
      await authService.logout(state.tokens.refresh).catch(() => {});
    }
    identityTokenRef.current = undefined;
    authService.clearAuth();
    setState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
    setActiveRole(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ ...state, activeRole, login, logout, selectRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
