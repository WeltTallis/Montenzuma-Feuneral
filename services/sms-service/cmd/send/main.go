// Command send sends an SMS via Africa's Talking SMS service.
//
// Uses the Africa's Talking client from the parent module (github.com/tech-kenya/africastalkingsms).
// Runs with: go run ./cmd/send
// e.g. go run ./cmd/send 254740045355 "Hello from RestPoint!"
package main

import (
	"log"
	"os"
	"strings"

	africastalking "github.com/tech-kenya/africastalkingsms"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env from the sms-service root
	if err := godotenv.Load("../../.env"); err != nil {
		_ = godotenv.Load("../../.env.production")
	}

	if len(os.Args) < 2 {
		log.Fatal("usage: send <phone> [message]")
	}

	recipient := os.Args[1]
	var message string
	if len(os.Args) > 2 {
		message = strings.Join(os.Args[2:], " ")
	} else {
		message = "Hello from RestPoint!"
	}

	apiKey := strings.TrimSpace(os.Getenv("AFRICANS_TALKING_API_KEY"))
	if apiKey == "" {
		log.Fatal("missing API key: set AFRICANS_TALKING_API_KEY in .env")
	}

	username := strings.TrimSpace(os.Getenv("atUserName"))
	if username == "" {
		username = strings.TrimSpace(os.Getenv("username"))
	}
	if username == "" {
		username = "sandbox"
	}

	atShortCode := strings.TrimSpace(os.Getenv("atShortCode"))
	sandbox := strings.TrimSpace(os.Getenv("sandboxEnv"))
	if sandbox == "" {
		sandbox = strings.TrimSpace(os.Getenv("sandbox"))
	}
	if sandbox == "" {
		sandbox = "true"
	}

	// If no short code is configured, use the default sandbox short code
	if atShortCode == "" {
		atShortCode = "30216"
	}
	client, err := africastalking.NewSMSClient(apiKey, username, atShortCode, sandbox)
	if err != nil {
		log.Fatalf("failed to initialize Africa's Talking client: %v", err)
	}

	log.Printf("Sending SMS to %s ...", recipient)
	response, err := client.SendSMS(recipient, message)
	if err != nil {
		log.Fatalf("Failed to send SMS: %v", err)
	}

	log.Println("Response:", response)
	println("SMS sent to", recipient, ":", message)
}

