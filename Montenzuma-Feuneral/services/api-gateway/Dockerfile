
# RestPoint api-gateway   multi-stage production image



FROM golang:1.22-alpine AS build
WORKDIR /usr/src/app
RUN apk add --no-cache ca-certificates git
COPY services/api-gateway/go.mod ./services/api-gateway/go.mod
ENV GOPROXY=https://proxy.golang.org,direct \
    GOSUMDB=sum.golang.org
RUN cd services/api-gateway && for attempt in 1 2 3 4 5; do go mod download && exit 0; echo "go mod download failed (attempt ${attempt}/5), retrying..."; sleep 15; done; exit 1
COPY . .
RUN cd services/api-gateway && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-s -w' -o /usr/local/bin/api-gateway .


# Stage 2/2  runtime: minimal image with just the binary

FROM alpine:3.20 AS runtime
RUN apk add --no-cache ca-certificates && addgroup -g 1001 -S gateway && adduser -S gateway -u 1001 -G gateway
WORKDIR /app
COPY --from=build /usr/local/bin/api-gateway /app/api-gateway
COPY --from=build /usr/src/app/services/api-gateway/.env /app/.env
COPY services/api-gateway/healthcheck.sh /usr/local/bin/gateway-healthcheck
RUN chmod 0755 /usr/local/bin/gateway-healthcheck

USER gateway

EXPOSE 5000
ENV GIN_MODE=release
ENV RUNNING_IN_DOCKER=true

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 CMD ["/usr/local/bin/gateway-healthcheck"]

CMD ["/app/api-gateway"]
