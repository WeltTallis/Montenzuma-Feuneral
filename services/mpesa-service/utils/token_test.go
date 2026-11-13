package utils

import (
	"net/url"
	"testing"
)

func TestNormalizeOAuthURL(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		wantGrant   string
		wantChannel string
		wantErr     bool
	}{
		{
			name:      "adds client credentials grant",
			input:     "https://api.safaricom.co.ke/oauth/v1/generate",
			wantGrant: "client_credentials",
		},
		{
			name:        "preserves other query values and replaces grant",
			input:       "https://api.safaricom.co.ke/oauth/v1/generate?channel=web&grant_type=invalid",
			wantGrant:   "client_credentials",
			wantChannel: "web",
		},
		{
			name:    "rejects a relative url",
			input:   "/oauth/v1/generate",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := normalizeOAuthURL(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("normalizeOAuthURL() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}

			parsed, err := url.Parse(got)
			if err != nil {
				t.Fatalf("normalized URL is invalid: %v", err)
			}
			if gotGrant := parsed.Query().Get("grant_type"); gotGrant != tt.wantGrant {
				t.Errorf("grant_type = %q, want %q", gotGrant, tt.wantGrant)
			}
			if gotChannel := parsed.Query().Get("channel"); gotChannel != tt.wantChannel {
				t.Errorf("channel = %q, want %q", gotChannel, tt.wantChannel)
			}
		})
	}
}
