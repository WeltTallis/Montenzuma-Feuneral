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

type app struct { db *pgxpool.Pool; cache *redis.Client }

func main() {
	ctx := context.Background()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" { dsn = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", env("PGUSER","insurance"), env("PGPASSWORD","insurance"), env("PGHOST","localhost"), env("PGPORT","5432"), env("PGDATABASE","insurance"), env("PGSSLMODE","disable")) }
	poolConfig, err := pgxpool.ParseConfig(dsn); if err != nil { log.Fatal(err) }
	poolConfig.ConnConfig.RuntimeParams["timezone"] = "UTC"
	db, err := pgxpool.NewWithConfig(ctx, poolConfig); if err != nil { log.Fatal(err) }; defer db.Close()
	for i:=0; i<20; i++ { if db.Ping(ctx)==nil { break }; time.Sleep(time.Second) }
	if err:=migrate(ctx, db); err!=nil { log.Fatal(err) }
	var cache *redis.Client
	if address := os.Getenv("REDIS_ADDR"); address != "" {
		cache = redis.NewClient(&redis.Options{Addr: address, Password: os.Getenv("REDIS_PASSWORD"), DB: 0})
		if err := cache.Ping(ctx).Err(); err != nil { log.Printf("insurance Redis cache unavailable, continuing without cache: %v", err); _ = cache.Close(); cache = nil }
	}
	a:=&app{db:db,cache:cache}; if cache != nil { defer cache.Close() }; mux:=http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter,r *http.Request){ if err:=db.Ping(r.Context()); err!=nil { write(w,503,map[string]any{"status":"unhealthy"}); return }; write(w,200,map[string]any{"status":"ok","database":"postgres"}) })
	mux.HandleFunc("POST /insurance/applications",a.createPolicy)
	mux.HandleFunc("POST /insurance/claims",a.createClaim)
	mux.Handle("POST /insurance/cover-check",a.cacheFor(15*time.Second,a.coverCheck))
	mux.Handle("POST /insurance/claim-track",a.cacheFor(10*time.Second,a.claimTrack))
	mux.Handle("GET /insurance/policies",a.cacheFor(30*time.Second,a.listPolicies))
	mux.Handle("GET /insurance/policies/{policyNumber}",a.cacheFor(30*time.Second,a.getPolicy))
	mux.Handle("GET /insurance/claims",a.cacheFor(10*time.Second,a.listClaims))
	mux.HandleFunc("PATCH /insurance/claims/{claimId}/status",a.updateClaim)
	mux.Handle("GET /insurance/stats",a.cacheFor(15*time.Second,a.stats))
	mux.HandleFunc("POST /insurance/payments/stk-push",a.stkPush)
	mux.HandleFunc("POST /insurance/payments/callback",a.paymentCallback)
	mux.HandleFunc("GET /insurance/payments/{reference}",a.paymentStatus)
	addr:=":"+env("PORT","5050"); log.Printf("insurance service listening on %s",addr); log.Fatal(http.ListenAndServe(addr, cors(a.invalidateAfter(mux))))
}
func env(k,d string)string{if v:=os.Getenv(k);v!=""{return v};return d}







CREATE TABLE IF NOT EXISTS insurance_policies(policy_id BIGSERIAL PRIMARY KEY, policy_number TEXT NOT NULL UNIQUE, id_number TEXT NOT NULL, tenant_slug TEXT NOT NULL DEFAULT 'system_shared', tenant_id BIGINT, branch_id BIGINT NOT NULL DEFAULT 0, full_name TEXT NOT NULL, age INT NOT NULL DEFAULT 0, employment TEXT, phone TEXT NOT NULL DEFAULT '', email TEXT, cover_type TEXT NOT NULL DEFAULT '', covered_count INT NOT NULL DEFAULT 1, monthly_premium NUMERIC(12,2) NOT NULL DEFAULT 0, plan_code TEXT, status TEXT NOT NULL DEFAULT 'pending', declaration_accepted BOOLEAN NOT NULL DEFAULT false, next_of_kin_name TEXT, next_of_kin_phone TEXT, next_of_kin_relationship TEXT, is_deleted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS insurance_policy_members(member_id BIGSERIAL PRIMARY KEY, policy_id BIGINT NOT NULL REFERENCES insurance_policies(policy_id) ON DELETE CASCADE, full_name TEXT NOT NULL, phone TEXT, tenant_slug TEXT NOT NULL DEFAULT 'system_shared', tenant_id BIGINT, position TEXT, is_deleted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS insurance_claims(claim_id BIGSERIAL PRIMARY KEY, policy_number TEXT NOT NULL, policy_id BIGINT REFERENCES insurance_policies(policy_id), claimant_full_name TEXT NOT NULL, claimant_id_number TEXT NOT NULL, phone TEXT NOT NULL, relationship TEXT NOT NULL, deceased_name TEXT NOT NULL, death_date DATE NOT NULL, cause_of_death TEXT NOT NULL, place_of_death TEXT NOT NULL, notes TEXT, doc_death_cert_path TEXT, doc_claimant_id_path TEXT, doc_burial_permit_path TEXT, status TEXT NOT NULL DEFAULT 'submitted', review_notes TEXT, tenant_slug TEXT NOT NULL DEFAULT 'system_shared', tenant_id BIGINT, is_deleted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS insurance_payments(payment_id BIGSERIAL PRIMARY KEY, reference TEXT NOT NULL UNIQUE, policy_number TEXT NOT NULL, phone TEXT NOT NULL, amount NUMERIC(12,2) NOT NULL, status TEXT NOT NULL DEFAULT 'pending', merchant_request_id TEXT, checkout_request_id TEXT, mpesa_receipt TEXT, result_code TEXT, result_description TEXT, tenant_slug TEXT NOT NULL DEFAULT 'system_shared', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS insurance_claims_policy_idx ON insurance_claims(policy_number); CREATE INDEX IF NOT EXISTS insurance_payments_policy_idx ON insurance_payments(policy_number);`);return err}

func normalize(s string)string{s=strings.ToUpper(strings.Join(strings.Fields(s),""));for _,p:=range []string{"AMANI-COVER","AMNICOVER","AMANI","AMN","AM"}{if strings.HasPrefix(s,p){s=strings.TrimLeft(s[len(p):],"-_");break}};return s}
func intVal(v any)int{switch n:=v.(type){case float64:return int(n);case int:return n};return 0};func floatVal(v any)float64{n,_:=v.(float64);return n};func truth(v any)bool{b,_:=v.(bool);return b}
