package config

type SoftwareIdentity struct {
    Name          string `json:"name"`
    ProductID     string `json:"product_id"`
    ProductCode   string `json:"product_code"`
    Version       string `json:"version"`
    Build         string `json:"build"`
    ReleaseID     string `json:"release_id"`
    ReleaseStatus string `json:"release_status"`
    Copyright     string `json:"copyright"`
}

var Identity = SoftwareIdentity{

    Name:          "RestPoint",
    ProductID:     "RP-PROD-01",
    ProductCode:   "RESTPOINT",
    Version:       "1.0.0",
    Build:         "BUILD-000001",
    ReleaseID:     "RP-REL-2026-001",
    ReleaseStatus: "Stable",
    Copyright:     "Copyright © 2026 RestPoint",

}