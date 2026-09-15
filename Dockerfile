# ==========================================
# Fase 1: Compilación (Node 22)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias limpias
RUN npm ci

# Copiar el código fuente
COPY . .

# Argumento de compilación para la URL de la API (por defecto localhost:8000)
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Compilar la aplicación para producción (TypeScript + Vite)
RUN npm run build

# ==========================================
# Fase 2: Servidor Web Estático (Nginx Alpine)
# ==========================================
FROM nginx:alpine

LABEL maintainer="Equipo Sistemas Expertos"
LABEL description="Frontend Vite + React para Software Educativo de Sistemas Expertos"

# Eliminar configuración por defecto de Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto HTTP
EXPOSE 80

# Comando para mantener Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
