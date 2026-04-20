# WebSocket de Permisos - Implementación Frontend

## Descripción

Sistema de notificaciones en tiempo real para cambios de permisos usando WebSockets. Los permisos se actualizan automáticamente sin necesidad de recargar la página.

## Archivos Creados

### 1. `src/services/websocket.service.ts`
Servicio singleton que maneja todas las conexiones WebSocket.

**Características:**
- Conexión automática a `/ws/permisos/{userId}/`
- Reconexión automática (hasta 5 intentos)
- Manejo de handlers por tipo de mensaje
- Desconexión ordenada

**Métodos principales:**
```typescript
connect(userId: string)           // Conectar al WebSocket
disconnect()                       // Desconectar
send(message)                      // Enviar mensaje
on(type, handler)                  // Escuchar mensajes de un tipo
off(type, handler)                 // Dejar de escuchar
onConnect(handler)                 // Callback cuando se conecta
onError(handler)                   // Callback cuando hay error
isConnected()                       // Verificar estado
```

### 2. `src/hooks/usePermissionsWebSocket.ts`
Hook React que simplifica el uso del WebSocket de permisos.

**Uso:**
```typescript
const { isConnected, requestPermisos } = usePermissionsWebSocket({
  userId: user?.id,                    // ID del usuario
  enabled: true,                       // Habilitar/deshabilitar
  onPermisosUpdate: (data) => {...},   // Callback cuando se actualizan permisos
  onConnect: () => {...},              // Callback cuando se conecta
  onError: (error) => {...},           // Callback cuando hay error
});
```

### 3. Actualizado: `src/context/PermissionsContext.tsx`
El contexto ahora:
- Carga permisos iniciales desde API
- Se conecta al WebSocket automáticamente
- Actualiza los permisos en tiempo real cuando llega un mensaje
- Mantiene compatibilidad con código existente

## Flujo de Funcionamiento

```
1. Usuario se autentica (AuthContext)
   ↓
2. PermissionsProvider se monta
   ↓
3. Se cargan permisos iniciales desde API
   ↓
4. usePermissionsWebSocket se ejecuta
   ↓
5. Se conecta al WebSocket (/ws/permisos/{userId}/)
   ↓
6. Frontend espera mensajes de actualización
   ↓
7. Admin actualiza permisos en el backend
   ↓
8. Backend notifica al usuario vía WebSocket
   ↓
9. Frontend recibe 'permisos_update'
   ↓
10. Permisos se actualizan en tiempo real
    ↓
11. El menú/sidebar se actualiza automáticamente
```

## Variables de Entorno (Backend)

Agrega a tu `.env` del backend:

```bash
# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# O si usas Redis URL
REDIS_URL=redis://127.0.0.1:6379

# Channels
CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer
```

## Inicio del Backend

Para que funcione, el backend debe ejecutarse con Daphne (ASGI):

```bash
# Desarrollo
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# O Django detecta automáticamente
python manage.py runserver
```

## Verificar Redis

```bash
# Verificar que Redis está corriendo
redis-cli ping
# Debe responder: PONG

# Si no está instalado (macOS)
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis-server
```

## Estructura de Mensajes

### Mensaje del frontend → backend

```javascript
{
  action: 'request_permisos'  // Solicitar permisos actuales
}
```

### Mensaje del backend → frontend

```javascript
{
  type: 'permisos_update',
  action: 'update',           // o 'response'
  message: 'Permisos actualizados',
  data: {
    menus: [...],             // Árbol de menús
    rol: 'administrador'      // Rol del usuario
  }
}
```

## Ejemplo de Uso en Componentes

### Ejemplo 1: Verificar conexión WebSocket

```typescript
import { usePermissionsWebSocket } from '@/hooks/usePermissionsWebSocket';
import { useAuth } from '@/context/AuthContext';

export function WebSocketStatus() {
  const { user } = useAuth();
  const { isConnected } = usePermissionsWebSocket({
    userId: user?.id?.toString() ?? null,
  });

  return (
    <div>
      WebSocket: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
    </div>
  );
}
```

### Ejemplo 2: Solicitar permisos manualmente

```typescript
import { usePermissionsWebSocket } from '@/hooks/usePermissionsWebSocket';
import { useAuth } from '@/context/AuthContext';

export function RefreshPermissionsButton() {
  const { user } = useAuth();
  const { requestPermisos } = usePermissionsWebSocket({
    userId: user?.id?.toString() ?? null,
  });

  return (
    <button onClick={requestPermisos}>
      Actualizar Permisos
    </button>
  );
}
```

### Ejemplo 3: Escuchar cambios globales

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermissionsWebSocket } from '@/hooks/usePermissionsWebSocket';

export function PermissionsMonitor() {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  usePermissionsWebSocket({
    userId: user?.id?.toString() ?? null,
    onPermisosUpdate: () => {
      setLastUpdate(new Date());
      console.log('📨 Permisos actualizados en:', new Date().toLocaleTimeString());
    },
  });

  return (
    <div>
      {lastUpdate && (
        <p>Última actualización: {lastUpdate.toLocaleTimeString()}</p>
      )}
    </div>
  );
}
```

## Troubleshooting

### Error: "WebSocket no está conectado"
- Verifica que Redis está corriendo: `redis-cli ping`
- Asegúrate que el backend está ejecutando con Daphne
- Revisa la consola del navegador (F12 → Console)

### No se reciben notificaciones
1. Verifica que Redis está corriendo
2. Comprueba que `CHANNEL_LAYERS` está configurado en settings.py
3. Revisa los logs del backend
4. Abre la consola del navegador (F12)

### La conexión se cierra después de N segundos
- Verifica el timeout de nginx/apache
- Aumenta el timeout del servidor web
- Comprueba que Daphne está respondiendo

### Error: "CORS policy"
- Verifica que el WebSocket URL es del mismo dominio
- Si usas subdominio, revisa la configuración de CORS en Django

## Ventajas del Sistema

✅ **Actualizaciones en tiempo real**: Sin necesidad de recargar  
✅ **Escalable**: Usa Redis para distribuir mensajes  
✅ **Tolerante a fallos**: Reconexión automática  
✅ **Eficiente**: Solo notifica cambios, no mantiene polling  
✅ **Seguro**: Requiere autenticación JWT  

## Próximos Pasos (Opcional)

1. **Notificaciones visuales**: Agregar toast/snackbar cuando se actualizan permisos
2. **Logs de auditoría**: Registrar qué usuario cambió qué permiso
3. **Historial**: Guardar historial de cambios de permisos
4. **Sincronización cross-tab**: Si el usuario abre múltiples tabs, todos se actualizan
