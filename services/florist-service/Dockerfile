# Production Dockerfile for Florist Service
FROM node:24-alpine

# Install build dependencies
RUN apk add --no-cache dumb-init python3 make g++ wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

WORKDIR /usr/src/app

# Copy root workspace config
COPY package.json package-lock.json tsconfig.base.json ./

# Copy shared package.json files (workspace deps for @montezuma/shared-services)
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-services/package.json ./packages/shared-services/
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY shared/package.json ./shared/

# Copy service package.json
COPY services/florist-service/package.json ./services/florist-service/

# Install ALL dependencies (root deps incl. knex/jsonwebtoken/multer/sharp + florist deps)
# Do NOT use `--omit=optional`: it prunes sharp's platform binaries
# (@img/sharp-linuxmusl-x64 / @img/sharp-libvips-linuxmusl-x64) on Alpine,
# causing "Could not load the sharp module using the linuxmusl-x64 runtime".
RUN npm config set fetch-timeout 1200000 && npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 120000 && npm config set fetch-retry-maxtimeout 600000 && NODE_OPTIONS=--max-old-space-size=2048 npm install --no-audit --no-fund

# Copy source code (packages + app-global are imported by the florist controller/auth middleware)
COPY packages/ ./packages/
COPY shared/ ./shared/
COPY services/app-global/ ./services/app-global/
COPY services/florist-service/ ./services/florist-service/

# Build shared packages (critical for TypeScript imports of centralizedUploadService)
RUN cd packages/shared-config && npm run build
RUN cd packages/shared-logger && npm run build
RUN cd packages/shared-services && npm run build
RUN cd packages/shared-utils && npm run build

# Install tsx for running TypeScript directly (server.ts + dynamic .ts imports)
RUN npm install -g tsx

RUN mkdir -p /usr/src/app/data /opt/storage/uploads && chown -R nodejs:nodejs /usr/src/app /opt/storage/uploads

USER nodejs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV FLORIST_PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["tsx", "services/florist-service/server.ts"]