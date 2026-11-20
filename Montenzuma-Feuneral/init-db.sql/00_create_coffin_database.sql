-- ============================================
-- COFFIN SERVICE - central (shared) coffin database
-- One central database serves coffin inventory, bookings/orders, stock requests,
-- images, coffin usage and deceased-coffin assignments for ALL tenants.
-- The coffin service runs its own knex migrations independently against this DB.
-- ============================================
CREATE DATABASE IF NOT EXISTS restpoint_coffin
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON restpoint_coffin.* TO 'restpoint_user'@'%';
FLUSH PRIVILEGES;