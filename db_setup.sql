
-- Connect as postgres superuser
-- Command: psql -U postgres

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
