package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type app struct {
	db    *pgxpool.Pool
	cache *redis.Client
}

func main() {
	ctx := context.Background()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			env("PGUSER", "insurance"),
			env("PGPASSWORD", "40045355insurace"),
			env("PGHOST", "localhost"),
			env("PGPORT", "5432"),
			env("PGDATABASE", "insurance"),
			env("PGSSLMODE", "disable"),
		)
	}

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		log.Fatal(err)
	}
	poolConfig.ConnConfig.RuntimeParams["timezone"] = "UTC"

	db, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	connected := false
	for i := 0; i < 20; i++ {
		if db.Ping(ctx) == nil {
			connected = true
			break
		}
		time.Sleep(time.Second)
	}
	if !connected {
		log.Fatal("could not connect to PostgreSQL")
	}
	if err := migrate(ctx, db); err != nil {
		log.Fatal(err)
	}

	var cache *redis.Client
	if address := os.Getenv("REDIS_ADDR"); address != "" {
		cache = redis.NewClient(&redis.Options{
			Addr:     address,
			Password: os.Getenv("REDIS_PASSWORD"),
			DB:       0,
		})
		if err := cache.Ping(ctx).Err(); err != nil {
			log.Printf("insurance Redis cache unavailable, continuing without cache: %v", err)
			_ = cache.Close()
			cache = nil
		}
	}

	a := &app{db: db, cache: cache}
	if cache != nil {
		defer cache.Close()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		if err := db.Ping(r.Context()); err != nil {
			write(w, 503, map[string]any{"status": "unhealthy"})
			return
		}
		write(w, 200, map[string]any{"status": "ok", "database": "postgres"})
	})
	mux.HandleFunc("POST /insurance/applications", a.createPolicy)
	mux.HandleFunc("POST /insurance/claims", a.createClaim)
	mux.Handle("POST /insurance/cover-check", a.cacheFor(15*time.Second, a.coverCheck))
	mux.Handle("POST /insurance/claim-track", a.cacheFor(10*time.Second, a.claimTrack))
	mux.Handle("GET /insurance/policies", a.cacheFor(30*time.Second, a.listPolicies))
	mux.Handle("GET /insurance/policies/{policyNumber}", a.cacheFor(30*time.Second, a.getPolicy))
	mux.Handle("GET /insurance/claims", a.cacheFor(10*time.Second, a.listClaims))
	mux.HandleFunc("PATCH /insurance/claims/{claimId}/status", a.updateClaim)
	mux.Handle("GET /insurance/stats", a.cacheFor(15*time.Second, a.stats))
	mux.HandleFunc("POST /insurance/payments/stk-push", a.stkPush)
	mux.HandleFunc("POST /insurance/payments/callback", a.paymentCallback)
	mux.HandleFunc("GET /insurance/payments/{reference}", a.paymentStatus)

	addr := ":" + env("PORT", "5050")
	log.Printf("insurance service listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, cors(a.invalidateAfter(mux))))
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}