package main

import (
	"log"
	"os"

	africastalking "github.com/tech-kenya/africastalkingsms"
)

// Run with: go run cli/cli-sample.go
func main() {
	apiKey := os.Getenv("atApiKey")
	username := os.Getenv("atUserName")
	atShortCode := os.Getenv("atShortCode")
	sandbox := os.Getenv("sandbox")
	client, err := africastalking.NewSMSClient(apiKey, username, atShortCode, sandbox)
	log.Println(client)
	if err != nil {
		log.Fatal(err)
	}
	response, err := client.SendSMS("+254746554245", "Hello from Go!")
	if err != nil {
		log.Fatal("Failed to send SMS:", err)
	}

	log.Println("Response:", response)
}
