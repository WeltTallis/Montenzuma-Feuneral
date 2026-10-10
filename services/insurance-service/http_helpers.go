package main

import (
	"encoding/json"
	"net/http"
	"strings"
)

func write(w http.ResponseWriter,status int,v any){w.Header().Set("Content-Type","application/json");w.WriteHeader(status);_ = json.NewEncoder(w).Encode(v)}

func body(r *http.Request)(map[string]any,error){var v map[string]any;err:=json.NewDecoder(r.Body).Decode(&v);return v,err}

func str(m map[string]any,k string)string{v,_:=m[k].(string);return strings.TrimSpace(v)}

func tenant(r *http.Request)string{if t:=r.Header.Get("x-tenant-slug");t!=""{return t};return "system_shared"}

func cors(next http.Handler)http.Handler{return http.HandlerFunc(func(w http.ResponseWriter,r *http.Request){w.Header().Set("Access-Control-Allow-Origin","*");w.Header().Set("Access-Control-Allow-Headers","Content-Type, Authorization, X-Tenant-Slug, X-Tenant-Id, X-Mpesa-Callback-Secret");w.Header().Set("Access-Control-Allow-Methods","GET, POST, PATCH, OPTIONS");if r.Method=="OPTIONS"{w.WriteHeader(204);return};next.ServeHTTP(w,r)})}
