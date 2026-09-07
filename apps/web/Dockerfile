# Stage 1: Build
FROM node:24-bookworm-slim AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

WORKDIR /app

# Accept build arg and expose to Vite
ARG VITE_BASE_URL
ARG VITE_BACKEND_API_URL
ARG VITE_MAP_TILE_URL

ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_BACKEND_API_URL=$VITE_BACKEND_API_URL
ENV VITE_MAP_TILE_URL=$VITE_MAP_TILE_URL

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY packages/eslint-config/package.json ./packages/eslint-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

WORKDIR /app/apps/web
RUN pnpm build

# Stage 2: Serve with nginx
FROM nginx:stable
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]