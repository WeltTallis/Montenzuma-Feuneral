package db

import (
	"net"
	"net/url"
	"strings"

	"github.com/go-mpesa-integration/config"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Init(config *config.EnvCofig, DBMigrator func(db *gorm.DB) error) *gorm.DB {
	for key, value := range map[string]string{
		"DB_HOST":     config.DBHost,
		"DB_PORT":     config.DBPort,
		"DB_USER":     config.DBUser,
		"DB_PASSWORD": config.DBPassword,
		"DB_NAME":     config.DBName,
		"DB_SSL_MODE": config.DBSSLMode,
	} {
		if strings.TrimSpace(value) == "" {
			logrus.Fatalf("Missing required database setting %s", key)
		}
	}

	// URL encoding keeps passwords containing @, :, #, %, or whitespace from
	// being misparsed by PostgreSQL's keyword/value DSN parser.
	databaseURI := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(config.DBUser, config.DBPassword),
		Host:   net.JoinHostPort(config.DBHost, config.DBPort),
		Path:   "/" + config.DBName,
		RawQuery: url.Values{
			"sslmode":  {config.DBSSLMode},
			"timezone": {"UTC"},
		}.Encode(),
	}
	dsn := databaseURI.String()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		logrus.Fatalf("Failed to connect to database: %s", err)
	}
	logrus.Info("Database connection established successfully")

	if err := DBMigrator(db); err != nil {
		logrus.Fatalf("Failed to run migrations: %s", err)
	}
	logrus.Info("Migrations run successfully")
	return db
}
