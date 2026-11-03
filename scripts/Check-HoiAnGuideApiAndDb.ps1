$ErrorActionPreference = 'Continue'
$apiUrl = 'http://localhost:8080/api/pois'

Write-Host '=== HoiAnGuide CRUD synchronization quick check ===' -ForegroundColor Cyan
Write-Host '1) Checking GET /api/pois ...' -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get -TimeoutSec 12
    $items = if ($response -is [System.Array]) { $response } elseif ($response.items) { $response.items } elseif ($response.content) { $response.content } elseif ($response.data -is [System.Array]) { $response.data } else { @($response) }
    Write-Host "API reachable. POI rows returned by API: $($items.Count)" -ForegroundColor Green
    $items | Select-Object -First 5 id, name, qrCode, latitude, longitude, status | Format-Table -AutoSize
} catch {
    Write-Host "GET /api/pois failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Check API Gateway/poi-service, route configuration and ADMIN token if this endpoint requires authentication.' -ForegroundColor Yellow
}

Write-Host "`n2) Checking MySQL poi_db.pois row count ..." -ForegroundColor Cyan
try {
    docker compose exec -T mysql-db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "SELECT COUNT(*) FROM poi_db.pois;"'
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'Database query completed. Compare this count with the API response after test create/update/delete.' -ForegroundColor Green
    } else {
        Write-Host 'Database query failed; verify mysql-db is running and the root password environment variable is set.' -ForegroundColor Red
    }
} catch {
    Write-Host "Docker/MySQL check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nThis script is read-only. It does not create, update, or delete records." -ForegroundColor DarkCyan
Write-Host 'For a real CRUD proof, follow docs/CRUD_SYNC_CHECKLIST.md and use a clearly named temporary test POI.' -ForegroundColor DarkCyan
