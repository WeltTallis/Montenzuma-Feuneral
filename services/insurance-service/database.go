package main

import (
	"context"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func migrate(ctx context.Context, db *pgxpool.Pool) error {
	_, err := db.Exec(ctx, `
CREATE TABLE IF NOT EXISTS insurance_policies (
  policy_id BIGSERIAL PRIMARY KEY,
  policy_number TEXT NOT NULL UNIQUE,
  id_number TEXT NOT NULL,
  tenant_slug TEXT NOT NULL DEFAULT 'system_shared',
  tenant_id BIGINT,
  branch_id BIGINT NOT NULL DEFAULT 0,
  full_name TEXT NOT NULL,
  age INT NOT NULL DEFAULT 0,
  employment TEXT,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT,
  cover_type TEXT NOT NULL DEFAULT '',
  covered_count INT NOT NULL DEFAULT 1,
  monthly_premium NUMERIC(12,2) NOT NULL DEFAULT 0,
  plan_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  declaration_accepted BOOLEAN NOT NULL DEFAULT false,
  next_of_kin_name TEXT,
  next_of_kin_phone TEXT,
  next_of_kin_relationship TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS insurance_policy_members (
  member_id BIGSERIAL PRIMARY KEY,
  policy_id BIGINT NOT NULL REFERENCES insurance_policies(policy_id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  tenant_slug TEXT NOT NULL DEFAULT 'system_shared',
  tenant_id BIGINT,
  position TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS insurance_claims (
  claim_id BIGSERIAL PRIMARY KEY,
  policy_number TEXT NOT NULL,
  policy_id BIGINT REFERENCES insurance_policies(policy_id),
  claimant_full_name TEXT NOT NULL,
  claimant_id_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT NOT NULL,
  deceased_name TEXT NOT NULL,
  death_date DATE NOT NULL,
  cause_of_death TEXT NOT NULL,
  place_of_death TEXT NOT NULL,
  notes TEXT,
  doc_death_cert_path TEXT,
  doc_claimant_id_path TEXT,
  doc_burial_permit_path TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  review_notes TEXT,
  tenant_slug TEXT NOT NULL DEFAULT 'system_shared',
  tenant_id BIGINT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS insurance_payments (
  payment_id BIGSERIAL PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  policy_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  mpesa_receipt TEXT,
  result_code TEXT,
  result_description TEXT,
  tenant_slug TEXT NOT NULL DEFAULT 'system_shared',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS insurance_claims_policy_idx ON insurance_claims(policy_number);
CREATE INDEX IF NOT EXISTS insurance_payments_policy_idx ON insurance_payments(policy_number);
`)
	return err
}

func normalize(s string) string {
	s = strings.ToUpper(strings.Join(strings.Fields(s), ""))
	for _, prefix := range []string{"AMANI-COVER", "AMNICOVER", "AMANI", "AMN", "AM"} {
		if strings.HasPrefix(s, prefix) {
			s = strings.TrimLeft(s[len(prefix):], "-_")
			break
		}
	}
	return s
}

func intVal(v any) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	}
	return 0
}

func floatVal(v any) float64 {
	n, _ := v.(float64)
	return n
}

func truth(v any) bool {
	b, _ := v.(bool)
	return b
}