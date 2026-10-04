# ============================================================
# RestPoint Docker Makefile — Production Build System
# ============================================================

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# OOM-safe: serial builds keep only one npm install running at a time.
# Override on bigger machines:  make up PARALLEL=4
PARALLEL ?= 1
export COMPOSE_PARALLEL_LIMIT := $(PARALLEL)
export NODE_OPTIONS := --max-old-space-size=2048

# ------------------------------------------------------------
# Compose commands
# ------------------------------------------------------------
COMPOSE      := docker compose
COMPOSE_PROD := docker compose -f docker-compose.prod.yml

# Build-service list — DERIVED from the compose files' `build:` blocks by
# scripts/list-build-services.sh.
#
# POSIX sh + awk on purpose: the production host runs Docker on a plain Debian
# VPS with NO Node.js installed. Shelling out to `node` here broke every target:
#     /bin/sh: 1: node: not found
#     make: *** [Makefile:454: validate] Error 127
#
# The list used to be hand-maintained, and it drifted: florist-service exists in
# BOTH compose files but was never added, so every build target silently skipped
# it and the later `up --no-build` died with:
#   Error response from daemon: No such image: restpoint-florist-service:latest
# Deriving the list makes a newly added compose service impossible to forget.
#
# Override to build a subset, e.g.
#   make build RAW_BUILD_SERVICES="api-gateway frontend"
ALL_BUILD_SERVICES_DEV  := $(shell sh scripts/list-build-services.sh 2>/dev/null)
ALL_BUILD_SERVICES_PROD := $(shell sh scripts/list-build-services.sh docker-compose.prod.yml 2>/dev/null)

# Union of both compose files; $(sort) de-duplicates.
RAW_BUILD_SERVICES ?= $(sort $(ALL_BUILD_SERVICES_DEV) $(ALL_BUILD_SERVICES_PROD))

# For the DEV compose file (docker-compose.yml) — used by build/build-fast/up/...
BUILD_SERVICES := $(filter $(RAW_BUILD_SERVICES),$(ALL_BUILD_SERVICES_DEV))

# For the PROD compose file (docker-compose.prod.yml) — used by deploy-prod
BUILD_SERVICES_PROD := $(filter $(RAW_BUILD_SERVICES),$(ALL_BUILD_SERVICES_PROD))

