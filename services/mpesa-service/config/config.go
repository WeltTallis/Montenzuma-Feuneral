package config

import (
	"os"
	"sync"

	"github.com/caarlos0/env/v11"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

type EnvCofig struct {
	AppPort        string `env:"APP_PORT,required"`
	AppEnv         string `env:"APP_ENV,required"`
	DBHost         string `env:"DB_HOST,required"`
	DBPort         string `env:"DB_PORT,required"`
	DBUser         string `env:"DB_USER,required"`
	DBPassword     string `env:"DB_PASSWORD,required"`
	DBName         string `env:"DB_NAME,required"`
	DBSSLMode      string `env:"DB_SSL_MODE,required"`
	ConsumerKey    string `env:"MPESA_CONSUMER_KEY,required"`
	ConsumerSecret string `env:"MPESA_CONSUMER_SECRET,required"`
	PassKey        string `env:"MPESA_PASSKEY,required"`
	ShortCode      string `env:"MPESA_SHORTCODE,required"`
	TillNumber     string `env:"MPESA_TILL_NUMBER"`
	MpesaUrl       string `env:"MPESA_URL,required"`
	MPesaTokenUrl  string `env:"MPESA_OAUTH_URL,required"`
	CallbackUrl    string `env:"CALL_BACK_URL,required"`
}

var (
	configOnce    sync.Once
	cachedConfig  *EnvCofig
)

func NewEnvConfig() *EnvCofig {
	configOnce.Do(func() {
		err := godotenv.Load()
		if err != nil && !os.IsNotExist(err) {
			logrus.Fatalf("Error loading .env file: %v", err)
		}
		parsed := &EnvCofig{}
		if err := env.Parse(parsed); err != nil {
			logrus.Fatalf("Error parsing env file: %v", err)
		}
		cachedConfig = parsed
		logrus.Info("Env Config Loaded successfully")
	})
	return cachedConfig
}
