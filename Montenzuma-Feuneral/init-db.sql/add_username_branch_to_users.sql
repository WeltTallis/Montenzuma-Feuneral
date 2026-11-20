-- Migration: Add username and branch_id columns to users table for all tenant databases
-- Run against the MySQL server (not a specific database)

-- Restpoint Main (default tenant)
ALTER TABLE restpoint_main.users ADD COLUMN IF NOT EXISTS username VARCHAR(255) NULL AFTER email;
ALTER TABLE restpoint_main.users ADD COLUMN IF NOT EXISTS branch_id INT NULL AFTER role;
UPDATE restpoint_main.users SET username = SUBSTRING_INDEX(email, '@', 1) WHERE username IS NULL OR username = '';

-- All tenant databases
SET @sql = NULL;
SELECT GROUP_CONCAT(
    CONCAT(
        'ALTER TABLE `', TABLE_SCHEMA, '`.users ',
        'ADD COLUMN IF NOT EXISTS username VARCHAR(255) NULL AFTER email; ',
        'ALTER TABLE `', TABLE_SCHEMA, '`.users ',
        'ADD COLUMN IF NOT EXISTS branch_id INT NULL AFTER role; ',
        'UPDATE `', TABLE_SCHEMA, '`.users ',
        'SET username = SUBSTRING_INDEX(email, ''@'', 1) WHERE username IS NULL OR username = '''';'
    ) SEPARATOR ' '
) INTO @sql
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_NAME = 'users'
  AND TABLE_SCHEMA NOT IN ('tenant_tracking', 'support_db', 'information_schema', 'mysql', 'performance_schema', 'sys');

-- Execute the generated SQL if we found any databases
SET @sql = IFNULL(@sql, 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration complete: username and branch_id columns added to all user tables' as status;