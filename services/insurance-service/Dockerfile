FROM golang:1.22-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY *.go ./
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/insurance-service .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
RUN mkdir -p /opt/storage/uploads/insurance && chown -R 1001:1001 /opt/storage/uploads
COPY --from=build /out/insurance-service /app/insurance-service
EXPOSE 5050
USER 1001:1001
ENTRYPOINT ["/app/insurance-service"]