# Colors for output
BLUE   := \033[0;34m
GREEN  := \033[0;32m
RED    := \033[0;31m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
NC     := \033[0m # No Color

# ------------------------------------------------------------
# Service-list guards
#
# An empty derived list turns every build loop into a no-op that still prints
# "✓ Build complete" — that is how broken/unbuilt images silently reached
# production before. Wire these in as prerequisites so the failure is loud.
#
# The list itself is captured with `2>/dev/null` so a transient compose error
# does not spam stderr on every `make help`. But that ALSO means the real
# reason is thrown away, and the guard used to report only "No buildable
# services" — which is true but useless: it is indistinguishable from a broken
# compose file, a missing Dockerfile, a missing .env.production, or Docker not
# being installed at all. So on failure we re-run the detector WITH stderr and
# print whatever compose actually said.
# ------------------------------------------------------------
check-build-list:
	@if [ -z "$(strip $(BUILD_SERVICES))" ]; then \
		echo "$(RED)✗ No buildable services found in docker-compose.yml$(NC)"; \
		echo "$(YELLOW)  Underlying error from the compose file:$(NC)"; \
		sh scripts/list-build-services.sh 2>&1 1>/dev/null | sed 's/^/    /'; \
		echo "$(YELLOW)  Diagnose with: sh scripts/list-build-services.sh$(NC)"; \
		exit 1; \
	fi

check-build-list-prod:
	@if [ -z "$(strip $(BUILD_SERVICES_PROD))" ]; then \
		echo "$(RED)✗ No buildable services found in docker-compose.prod.yml$(NC)"; \
		echo "$(YELLOW)  Underlying error from the compose file:$(NC)"; \
		sh scripts/list-build-services.sh docker-compose.prod.yml 2>&1 1>/dev/null | sed 's/^/    /'; \
		echo "$(YELLOW)  Diagnose with: sh scripts/list-build-services.sh docker-compose.prod.yml$(NC)"; \
		exit 1; \
	fi

# Default target
.DEFAULT_GOAL := help

help:
	@echo "$(BLUE)RestPoint Docker Makefile — Production Build System$(NC)"
	@echo ""
	@echo "$(GREEN)── Build (serial / OOM-safe) ──────────────────────────────$(NC)"
	@echo "  make build                - Build all images (with cache)"
	@echo "  make build-fast           - Build all images with BuildKit (serial, cached)"
	@echo "  make build-no-cache       - Rebuild all images from scratch (sequential)"
	@echo "  make build-no-cache-fast  - Rebuild all images from scratch (serial, BuildKit)"
	@echo "  make build-service SVC=X  - Build specific service (no cache)"
	@echo "  make build-service-fast SVC=X - Build specific service with BuildKit"
	@echo "  make build-all            - Build all services with no cache"
	@echo "  make build-all-fast       - Build all services with no cache (serial)"
	@echo "  make build-optimized      - Build all with cache optimizations"
	@echo "  make clear-cache          - Clear Docker build cache"
	@echo "  make rebuild-fast         - Clear cache + rebuild all (ULTRA FAST)"
	@echo "  make rebuild-slim         - Rebuild the previously oversized services, then reclaim old layers"
	@echo "  make rebuild-slim-prod    - Same slim rebuild using docker-compose.prod.yml"
	@echo ""
	@echo "$(GREEN)── Lifecycle ───────────────────────────────────────────$(NC)"
	@echo "  make up                   - Start all services (dev, build + up)"
	@echo "  make up-force             - Force recreate all containers"
	@echo "  make down                 - Stop and remove all services"
	@echo "  make restart              - Restart all services"
	@echo "  make start                - Start services without building"
	@echo "  make stop                 - Stop services (keep containers)"
	@echo "  make kill                 - Kill all containers immediately"
	@echo ""
	@echo "$(GREEN)── Logs / Status / Access ──────────────────────────────$(NC)"
	@echo "  make logs                 - Show all logs"
	@echo "  make logs-service SVC=X   - Show logs for service"
	@echo "  make health               - Check all services"
	@echo "  make ps                   - List running containers"
	@echo "  make ps-all               - List all containers (including stopped)"
	@echo "  make stats                - Docker resource usage"
	@echo "  make shell SVC=X          - Shell into service"
	@echo "  make exec SVC=X CMD='cmd' - Execute command"
	@echo ""
	@echo "$(GREEN)── Production Deployment ─────────────────────────$(NC)"
	@echo "  make deploy-prod          - Deploy to production (docker-compose.prod.yml)"
	@echo "  make deploy-staging       - Deploy to staging"
	@echo "  make prod-up              - Start production services (requires built images)"
	@echo "  make prod-build           - Build all production images (without starting)"
	@echo "  make prod-down            - Stop production services"
	@echo "  make prod-logs            - Production logs"
	@echo "  make prod-health          - Production health check"
	@echo "  make prod-doctor          - Diagnose why a service will not start"
	@echo "  make fix-db-healthcheck   - Repair MariaDB healthcheck user (access denied)"
	@echo ""
	@echo "$(GREEN)── Frontend ────────────────────────────────────────────$(NC)"
	@echo "  make fix-frontend         - Rebuild ONLY the UI from scratch (no cache)"
	@echo "  make prod-ui-up           - Start ONLY the prod UI, ignoring all backend deps"
	@echo ""
	@echo "$(GREEN)── Maintenance ─────────────────────────────────────────$(NC)"
	@echo "  make clean                - Remove containers & volumes (DESTRUCTIVE)"
	@echo "  make validate             - Validate docker-compose files"
	@echo "  make prune                - Remove unused resources"
	@echo "  make fix-tenant           - Rebuild & restart tenant-service"
	@echo "  make fix-gateway          - Rebuild & restart api-gateway"
	@echo ""

# ============================================================
# BUILD TARGETS
# ============================================================

# Standard build (with cache) — builds ONE image at a time (OOM-safe)
build: check-build-list
	@echo "$(BLUE)Building all Docker images (serial, 1 at a time)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build $$svc; done
	@echo "$(GREEN)✓ Build complete$(NC)"

# FAST build with BuildKit (cached) — still serial to avoid OOM
build-fast: check-build-list
	@echo "$(BLUE)Building all images with BuildKit (serial, 1 at a time)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; DOCKER_BUILDKIT=1 $(COMPOSE) build $$svc; done
	@echo "$(GREEN)✓ Fast build complete$(NC)"

# Standard no-cache build
build-no-cache: check-build-list
	@echo "$(BLUE)Rebuilding all images from scratch (serial)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build --no-cache $$svc; done
	@echo "$(GREEN)✓ Build complete$(NC)"

# FAST no-cache build with BuildKit — still serial to avoid OOM
build-no-cache-fast: check-build-list
	@echo "$(BLUE)Rebuilding all images from scratch with BuildKit (serial)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; DOCKER_BUILDKIT=1 $(COMPOSE) build --no-cache $$svc; done
	@echo "$(GREEN)✓ Fast build complete$(NC)"

# Build all services
build-all: check-build-list
	@echo "$(BLUE)Building all services with no cache (serial)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build --no-cache $$svc; done
	@echo "$(GREEN)✓ Build complete$(NC)"

# Build all services FAST (cached, serial)
build-all-fast: check-build-list
	@echo "$(BLUE)Building ALL services with BuildKit (serial)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; DOCKER_BUILDKIT=1 $(COMPOSE) build --no-cache $$svc; done
	@echo "$(GREEN)✓ All services built$(NC)"

# Build specific service (standard)
build-service:
	@if [ -z "$(SVC)" ]; then \
		echo "$(RED)Error: SVC not specified. Usage: make build-service SVC=service-name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Building $(SVC)...$(NC)"
	@$(COMPOSE) build --no-cache $(SVC)
	@echo "$(GREEN)✓ $(SVC) built successfully$(NC)"

# Build specific service FAST (with BuildKit)
build-service-fast:
	@if [ -z "$(SVC)" ]; then \
		echo "$(RED)Error: SVC not specified. Usage: make build-service-fast SVC=service-name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Building $(SVC) with BuildKit...$(NC)"
	@DOCKER_BUILDKIT=1 $(COMPOSE) build --no-cache $(SVC)
	@echo "$(GREEN)✓ $(SVC) built successfully$(NC)"

# Rebuild services that historically carried the old 2–3GB single-stage image.
# The generated Dockerfiles are already multi-stage; rebuilding replaces the
# tagged images, while the cleanup removes only layers no container references.
rebuild-slim:
	@echo "$(BLUE)Rebuilding oversized services with the generated slim Dockerfiles...$(NC)"
	@set -e; for svc in florist-service leave-service hearse-service workshop-service; do echo "  -> building $$svc"; DOCKER_BUILDKIT=1 $(COMPOSE) build --no-cache $$svc; done
	@set -e; for svc in florist-service leave-service hearse-service workshop-service; do echo "  -> restarting $$svc"; $(COMPOSE) up -d --no-deps $$svc; done
	@echo "$(BLUE)Removing unused old image layers and build cache...$(NC)"
	@if [ -f scripts/docker-cleanup.mjs ] && command -v node >/dev/null 2>&1; then \
		node scripts/docker-cleanup.mjs --apply; \
	else \
		echo "$(YELLOW)  skipped layer reclamation (needs node + scripts/docker-cleanup.mjs)$(NC)"; \
	fi
	@echo "$(GREEN)✓ Slim rebuild and safe reclamation complete$(NC)"

rebuild-slim-prod:
	@echo "$(BLUE)Rebuilding oversized production services with slim images...$(NC)"
	@set -e; for svc in florist-service leave-service hearse-service workshop-service; do echo "  -> building $$svc"; DOCKER_BUILDKIT=1 $(COMPOSE_PROD) build --no-cache $$svc; done
	@set -e; for svc in florist-service leave-service hearse-service workshop-service; do echo "  -> restarting $$svc"; $(COMPOSE_PROD) up -d --no-deps $$svc; done
	@echo "$(BLUE)Removing unused old production layers and build cache...$(NC)"
	@if [ -f scripts/docker-cleanup.mjs ] && command -v node >/dev/null 2>&1; then \
		node scripts/docker-cleanup.mjs --apply; \
	else \
		echo "$(YELLOW)  skipped layer reclamation (needs node + scripts/docker-cleanup.mjs)$(NC)"; \
	fi
	@echo "$(GREEN)✓ Production slim rebuild and safe reclamation complete$(NC)"

# Build with cache optimizations
build-optimized: check-build-list
	@echo "$(BLUE)Building with cache optimizations (serial)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build --build-arg BUILDKIT_INLINE_CACHE=1 $$svc; done
	@echo "$(GREEN)✓ Optimized build complete$(NC)"

# Clear Docker build cache
clear-cache:
	@echo "$(YELLOW)Clearing Docker build cache...$(NC)"
	@docker builder prune -f
	@docker buildx prune -f 2>/dev/null || true
	@echo "$(GREEN)✓ Cache cleared$(NC)"

# ULTRA FAST - Full rebuild with cache clear
rebuild-fast: clear-cache build-no-cache-fast up
	@echo "$(GREEN)✓ Fast rebuild complete$(NC)"

# ============================================================
# STARTUP TARGETS
# ============================================================

up: validate check-build-list
	@echo "$(BLUE)Stopping old containers and starting fresh...$(NC)"
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true
	@echo "$(BLUE)Building images (serial, 1 at a time)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build $$svc; done
	@echo "$(BLUE)Starting all services...$(NC)"
	@$(COMPOSE) up -d --no-build --remove-orphans
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "Waiting for services to be healthy..."
	@sleep 30
	@make health

up-force: check-build-list
	@echo "$(BLUE)Force recreating all containers...$(NC)"
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build $$svc; done
	@$(COMPOSE) up -d --no-build --remove-orphans --force-recreate
	@echo "$(GREEN)✓ Services recreated$(NC)"
	@sleep 30
	@make health

down:
	@echo "$(BLUE)Stopping all services...$(NC)"
	@$(COMPOSE) down --remove-orphans
	@echo "$(GREEN)✓ Services stopped$(NC)"

restart:
	@echo "$(BLUE)Restarting all services...$(NC)"
	@$(COMPOSE) down --remove-orphans
	@echo "$(BLUE)Starting fresh...$(NC)"
	@$(COMPOSE) up -d --no-build --remove-orphans
	@echo "$(GREEN)✓ Services restarted$(NC)"

# Start services WITHOUT building anything (images must already exist).
# Use this when you just want everything running — no builds, no rebuilds.
start:
	@echo "$(BLUE)Starting all services (no build)...$(NC)"
	@$(COMPOSE) up -d --no-build --remove-orphans
	@echo "$(GREEN)✓ Services started$(NC)"

stop:
	@echo "$(BLUE)Stopping services (keeping containers)...$(NC)"
	@$(COMPOSE) stop
	@echo "$(GREEN)✓ Services stopped$(NC)"

kill:
	@echo "$(RED)Killing all containers immediately...$(NC)"
	@$(COMPOSE) kill
	@echo "$(RED)✓ All containers killed$(NC)"

# ============================================================
# CLEANUP TARGETS
# ============================================================

clean: kill
	@echo "$(RED)WARNING: This will remove all containers, networks, and volumes!$(NC)"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(RED)Cleaning up...$(NC)"; \
		$(COMPOSE) down -v; \
		docker system prune -f; \
		echo "$(RED)✓ Cleanup complete$(NC)"; \
	else \
		echo "Cancelled."; \
	fi

clean-full:
	@echo "$(RED)WARNING: This will remove ALL containers, volumes, networks, and images!$(NC)"
	@read -p "Type 'yes' to confirm: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "$(RED)Cleaning up everything...$(NC)"; \
		$(COMPOSE) down -v --rmi all; \
		docker system prune -a -f; \
		echo "$(RED)✓ Complete cleanup done$(NC)"; \
	else \
		echo "Cancelled."; \
	fi

# ============================================================
# MONITORING TARGETS
# ============================================================

logs:
	@$(COMPOSE) logs -f --tail=100

logs-service:
	@if [ -z "$(SVC)" ]; then \
		echo "$(RED)Error: SVC not specified. Usage: make logs-service SVC=service-name$(NC)"; \
		exit 1; \
	fi
	@$(COMPOSE) logs -f --tail=100 $(SVC)

health:
	@echo "$(BLUE)Checking service health...$(NC)"
	@if [ -f ./scripts/02-health-check.sh ]; then \
		./scripts/02-health-check.sh || true; \
	else \
		echo "$(YELLOW)Health check script not found, checking with curl...$(NC)"; \
		curl -s http://localhost:5000/health || echo "$(RED)Gateway not healthy$(NC)"; \
		curl -s http://localhost:5002/health || echo "$(RED)Tenant service not healthy$(NC)"; \
	fi

ps:
	@echo "$(BLUE)Running containers:$(NC)"
	@$(COMPOSE) ps

ps-all:
	@echo "$(BLUE)All containers (including stopped):$(NC)"
	@docker ps -a | grep restpoint

# ============================================================
# SHELL ACCESS
# ============================================================

shell:
	@if [ -z "$(SVC)" ]; then \
		echo "$(RED)Error: SVC not specified. Usage: make shell SVC=service-name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Opening shell in $(SVC)...$(NC)"
	@$(COMPOSE) exec $(SVC) sh

exec:
	@if [ -z "$(SVC)" ] || [ -z "$(CMD)" ]; then \
		echo "$(RED)Error: Usage: make exec SVC=service-name CMD='your-command'$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Executing in $(SVC): $(CMD)$(NC)"
	@$(COMPOSE) exec $(SVC) sh -c "$(CMD)"

# ============================================================
# ENVIRONMENT SETUP
# ============================================================

dev:
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env from .env.example...$(NC)"; \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
		else \
			echo "$(YELLOW)Creating default .env file...$(NC)"; \
			echo "# RestPoint Environment Variables" > .env; \
			echo "DB_ROOT_PASSWORD=RestPoint2024!" >> .env; \
			echo "DB_NAME=restpoint_main" >> .env; \
			echo "DB_USER=restpoint_user" >> .env; \
			echo "DB_PASSWORD=RestPointUser2024" >> .env; \
			echo "JWT_SECRET=your-super-secret-jwt-key-change-this" >> .env; \
			echo "JWT_REFRESH_SECRET=your-refresh-secret-change-this" >> .env; \
			echo "RABBITMQ_USER=guest" >> .env; \
			echo "RABBITMQ_PASSWORD=guest" >> .env; \
			echo "REDIS_PASSWORD=" >> .env; \
			echo "CORS_ORIGIN=http://localhost:3000,http://localhost:5000,http://localhost:8080" >> .env; \
		fi; \
	fi
	@echo "$(GREEN)✓ Development environment ready$(NC)"
	@make build-fast

# ============================================================
# PRODUCTION TARGETS
# ============================================================

prod:
	@echo "$(BLUE)Setting up production environment...$(NC)"
	@if [ ! -f .env.prod ]; then \
		echo "$(RED)Error: .env.prod not found!$(NC)"; \
		exit 1; \
	fi
	@cp .env.prod .env
	@echo "$(GREEN)✓ Production environment configured$(NC)"
	@make build-no-cache-fast

deploy-prod: validate check-build-list-prod
	@echo "$(BLUE)Deploying to PRODUCTION...$(NC)"
	@if [ ! -f .env.production ]; then \
		echo "$(RED)Error: .env.production not found!$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Configuring production environment...$(NC)"
	@cp .env.production .env
	@echo "$(BLUE)Building production images...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES_PROD); do echo "  -> building $$svc"; $(COMPOSE_PROD) build --no-cache $$svc; done
	@echo "$(GREEN)✓ Production build complete$(NC)"
	@echo "$(BLUE)Starting production services...$(NC)"
	@$(COMPOSE_PROD) up -d --no-build
	@echo "$(GREEN)✓ Production deployment complete$(NC)"
	@echo "Waiting 30s for services to stabilize..."
	@sleep 30
	@$(COMPOSE_PROD) ps

deploy-staging: check-build-list
	@echo "$(BLUE)Deploying to STAGING...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build $$svc; done
	@$(COMPOSE) up -d --no-build
	@echo "$(GREEN)✓ Staging deployment complete$(NC)"

# Fail early with an actionable message when an image a service depends on was
# never built. Without this, `up -d --no-build` only surfaces Docker's opaque
# "No such image: restpoint-<svc>:latest" AFTER it has already created every
# volume and network.
check-prod-images:
	@missing=""; \
	for img in $$(sh scripts/list-build-services.sh docker-compose.prod.yml image-list); do \
		docker image inspect "$$img" >/dev/null 2>&1 || missing="$$missing $$img"; \
	done; \
	if [ -n "$$missing" ]; then \
		echo "$(RED)✗ Missing production image(s):$$missing$(NC)"; \
		echo "$(YELLOW)  They must be built before 'prod-up' can use --no-build.$(NC)"; \
		echo "$(YELLOW)  Fix with:  make prod-build   (or 'make deploy-prod' to build + start)$(NC)"; \
		exit 1; \
	fi; \
	echo "$(GREEN)✓ All production images present$(NC)"

# Build every production image (serial, OOM-safe), without starting anything.
prod-build: check-build-list-prod
	@echo "$(BLUE)Building production images (serial, 1 at a time)...$(NC)"
	@set -e; for svc in $(BUILD_SERVICES_PROD); do echo "  -> building $$svc"; $(COMPOSE_PROD) build $$svc; done
	@echo "$(GREEN)✓ Production build complete$(NC)"

# `up -d` ABORTS the moment any `condition: service_healthy` dependency is not
# satisfied, which used to leave the box with NO services started at all — one
# unhealthy database probe took down the entire deployment, including the UI that
# had nothing to do with the database. Starting in two phases fixes that:
#
#   1. infra (mariadb/redis/rabbitmq) — `up -d` here is still all-or-nothing, but
#      these three have no service_healthy dependents to wait on, so it cannot
#      cascade.
#   2. everything else — with infra already running, Compose evaluates the
#      health conditions against live containers instead of starting from zero.
#
# `--wait` is deliberately NOT used: it would reintroduce the same all-or-nothing
# abort on any service that fails to reach `healthy`.
# A `service_healthy` dependency that never becomes healthy makes `up -d` sit at
# "Container ... Waiting" until the CLI gives up — and because Compose resolves
# dependencies before starting dependents, that hang blocks the UI too, even
# though the SPA needs none of it. So the UI is started FIRST, on its own, with
# `--no-deps`, and the rest of the stack is brought up afterwards. nginx serves
# index.html immediately and the SPA's own API calls simply fail until the
# backend is back, which is the behaviour we want.
prod-up: validate check-build-list-prod check-prod-images
	@echo "$(BLUE)Phase 1/3: starting the UI (independent of the backend)...$(NC)"
	@$(COMPOSE_PROD) up -d --no-build --no-deps frontend
	@echo "$(BLUE)Phase 2/3: starting infrastructure...$(NC)"
	@$(COMPOSE_PROD) up -d --no-build mariadb redis rabbitmq
	@echo "$(BLUE)Phase 3/3: starting application services...$(NC)"
	@$(COMPOSE_PROD) up -d --no-build || \
		echo "$(YELLOW)⚠ Some services did not start. The UI is already up — run 'make prod-doctor'.$(NC)"
	@echo "$(GREEN)✓ Production services started$(NC)"
	@sleep 30
	@$(COMPOSE_PROD) ps

prod-down:
	@echo "$(BLUE)Stopping production services...$(NC)"
	@$(COMPOSE_PROD) down
	@echo "$(GREEN)✓ Production services stopped$(NC)"

prod-logs:
	@$(COMPOSE_PROD) logs -f --tail=100

# -----------------------------------------------------------------------------
# DIAGNOSIS
# -----------------------------------------------------------------------------
# `make prod-up` failing with
#     dependency failed to start: container restpoint_mariadb is unhealthy
# says nothing about WHY. This target prints the actual health-check output
# (the real error), the live connection usage, and the containers that are
# restarting, so the cause is identified in one command instead of guessed at.
prod-doctor:
	@echo "$(BLUE)=== Container status ===$(NC)"
	@$(COMPOSE_PROD) ps -a --format 'table {{.Name}}\t{{.Status}}' 2>/dev/null || docker ps -a --format 'table {{.Names}}\t{{.Status}}'
	@echo ""
	@echo "$(BLUE)=== MariaDB health-check output (the real error) ===$(NC)"
	@docker inspect --format '{{range .State.Health.Log}}{{.ExitCode}}: {{.Output}}{{end}}' restpoint_mariadb 2>/dev/null | tail -n 20 || echo "$(YELLOW)No health log — is the container running?$(NC)"
	@echo ""
	@echo "$(BLUE)=== MariaDB connection usage vs limit ===$(NC)"
	@echo "$(YELLOW)If Max_used_connections approaches max_connections, the limit is the cause.$(NC)"
	@echo "$(YELLOW)NOTE: the entrypoint unsets MARIADB_ROOT_PASSWORD before exec'ing the$(NC)"
	@echo "$(YELLOW)server, so it is read from .env on the host instead.$(NC)"
	@dbpw=$$(sed -n 's/^[[:space:]]*MARIADB_ROOT_PASSWORD[[:space:]]*=[[:space:]]*//p' .env.production .env 2>/dev/null | head -n 1 | tr -d '\r'); \
	if [ -n "$$dbpw" ]; then \
		docker exec restpoint_mariadb mariadb -uroot -p"$$dbpw" --protocol socket -e \
			"SHOW STATUS LIKE 'Max_used_connections'; SHOW STATUS LIKE 'Threads_connected'; SHOW VARIABLES LIKE 'max_connections';" 2>/dev/null \
			|| echo "$(YELLOW)Could not query MariaDB (container may be down).$(NC)"; \
	else \
		echo "$(YELLOW)MARIADB_ROOT_PASSWORD not found in .env.production/.env$(NC)"; \
	fi
	@echo ""
	@echo "$(BLUE)=== Healthcheck credential file (is the user missing?) ===$(NC)"
	@echo "$(YELLOW)If this file exists but the 'healthcheck' SQL user does not, the$(NC)"
	@echo "$(YELLOW)container is permanently unhealthy — run 'make fix-db-healthcheck'.$(NC)"
	@docker exec restpoint_mariadb sh -c 'cat /var/lib/mysql/.my-healthcheck.cnf 2>/dev/null | sed "s/^\(password[[:space:]]*=\).*/\1 <redacted>/"' 2>/dev/null \
		|| echo "$(YELLOW)No .my-healthcheck.cnf in the data volume.$(NC)"
	@echo ""
	@echo "$(BLUE)=== Containers stuck restarting (crash-looping) ===$(NC)"
	@docker ps -a --filter 'name=restpoint_' --filter 'status=restarting' --format '{{.Names}}' 2>/dev/null | while read -r c; do \
		echo "$(YELLOW)$c$(NC)"; \
		docker logs --tail=15 "$$c" 2>&1 | sed 's/^/    /'; \
	done
	@echo ""
	@echo "$(BLUE)=== Is the UI up right now? (served on host :8080) ===$(NC)"
	@docker ps --filter 'name=restpoint_frontend' --format '{{.Names}}: {{.Status}}' 2>/dev/null || true
	@curl -s -o /dev/null -w '    http://localhost:8080 -> HTTP %{http_code}\n' http://localhost:8080/ 2>/dev/null || echo "    (no response)"

# Repair the MariaDB healthcheck user.
#
# mariadb:10.11 (10.11.19+) authenticates healthcheck.sh using credentials stored
# in /var/lib/mysql/.my-healthcheck.cnf, and its entrypoint only creates the
# matching SQL account on FIRST volume init. `_check_if_upgrade_is_needed` skips
# the repair whenever that file already exists, so a volume where the file
# survived but the account did not is stuck forever:
#     ERROR 1045 (28000): Access denied for user 'healthcheck'@'localhost'
#     healthcheck innodb_initialized failed
# The server is fine — it is the PROBE that cannot authenticate — yet the
# container reports `unhealthy` and `condition: service_healthy` then blocks the
# whole stack. This target recreates the account using the password from that
# same file (never an invented one) and verifies with the image's own binary.
fix-db-healthcheck:
	@sh scripts/fix-db-healthcheck.sh

# ============================================================
# VALIDATION
# ============================================================

validate:
	@echo "$(BLUE)Validating docker-compose files...$(NC)"
	@$(COMPOSE) config > /dev/null 2>&1 && echo "$(GREEN)✓ docker-compose.yml is valid$(NC)" || echo "$(RED)✗ docker-compose.yml invalid$(NC)"
	@if [ -f docker-compose.prod.yml ]; then \
		$(COMPOSE_PROD) config > /dev/null 2>&1 && echo "$(GREEN)✓ docker-compose.prod.yml is valid$(NC)" || echo "$(RED)✗ docker-compose.prod.yml invalid$(NC)"; \
	fi
	@sh scripts/list-build-services.sh verify-dockerfiles
	@sh scripts/list-build-services.sh docker-compose.prod.yml verify-dockerfiles

# Every buildable service must have its Dockerfile on disk. Catches a compose
# file pointing at a Dockerfile that does not exist BEFORE the slow serial
# builds start (and before `up --no-build` fails on a missing image).
check-dockerfiles:
	@echo "$(BLUE)Checking Dockerfiles for every buildable service...$(NC)"
	@sh scripts/list-build-services.sh verify-dockerfiles
	@sh scripts/list-build-services.sh docker-compose.prod.yml verify-dockerfiles

validate-dockerfiles:
	@echo "$(BLUE)Validating all Dockerfiles...$(NC)"
	@for dockerfile in $$(find ./services -name "Dockerfile" 2>/dev/null); do \
		echo "Checking $$dockerfile..."; \
		docker build -t test-build --no-cache -f $$dockerfile . > /dev/null 2>&1; \
		if [ $$? -eq 0 ]; then \
			echo "$(GREEN)✓ $$dockerfile is valid$(NC)"; \
		else \
			echo "$(RED)✗ $$dockerfile has errors$(NC)"; \
		fi; \
	done

# ============================================================
# BACKUP & RECOVERY
# All backups are written to /opt/backups on the production
# server (override with BACKUP_DIR=... for local runs).
# ============================================================

BACKUP_DIR ?= /opt/backups

backup:
	@echo "$(BLUE)Creating database backup in $(BACKUP_DIR)...$(NC)"
	@mkdir -p $(BACKUP_DIR)/db
	@BACKUP_FILE="$(BACKUP_DIR)/db/restpoint_db_$$(date +%Y%m%d_%H%M%S).sql.gz"; \
	docker-compose exec -T mariadb mysqldump -uroot -p$${DB_ROOT_PASSWORD:-rootpassword} --all-databases 2>/dev/null | gzip > $$BACKUP_FILE; \
	if [ $$? -eq 0 ]; then \
		echo "$(GREEN)✓ Database backup created: $$BACKUP_FILE$(NC)"; \
	else \
		echo "$(RED)✗ Backup failed$(NC)"; \
	fi

# Archive every tenant upload (signatures, logos, documents, hearse images,
# scans, invoices) from the shared host storage directory.
backup-uploads:
	@echo "$(BLUE)Archiving /opt/storage/uploads into $(BACKUP_DIR)...$(NC)"
	@mkdir -p $(BACKUP_DIR)/uploads
	@ARCHIVE="$(BACKUP_DIR)/uploads/uploads_$$(date +%Y%m%d_%H%M%S).tar.gz"; \
	tar -czf $$ARCHIVE -C /opt/storage uploads 2>/dev/null; \
	if [ $$? -eq 0 ]; then \
		echo "$(GREEN)✓ Uploads backup created: $$ARCHIVE$(NC)"; \
	else \
		echo "$(RED)✗ Uploads backup failed$(NC)"; \
	fi

backup-all: backup backup-uploads
	@echo "$(GREEN)✓ Full backup (database + uploads) stored in $(BACKUP_DIR)$(NC)"

restore:
	@echo "$(RED)WARNING: This will overwrite the current database!$(NC)"
	@read -p "Enter backup file path [default: newest in $(BACKUP_DIR)/db]: " backup_file; \
	if [ -z "$$backup_file" ]; then \
		backup_file=$$(ls -1t $(BACKUP_DIR)/db/*.sql.gz 2>/dev/null | head -n 1); \
	fi; \
	if [ -f "$$backup_file" ]; then \
		echo "$(BLUE)Restoring from $$backup_file...$(NC)"; \
		gunzip -c $$backup_file | docker-compose exec -T mariadb mysql -uroot -p$${DB_ROOT_PASSWORD:-rootpassword}; \
		if [ $$? -eq 0 ]; then \
			echo "$(GREEN)✓ Restore complete$(NC)"; \
		else \
			echo "$(RED)✗ Restore failed$(NC)"; \
		fi; \
	else \
		echo "$(RED)Backup file not found: $$backup_file$(NC)"; \
		exit 1; \
	fi

# ============================================================
# TESTING
# ============================================================

test:
	@echo "$(BLUE)Running tests...$(NC)"
	@if docker-compose exec api-gateway npm test 2>/dev/null; then \
		echo "$(GREEN)✓ Tests complete$(NC)"; \
	else \
		echo "$(YELLOW)No tests found or service not running$(NC)"; \
	fi

# ============================================================
# UTILITY TARGETS
# ============================================================

ps-images:
	@echo "$(BLUE)Docker images:$(NC)"
	@docker images | grep restpoint || echo "No RestPoint images found"

prune:
	@echo "$(YELLOW)Removing unused Docker resources...$(NC)"
	@docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

stats:
	@echo "$(BLUE)Docker resource usage:$(NC)"
	@docker stats --no-stream

logs-all:
	@echo "$(BLUE)All container logs (last 300 lines):$(NC)"
	@$(COMPOSE) logs --tail=300

check-deps:
	@echo "$(BLUE)Checking dependencies...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)✗ Docker not installed$(NC)"; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "$(RED)✗ Docker Compose not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All dependencies found$(NC)"

version:
	@echo "$(BLUE)Version Information:$(NC)"
	@echo "Docker: $$(docker --version)"
	@echo "Docker Compose: $$(docker-compose --version)"

info:
	@echo "$(BLUE)RestPoint System Information:$(NC)"
	@echo "Status: "; @make ps
	@echo ""
	@echo "Configuration:"
	@if [ -f .env ]; then \
		grep -E "^[A-Z_]+" .env | head -10; \
	else \
		echo "No .env file"; \
	fi
	@echo ""
	@echo "Services: $$(docker-compose config --services | wc -l)"

rebuild: clean build up
	@echo "$(GREEN)✓ Full rebuild complete$(NC)"

reset: clean dev
	@echo "$(GREEN)✓ Reset to development state complete$(NC)"

# ============================================================
# FIX SERVICES
# ============================================================

start-all:
	@echo "$(BLUE)Starting all services including missing ones...$(NC)"
	@$(COMPOSE) up -d --no-build --remove-orphans
	@echo "$(GREEN)✓ All services started$(NC)"
	@sleep 10
	@make ps

start-essential:
	@echo "$(BLUE)Starting essential services (gateway, tenant, auth, database)...$(NC)"
	@$(COMPOSE) up -d --no-build mariadb redis rabbitmq tenant-service api-gateway auth-service
	@echo "$(GREEN)✓ Essential services started$(NC)"
	@sleep 10
	@make ps

fix-tenant:
	@echo "$(BLUE)Checking tenant service...$(NC) "
	@docker ps -a | grep tenant-service
	@echo "$(BLUE)Removing and rebuilding tenant service...$(NC)"
	@docker rm -f restpoint_tenant_service 2>/dev/null || true
	@$(COMPOSE) build --no-cache tenant-service
	@$(COMPOSE) up -d --no-build tenant-service
	@echo "$(GREEN)✓ Tenant service rebuilt and started$(NC)"
	@docker logs restpoint_tenant_service --tail=20

fix-gateway:
	@echo "$(BLUE)Checking gateway...$(NC)"
	@docker ps -a | grep gateway
	@echo "$(BLUE)Removing and rebuilding gateway...$(NC)"
	@docker rm -f restpoint_api_gateway 2>/dev/null || true
	@$(COMPOSE) build --no-cache api-gateway
	@$(COMPOSE) up -d --no-build api-gateway
	@echo "$(GREEN)✓ Gateway rebuilt and started$(NC)"
	@docker logs restpoint_api_gateway --tail=20

# ----------------------------------------------------------------------------
# FRONTEND-ONLY TARGETS
# Rebuild and redeploy ONLY the UI container. `up -d --no-deps frontend`
# guarantees the api-gateway (or any other service) is never recreated.
# ----------------------------------------------------------------------------
build-frontend:
	@echo "$(BLUE)Building ONLY the frontend image (cached layers)...$(NC)"
	@$(COMPOSE) build frontend
	@$(COMPOSE) up -d --no-deps frontend
	@echo "$(GREEN)✓ Frontend rebuilt and restarted$(NC)"
	@sleep 5
	@docker logs restpoint_frontend --tail=20

fix-frontend:
	@echo "$(BLUE)Rebuilding ONLY the frontend from scratch (no cache)...$(NC)"
	@$(COMPOSE) build --no-cache frontend
	@$(COMPOSE) up -d --no-deps frontend
	@echo "$(GREEN)✓ Frontend rebuilt from scratch and restarted$(NC)"
	@sleep 5
	@docker logs restpoint_frontend --tail=20

# Bring the UI up on PRODUCTION right now, ignoring every backend dependency.
# This is the emergency lever when something like MariaDB is stuck and
# `make prod-up` hangs at "Container restpoint_mariadb Waiting" — the SPA is a
# static nginx bundle, so it does not need the database to serve index.html.
# `--no-deps` is what makes this work: without it Compose would still resolve
# the dependency chain and block on the unhealthy database.
prod-ui-up:
	@echo "$(BLUE)Starting ONLY the UI, ignoring all backend dependencies...$(NC)"
	@$(COMPOSE_PROD) up -d --no-build --no-deps frontend
	@sleep 3
	@docker ps --filter 'name=restpoint_frontend' --format '{{.Names}}: {{.Status}}'
	@curl -s -o /dev/null -w '    http://localhost:8080 -> HTTP %{http_code}\n' http://localhost:8080/ || true
	@echo "$(YELLOW)API calls fail until the backend recovers — run 'make prod-doctor'.$(NC)"

fix-all: check-build-list
	@echo "$(BLUE)Fixing all services...$(NC)"
	@$(COMPOSE) down --remove-orphans
	@set -e; for svc in $(BUILD_SERVICES); do echo "  -> building $$svc"; $(COMPOSE) build --no-cache $$svc; done
	@$(COMPOSE) up -d --no-build --remove-orphans
	@echo "$(GREEN)✓ All services rebuilt and started$(NC)"
	@sleep 30
	@make ps

# ============================================================
# USAGE TIPS
# ============================================================

usage-tips:
	@echo "$(CYAN)=== DOCKER BUILD OPTIMIZATION TIPS ===$(NC)"
	@echo ""
	@echo "$(GREEN)1. BuildKit is already enabled (export DOCKER_BUILDKIT=1)$(NC)"
	@echo ""
	@echo "$(GREEN)2. Fastest build options:$(NC)"
		@echo "   make build-no-cache-fast  # Rebuild everything (serial)"
	@echo "   make rebuild-fast         # Clear cache + rebuild (ULTRA FAST)"
	@echo "   make build-service-fast SVC=service  # Rebuild single service"
	@echo ""
	@echo "$(GREEN)3. Build performance:$(NC)"
	@echo "   Standard build: 5-10 min"
	@echo "   Fast build:     2-3 min  (with BuildKit)"
	@echo "   Single service: 30-60 sec"
	@echo ""
	@echo "$(GREEN)4. Daily workflow:$(NC)"
	@echo "   $ make build-service-fast SVC=tenant-service"
	@echo "   $ docker-compose up -d tenant-service"
	@echo "   $ make logs-service SVC=tenant-service"
	@echo ""
	@echo "$(GREEN)5. Clear cache when needed:$(NC)"
	@echo "   $ make clear-cache"
	@echo ""
	@echo "$(GREEN)6. Check build time:$(NC)"
	@echo "   $ time make build-no-cache-fast"
	@echo ""
