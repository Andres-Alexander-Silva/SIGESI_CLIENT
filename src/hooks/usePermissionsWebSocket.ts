import { useEffect, useRef, useCallback } from "react";
import { webSocketService } from "@/services/websocket.service";

interface PermisosUpdateMessage {
  type: "permisos_update";
  action: "update" | "response";
  message: string;
  data: any;
}

interface UsePermissionsWebSocketOptions {
  userId: string | null;
  enabled?: boolean;
  onPermisosUpdate?: (data: any) => void;
  onConnect?: () => void;
  onError?: (error: Event) => void;
}

/**
 * Hook para conectar y escuchar actualizaciones de permisos en tiempo real
 *
 * @example
 * const { isConnected, requestPermisos } = usePermissionsWebSocket({
 *   userId: user?.id,
 *   onPermisosUpdate: (data) => setPermisos(data),
 * });
 */
export function usePermissionsWebSocket({
  userId,
  enabled = true,
  onPermisosUpdate,
  onConnect,
  onError,
}: UsePermissionsWebSocketOptions) {
  const handlerRef = useRef<(message: PermisosUpdateMessage) => void>();
  const connectHandlerRef = useRef<() => void>();
  const errorHandlerRef = useRef<(error: Event) => void>();
  const isConnectingRef = useRef(false);

  // Crear handlers
  useEffect(() => {
    handlerRef.current = (message: PermisosUpdateMessage) => {
      console.log("📨 Actualización de permisos recibida:", message);

      if (message.action === "update") {
        console.log("✓ Permisos actualizados:", message.data);
        onPermisosUpdate?.(message.data);

        // Mostrar notificación (opcional)
        if (message.message) {
          console.log("📢 Notificación:", message.message);
        }
      } else if (message.action === "response") {
        console.log("✓ Respuesta de permisos:", message.data);
        onPermisosUpdate?.(message.data);
      }
    };

    connectHandlerRef.current = () => {
      console.log("✓ WebSocket de permisos conectado");
      onConnect?.();
    };

    errorHandlerRef.current = (error: Event) => {
      console.error("✗ Error en WebSocket de permisos:", error);
      onError?.(error);
    };
  }, [onPermisosUpdate, onConnect, onError]);

  // Conectar al WebSocket
  useEffect(() => {
    if (!enabled || !userId || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    // Registrar handlers
    webSocketService.on("permisos_update", handlerRef.current!);
    webSocketService.onConnect(connectHandlerRef.current!);
    webSocketService.onError(errorHandlerRef.current!);

    // Conectar con timeout
    const timeoutId = setTimeout(() => {
      console.warn("⏱️ WebSocket tardó demasiado en conectar");
      isConnectingRef.current = false;
    }, 10000);

    webSocketService
      .connect(userId)
      .then(() => {
        clearTimeout(timeoutId);
        console.log("✓ Conectado a WebSocket");
        isConnectingRef.current = false;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error("✗ Error conectando a WebSocket:", error);
        isConnectingRef.current = false;
        // No bloquear, permitir que el usuario siga usando la app
      });

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (handlerRef.current) {
        webSocketService.off("permisos_update", handlerRef.current);
      }
    };
  }, [enabled, userId]);

  // Función para solicitar permisos
  const requestPermisos = useCallback(() => {
    webSocketService.send({
        action: "request_permisos",
        type: ""
    });
  }, []);

  // Estado de conexión
  const isConnected = webSocketService.isConnected();

  return {
    isConnected,
    requestPermisos,
  };
}
