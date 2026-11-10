FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy module definition files
COPY api/go.mod api/go.sum ./api/

# Download dependencies
ENV GOPROXY=https://proxy.golang.org,direct \
    GOSUMDB=sum.golang.org
RUN for attempt in 1 2 3 4 5; do (cd api && go mod download) && exit 0; echo "go mod download failed (attempt ${attempt}/5), retrying..."; sleep 15; done; exit 1

# Copy source code
COPY . .

# Build the SMS service binary
WORKDIR /app/api
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/sms-service .

# Minimal runtime image
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /out/sms-service /app/sms-service

EXPOSE 8080

USER nobody:nobody

ENTRYPOINT ["/app/sms-service"]
