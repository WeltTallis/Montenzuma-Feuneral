-- ============================================
-- Branch Connections Table
-- ============================================
-- This table tracks relationships between branches so they can
-- communicate with each other (e.g., request coffin inventory transfers).
-- 
-- When a branch connection is created, it is bidirectional:
--   - Branch A → Branch B (branch_id = A, connected_branch_id = B)
--   - Branch B → Branch A (branch_id = B, connected_branch_id = A)
--
-- Connection types:
--   - referral:      One branch refers clients to another
--   - transfer:      Branches can transfer inventory (coffins, etc.)
--   - partnership:   General partnership (default for auto-connected branches)
--   - parent_child:  A parent branch with a child/satellite branch
--
-- Status:
--   - active:   Branches can communicate
--   - inactive: Connection exists but communication is paused
--   - pending:  Connection request awaiting approval

CREATE TABLE IF NOT EXISTS branch_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_slug VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    connected_branch_id INT NOT NULL,
    connection_type ENUM('referral','transfer','partnership','parent_child') DEFAULT 'partnership',
    status ENUM('active','inactive','pending') DEFAULT 'active',
    notes TEXT,
    created_at VARCHAR(255),
    updated_at VARCHAR(255),
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (connected_branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    INDEX idx_tenant_slug (tenant_slug),
    INDEX idx_branch_id (branch_id),
    INDEX idx_connected_branch_id (connected_branch_id),
    UNIQUE KEY unique_branch_connection (tenant_slug, branch_id, connected_branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Coffin Transfer Requests Table
-- ============================================
-- This table tracks requests to transfer coffin inventory between
-- connected branches. For example, Branch Y requests coffins from
-- Branch X. Branch X can approve/reject the request, and when
-- completed, the inventory is moved between branch databases.

CREATE TABLE IF NOT EXISTS coffin_transfer_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_slug VARCHAR(255) NOT NULL,
    from_branch_id INT NOT NULL,
    to_branch_id INT NOT NULL,
    coffin_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending',
    requested_by VARCHAR(255),
    notes TEXT,
    created_at VARCHAR(255),
    updated_at VARCHAR(255),
    INDEX idx_tenant_slug (tenant_slug),
    INDEX idx_from_branch (from_branch_id),
    INDEX idx_to_branch (to_branch_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;