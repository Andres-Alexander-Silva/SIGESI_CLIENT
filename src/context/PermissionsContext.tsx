import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { permissionsService } from '@/services/permissions.service';
import { Menu, AccionType } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────
interface PermissionsContextType {
  /** Árbol de menús a los que el usuario tiene acceso */
  menus: Menu[];
  /** Rol del usuario según la API de permisos */
  rol: string;
  /** true mientras se está cargando */
  isLoading: boolean;
  /** Error de carga (si aplica) */
  error: string | null;
  /**
   * Comprueba si el usuario puede ejecutar una acción en un menú concreto.
   * @param menuUrl - la URL del menú (ej: "/dashboard", "/proyectos")
   * @param accion  - la acción a verificar
   */
  can: (menuUrl: string, accion: AccionType) => boolean;
  /**
   * Recarga los permisos desde la API (útil después de cambios de rol).
   */
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  menus:     [],
  rol:       '',
  isLoading: false,
  error:     null,
  can:       () => false,
  refresh:   async () => {},
});

export function usePermissions() {
  return useContext(PermissionsContext);
}

/**
 * Hook conveniente para verificar una acción puntual.
 *
 * Uso en componentes:
 *   const canCreate = usePermission('/proyectos', 'crear');
 */
export function usePermission(menuUrl: string, accion: AccionType): boolean {
  const { can } = usePermissions();
  return can(menuUrl, accion);
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [menus,     setMenus]     = useState<Menu[]>([]);
  const [rol,       setRol]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Índice plano: { [normalizedUrl]: Map<accion, permitido> }
  // Se construye una vez que llegan los menús y se usa en `can()`.
  const [permIndex, setPermIndex] = useState<
    Map<string, Map<AccionType, boolean>>
  >(new Map());

  /** Construye el índice de permisos por URL a partir del árbol de menús */
  const buildIndex = (menuList: Menu[]) => {
    const index = new Map<string, Map<AccionType, boolean>>();

    const walk = (list: Menu[]) => {
      for (const menu of list) {
        for (const opcion of menu.opciones ?? []) {
          const key = normalizeUrl(opcion.url);
          const accionMap = new Map<AccionType, boolean>([
            ['ver',      opcion.puede_consultar],
            ['crear',    opcion.puede_crear],
            ['editar',   opcion.puede_actualizar],
            ['eliminar', opcion.puede_eliminar],
          ]);
          index.set(key, accionMap);
        }
        if (menu.children?.length) walk(menu.children);
      }
    };

    walk(menuList);
    return index;
  };

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await permissionsService.getMyPermissions();
      setMenus(data.menus);
      setRol(data.rol);
      setPermIndex(buildIndex(data.menus));
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'No se pudieron cargar los permisos',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar permisos automáticamente al autenticarse; limpiar al salir
  useEffect(() => {
    if (isAuthenticated) {
      fetch();
    } else {
      setMenus([]);
      setRol('');
      setPermIndex(new Map());
      setError(null);
    }
  }, [isAuthenticated, fetch]);

  const can = useCallback(
    (menuUrl: string, accion: AccionType): boolean => {
      const key      = normalizeUrl(menuUrl);
      const accionMap = permIndex.get(key);
      if (!accionMap) return false;
      return accionMap.get(accion) ?? false;
    },
    [permIndex],
  );

  return (
    <PermissionsContext.Provider
      value={{ menus, rol, isLoading, error, can, refresh: fetch }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

// ─── utilidades ──────────────────────────────────────────────────────────────

/** Normaliza una URL para usarla como clave: quita barras y pasa a minúsculas */
function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/^\/|\/$/g, '');
}
