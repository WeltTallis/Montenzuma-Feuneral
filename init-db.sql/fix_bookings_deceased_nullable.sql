-- Fix: make bookings.deceased_name optional and add expected_by column
-- for databases that already created the table with deceased_name NOT NULL.

ALTER TABLE bookings
  MODIFY deceased_name VARCHAR(255) NULL;

SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'expected_by'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN expected_by DATE NULL AFTER service_date',
  'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
