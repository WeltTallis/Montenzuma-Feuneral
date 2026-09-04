# RestPoint Mini Store Service
# Self-contained inventory + stock module. Persists to MariaDB
# (mini_store_items / mini_store_transactions in the operations DB).
#
# NOTE: the source uses `.ts` import specifiers (ESM + TypeScript), so we run
# it with `tsx` from the *source* (like hearse/florist do) instead of a
# tsc build — this avoids the "./routes/storeRoutes.ts" resolution problem
# that would break `node dist/server.js`.
FROM node:24-alpine

# Build/runtime tooling (mysql2 + tsx need python3/make/g++ on alpine)
RUN apk add --no-cache dumb-init python3 make g++ wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

WORKDIR /usr/src/app/services/store-service

# Install ONLY the store service's dependencies (it has no workspace/shared
# package dependencies — express, knex, mysql2, cors, dotenv + tsx dev tooling)
COPY services/store-service/package.json ./
RUN npm config set fetch-timeout 1200000 && \
  npm config set fetch-retries 5 && \
  NODE_OPTIONS=--max-old-space-size=1536 npm install --no-audit --no-fund

# Copy the full service source (server, controllers, routes, models, migrations)
COPY services/store-service/ ./

RUN chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npx", "--no-install", "tsx", "server.ts"]
