package main

import (
	"net/http"
	"testing"
)

func TestStripUpstreamCORSHeaders(t *testing.T) {
	headers := make(http.Header)
	headers.Add("Access-Control-Allow-Origin", "https://if.restpoint.co.ke")
	headers.Add("Access-Control-Allow-Credentials", "true")
	headers.Add("Access-Control-Allow-Credentials", "true")
	headers.Set("Content-Type", "application/json")

	stripUpstreamCORSHeaders(headers)

	for _, name := range []string{
		"Access-Control-Allow-Origin",
		"Access-Control-Allow-Credentials",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Headers",
		"Access-Control-Expose-Headers",
		"Access-Control-Max-Age",
		"Access-Control-Allow-Private-Network",
	} {
		if values := headers.Values(name); len(values) != 0 {
			t.Errorf("%s was not removed: %v", name, values)
		}
	}

	if got := headers.Get("Content-Type"); got != "application/json" {
		t.Errorf("Content-Type was changed: got %q", got)
	}
}
