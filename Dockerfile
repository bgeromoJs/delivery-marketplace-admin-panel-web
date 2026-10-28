# syntax=docker/dockerfile:1

# ---- Dependências ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* é embutido no bundle em tempo de build, não em runtime.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runtime (output: standalone) ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Heap do Node limitado a 192 MB. O V8 reserva ~192 MB além desse valor (young
# generation, code space), então o teto real do heap fica em ~384 MB — abaixo do
# mem_limit de 448 MB no docker-compose.yml, para o V8 falhar antes do Docker.
ENV NODE_OPTIONS="--max-old-space-size=192"

CMD ["node", "server.js"]
