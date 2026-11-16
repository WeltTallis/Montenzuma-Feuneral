# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /usr/src/app
# Do NOT use --omit=optional anywhere: it prunes sharp's 
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-services/package.json ./packages/shared-services/
COPY shared/package.json ./shared/
COPY services/bodycheckout-service/package.json ./services/bodycheckout-service/

RUN npm config set fetch-timeout 1200000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 120000 \
 && npm config set fetch-retry-maxtimeout 600000 && npm install --legacy-peer-deps --no-audit --no-fund

# Stage 2/4 — build: compile shared package dists (discarded afterwards)

FROM deps AS build
COPY services/configurations/ ./configurations/
COPY packages/ ./packages/
COPY shared/ ./shared/
COPY services/app-global/ ./services/app-global/
COPY services/bodycheckout-service/ ./services/bodycheckout-service/

# Build shared packages in dependency order 
RUN cd packages/shared-config && npm run build && cd ../.. && \
    cd packages/shared-logger && npm run build && cd ../.. && \
    cd packages/shared-utils && npm run build && cd ../.. && \
    cd packages/shared-services && npm run build && cd ../..


# Stage 3/4 — prod-deps: production-only node_modules (--omit=dev)
# 
FROM node:24-alpine AS prod-deps
WORKDIR /usr/src/app
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-services/package.json ./packages/shared-services/
COPY shared/package.json ./shared/
COPY services/bodycheckout-service/package.json ./services/bodycheckout-service/


RUN npm config set fetch-timeout 1200000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 120000 \
 && npm config set fetch-retry-maxtimeout 600000 && npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

RUN node -e "const p=require('./services/bodycheckout-service/package.json'); for(const d of Object.keys(p.dependencies||{}).filter(d=>!d.startsWith('@montezuma/'))) require.resolve(d,{paths:[process.cwd()+'/services/bodycheckout-service']}); console.log('[GUARD] bodycheckout-service production dependencies OK')"


# Stage 4/4 — runtime: final image

FROM node:24-alpine AS runtime

RUN apk add --no-cache dumb-init wget \
 && addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001

# tsx runs the TypeScript entry directly (same as the legacy images).
RUN npm install -g tsx --no-audit --no-fund

WORKDIR /usr/src/app

# Production-only dependency 
COPY --from=prod-deps --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /usr/src/app/services/ ./services/
# Shared packages 
COPY --from=build --chown=nodejs:nodejs /usr/src/app/packages ./packages
# Runtime sources
COPY --chown=nodejs:nodejs tsconfig.base.json ./
COPY --chown=nodejs:nodejs shared/ ./shared/
COPY --chown=nodejs:nodejs services/app-global/ ./services/app-global/
COPY --chown=nodejs:nodejs services/configurations/ ./configurations/
COPY --chown=nodejs:nodejs services/bodycheckout-service/ ./services/bodycheckout-service/

# Writable runtime dirs
RUN mkdir -p /usr/src/app/data \
 && chown -R nodejs:nodejs /usr/src/app/data

USER nodejs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["tsx","services/bodycheckout-service/server.ts"]
