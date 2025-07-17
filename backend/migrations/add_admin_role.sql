-- Migration: Add admin role to users table
-- Date: 2025-01-10

-- First, let's check the current ENUM values
-- ALTER TABLE users MODIFY COLUMN account_type ENUM('parent','child','teacher','admin') NOT NULL;

-- For MySQL/MariaDB, we need to modify the ENUM to include 'admin'
ALTER TABLE users 
MODIFY COLUMN account_type ENUM('parent', 'child', 'teacher', 'admin') NOT NULL;

-- Add an index for faster admin queries
CREATE INDEX idx_account_type ON users(account_type);

-- Create admin_actions log table for audit trail
CREATE TABLE IF NOT EXISTS admin_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add is_super_admin flag for future use (optional)
ALTER TABLE users 
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE AFTER account_type;