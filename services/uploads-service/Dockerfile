# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install sharp dependencies
RUN apk add --no-cache \
    vips-dev \
    build-base \
    python3

COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5012
CMD ["npm", "start"]