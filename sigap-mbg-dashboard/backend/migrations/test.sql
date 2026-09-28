-- Quick test script to verify database setup
-- Run this after init.sql to check everything is working

USE sigap_mbg;

-- Check tables exist
SHOW TABLES;

-- Check devices table
SELECT * FROM devices;

-- Check readings table structure
DESCRIBE readings;

-- Insert test reading
INSERT INTO readings (
    device_id, reading_timestamp,
    mq135_mean, mq135_std, mq135_slope,
    mq136_mean, mq136_std, mq136_slope,
    temp_mean, humidity_mean,
    prediction, confidence
) VALUES (
    'SIGAP-MBG-01', 
    NOW(),
    245.3, 12.1, 0.85,
    18.7, 2.3, 0.12,
    29.4, 68.2,
    'Layak', 
    0.95
);

-- Verify insert
SELECT * FROM readings ORDER BY id DESC LIMIT 1;

-- Test query for dashboard
SELECT 
    d.device_id,
    d.location_name,
    r.reading_timestamp,
    r.prediction,
    r.confidence
FROM devices d
LEFT JOIN readings r ON d.device_id = r.device_id
WHERE r.reading_timestamp = (
    SELECT MAX(reading_timestamp) 
    FROM readings 
    WHERE device_id = d.device_id
);

SELECT 'Database setup OK!' as status;
