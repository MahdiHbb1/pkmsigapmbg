# 🗄️ MySQL 8.0 Installation Guide - SIGAP MBG

## Download & Install

1. **Download MySQL Installer**
   - URL: https://dev.mysql.com/downloads/installer/
   - Pilih: `mysql-installer-community-8.0.xx.msi` (Windows)
   - Size: ~400-500 MB

2. **Installation Steps**
   ```
   a. Run installer (mysql-installer-community-x.x.xx.msi)
   b. Choose Setup Type: "Developer Default" (Recommended)
   c. Check Requirements → Install prerequisites jika ada
   d. Execute Installation → Wait 5-10 minutes
   
   e. MySQL Server Configuration:
      - Config Type: Development Computer
      - Port: 3306 (default)
      - Root Password: [BUAT PASSWORD KUAT, CATAT!]
      - Windows Service: YES, Start at System Startup
   
   f. Apply Configuration → Execute
   g. Finish Installation
   ```

3. **Verifikasi Install**
   ```powershell
   # Test MySQL Command
   mysql --version
   
   # Output expected:
   # mysql  Ver 8.0.xx for Win64 on x86_64 (MySQL Community Server - GPL)
   ```

---

## Setup SIGAP MBG Database

### Step 1: Login ke MySQL
```powershell
mysql -u root -p
# Enter password yang dibuat tadi
```

### Step 2: Create Database & User
```sql
-- Create database
CREATE DATABASE sigap_mbg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user (optional, lebih aman)
CREATE USER 'sigap_user'@'localhost' IDENTIFIED BY 'sigap_password_2026';
GRANT ALL PRIVILEGES ON sigap_mbg.* TO 'sigap_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

### Step 3: Import Schema
```powershell
cd C:\nitipmehdi\pkmsigapmbg-main\pkmsigapmbg-main
mysql -u root -p sigap_mbg < sigap-mbg-dashboard/backend/migrations/init.sql
```

### Step 4: Configure Backend .env
Edit file: `sigap-mbg-dashboard/backend/.env`

```env
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD_HERE
DB_NAME=sigap_mbg

# API Keys
DEVICE_API_KEYS=test-key-esp32-2026,test-key-simulator-2026
```

---

## Alternative: Quick Install via Chocolatey (Jika ada)

```powershell
# Check if Chocolatey installed
choco --version

# Install MySQL
choco install mysql -y

# Start MySQL Service
net start MySQL80
```

---

## Alternative: XAMPP (Easier for Beginners)

1. **Download XAMPP**
   - URL: https://www.apachefriends.org/download.html
   - Size: ~150 MB
   - Include: MySQL + phpMyAdmin GUI

2. **Install & Start**
   ```
   a. Run installer xampp-windows-x64-x.x.xx-installer.exe
   b. Install to: C:\xampp
   c. Open XAMPP Control Panel
   d. Start "MySQL" service
   e. Click "Admin" → Opens phpMyAdmin in browser
   ```

3. **Create Database via phpMyAdmin**
   ```
   a. Click "New" di sidebar
   b. Database name: sigap_mbg
   c. Collation: utf8mb4_unicode_ci
   d. Create
   e. Click "Import" tab
   f. Choose file: sigap-mbg-dashboard/backend/migrations/init.sql
   g. Click "Go"
   ```

4. **Configure .env for XAMPP**
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sigap_mbg
   ```
   *(XAMPP MySQL default: user=root, password kosong)*

---

## Troubleshooting

### MySQL Service Won't Start
```powershell
# Check service status
Get-Service MySQL80

# Start manually
net start MySQL80

# Check port 3306 tidak dipakai aplikasi lain
netstat -ano | findstr :3306
```

### "Access Denied" Error
```sql
-- Reset root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Can't Connect from Backend
```sql
-- Allow remote connection (if needed)
UPDATE mysql.user SET host='%' WHERE user='root';
FLUSH PRIVILEGES;
```

---

## Test Connection

### Via MySQL CLI
```powershell
mysql -u root -p -e "SHOW DATABASES;"
```

### Via Backend Test
```powershell
cd sigap-mbg-dashboard/backend
node -e "require('./src/db/connection').query('SELECT 1+1 AS result', (err, res) => { if(err) console.error(err); else console.log('✅ DB Connected:', res[0]); process.exit(); })"
```

---

## Next Steps After MySQL Setup

1. ✅ Import schema (init.sql)
2. ✅ Configure .env file
3. ✅ Test backend connection
4. 🚀 Start backend: `npm run dev`
5. 🌐 Open dashboard: http://localhost:3000

---

**Installation Time Estimate:**
- MySQL Installer: 10-15 minutes
- XAMPP: 5-8 minutes
- Configuration: 3-5 minutes

**TOTAL: ~15-20 minutes**
