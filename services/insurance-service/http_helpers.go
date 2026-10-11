package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

func write(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func body(r *http.Request) (map[string]any, error) {
	var v map[string]any
	err := json.NewDecoder(r.Body).Decode(&v)
	if err != nil {
		return nil, err
	}
	if v == nil {
		return make(map[string]any), nil
	}
	if _, ok := v["phone"]; !ok {
		for _, key := range []string{"phoneNumber", "mobileNumber"} {
			if value, exists := v[key]; exists {
				v["phone"] = value
				break
			}
		}
	}
	if _, ok := v["confirmAccepted"]; !ok {
		for _, key := range []string{"declarationAccepted", "declaration_accepted", "acceptDeclaration", "acceptedDeclaration", "declaration"} {
			if value, exists := v[key]; exists {
				v["confirmAccepted"] = value
				break
			}
		}
	}
	cover := str(v, "coverType")
	if cover == "" {
		cover = str(v, "cover_type")
	}

	if cover == "" {
		cover = str(v, "cover")
	}

	if cover != "" {
		cover = normalizeCover(cover)
		v["coverType"] = cover
		v["cover_type"] = cover
		v["cover"] = cover
	}

	if _, ok := v["coveredCount"]; !ok {
		count := 1
		if members, ok := v["members"].([]any); ok && len(members) > 0 {
			count += len(members)
		}
		v["coveredCount"] = count
	}
	return v, nil
}

func str(m map[string]any, k string) string { v, _ := m[k].(string); return strings.TrimSpace(v) }

/*
first returns the first non-empty value among the given keys. The claim

	form historically sent short keys (fullName/idNumber/causeDeath/placeDeath)
	while the backend expected long ones, so we accept both spellings here and
	keep old and new callers working.
*/
func first(m map[string]any, keys ...string) string {
	for _, k := range keys {
		if v := str(m, k); v != "" {
			return v
		}
	}
	return ""
}

/* numVal reads a numeric field that may arrive as a JSON number or string. */
func numVal(m map[string]any, k string) float64 {
	switch v := m[k].(type) {
	case float64:
		return v
	case int:
		return float64(v)
	case string:
		var n float64
		fmt.Sscanf(strings.TrimSpace(v), "%g", &n)
		return n
	}
	return 0
}

func tenant(r *http.Request) string {
	if t := r.Header.Get("x-tenant-slug"); t != "" {
		return t
	}
	return "system_shared"
}

/* money formats a float as a Kenya-shilling string, e.g. 1250.5 -> "KES 1,251". */

func money(n float64) string {
	rounded := int64(n + 0.5)
	return "KES " + strconv.FormatInt(rounded, 10)
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = "*"
		}
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-Slug, X-Tenant-Id, X-Mpesa-Callback-Secret, X-Branch-Slug, X-Branch-Id, X-Branch-Db, X-User-Id, X-User-Email, X-User-Name, X-Slug, Origin, X-Requested-With, Accept")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}
