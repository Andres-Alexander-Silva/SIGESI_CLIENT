import api from "./api";
import {
  UserAdmin,
  MenuAdmin,
  OpcionAdmin,
  PermisoAdmin,
  PaginatedResponse,
  ChangePasswordData,
} from "@/types";

// Extrae el array de una respuesta que puede ser paginada o directa
function extractList<T>(data: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usersService = {
  list: () =>
    api
      .get<UserAdmin[] | PaginatedResponse<UserAdmin>>("/config/users/")
      .then((r) => extractList(r.data)),
  listByRol: (rol: string) =>
    api
      .get<UserAdmin[] | PaginatedResponse<UserAdmin>>("/config/users/", {
        params: { rol },
      })
      .then((r) => extractList(r.data)),
  get: (id: number) =>
    api.get<UserAdmin>(`/config/users/${id}/`).then((r) => r.data),
  create: (data: Partial<UserAdmin> & { password: string }) =>
    api.post<UserAdmin>("/config/users/", data).then((r) => r.data),
  update: (id: number, data: Partial<UserAdmin>) =>
    api.patch<UserAdmin>(`/config/users/${id}/`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/config/users/${id}/`),
  changePassword: (data: ChangePasswordData) =>
    api.post(`/config/users/cambiar-password/`, data),

  bulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/config/users/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ── Menús ─────────────────────────────────────────────────────────────────────
export const menusAdminService = {
  list: () =>
    api
      .get<MenuAdmin[] | PaginatedResponse<MenuAdmin>>("/config/menus/")
      .then((r) => extractList(r.data)),
  get: (id: number) =>
    api.get<MenuAdmin>(`/config/menus/${id}/`).then((r) => r.data),
  create: (data: Partial<MenuAdmin>) =>
    api.post<MenuAdmin>("/config/menus/", data).then((r) => r.data),
  update: (id: number, data: Partial<MenuAdmin>) =>
    api.patch<MenuAdmin>(`/config/menus/${id}/`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/config/menus/${id}/`),
};

// ── Opciones ──────────────────────────────────────────────────────────────────
export const opcionesService = {
  list: () =>
    api
      .get<OpcionAdmin[] | PaginatedResponse<OpcionAdmin>>("/config/opciones/")
      .then((r) => extractList(r.data)),
  get: (id: number) =>
    api.get<OpcionAdmin>(`/config/opciones/${id}/`).then((r) => r.data),
  create: (data: Partial<OpcionAdmin>) =>
    api.post<OpcionAdmin>("/config/opciones/", data).then((r) => r.data),
  update: (id: number, data: Partial<OpcionAdmin>) =>
    api.patch<OpcionAdmin>(`/config/opciones/${id}/`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/config/opciones/${id}/`),
};

// ── Permisos ──────────────────────────────────────────────────────────────────
export const permisosService = {
  list: () =>
    api
      .get<
        PermisoAdmin[] | PaginatedResponse<PermisoAdmin>
      >("/config/permisos/")
      .then((r) => extractList(r.data)),
  get: (id: number) =>
    api.get<PermisoAdmin>(`/config/permisos/${id}/`).then((r) => r.data),
  create: (data: Partial<PermisoAdmin>) =>
    api.post<PermisoAdmin>("/config/permisos/", data).then((r) => r.data),
  update: (id: number, data: Partial<PermisoAdmin>) =>
    api
      .patch<PermisoAdmin>(`/config/permisos/${id}/`, data)
      .then((r) => r.data),
  remove: (id: number) => api.delete(`/config/permisos/${id}/`),
};
