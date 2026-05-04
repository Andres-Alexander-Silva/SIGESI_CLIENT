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

  useEffect(() => {
    handlerRef.current = (message: PermisosUpdateMessage) => {
      console.log("📨 Actualización de permisos recibida:", message);

      if (message.action === "update") {
        onPermisosUpdate?.(message.data);
        if (message.message) console.log("📢 Notificación:", message.message);
      } else if (message.action === "response") {
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

  useEffect(() => {
    // No conectar si no está habilitado, no hay userId, o ya está conectando
    if (!enabled || !userId || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    webSocketService.on("permisos_update", handlerRef.current!);
    webSocketService.onConnect(connectHandlerRef.current!);
    webSocketService.onError(errorHandlerRef.current!);

    const timeoutId = setTimeout(() => {
      console.warn("⏱️ WebSocket tardó demasiado en conectar");
      isConnectingRef.current = false;
    }, 10000);

    webSocketService
      .connect(userId)
      .then(() => {
        clearTimeout(timeoutId);
        isConnectingRef.current = false;
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        // Error no crítico: la app sigue funcionando sin WebSocket
        console.warn("⚠️ No se pudo conectar el WebSocket de permisos:", error);
        isConnectingRef.current = false;
      });

    return () => {
      clearTimeout(timeoutId);
      if (handlerRef.current) {
        webSocketService.off("permisos_update", handlerRef.current);
      }
    };
  }, [enabled, userId]);

  const requestPermisos = useCallback(() => {
    webSocketService.send({ action: "request_permisos", type: "" });
  }, []);

  return {
    isConnected: webSocketService.isConnected(),
    requestPermisos,
  };
}
