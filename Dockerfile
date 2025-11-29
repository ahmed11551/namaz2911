# ===========================================
# Namaz2911 - Dockerfile для продакшена
# ===========================================

# Этап 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Установка зависимостей
COPY package*.json ./
COPY bun.lockb* ./
RUN npm ci --legacy-peer-deps

# Копирование исходного кода
COPY . .

# Переменные окружения для сборки
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Сборка приложения
RUN npm run build

# Этап 2: Nginx для продакшена
FROM nginx:alpine AS production

# Копирование конфигурации nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=builder /app/dist /usr/share/nginx/html

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

