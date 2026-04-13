import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, LoginCredentials, User, AuthTokens } from '@/types';
import { authService } from '@/services/auth.service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const tokens = authService.getStoredTokens();
    const user = authService.getStoredUser();

    if (tokens && user) {
      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const { tokens, user } = await authService.login(credentials);
    authService.storeAuth(tokens, user);
    setState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    if (state.tokens?.refresh) {
      await authService.logout(state.tokens.refresh);
    }
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
