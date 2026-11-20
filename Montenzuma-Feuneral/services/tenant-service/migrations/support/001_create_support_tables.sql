-- Support Service Database Tables
-- This database is independent (not per-tenant) - shared across all tenants
-- Run against the 'support_db' database

CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_slug VARCHAR(100) NOT NULL,
    tenant_name VARCHAR(255),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    type VARCHAR(50) DEFAULT 'help',
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    created_at VARCHAR(255),
    updated_at VARCHAR(255),
    INDEX idx_tenant (tenant_slug),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ticket_replies (
    reply_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    tenant_slug VARCHAR(100) NOT NULL,
    created_at VARCHAR(255),
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_tenant (tenant_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;