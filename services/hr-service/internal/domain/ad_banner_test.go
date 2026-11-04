package domain

import (
	"testing"
	"time"
)

func adBannerTestWindow() (time.Time, time.Time) {
	starts := time.Date(2026, 9, 6, 0, 0, 0, 0, time.Local)
	return starts, starts.Add(30 * 24 * time.Hour)
}

// validAdBanner represents a Kenyan payroll campaign with phone and web CTAs.
func validAdBanner() *AdBanner {
	starts, ends := adBannerTestWindow()
	return &AdBanner{
		Title: "RestPoint Kenya payroll update",
		Body:  "Manage attendance and request a salary advance from your employee account.",
		Bullets: []string{
			"View attendance and payslips",
			"Request an eligible salary advance",
			"Update your employee details",
		},
		CTAs: []AdBannerCTA{
			{Label: "Call support", Type: AdBannerCTATypePhone, Value: "+254700000000"},
			{Label: "Open portal", Type: AdBannerCTATypeURL, Value: "https://restpoint.co.ke"},
		},
		Footer:   "RestPoint Kenya",
		StartsAt: starts,
		EndsAt:   ends,
		IsActive: true,
	}
}

func TestAdBannerValidateAcceptsCampaignShape(t *testing.T) {
	if err := validAdBanner().Validate(); err != nil {
		t.Fatalf("expected valid campaign to pass validation, got %v", err)
	}
}

func TestAdBannerValidateRules(t *testing.T) {
	cases := []struct {
		name   string
		mutate func(b *AdBanner)
	}{
		{"empty title", func(b *AdBanner) { b.Title = "   " }},
		{"title over 255", func(b *AdBanner) { b.Title = string(make([]byte, 256)) }},
		{"footer over 255", func(b *AdBanner) { b.Footer = string(make([]byte, 256)) }},
		{"seven bullets", func(b *AdBanner) {
			b.Bullets = []string{"1", "2", "3", "4", "5", "6", "7"}
		}},
		{"blank bullet", func(b *AdBanner) { b.Bullets = []string{"  "} }},
		{"bullet over 200 chars", func(b *AdBanner) { b.Bullets = []string{string(make([]byte, 201))} }},
		{"no CTAs", func(b *AdBanner) { b.CTAs = nil }},
		{"four CTAs", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{
				{Label: "A", Type: AdBannerCTATypeURL, Value: "https://a"},
				{Label: "B", Type: AdBannerCTATypeURL, Value: "https://b"},
				{Label: "C", Type: AdBannerCTATypeURL, Value: "https://c"},
				{Label: "D", Type: AdBannerCTATypeURL, Value: "https://d"},
			}
		}},
		{"empty CTA label", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: " ", Type: AdBannerCTATypeURL, Value: "https://a"}}
		}},
		{"CTA label over 40", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: string(make([]byte, 41)), Type: AdBannerCTATypeURL, Value: "https://a"}}
		}},
		{"unknown CTA type", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: "Support", Type: "sms", Value: "https://restpoint.co.ke"}}
		}},
		{"unsupported messaging CTA rejected", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: "Messaging", Type: "sms", Value: "https://example.co.ke"}}
		}},
		{"phone with letters", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: "Call", Type: AdBannerCTATypePhone, Value: "+2547abc12345"}}
		}},
		{"phone too short", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: "Call", Type: AdBannerCTATypePhone, Value: "123"}}
		}},
		{"http url rejected", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: "Website", Type: AdBannerCTATypeURL, Value: "http://example.co.ke"}}
		}},
		{"javascript url rejected", func(b *AdBanner) {
			b.CTAs = []AdBannerCTA{{Label: "Website", Type: AdBannerCTATypeURL, Value: "javascript:alert(1)"}}
		}},
		{"ends before starts", func(b *AdBanner) { b.StartsAt, b.EndsAt = b.EndsAt, b.StartsAt }},
		{"ends equals starts", func(b *AdBanner) { b.EndsAt = b.StartsAt }},
		{"zero window dates", func(b *AdBanner) { b.StartsAt, b.EndsAt = time.Time{}, time.Time{} }},
		{"window over 180 days", func(b *AdBanner) { b.EndsAt = b.StartsAt.Add(181 * 24 * time.Hour) }},
		{"exactly 180 days allowed", func(b *AdBanner) { b.EndsAt = b.StartsAt.Add(180 * 24 * time.Hour) }},
		{"zero target project id", func(b *AdBanner) { b.TargetProjectIDs = []uint{0} }},
		{"duplicate target project ids", func(b *AdBanner) { b.TargetProjectIDs = []uint{7, 7} }},
		{"multiple target projects", func(b *AdBanner) { b.TargetProjectIDs = []uint{7, 8} }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			b := validAdBanner()
			tc.mutate(b)
			if tc.name == "exactly 180 days allowed" {
				if err := b.Validate(); err != nil {
					t.Fatalf("expected 180-day window to validate, got %v", err)
				}
				return
			}
			if err := b.Validate(); err == nil {
				t.Fatalf("expected validation error for %s", tc.name)
			}
		})
	}
}

func TestAdBannerValidateAcceptsPlusPrefixedPhone(t *testing.T) {
	b := validAdBanner()
	b.CTAs = []AdBannerCTA{{Label: "Gọi hotline", Type: AdBannerCTATypePhone, Value: "+84914827988"}}
	if err := b.Validate(); err != nil {
		t.Fatalf("expected +84 phone to validate, got %v", err)
	}
}

func TestAdBannerIsLiveAtHalfOpenWindow(t *testing.T) {
	b := validAdBanner()

	if b.IsLiveAt(b.StartsAt.Add(-time.Second)) {
		t.Error("before starts_at must not be live")
	}
	if !b.IsLiveAt(b.StartsAt) {
		t.Error("at starts_at must be live (closed start)")
	}
	if !b.IsLiveAt(b.EndsAt.Add(-time.Second)) {
		t.Error("just before ends_at must be live")
	}
	if b.IsLiveAt(b.EndsAt) {
		t.Error("at ends_at must NOT be live (open end)")
	}

	b.IsActive = false
	if b.IsLiveAt(b.StartsAt.Add(time.Hour)) {
		t.Error("paused campaign must not be live")
	}
}

func TestAdBannerTargetsProject(t *testing.T) {
	broadcast := validAdBanner()
	if !broadcast.TargetsProject(999) {
		t.Error("empty target list broadcasts to every project")
	}

	targeted := validAdBanner()
	targeted.TargetProjectIDs = []uint{12}
	if !targeted.TargetsProject(12) {
		t.Error("targeted project must match")
	}
	if targeted.TargetsProject(13) {
		t.Error("untargeted project must not match")
	}
	if !targeted.TargetsAnyProject([]uint{13, 12}) {
		t.Error("TargetsAnyProject must match when one of the employee's projects is targeted")
	}
	if targeted.TargetsAnyProject([]uint{13}) {
		t.Error("TargetsAnyProject must not match disjoint sets")
	}
}
