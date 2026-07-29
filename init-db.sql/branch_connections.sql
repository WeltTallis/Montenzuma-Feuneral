CREATE TABLE IF NOT EXISTS branch_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_slug VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    connected_branch_id INT NOT NULL,
    connection_type ENUM('referral','transfer','partnership','parent_child') DEFAULT 'referral',
    status ENUM('active','inactive','pending') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (connected_branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_tenant_slug (tenant_slug),
    INDEX idx_branch_id (branch_id),
    UNIQUE KEY unique_branch_connection (tenant_slug, branch_id, connected_branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;