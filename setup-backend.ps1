#!/usr/bin/env pwsh
# CargoFlow Backend Setup Script
# Run from: C:\Users\bouya\OneDrive\Desktop\CargoFlow\
# Usage: .\setup-backend.ps1

$Root    = $PSScriptRoot
$ApiDir  = Join-Path $Root "api"
$SkelDir = Join-Path $Root "backend"

Write-Host "`n🛫  CargoFlow Backend Setup`n" -ForegroundColor Cyan

# ── 1. Check Composer ──────────────────────────────────────────────────────────
Write-Host "Checking Composer..." -ForegroundColor Yellow
try {
    $cv = composer --version 2>&1
    Write-Host "  $cv" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Composer not found. Install from: https://getcomposer.org" -ForegroundColor Red
    exit 1
}

# ── 2. Install Laravel ─────────────────────────────────────────────────────────
if (Test-Path (Join-Path $ApiDir "artisan")) {
    Write-Host "Laravel already installed in api/ — skipping." -ForegroundColor Green
} else {
    Write-Host "`nInstalling Laravel into api/ ..." -ForegroundColor Yellow
    Set-Location $Root
    composer create-project laravel/laravel api --prefer-dist --no-interaction
    if (-not (Test-Path (Join-Path $ApiDir "artisan"))) {
        Write-Host "  ✗ Laravel installation failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Laravel installed." -ForegroundColor Green
}

Set-Location $ApiDir

# ── 3. Install packages ────────────────────────────────────────────────────────
Write-Host "`nInstalling packages..." -ForegroundColor Yellow
composer require laravel/sanctum spatie/laravel-permission spatie/laravel-activitylog barryvdh/laravel-dompdf --no-interaction
Write-Host "  ✓ Packages installed." -ForegroundColor Green

# ── 4. Copy skeleton files ─────────────────────────────────────────────────────
Write-Host "`nCopying CargoFlow backend files..." -ForegroundColor Yellow

# Models
$modelSrc = Join-Path $SkelDir "app\Models"
$modelDst = Join-Path $ApiDir  "app\Models"
if (Test-Path $modelSrc) {
    Copy-Item -Path "$modelSrc\*" -Destination $modelDst -Recurse -Force
    Write-Host "  ✓ Models copied." -ForegroundColor Green
}

# Controllers
$ctrlSrc = Join-Path $SkelDir "app\Http\Controllers\Api"
$ctrlDst = Join-Path $ApiDir  "app\Http\Controllers\Api"
if (Test-Path $ctrlSrc) {
    New-Item -ItemType Directory -Force -Path $ctrlDst | Out-Null
    Copy-Item -Path "$ctrlSrc\*" -Destination $ctrlDst -Recurse -Force
    Write-Host "  ✓ Controllers copied." -ForegroundColor Green
}

# Migration
$migSrc = Join-Path $SkelDir "database\migrations"
$migDst = Join-Path $ApiDir  "database\migrations"
if (Test-Path $migSrc) {
    Copy-Item -Path "$migSrc\*" -Destination $migDst -Recurse -Force
    Write-Host "  ✓ Migrations copied." -ForegroundColor Green
}

# Seeder
$seedSrc = Join-Path $SkelDir "database\seeders\DatabaseSeeder.php"
$seedDst = Join-Path $ApiDir  "database\seeders\DatabaseSeeder.php"
if (Test-Path $seedSrc) {
    Copy-Item -Path $seedSrc -Destination $seedDst -Force
    Write-Host "  ✓ Seeder copied." -ForegroundColor Green
}

# Routes
Copy-Item -Path (Join-Path $SkelDir "routes\api.php") -Destination (Join-Path $ApiDir "routes\api.php") -Force
Write-Host "  ✓ Routes copied." -ForegroundColor Green

# ── 5. Patch User model — add 'status' to fillable ────────────────────────────
$userModel = Join-Path $ApiDir "app\Models\User.php"
$userContent = Get-Content $userModel -Raw
if (-not ($userContent -contains "'status'")) {
    $userContent = $userContent -replace "'email_verified_at',", "'email_verified_at',`n        'status',"
    Set-Content $userModel $userContent -Encoding utf8
    Write-Host "  ✓ User model patched (status field)." -ForegroundColor Green
}

# ── 6. Patch users migration — add status column ──────────────────────────────
$migFiles = Get-ChildItem (Join-Path $ApiDir "database\migrations") -Filter "*create_users*"
foreach ($mf in $migFiles) {
    $mc = Get-Content $mf.FullName -Raw
    if (-not ($mc -contains "status")) {
        $mc = $mc -replace "\`$table->timestamps\(\);", "`$table->string('status')->default('active');`n            `$table->timestamps();"
        Set-Content $mf.FullName $mc -Encoding utf8
        Write-Host "  ✓ Users migration patched." -ForegroundColor Green
    }
}

# ── 7. Configure .env ──────────────────────────────────────────────────────────
$envPath = Join-Path $ApiDir ".env"
Copy-Item (Join-Path $ApiDir ".env.example") $envPath -Force

php artisan key:generate --force

# Add CORS/Sanctum config
$envContent = Get-Content $envPath -Raw
if (-not ($envContent -contains "SANCTUM_STATEFUL")) {
    Add-Content $envPath "`nSANCTUM_STATEFUL_DOMAINS=localhost:3000`nFRONTEND_URL=http://localhost:3000"
}
Write-Host "  ✓ .env configured." -ForegroundColor Green

# ── 8. Patch cors config ───────────────────────────────────────────────────────
$corsPath = Join-Path $ApiDir "config\cors.php"
if (Test-Path $corsPath) {
    $corsContent = Get-Content $corsPath -Raw
    $corsContent  = $corsContent -replace "'allowed_origins' => \[.*?\]", "'allowed_origins' => ['http://localhost:3000']"
    Set-Content $corsPath $corsContent -Encoding utf8
    Write-Host "  ✓ CORS configured for http://localhost:3000." -ForegroundColor Green
}

# ── 9. Publish Sanctum & Spatie config ────────────────────────────────────────
Write-Host "`nPublishing configs..." -ForegroundColor Yellow
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider" --force | Out-Null
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider" --force | Out-Null
php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations" --force | Out-Null
Write-Host "  ✓ Configs published." -ForegroundColor Green

# ── 10. Patch config/auth.php — add sanctum guard ────────────────────────────
$authConfig = Join-Path $ApiDir "config\auth.php"
$authContent = Get-Content $authConfig -Raw
if (-not ($authContent -contains "'guard' => 'sanctum'")) {
    # Switch default API guard to sanctum
    $authContent = $authContent -replace "'api' => \[\s*'driver' => 'token'", "'api' => [
            'driver' => 'sanctum'"
    Set-Content $authConfig $authContent -Encoding utf8
    Write-Host "  ✓ Auth guard set to sanctum." -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit api\.env — set DB_DATABASE, DB_USERNAME, DB_PASSWORD" -ForegroundColor White
Write-Host "  2. Create the MySQL database:  CREATE DATABASE cargoflow;" -ForegroundColor White
Write-Host "  3. Run:  cd api" -ForegroundColor White
Write-Host "           php artisan migrate" -ForegroundColor White
Write-Host "           php artisan db:seed" -ForegroundColor White
Write-Host "           php artisan serve" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan


