FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
ENV GOPROXY=https://proxy.golang.org,direct \
    GOSUMDB=sum.golang.org
RUN for attempt in 1 2 3 4 5; do go mod download && exit 0; echo "go mod download failed (attempt ${attempt}/5), retrying..."; sleep 15; done; exit 1
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/mpesa-service .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=build /out/mpesa-service /app/mpesa-service
EXPOSE 4040
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:4040/health || exit 1
ENTRYPOINT ["/app/mpesa-service"]
