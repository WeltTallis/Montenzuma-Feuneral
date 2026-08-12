-- ============================================
-- MINI STORE SERVICE - store_tables
-- ============================================

CREATE TABLE IF NOT EXISTS store_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
    stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(12,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_store_items_name (name),
    INDEX idx_store_items_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    action ENUM('used','restocked','adjusted') NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    staff VARCHAR(255) NOT NULL DEFAULT 'Store Clerk',
    reason VARCHAR(500),
    remaining DECIMAL(12,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_store_tx_item (item_id),
    INDEX idx_store_tx_action (action),
    INDEX idx_store_tx_created (created_at),
    INDEX idx_store_tx_staff (staff)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;