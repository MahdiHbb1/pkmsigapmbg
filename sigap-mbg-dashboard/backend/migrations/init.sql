-- SIGAP MBG Dashboard Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS sigap_mbg;
USE sigap_mbg;

-- Table: devices
-- Stores information about each SIGAP MBG unit deployed
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    location_name VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: readings
-- Stores all sensor readings and ML predictions from devices
CREATE TABLE IF NOT EXISTS readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    reading_timestamp DATETIME NOT NULL,
    mq135_mean FLOAT,
    mq135_std FLOAT,
    mq135_slope FLOAT,
    mq136_mean FLOAT,
    mq136_std FLOAT,
    mq136_slope FLOAT,
    temp_mean FLOAT,
    humidity_mean FLOAT,
    prediction ENUM('Layak', 'Perlu Diperiksa', 'Tidak Layak') NOT NULL,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    INDEX idx_device_timestamp (device_id, reading_timestamp),
    INDEX idx_prediction (prediction),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Optional: users table for authentication (not implemented in MVP)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'petugas',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample device for testing
INSERT INTO devices (device_id, location_name) 
VALUES ('SIGAP-MBG-01', 'SPPG Universitas Negeri Semarang')
ON DUPLICATE KEY UPDATE device_id=device_id;
