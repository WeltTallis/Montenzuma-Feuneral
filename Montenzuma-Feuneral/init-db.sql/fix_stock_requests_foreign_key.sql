-- Fix stock_requests foreign key constraint to allow cross-branch requests
-- This allows requesting coffins from other branches

-- Drop the foreign key constraint on coffin_id
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'stock_requests' 
  AND COLUMN_NAME = 'coffin_id'
  AND REFERENCED_TABLE_NAME IS NOT NULL
);

SET @sql = IF(@constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE stock_requests DROP FOREIGN KEY ', @constraint_name),
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the constraint was removed
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'stock_requests'
  AND COLUMN_NAME = 'coffin_id';