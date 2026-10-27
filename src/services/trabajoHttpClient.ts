import type { AxiosRequestConfig } from 'axios';
import httpClient from './httpClient';

export function rutaTrabajo(url: string, pathname = typeof window !== 'undefined' ? window.location.pathname : ''): string {
  const actividad = pathname.match(/^\/actividades\/resolver\/([^/]+)(?:\/|$)/)?.[1];
  const esRecursoTrabajo = /^\/(sistemas-expertos\/[^/]+|bases-conocimiento\/[^/]+|hechos\/[^/]+|variables\/[^/]+|reglas\/[^/]+|condiciones\/[^/]+|conclusiones\/[^/]+|nodos\/[^/]+|conexiones\/[^/]+|inferencias(?:\/|$)|simulaciones\/[^/]+|ejecuciones\/[^/]+|validaciones\/[^/]+|historial-inferencias(?:\/|$))/.test(url);
  return actividad && esRecursoTrabajo ? `/asignaciones/${actividad}/trabajo${url}` : url;
}

// Capturar el contexto al realizar la llamada evita que una petición pendiente
// cambie de actividad cuando el usuario navega a otra pantalla.
const trabajoHttpClient = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig) { return config === undefined ? httpClient.get<T>(rutaTrabajo(url)) : httpClient.get<T>(rutaTrabajo(url), config); },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) { return config === undefined ? httpClient.post<T>(rutaTrabajo(url), data) : httpClient.post<T>(rutaTrabajo(url), data, config); },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) { return config === undefined ? httpClient.put<T>(rutaTrabajo(url), data) : httpClient.put<T>(rutaTrabajo(url), data, config); },
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) { return config === undefined ? httpClient.patch<T>(rutaTrabajo(url), data) : httpClient.patch<T>(rutaTrabajo(url), data, config); },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig) { return config === undefined ? httpClient.delete<T>(rutaTrabajo(url)) : httpClient.delete<T>(rutaTrabajo(url), config); },
};
export default trabajoHttpClient;
