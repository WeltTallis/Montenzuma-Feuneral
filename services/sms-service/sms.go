package africastalking

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

var httpClient http.Client

// Check how `json.Marshal/1` marshals arrays
type Request_data struct {
	Prod                 bool
	Api_key              string
	Username             string   //`username`
	To                   []string //`to`
	Message              string   //`message`
	From                 string   //`from`
	BulkSMSMode          int      //`bulkSMSMode`
	Enqueue              int      //`enqueue`
	Keyword              string   //`keyword`
	LinkId               string   //`linkId`
	RetryDurationInHours int      //`retryDurationInHours`
}

func (req_data *Request_data) encodeValues() []byte {
	data := url.Values{}
	data.Set("username", req_data.Username)
	data.Set("to", strings.Join(req_data.To, ","))
	data.Set("message", req_data.Message)
	setDataStr(&data, req_data.From, "from")
	setDataInt(&data, req_data.BulkSMSMode, "bulkSMSMode")
	setDataInt(&data, req_data.Enqueue, "enqueue")
	setDataStr(&data, req_data.Keyword, "keyword")
	setDataStr(&data, req_data.LinkId, "linkId")
	setDataInt(&data, req_data.RetryDurationInHours, "retryDurationInHours")

	return []byte(data.Encode())
}

func setDataStr(data *url.Values, val, key string) {
	if val != "" {
		data.Set(key, val)
	}
}

func setDataInt(data *url.Values, val int, key string) {
	if val != 0 {
		data.Set(key, fmt.Sprintf("%d", val))
	}
}

// ConfirmFields verifies that required parameters are present
func (req_data *Request_data) ConfirmFields() error {
	if req_data.Api_key == "" {
		return fmt.Errorf("`ConfirmFields` got `req_data.Api_key` is blank!")
	}
	if req_data.Username == "" {
		return fmt.Errorf("`ConfirmFields` got `req_data.Username` is blank!")
	}
	if len(req_data.To) == 0 {
		return fmt.Errorf("`ConfirmFields` got `req_data.To` has no numbers to send to!")
	}
	if req_data.Message == "" {
		return fmt.Errorf("`ConfirmFields` got `req_data.Message` is blank!")
	}
	return nil
}

// SendLegacySMS sends an SMS using the legacy Request_data structure
func (req_data *Request_data) SendLegacySMS() (map[string]interface{}, error) {
	json_map := make(map[string]interface{})

	prod := req_data.Prod
	if !prod {
		req_data.Username = "sandbox"
	}
	err := req_data.ConfirmFields()
	if err != nil {
		return json_map, fmt.Errorf("'req_data.ConfirmFields' got error: %w", err)
	}
	data := req_data.encodeValues()
	apiURL := "https://api.sandbox.africastalking.com/version1/messaging"
	if prod {
		apiURL = "https://api.africastalking.com/version1/messaging"
	}

	req, err := http.NewRequest("POST", apiURL, strings.NewReader(string(data)))
	if err != nil {
		return json_map, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("apiKey", req_data.Api_key)

	resp, err := httpClient.Do(req)
	if err != nil {
		return json_map, fmt.Errorf("httpClient.Do got error: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return json_map, fmt.Errorf("io.ReadAll got error: %w", err)
	}

	err = json.Unmarshal(body, &json_map)
	if err != nil {
		return json_map, fmt.Errorf("json.Unmarshal got error: %w", err)
	}
	return json_map, nil
}
