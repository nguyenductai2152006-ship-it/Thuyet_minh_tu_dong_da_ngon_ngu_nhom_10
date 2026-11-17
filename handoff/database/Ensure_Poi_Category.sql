USE poi_db;
SET @present=(SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='poi_db' AND TABLE_NAME='pois' AND COLUMN_NAME='category');
SET @ddl=IF(@present=0,'ALTER TABLE pois ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT ''heritage''','SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP);
START TRANSACTION;
UPDATE pois SET category=CASE
 WHEN qr_code='HOIANGUIDE_POI_3' THEN 'history'
 WHEN qr_code IN ('HOIANGUIDE_POI_4','HOIANGUIDE_POI_8') THEN 'oldhouse'
 WHEN qr_code IN ('HOIANGUIDE_POI_5','HOIANGUIDE_POI_7','HOIANGUIDE_POI_9') THEN 'assembly'
 WHEN qr_code='HOIANGUIDE_POI_6' THEN 'market' ELSE category END WHERE category='heritage' AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version='sync18_category_seed');
INSERT IGNORE INTO schema_migrations(version) VALUES ('sync18_category_seed');
COMMIT;
