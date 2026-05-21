import api from "./api";
import { LoginCredentials, AuthTokens, User, UserRole, RoleOption } from "@/types";

// ─── Tipos internos de la API ─────────────────────────────────────────────────

interface LoginApiResponse {
  usuarioId: number;
  email: string;
  names: string;
  available_roles: RoleOption[];
  /** Solo presente cuando response === "SELECT_ROLE" */
  identityToken?: string;
  /** Presentes cuando el backend ya seleccionó el rol automáticamente */
  token?: string;
  refreshToken?: string;
  role?: string;
  response: string;
}

interface SelectRoleApiResponse {
  role: string;
  available_roles: RoleOption[];
  token: string;
  refreshToken: string;
}

// ─── Resultado normalizado del login ──────────────────────────────────────────

export interface LoginResult {
  /** true → hay que pedir selección de rol antes de continuar */
  needsRoleSelection: boolean;
  user: User;
  /** Sólo presente cuando needsRoleSelection === false */
  tokens?: AuthTokens;
  /** Token temporal para llamar a /auth/select-role/ */
  identityToken?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildUser(
  usuarioId: number,
  email: string,
  names: string,
  available_roles: RoleOption[],
): User {
  const parts = (names ?? "").trim().split(/\s+/);
  return {
    id: usuarioId,
    email,
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
    roles: available_roles.map((r) => r.code),
    available_roles,
    is_active: true,
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const authService = {
  /** Paso 1: credenciales → puede requerir selección de rol */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { data } = await api.post<LoginApiResponse>("/auth/login/", credentials);

    const user = buildUser(
      data.usuarioId,
      data.email,
      data.names,
      data.available_roles ?? [],
    );

    if (data.response === "SELECT_ROLE" && data.identityToken) {
      return {
        needsRoleSelection: true,
        user,
        identityToken: data.identityToken,
      };
    }

    // Caso retrocompatible: el backend devuelve token directamente
    return {
      needsRoleSelection: false,
      user,
      tokens: {
        access: data.token ?? "",
        refresh: data.refreshToken ?? "",
      },
    };
  },

  /**
   * Paso 2: elige rol.
   * - Durante el login usa el identityToken.
   * - Para cambio en caliente usa el access token actual (el interceptor de api.ts
   *   ya lo adjunta automáticamente, así que sólo lo sobreescribimos si viene
   *   identityToken explícito).
   */
  async selectRole(
    role: UserRole,
    identityToken?: string,
  ): Promise<{ tokens: AuthTokens; activeRole: UserRole; available_roles: RoleOption[] }> {
    const headers = identityToken
      ? { Authorization: `Bearer ${identityToken}` }
      : undefined;

    const { data } = await api.post<SelectRoleApiResponse>(
      "/auth/select-role/",
      { role },
      { headers },
    );

    return {
      tokens: { access: data.token, refresh: data.refreshToken },
      activeRole: data.role as UserRole,
      available_roles: data.available_roles,
    };
  },

  async logout(refresh: string): Promise<void> {
    try {
      await api.post("/auth/logout/", { refreshToken: refresh });
    } catch {
      // Ignorar errores en logout
    }
  },

  // ─── Storage ────────────────────────────────────────────────────────────────

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
