


# Stage 1/4 — deps: full dependency tree (incl. dev) just for building

FROM node:24-alpine AS deps
WORKDIR /usr/src/app
# Do NOT use --omit=optional anywhere: it prunes sharp's platform binaries
# (@img/sharp-linuxmusl-x64 / @img/sharp-libvips-linuxmusl-x64) on Alpine.
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-services/package.json ./packages/shared-services/
COPY shared/package.json ./shared/
COPY services/hearse-service/package.json ./services/hearse-service/

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
COPY services/hearse-service/ ./services/hearse-service/

# Build shared packages in dependency order (shared-config → shared-logger →
# shared-utils → shared-services → shared-stamps). Only THIS stage needs the
# dev toolchain (typescript); it is never shipped.
RUN cd packages/shared-config && npm run build && cd ../.. && \
    cd packages/shared-logger && npm run build && cd ../.. && \
    cd packages/shared-utils && npm run build && cd ../.. && \
    cd packages/shared-services && npm run build && cd ../..


# Stage 3/4 — prod-deps: production-only node_modules (--omit=dev)

FROM node:24-alpine AS prod-deps
WORKDIR /usr/src/app
ENV NODE_OPTIONS=--max-old-space-size=2048
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-services/package.json ./packages/shared-services/
COPY shared/package.json ./shared/
COPY services/hearse-service/package.json ./services/hearse-service/


RUN npm config set fetch-timeout 1200000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 120000 \
 && npm config set fetch-retry-maxtimeout 600000 && npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

RUN node -e "const p=require('./services/hearse-service/package.json'); for(const d of Object.keys(p.dependencies||{}).filter(d=>!d.startsWith('@montezuma/'))) require.resolve(d,{paths:[process.cwd()+'/services/hearse-service']}); console.log('[GUARD] hearse-service production dependencies OK')"

# Stage 4/4 — runtime: final image

FROM node:24-alpine AS runtime

RUN apk add --no-cache dumb-init wget \
 && addgroup -g 1001 -S nodejs \
 && adduser -S nodejs -u 1001

# tsx runs the TypeScript entry directly (same as the legacy images).
RUN npm install -g tsx --no-audit --no-fund

WORKDIR /usr/src/app

# Production-only dependency tree (dev toolchain excluded by --omit=dev)
COPY --from=prod-deps --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /usr/src/app/services/ ./services/
# Shared packages incl. their built dist/ (relative @montezuma/* symlinks
# inside node_modules resolve against this path)
COPY --from=build --chown=nodejs:nodejs /usr/src/app/packages ./packages
# Runtime sources: TS files executed by tsx + JS services + shared modules
COPY --chown=nodejs:nodejs tsconfig.base.json ./
COPY --chown=nodejs:nodejs shared/ ./shared/
COPY --chown=nodejs:nodejs services/app-global/ ./services/app-global/
COPY --chown=nodejs:nodejs services/configurations/ ./configurations/
COPY --chown=nodejs:nodejs services/hearse-service/ ./services/hearse-service/

# Writable runtime dirs (empty — tiny layer; uploads/data are bind-mounted
# over these in compose). Ownership via chown on EMPTY dirs: never chown -R
# over copied content, that duplicates the whole layer.
RUN mkdir -p /usr/src/app/services/hearse-service/uploads \
 && chown -R nodejs:nodejs /usr/src/app/services/hearse-service/uploads

USER nodejs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
# NOTE: the entrypoint is server.js but the source is server.ts. This is correct:
# tsx resolves a missing .js entrypoint to the sibling .ts, which the production
# logs confirm (the require stack shows bookHerse.ts / hearseRoutes.ts / server.ts).
CMD ["tsx","services/hearse-service/server.js"]
