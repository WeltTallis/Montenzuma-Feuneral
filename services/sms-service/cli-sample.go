//go:build ignore
// +build ignore
package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	africastalking "github.com/tech-kenya/africastalkingsms"
)

// Run with: go run cli-sample.go [phone] [message]
// e.g. go run cli-sample.go 254740045355 "Hello from RestPoint!"
func main() {
	if len(os.Args) < 2 {
		log.Fatal("usage: cli-sample.go <phone> [message]")
	}

	recipient := os.Args[1]
	var message string
	if len(os.Args) > 2 {
		message = strings.Join(os.Args[2:], " ")
	} else {
		message = "Hello from Africa's Talking!"
	}

	apiKey := os.Getenv("atApiKey")
	if apiKey == "" {
		apiKey = os.Getenv("AFRICANS_TALKING_API_KEY")
	}
	// .env stores values with quotes (e.g. atApiKey="..."), strip them
	apiKey = strings.Trim(apiKey, "\"'")
	if apiKey == "" {
		log.Fatal("missing API key: set atApiKey in .env")
	}

	username := os.Getenv("atUserName")
	if username == "" {
		username = os.Getenv("username")
	}
	if username == "" {
		username = "sandbox"
	}

	atShortCode := os.Getenv("atShortCode")
	sandbox := os.Getenv("sandboxEnv")
	if sandbox == "" {
		sandbox = os.Getenv("sandbox")
	}
	if sandbox == "" {
		sandbox = "true"
	}
	// If no short code is configured, generate the default sandbox short code
	if atShortCode == "" {
		atShortCode = "30216"
	}

	client, err := africastalking.NewSMSClient(apiKey, username, atShortCode, sandbox)
	if err != nil {
		log.Fatalf("failed to initialize Africa's Talking client: %v", err)
	}

	log.Printf("Sending SMS to %s ...", recipient)
	response, err := client.SendSMS("+254740045355", message)
	if err != nil {
		log.Fatalf("Failed to send SMS: %v", err)
	}

	log.Println("Response:", response)
	fmt.Printf("SMS sent to %s: %s\n", recipient, message)
}
