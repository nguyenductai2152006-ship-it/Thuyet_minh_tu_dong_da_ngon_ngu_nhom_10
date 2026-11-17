-- HoiAnGuide Admin update 2026-10-29. Additive and rerunnable; no data is deleted.
USE poi_db;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='poi_db' AND table_name='analytics_events' AND column_name='device_id'), 'SELECT 1', 'ALTER TABLE analytics_events ADD COLUMN device_id char(36) NULL');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='poi_db' AND table_name='analytics_events' AND column_name='device_type'), 'SELECT 1', 'ALTER TABLE analytics_events ADD COLUMN device_type varchar(24) NULL');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='poi_db' AND table_name='analytics_events' AND column_name='device_name'), 'SELECT 1', 'ALTER TABLE analytics_events ADD COLUMN device_name varchar(80) NULL');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='poi_db' AND table_name='analytics_events' AND column_name='platform'), 'SELECT 1', 'ALTER TABLE analytics_events ADD COLUMN platform varchar(32) NULL');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='poi_db' AND table_name='analytics_events' AND column_name='browser_name'), 'SELECT 1', 'ALTER TABLE analytics_events ADD COLUMN browser_name varchar(48) NULL');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF(EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema='poi_db' AND table_name='analytics_events' AND index_name='idx_device_time'), 'SELECT 1', 'CREATE INDEX idx_device_time ON analytics_events(device_id, created_at)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
