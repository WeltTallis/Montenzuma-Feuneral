# TypeScript Build Error Fix

## Problem Description

The Docker build was failing with the following error when building the analytics-service:

```
error TS5055: Cannot write file '/usr/src/app/packages/shared-logger/dist/index.js' because it would overwrite input file.
error TS5055: Cannot write file '/usr/src/app/packages/shared-logger/dist/logger.js' because it would overwrite input file.
```

## Root Cause

The issue was in `tsconfig.base.json`:

1. **Include pattern too broad**: The base tsconfig included `"services/**/*"` which matched all service directories
2. **Conflicting output directories**: The base config had `"outDir": "./dist"` and `"rootDir": "."`
3. **Double compilation**: When TypeScript compiled from the root during service builds, it tried to:
   - Compile files from the root `packages/` directory
   - Also compile files that were already compiled by individual package builds
   - This caused output files to conflict and overwrite each other

## The Fix

Added `"packages/**/*"` to the `exclude` array in `tsconfig.base.json`:

```json
"exclude": [
  "node_modules",
  "dist",
  "build",
  "**/*.test.ts",
  "**/*.spec.ts",
  "FrontendClient/**/*",
  "services/**/node_modules/**/*",
  "packages/**/*"  // <-- Added this line
]
```

## Why This Works

1. **Separation of concerns**: Each package in `packages/` has its own `tsconfig.json` and build process
2. **Prevents double compilation**: The root tsconfig no longer tries to compile package files
3. **Maintains build order**: Dockerfiles still build packages in the correct order:
   - `packages/shared-config`
   - `packages/shared-logger`
   - `packages/shared-services`
   - `packages/shared-utils`
4. **Service compilation**: Services can still import from packages using path mappings like `@packages/shared-services/*`

## Build Process Flow

The Docker build now works correctly:

1. Copy package.json files
2. Install dependencies
3. Copy source code
4. Build shared packages (each package compiles itself to its own `dist/` folder)
5. Service code uses the compiled packages

## Verification

To verify the fix works:

```bash
# Build a specific service
make build-service-fast SVC=analytics-service

# Or rebuild all services
make build-no-cache-fast
```

## Related Files

- `tsconfig.base.json` - Root TypeScript configuration (modified)
- `packages/*/tsconfig.json` - Individual package configurations (unchanged)
- `services/*/Dockerfile` - Service Dockerfiles (unchanged)
- `Makefile` - Build automation (unchanged)
