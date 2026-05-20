import api from "./api";
import { LoginCredentials, AuthTokens, User, UserRole } from "@/types";

interface LoginApiResponse {
  usuarioId: number;
  email: string;
  names: string;
  /** Array de roles — puede venir o no según versión del backend */
  roles?: string[];
  rolesDisplay?: string[];
  /** Campos actuales del swagger: rol único como string */
  roleCode?: string;
  roleName?: string;
  token: string;
  refreshToken: string;
  response: string;
}

interface LoginResult {
  tokens: AuthTokens;
  user: User;
  roles: string[];
}

function mapLoginResponse(data: LoginApiResponse): LoginResult {
  const parts = (data.names ?? "").trim().split(/\s+/);
  const first_name = parts[0] ?? "";
  const last_name = parts.slice(1).join(" ");

  // El swagger define roleCode (string único). Si el backend ya envía roles[]
  // también se soporta. De este modo nunca queda vacío.
  const rolesArray: UserRole[] = data.roles?.length
    ? (data.roles as UserRole[])
    : data.roleCode
    ? ([data.roleCode] as UserRole[])
    : [];

  const user: User = {
    id: data.usuarioId,
    email: data.email,
    first_name,
    last_name,
    roles: rolesArray,
    is_active: true,
  };

  return {
    tokens: {
      access: data.token,
      refresh: data.refreshToken,
    },
    user,
    roles: rolesArray,
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const response = await api.post<LoginApiResponse>(
      "/auth/login/",
      credentials,
    );
    return mapLoginResponse(response.data);
  },

  async logout(refresh: string): Promise<void> {
    try {
      await api.post("/auth/logout/", { refreshToken: refresh });
    } catch {
      // Ignorar errores en logout
    }
  },

  getStoredTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem("tokens");
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  },

  getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  storeAuth(tokens: AuthTokens, user: User): void {
    localStorage.setItem("tokens", JSON.stringify(tokens));
    localStorage.setItem("user", JSON.stringify(user));
  },

  storeUser(user: User): void {
    localStorage.setItem("user", JSON.stringify(user));
  },

  storeActiveRole(role: UserRole): void {
    localStorage.setItem("activeRole", role);
  },

  getStoredActiveRole(): UserRole | null {
    return (localStorage.getItem("activeRole") as UserRole) ?? null;
  },

  clearActiveRole(): void {
    localStorage.removeItem("activeRole");
  },

  clearAuth(): void {
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
  },
};
