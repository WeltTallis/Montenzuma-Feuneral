FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
ENV GOPROXY=https://proxy.golang.org,direct \
    GOSUMDB=sum.golang.org
RUN for attempt in 1 2 3 4 5; do go mod download && exit 0; echo "go mod download failed (attempt ${attempt}/5), retrying..."; sleep 15; done; exit 1
COPY *.go ./
RUN for attempt in 1 2 3 4 5; do \
      go mod tidy && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/insurance-service . && exit 0; \
      echo "go tidy/build failed (attempt ${attempt}/5), retrying..."; \
      sleep 15; \
    done; \
    exit 1

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
RUN mkdir -p /opt/storage/uploads/insurance && chown -R 1001:1001 /opt/storage/uploads
COPY --from=build /out/insurance-service /app/insurance-service
EXPOSE 5050
USER 1001:1001
ENTRYPOINT ["/app/insurance-service"]
