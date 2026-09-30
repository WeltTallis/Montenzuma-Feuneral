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
# ------------------------------------------------------------
check-build-list:
	@if [ -z "$(strip $(BUILD_SERVICES))" ]; then \
		echo "$(RED)✗ No buildable services found in docker-compose.yml$(NC)"; \
		echo "$(YELLOW)  Diagnose with: sh scripts/list-build-services.sh$(NC)"; \
		exit 1; \
	fi

check-build-list-prod:
	@if [ -z "$(strip $(BUILD_SERVICES_PROD))" ]; then \
		echo "$(RED)✗ No buildable services found in docker-compose.prod.yml$(NC)"; \
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
	@echo ""
	@echo "$(GREEN)── Frontend ────────────────────────────────────────────$(NC)"
	@echo "  make fix-frontend         - Rebuild ONLY the UI from scratch (no cache)"
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
	@node scripts/docker-cleanup.mjs --apply
	@echo "$(GREEN)✓ Slim rebuild and safe reclamation complete$(NC)"

rebuild-slim-prod:
	@echo "$(BLUE)Rebuilding oversized production services with slim images...$(NC)"
	@set -e; for svc in florist-service leave-service hearse-service workshop-service; do echo "  -> building $$svc"; DOCKER_BUILDKIT=1 $(COMPOSE_PROD) build --no-cache $$svc; done
	@set -e; for svc in florist-service leave-service hearse-service workshop-service; do echo "  -> restarting $$svc"; $(COMPOSE_PROD) up -d --no-deps $$svc; done
	@echo "$(BLUE)Removing unused old production layers and build cache...$(NC)"
	@node scripts/docker-cleanup.mjs --apply
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
			echo "CORS_ORIGIN=http://localhost:3000,http://localhost:5000,http://localhost:8082" >> .env; \
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

deploy-staging:
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
	for img in $$($(COMPOSE_PROD) config --format json 2>/dev/null | node scripts/compose-build-services.mjs --image-list); do \
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

prod-up: validate check-prod-images
	@echo "$(BLUE)Starting production services (docker-compose.prod.yml)...$(NC)"
	@$(COMPOSE_PROD) up -d --no-build
	@echo "$(GREEN)✓ Production services started$(NC)"
	@sleep 30
	@$(COMPOSE_PROD) ps

prod-down:
	@echo "$(BLUE)Stopping production services...$(NC)"
	@$(COMPOSE_PROD) down
	@echo "$(GREEN)✓ Production services stopped$(NC)"

prod-logs:
	@$(COMPOSE_PROD) logs -f --tail=100

# ============================================================
# VALIDATION
# ============================================================

validate:
	@echo "$(BLUE)Validating docker-compose files...$(NC)"
	@$(COMPOSE) config > /dev/null 2>&1 && echo "$(GREEN)✓ docker-compose.yml is valid$(NC)" || echo "$(RED)✗ docker-compose.yml invalid$(NC)"
	@if [ -f docker-compose.prod.yml ]; then \
		$(COMPOSE_PROD) config > /dev/null 2>&1 && echo "$(GREEN)✓ docker-compose.prod.yml is valid$(NC)" || echo "$(RED)✗ docker-compose.prod.yml invalid$(NC)"; \
	fi
	@node scripts/check-make-service-lists.mjs

# Every buildable service must have its Dockerfile on disk. Catches a compose
# file pointing at a Dockerfile that does not exist BEFORE the slow serial
# builds start (and before `up --no-build` fails on a missing image).
check-dockerfiles:
	@echo "$(BLUE)Checking Dockerfiles for every buildable service...$(NC)"
	@node scripts/check-make-service-lists.mjs

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
