import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Interceptor para agregar headers o logs si fuera necesario
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta con desempaquetado automático de { success, data } y manejo uniforme de errores
httpClient.interceptors.response.use(
  (response) => {
    // Si la respuesta de Django REST está envuelta en { success: boolean, data: ... }
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      'success' in response.data
    ) {
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error: AxiosError<{ detail?: string; error?: string; message?: string }>) => {
    let errorMessage = 'Ocurrió un error inesperado en la comunicación con el servidor.';
    
    if (error.response?.data) {
      errorMessage =
        error.response.data.detail ||
        error.response.data.error ||
        error.response.data.message ||
        errorMessage;
    } else if (error.request) {
      errorMessage = 'No se pudo conectar con el servidor Django. Verifica que el backend esté ejecutándose en ' + API_BASE_URL;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default httpClient;
