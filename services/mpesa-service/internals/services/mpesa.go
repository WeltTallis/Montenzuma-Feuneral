package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"os"

	"github.com/go-mpesa-integration/config"
	"github.com/go-mpesa-integration/interfacex"
	"github.com/go-mpesa-integration/internals/model"
	"github.com/go-mpesa-integration/internals/repository"
	"github.com/go-mpesa-integration/utils"
	"github.com/sirupsen/logrus"
)

type MpesaService interface {
	STKPush(ctx context.Context, request *interfacex.STKPushRequest) (*interfacex.STKPushResponse, error)
	SaveCallbackRequest(request *model.CallbackRequest) 

}

type mpesaService struct {
	mpesaRepo repository.MpesaRepository
}

func NewMpesaService(mpesaRepo repository.MpesaRepository) MpesaService {
	return &mpesaService{
		mpesaRepo: mpesaRepo,
	}
}

func (s *mpesaService) STKPush(ctx context.Context, request *interfacex.STKPushRequest) (*interfacex.STKPushResponse, error) {
	enConfig := config.NewEnvConfig()
	token, err := utils.GenerateAccessToken(enConfig.ConsumerKey, enConfig.ConsumerSecret)

	if err != nil {
		logrus.Errorf("Error generating access token: %v", err)
		return nil, err
	}

	//generate timestamps && password
	timeStamp := utils.GenerateTimeStamp()
	password := utils.GeneratePassword(enConfig.ShortCode, enConfig.PassKey, timeStamp)



	// callback url -> /api/v1/stkcallback
	callbackBase := strings.TrimSpace(enConfig.CallbackUrl)
	if callbackBase == "" {
		return nil, fmt.Errorf("CALL_BACK_URL must be configured")
	}
	callback, err := url.Parse(callbackBase)
	if err != nil {
		return nil, fmt.Errorf("invalid CALL_BACK_URL: %w", err)
	}
	query := callback.Query()
	query.Set("businessnumber", strings.TrimSpace(enConfig.ShortCode))
	query.Set("reference", strings.TrimSpace(request.AccountReference))
	callback.RawQuery = query.Encode()
	callbackURL := callback.String()

	logrus.Infof("Generated callback URL: %s", callbackURL)

	
	partyB := enConfig.ShortCode
transactionType := "CustomerPayBillOnline"
if till := strings.TrimSpace(os.Getenv("MPESA_TILL_NUMBER")); till != "" {
	partyB = till
	transactionType = "CustomerBuyGoodsOnline"
}

// request body
reqPayload := map[string]interface{}{
	"BusinessShortCode": enConfig.ShortCode,
	"Password":          password,
	"Timestamp":         timeStamp,
	"TransactionType":   transactionType,
	"Amount":            request.Amount,
	"PartyA":            request.PhoneNumber,
	"PartyB":            partyB,
	"PhoneNumber":       request.PhoneNumber,
	"CallBackURL":       callbackURL,
	"AccountReference":  request.AccountReference,
	"TransactionDesc":   request.TransactionDesc,
}
	// make a post request to the mpesa api

	url := enConfig.MpesaUrl
	reqBody, err := json.Marshal(reqPayload)

	if err != nil {
		logrus.Errorf("Error marshaling request body: %v", err)
		return nil, err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(reqBody))

	if err != nil {
		logrus.Errorf("Error creating request: %v", err)
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}

	res , err := client.Do(req)

	if err != nil {
		logrus.Errorf("Error making request: %v", err)
		return nil, err
	}
	defer res.Body.Close()

	var response interfacex.STKPushResponse

	bodyBytes, _ := io.ReadAll(res.Body)
	logrus.Infof("Safaricom STK Response status: %d body: %s", res.StatusCode, string(bodyBytes))
	err = json.Unmarshal(bodyBytes, &response)

	if err != nil {
		logrus.Errorf("Error decoding response: %v", err)
		return nil, err
	}

	if res.StatusCode >= 400 || (response.ResponseCode != "" && response.ResponseCode != "0") {
		logrus.Errorf("Safaricom STK Push failed: ResponseCode=%s, Desc=%s", response.ResponseCode, response.ResponseDescription)
		return nil, fmt.Errorf("M-Pesa rejected request: %s (%s)", response.ResponseDescription, response.CustomerMessage)
	}

	//save transaction to db using repository

	if err := s.mpesaRepo.SaveSTKPush(ctx, request, &response); err != nil {
		logrus.Errorf("Error saving transaction to db: %v", err)
		return nil, err
	}
	return &response, nil
}

func (s *mpesaService) SaveCallbackRequest(request *model.CallbackRequest)  {
	go func(){
		if err := s.mpesaRepo.SaveCallbackRequest(request); err != nil {
			logrus.Errorf("Error saving callback request: %v", err)
		}else {
            logrus.Info("Callback request saved successfully")
        }
	}()
}


