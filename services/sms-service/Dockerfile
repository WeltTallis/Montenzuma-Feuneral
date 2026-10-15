FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy module definition files
COPY api/go.mod api/go.sum ./api/
COPY go.mod go.sum ./

# Download dependencies
RUN cd api && go mod download

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
