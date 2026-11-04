
# RestPoint api-gateway   multi-stage production image



FROM golang:1.22-alpine AS build
WORKDIR /usr/src/app
RUN apk add --no-cache ca-certificates git
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags= -s -w -o /usr/local/bin/api-gateway ./services/api-gateway/


# Stage 2/2  runtime: minimal image with just the binary

FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates && addgroup -g 1001 -S gateway && adduser -S gateway -u 1001 -G gateway
WORKDIR /app
COPY --from=build /usr/local/bin/api-gateway /app/api-gateway
COPY --from=build /usr/src/app/services/api-gateway/.env /app/.env

USER gateway

EXPOSE 5000
ENV GIN_MODE=release
ENV RUNNING_IN_DOCKER=true

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD [/app/api-gateway]
