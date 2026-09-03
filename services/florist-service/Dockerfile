# Production Dockerfile for Florist Service
FROM node:24-alpine

# Install build dependencies
RUN apk add --no-cache dumb-init python3 make g++ wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

WORKDIR /usr/src/app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy service package.json
COPY services/florist-service/package.json ./services/florist-service/

# Install ALL dependencies (root deps incl. knex/jsonwebtoken + florist deps)
RUN npm config set fetch-timeout 1200000 && npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 120000 && npm config set fetch-retry-maxtimeout 600000 && NODE_OPTIONS=--max-old-space-size=2048 npm install --no-audit --no-fund --omit=optional

# GUARD: the florist service hard-requires mysql2 + knex (migrations) + express.
# Fail the build here instead of shipping a broken image.
RUN cd services/florist-service && node -e "require('mysql2'); require('knex'); require('express'); require('jsonwebtoken'); console.log('[GUARD] mysql2 + knex + express + jsonwebtoken OK')"

# Copy source code (app-global is imported by the florist auth middleware)
COPY services/app-global/ ./services/app-global/
COPY services/florist-service/ ./services/florist-service/

# Install tsx for running TypeScript directly (server.ts + dynamic .ts imports)
RUN npm install -g tsx

RUN mkdir -p /usr/src/app/data && chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV FLORIST_PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["tsx", "services/florist-service/server.ts"]