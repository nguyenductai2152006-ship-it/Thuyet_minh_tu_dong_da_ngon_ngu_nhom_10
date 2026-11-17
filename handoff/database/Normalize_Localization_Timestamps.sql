-- Optional maintenance: stop all writers and back up first.
USE localization_db;
CREATE TABLE IF NOT EXISTS timestamp_normalization_audit (
  localization_id BIGINT NOT NULL,
  original_created_at DATETIME(6) NOT NULL,
  original_updated_at DATETIME(6) NOT NULL,
  normalized_updated_at DATETIME(6) NOT NULL,
  maintenance_recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  reason VARCHAR(255) NOT NULL,
  PRIMARY KEY (localization_id, original_created_at, original_updated_at)
);
START TRANSACTION;
INSERT IGNORE INTO timestamp_normalization_audit
  (localization_id, original_created_at, original_updated_at, normalized_updated_at, reason)
SELECT id, created_at, updated_at, created_at,
 'Legacy updated_at precedes created_at; real edit time unknown'
FROM poi_localizations WHERE updated_at < created_at;
UPDATE poi_localizations SET updated_at = created_at WHERE updated_at < created_at;
COMMIT;
