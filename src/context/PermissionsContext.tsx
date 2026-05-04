import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  permissionsService,
  buildSidebarTree,
} from "@/services/permissions.service";
import { usePermissionsWebSocket } from "@/hooks/usePermissionsWebSocket";
import { Menu, AccionType } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────────────────
interface PermissionsContextType {
  menus: Menu[];
  rol: string;
  isLoading: boolean;
  error: string | null;
  can: (menuUrl: string, accion: AccionType) => boolean;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  menus: [],
  rol: "",
  isLoading: false,
  error: null,
  can: () => false,
  refresh: async () => {},
});

export function usePermissions() {
  return useContext(PermissionsContext);
}

export function usePermission(menuUrl: string, accion: AccionType): boolean {
  const { can } = usePermissions();
  return can(menuUrl, accion);
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, activeRole } = useAuth();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [rol, setRol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [permIndex, setPermIndex] = useState<
    Map<string, Map<AccionType, boolean>>
  >(new Map());

  const buildIndex = (menuList: Menu[]) => {
    const index = new Map<string, Map<AccionType, boolean>>();

    const walk = (list: Menu[]) => {
      for (const menu of list) {
        for (const opcion of menu.opciones ?? []) {
          const key = normalizeUrl(opcion.url);
          const accionMap = new Map<AccionType, boolean>([
            ["ver", opcion.puede_consultar],
            ["crear", opcion.puede_crear],
            ["editar", opcion.puede_actualizar],
            ["eliminar", opcion.puede_eliminar],
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
      const data = await permissionsService.getMyPermissions(
        activeRole ?? undefined,
      );
      setMenus(data.menus);
      setRol(data.rol);
      setPermIndex(buildIndex(data.menus));
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "No se pudieron cargar los permisos",
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeRole]);

  const updatePermisosFromWebSocket = useCallback(
    (permisos: any) => {
      console.log(
        "🔄 Actualización de permisos recibida del WebSocket:",
        permisos,
      );

      if (permisos?.menus) {
        const builtMenus = buildSidebarTree(permisos.menus);
        setMenus(builtMenus);
        setPermIndex(buildIndex(builtMenus));
        if (permisos.rol) {
          setRol(permisos.rol);
        }
      } else {
        fetch();
      }
    },
    [fetch],
  );

  // Solo conectar WebSocket si el usuario está autenticado y tiene id
  const wsUserId = isAuthenticated && user?.id ? user.id.toString() : null;

  usePermissionsWebSocket({
    userId: wsUserId,
    enabled: isAuthenticated && !!wsUserId,
    onPermisosUpdate: updatePermisosFromWebSocket,
    onConnect: () => {
      console.log("✓ WebSocket de permisos listo");
    },
    onError: (error) => {
      console.warn(
        "⚠️ WebSocket de permisos desconectado, app sigue funcionando:",
        error,
      );
    },
  });

  useEffect(() => {
    if (isAuthenticated && activeRole) {
      fetch();
    } else if (isAuthenticated && !activeRole) {
      // Aún no ha seleccionado rol — no cargar permisos
      setMenus([]);
      setRol("");
      setPermIndex(new Map());
    } else {
      setMenus([]);
      setRol("");
      setPermIndex(new Map());
      setError(null);
    }
  }, [isAuthenticated, activeRole, fetch]);

  const can = useCallback(
    (menuUrl: string, accion: AccionType): boolean => {
      const key = normalizeUrl(menuUrl);
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

function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^\/|\/$/g, "");
}
