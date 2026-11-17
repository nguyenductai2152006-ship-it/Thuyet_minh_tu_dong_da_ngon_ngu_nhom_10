[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
# Handle native exit codes explicitly (PowerShell 7); harmless on Windows PowerShell 5.
$PSNativeCommandUseErrorActionPreference = $false
$projectRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$composeFile = Join-Path $projectRoot 'compose.admin-e2e.yml'
if (!(Test-Path -LiteralPath $composeFile)) { throw 'Missing compose.admin-e2e.yml.' }
if (!(Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Docker CLI is required. Start Docker Desktop and run again.' }
$e2eRunId = [guid]::NewGuid().ToString('N')
$e2eProject = 'hoianguide-admin-e2e-' + $e2eRunId.Substring(0, 12)
if ($e2eProject -notmatch '^hoianguide-admin-e2e-[a-f0-9]{12}$') { throw 'Unsafe E2E project name.' }
$reportDir = Join-Path $projectRoot ('artifacts/admin-e2e/' + $e2eRunId)
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$keys = @('E2E_RUN_ID', 'E2E_MYSQL_PASSWORD', 'E2E_JWT_SECRET', 'E2E_ADMIN_PASSWORD', 'E2E_USER_PASSWORD')
$previous = @{}
foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
$env:E2E_RUN_ID = $e2eRunId
$env:E2E_MYSQL_PASSWORD = [guid]::NewGuid().ToString('N')
$env:E2E_JWT_SECRET = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$env:E2E_ADMIN_PASSWORD = [guid]::NewGuid().ToString('N')
$env:E2E_USER_PASSWORD = [guid]::NewGuid().ToString('N')
$composeArgs = @('compose', '--project-name', $e2eProject, '--file', $composeFile)
$exitStatus = 1
$phase = 'SETUP_FAILED'
$cleanupSucceeded = $false
try {
    & docker @composeArgs config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Invalid E2E Compose configuration.' }
    & docker @composeArgs build
    if ($LASTEXITCODE -ne 0) { throw 'E2E image build failed.' }
    # One-shot fixture completes before applications start. Do not use
    # --abort-on-container-exit: the fixture normally exits with code 0.
    & docker @composeArgs up -d frontend
    if ($LASTEXITCODE -ne 0) { throw 'E2E dependencies did not start.' }
    $phase = 'TESTS_FAILED'
    & docker @composeArgs run --rm --no-deps admin-e2e
    $runnerCode = $LASTEXITCODE
    $resultPath = Join-Path $reportDir 'admin-e2e-results.json'
    if (!(Test-Path -LiteralPath $resultPath)) { throw 'Runner did not create a report for this run.' }
    $result = Get-Content -Raw -Encoding UTF8 -LiteralPath $resultPath | ConvertFrom-Json
    if ($result.runId -ne $e2eRunId) { throw 'Report run ID does not match; stale results are refused.' }
    if ($runnerCode -ne 0 -or $result.failed -ne 0 -or $result.fatal -or $result.passed -le 0) { throw 'One or more E2E checks failed. See the report.' }
    $phase = 'PASSED'
    $exitStatus = 0
    Write-Host "E2E PASS: $($result.passed) checks. Report: $resultPath"
}
catch {
    Write-Host "E2E did not pass: $($_.Exception.Message)"
    # Logs from this disposable project only; no docker inspect/env output.
    & docker @composeArgs logs --no-color --tail 100 *> (Join-Path $reportDir 'services.log')
}
finally {
    # This UUID project is created by this launcher. The main app's project
    # and volumes are never used by this Compose file.
    & docker @composeArgs down --volumes --remove-orphans
    $cleanupSucceeded = $LASTEXITCODE -eq 0
    if (!$cleanupSucceeded) { $exitStatus = 1; Write-Host "Cleanup failed for disposable project $e2eProject" }
    [PSCustomObject]@{
        runId = $e2eRunId
        project = $e2eProject
        phase = $phase
        cleanupSucceeded = $cleanupSucceeded
        exitCode = $exitStatus
        completedAt = [DateTime]::UtcNow.ToString('o')
    } | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $reportDir 'launcher-status.json')
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}
Write-Host "Reports: $reportDir"
exit $exitStatus
