type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

interface WebSocketMessage {
  type: string;
  action?: string;
  data?: any;
  message?: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;
  private connectTimeout: number | null = null;
  private readonly CONNECTION_TIMEOUT = 5000;

  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private errorHandlers = new Set<ErrorHandler>();

  /**
   * 🔑 Obtener token desde localStorage
   */
  private getToken(): string | null {
    try {
      const tokens = localStorage.getItem('tokens');
      if (!tokens) return null;

      const parsed = JSON.parse(tokens);
      return parsed.access || null;
    } catch (error) {
      console.error('❌ Error leyendo token del localStorage:', error);
      return null;
    }
  }

  /**
   * Conecta al WebSocket de permisos
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        this.isIntentionallyClosed = false;

        const token = this.getToken();

        if (!token) {
          reject(new Error('No se encontró token en localStorage'));
          return;
        }

        // Evitar múltiples conexiones
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          console.log('✓ Ya conectado a WebSocket');
          resolve();
          return;
        }

        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.log('⏳ Conexión en curso...');
          resolve();
          return;
        }

        const WS_BASE_URL = import.meta.env.VITE_WEBSOCKET_URL;

        this.url = `${WS_BASE_URL}/permisos/${userId}/?token=${encodeURIComponent(token)}`;

        console.log('🔗 Conectando a:', this.url);

        this.ws = new WebSocket(this.url);

        // Timeout de conexión
        this.connectTimeout = window.setTimeout(() => {
          console.warn('⏱️ Timeout de conexión WebSocket');
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, this.CONNECTION_TIMEOUT);

        this.ws.onopen = () => {
          if (this.connectTimeout) clearTimeout(this.connectTimeout);
          console.log('✅ Conectado a WebSocket de permisos');
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          if (this.connectTimeout) clearTimeout(this.connectTimeout);
          console.error('❌ Error en WebSocket:', error);
          this.errorHandlers.forEach((handler) => handler(error));
          reject(error);
        };

        this.ws.onclose = () => {
          if (this.connectTimeout) clearTimeout(this.connectTimeout);
          console.warn('⚠️ WebSocket cerrado');

          if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        if (this.connectTimeout) clearTimeout(this.connectTimeout);
        console.error('❌ Error al conectar WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconecta del WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.connectTimeout) clearTimeout(this.connectTimeout);

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageHandlers.clear();
    this.connectionHandlers.clear();
    this.errorHandlers.clear();
  }

  /**
   * Envía un mensaje al servidor
   */
  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }

  /**
   * Registra un handler por tipo
   */
  on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  off(type: string, handler: MessageHandler): void {
    this.messageHandlers.get(type)?.delete(handler);
  }

  onConnect(handler: ConnectionHandler): void {
    this.connectionHandlers.add(handler);
  }

  onError(handler: ErrorHandler): void {
    this.errorHandlers.add(handler);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Manejo de mensajes
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      console.log('📨 Mensaje recibido:', message);

      if (this.messageHandlers.has(message.type)) {
        this.messageHandlers.get(message.type)!.forEach((handler) => {
          handler(message);
        });
      }

      if (this.messageHandlers.has('*')) {
        this.messageHandlers.get('*')!.forEach((handler) => {
          handler(message);
        });
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
    }
  }

  /**
   * Reintento de conexión
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;

      console.log(
        `🔄 Reintentando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.userId && !this.isIntentionallyClosed) {
          this.connect(this.userId).catch(() => {});
        }
      }, delay);
    } else {
      console.error('❌ Máximo de reconexiones alcanzado');
    }
  }
}

// Instancia única
export const webSocketService = new WebSocketService();
