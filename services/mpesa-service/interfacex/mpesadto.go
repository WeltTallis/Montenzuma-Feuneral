package interfacex

import "time"

type STKPushRequest struct {
	ID                  uint `gorm:"primaryKey"`
	Amount              string    `json:"amount"`
	PhoneNumber         string    `json:"phoneNumber"`
	AccountReference    string    `json:"accountReference"`
	TransactionDesc     string    `json:"transactionDesc"`
	TransactionType     string    `json:"transactionType"`
	CallBackURL         string    `json:"callBackURL"`
	BusinessShortCode   string    `json:"businessShortCode"`
	PartyA              string    `json:"partyA"`
	PartyB              string    `json:"partyB"`
	CheckoutRequestID   string    `json:"checkoutRequestID"`
	MerchantRequestID   string    `json:"merchantRequestID"`
	ResponseCode        string    `json:"responseCode"`
	ResponseDescription string    `json:"responseDescription"`
	CustomerMessage     string    `json:"customerMessage"`
	TenantSlug          string    `json:"tenantSlug" gorm:"-"`
	DeceasedID          string    `json:"deceasedId" gorm:"-"`
	AdmissionNumber     string    `json:"admissionNumber" gorm:"-"`
	PayerName           string    `json:"payerName" gorm:"-"`
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type STKPushResponse struct {
	MerchantRequestID   string
	CheckoutRequestID   string
	ResponseCode        string
	ResponseDescription string
	CustomerMessage     string
}
