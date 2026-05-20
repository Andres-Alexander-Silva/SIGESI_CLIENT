import axios from "axios";

// Eliminar la barra final para evitar dobles barras al concatenar paths
const API_URL = (
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000/api"
).replace(/\/$/, "");

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Rutas que NO deben llevar Authorization ni intentar refresh
const PUBLIC_PATHS = [
  "/auth/login/",
  "/auth/recuperacion/",
  "/auth/recuperacion/set-password/",
  "/auth/refresh/",
];

const isPublicPath = (url?: string) =>
  PUBLIC_PATHS.some((p) => url?.includes(p));

// ── Interceptor de request: inyectar access token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    // No inyectar token en rutas públicas de auth
    if (isPublicPath(config.url)) return config;

    try {
      const raw = localStorage.getItem("tokens");
      if (raw) {
        const { access } = JSON.parse(raw) as { access: string };
        config.headers.Authorization = `Bearer ${access}`;
      }
    } catch {
      // tokens corruptos en localStorage — los ignoramos
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Interceptor de response: renovar token expirado ────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // No intentar refresh en rutas públicas ni si ya se reintentó
    if (
      isPublicPath(originalRequest?.url) ||
      originalRequest?._retry ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const raw = localStorage.getItem("tokens");
      if (raw) {
        const { refresh } = JSON.parse(raw) as { refresh: string };

        // La API espera el campo "refreshToken"
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
          refreshToken: refresh,
        });

        const newTokens = {
          access: refreshResponse.data.token,
          refresh: refreshResponse.data.refreshToken || refresh,
        };

        localStorage.setItem("tokens", JSON.stringify(newTokens));
        originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        return api(originalRequest);
      }
    } catch {
      localStorage.removeItem("tokens");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default api;
