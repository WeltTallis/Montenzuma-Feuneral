# Production Dockerfile for Leave Service
FROM node:24-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /usr/src/app

COPY package.json tsconfig.base.json ./
COPY packages/shared-utils/package.json ./packages/shared-utils/
COPY packages/shared-config/package.json ./packages/shared-config/
COPY packages/shared-logger/package.json ./packages/shared-logger/
COPY packages/shared-services/package.json ./packages/shared-services/
COPY services/leave-service/package.json ./services/leave-service/

RUN npm config set fetch-timeout 1200000 && npm config set fetch-retries 5 && npm config set fetch-retry-mintimeout 120000 && npm config set fetch-retry-maxtimeout 600000 && NODE_OPTIONS=--max-old-space-size=2048 npm install --no-audit --no-fund --legacy-peer-deps && npm cache clean --force

COPY packages/ ./packages/
COPY shared/ ./shared/
COPY services/app-global/ ./services/app-global/

COPY services/leave-service/ ./services/leave-service/

RUN mkdir -p /usr/src/app/data && chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
# server.ts does not exist — this is a plain-JS service (package.json main: server.js).
# Running `npx tsx server.ts` caused ERR_MODULE_NOT_FOUND on every start.
CMD ["node", "services/leave-service/server.js"]

