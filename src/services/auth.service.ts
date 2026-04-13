import api from './api';
import { LoginCredentials, AuthTokens, User } from '@/types';

// ─── Tipos que devuelve realmente la API ─────────────────────────────────────
interface LoginApiResponse {
  usuarioId: number;
  email: string;
  names: string;       // "Nombre Apellido"
  roleCode: string;
  roleName: string;
  token: string;       // access token
  refreshToken: string;
  response: boolean;
}

// Convierte la respuesta de la API al formato interno de la app
function mapLoginResponse(data: LoginApiResponse): { tokens: AuthTokens; user: User } {
  const parts = (data.names ?? '').trim().split(/\s+/);
  const first_name = parts[0] ?? '';
  const last_name  = parts.slice(1).join(' ');

  return {
    tokens: {
      access:  data.token,
      refresh: data.refreshToken,
    },
    user: {
      id:         data.usuarioId,
      email:      data.email,
      first_name,
      last_name,
      role:       data.roleName || data.roleCode || 'Usuario',
      is_active:  true,
    },
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────
export const authService = {
  async login(credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: User }> {
    const response = await api.post<LoginApiResponse>('/auth/login/', credentials);
    return mapLoginResponse(response.data);
  },

  async logout(refresh: string): Promise<void> {
    try {
      // La API espera el campo "refreshToken"
      await api.post('/auth/logout/', { refreshToken: refresh });
    } catch {
      // Si falla en el servidor igual limpiamos local
    }
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  },

  async getProfile(): Promise<User> {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  getStoredTokens(): AuthTokens | null {
    try {
      const raw = localStorage.getItem('tokens');
      return raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      return null;
    }
  },

  getStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  storeAuth(tokens: AuthTokens, user: User): void {
    localStorage.setItem('tokens', JSON.stringify(tokens));
    localStorage.setItem('user',   JSON.stringify(user));
  },
};
