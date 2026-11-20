CREATE TABLE IF NOT EXISTS api_keys (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_hash CHAR(64) NOT NULL COMMENT 'sha256 hex of the plaintext key',
    created_by BIGINT UNSIGNED NOT NULL,
    last_used_at DATETIME(3) NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY uq_api_keys_key_hash (key_hash),
    KEY idx_api_keys_revoked_at (revoked_at),
    CONSTRAINT fk_api_keys_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mcp_api_keys (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    scope VARCHAR(16) NOT NULL COMMENT 'read_only | full',
    key_prefix VARCHAR(20) NOT NULL,
    key_hash CHAR(64) NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    last_used_at DATETIME(3) NULL,
    revoked_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_mcp_api_keys_key_hash (key_hash),
    KEY idx_mcp_api_keys_revoked_at (revoked_at),
    CONSTRAINT fk_mcp_api_keys_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ops_api_keys (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT 'agent identity (audit attribution)',
    scope VARCHAR(16) NOT NULL COMMENT 'read_only | read_write',
    key_prefix VARCHAR(20) NOT NULL,
    key_hash CHAR(64) NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    last_used_at DATETIME(3) NULL,
    revoked_at DATETIME(3) NULL,
    write_window_expires_at DATETIME(3) NULL COMMENT 'read_write auto-reverts to read_only after this instant',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uq_ops_api_keys_key_hash (key_hash),
    KEY idx_ops_api_keys_revoked_at (revoked_at),
    KEY idx_ops_api_keys_write_window (write_window_expires_at),
    CONSTRAINT fk_ops_api_keys_creator FOREIGN KEY (created_by) REFERENCES users(id)
);
