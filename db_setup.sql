-- ============================================
-- Catalog Database Setup - After Fresh Install
-- ============================================

-- Step 1: Connect as postgres superuser
-- Command: psql -U postgres
-- (You'll be prompted for the postgres password you set during install)

-- Create the catalog database
CREATE DATABASE catalog;

-- Create the catalog user with encrypted password
CREATE USER catalog_user WITH ENCRYPTED PASSWORD 'catalog_pass';

-- Grant all privileges on the catalog database to catalog_user
GRANT ALL PRIVILEGES ON DATABASE catalog TO catalog_user;

-- Connect to the catalog database
\c catalog

-- Create the catalog schema
CREATE SCHEMA IF NOT EXISTS catalog;

-- Grant schema usage and creation privileges to catalog_user
GRANT USAGE, CREATE ON SCHEMA catalog TO catalog_user;

-- Grant privileges on existing tables and sequences
GRANT ALL ON ALL TABLES IN SCHEMA catalog TO catalog_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA catalog TO catalog_user;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA catalog 
    GRANT ALL ON TABLES TO catalog_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA catalog 
    GRANT ALL ON SEQUENCES TO catalog_user;

-- Exit
\q

-- ============================================
-- Verification
-- ============================================

-- Now you should be able to connect as catalog_user:
-- psql -U catalog_user -d catalog
-- 
-- Test commands once connected:
-- SELECT current_user, current_database();
-- \dn+ catalog
-- CREATE TABLE catalog.test_table (id SERIAL PRIMARY KEY, name VARCHAR(50));
-- DROP TABLE catalog.test_table;