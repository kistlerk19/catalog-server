#!/usr/bin/env bash
# ============================================
# PostgreSQL Complete Uninstall and Reinstall on Ubuntu
# ============================================

echo "=== STEP 1: COMPLETE POSTGRESQL UNINSTALL ==="

# Stop PostgreSQL service
sudo systemctl stop postgresql

# Remove PostgreSQL packages
sudo apt-get --purge remove postgresql postgresql-*

# Remove configuration files and data directories
sudo rm -rf /var/lib/postgresql/
sudo rm -rf /var/log/postgresql/
sudo rm -rf /etc/postgresql/

# Remove PostgreSQL user
sudo deluser postgres

# Clean up any remaining packages
sudo apt-get autoremove
sudo apt-get autoclean

echo "=== STEP 2: FRESH POSTGRESQL INSTALLATION ==="

# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql

echo "=== STEP 3: INITIAL SETUP ==="

# Set password for postgres user (you'll be prompted)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres_password';"

echo "=== STEP 4: CONFIGURE AUTHENTICATION ==="

# Find and backup pg_hba.conf
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
HBA_FILE="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"

echo "Backing up pg_hba.conf..."
sudo cp $HBA_FILE $HBA_FILE.backup

# Modify pg_hba.conf to allow password authentication
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' $HBA_FILE

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql

echo "=== SETUP COMPLETE ==="
echo "PostgreSQL has been reinstalled and configured."
echo "You can now run the catalog database setup script."