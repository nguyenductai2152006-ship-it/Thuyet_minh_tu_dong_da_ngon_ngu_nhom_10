#!/bin/bash
set -euo pipefail
for service in identity poi localization audio; do
 var="${service^^}_DB_PASSWORD"; password="${!var}"
 [[ "$password" =~ ^[A-Fa-f0-9]{64}$ ]] || { echo "Service password must be 64 hex characters" >&2; exit 1; }
 MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot <<SQL
CREATE USER IF NOT EXISTS '${service}_app'@'%' IDENTIFIED BY '${password}';
GRANT ALL PRIVILEGES ON ${service}_db.* TO '${service}_app'@'%';
SQL
done
