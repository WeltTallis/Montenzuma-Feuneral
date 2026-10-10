package main

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const maxClaimDocumentBytes = 10 << 20

var claimDocumentFields = map[string]string{
	"deathCertificate": "death_certificate", "deathCert": "death_certificate", "docDeathCert": "death_certificate",
	"claimantId": "claimant_id", "claimantID": "claimant_id", "claimantIdDocument": "claimant_id", "docClaimantId": "claimant_id",
	"burialPermit": "burial_permit", "docBurialPermit": "burial_permit",
}

func claimSubmission(w http.ResponseWriter, r *http.Request) (map[string]any, map[string]*multipart.FileHeader, error) {
	if !strings.HasPrefix(strings.ToLower(r.Header.Get("Content-Type")), "multipart/form-data") {
		fields, err := body(r)
		return fields, nil, err
	}
	r.Body = http.MaxBytesReader(w, r.Body, 3*maxClaimDocumentBytes+(1<<20))
	if err := r.ParseMultipartForm(2 << 20); err != nil { return nil, nil, err }
	fields := make(map[string]any, len(r.MultipartForm.Value))
	for key, values := range r.MultipartForm.Value { if len(values) > 0 { fields[key] = values[0] } }
	files := make(map[string]*multipart.FileHeader)
	for field, headers := range r.MultipartForm.File {
		if len(headers) == 0 { continue }
		key, ok := claimDocumentFields[field]
		if !ok { return nil, nil, fmt.Errorf("unsupported document field %q", field) }
		if _, exists := files[key]; exists { return nil, nil, fmt.Errorf("only one file per document type is allowed") }
		if headers[0].Size > maxClaimDocumentBytes { return nil, nil, fmt.Errorf("claim document exceeds the 10 MB limit") }
		files[key] = headers[0]
	}
	return fields, files, nil
}

func saveClaimDocuments(tenantSlug string, claimID int64, files map[string]*multipart.FileHeader) (map[string]string, error) {
	paths := map[string]string{}
	if len(files) == 0 { return paths, nil }
	base := os.Getenv("GLOBAL_UPLOADS_DIR")
	if base == "" { base = os.Getenv("UPLOADS_BASE_DIR") }
	if base == "" { base = "/opt/storage/uploads" }
	tenantSlug = safePathPart(tenantSlug)
	dir := filepath.Join(base, "insurance", tenantSlug, "claims", fmt.Sprint(claimID))
	if err := os.MkdirAll(dir, 0750); err != nil { return nil, err }
	for key, header := range files {
		file, err := header.Open(); if err != nil { return paths, err }
		content := make([]byte, 512); n, readErr := file.Read(content)
		if readErr != nil && !errors.Is(readErr, io.EOF) { file.Close(); return paths, readErr }
		contentType := http.DetectContentType(content[:n])
		if contentType != "application/pdf" && contentType != "image/jpeg" && contentType != "image/png" { file.Close(); return paths, fmt.Errorf("%s must be a PDF, JPEG, or PNG file", key) }
		if _, err := file.Seek(0, io.SeekStart); err != nil { file.Close(); return paths, err }
		ext := map[string]string{"application/pdf":".pdf", "image/jpeg":".jpg", "image/png":".png"}[contentType]
		random := make([]byte, 16); if _, err := rand.Read(random); err != nil { file.Close(); return paths, err }
		name := hex.EncodeToString(random) + ext; target := filepath.Join(dir, name)
		out, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0640)
		if err != nil { file.Close(); return paths, err }
		size, copyErr := io.Copy(out, io.LimitReader(file, maxClaimDocumentBytes+1))
		closeErr := out.Close()
		file.Close()
		if copyErr != nil || closeErr != nil || size > maxClaimDocumentBytes {
			_ = os.Remove(target)
			if copyErr != nil { return paths, copyErr }
			if closeErr != nil { return paths, closeErr }
			return paths, fmt.Errorf("%s exceeds the 10 MB limit", key)
		}
		paths[key] = "/uploads/insurance/" + tenantSlug + "/claims/" + fmt.Sprint(claimID) + "/" + name
	}
	return paths, nil
}

func safePathPart(value string) string {
	value = strings.ToLower(strings.TrimSpace(value)); var b strings.Builder
	for _, r := range value { if r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '-' || r == '_' { b.WriteRune(r) } }
	if b.Len() == 0 { return "system_shared" }
	if b.Len() > 100 { return b.String()[:100] }
	return b.String()
}
