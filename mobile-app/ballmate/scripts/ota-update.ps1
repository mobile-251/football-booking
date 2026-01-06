# OTA Update Script for Windows
# Usage: .\scripts\ota-update.ps1 -Env preview -Message "Your update message"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "preview", "production")]
    [string]$Env,
    
    [Parameter(Mandatory=$true)]
    [string]$Message
)

# Environment configurations
$configs = @{
    "development" = @{
        "EXPO_PUBLIC_API_URL" = "http://localhost:3001"
        "EXPO_PUBLIC_APP_ENV" = "development"
    }
    "preview" = @{
        "EXPO_PUBLIC_API_URL" = "https://ballmate-rest.aqbtech.id.vn"
        "EXPO_PUBLIC_APP_ENV" = "preview"
    }
    "production" = @{
        "EXPO_PUBLIC_API_URL" = "https://ballmate-rest.aqbtech.id.vn"
        "EXPO_PUBLIC_APP_ENV" = "production"
    }
}

$config = $configs[$Env]

Write-Host "=== OTA Update ===" -ForegroundColor Cyan
Write-Host "Environment: $Env" -ForegroundColor Yellow
Write-Host "API URL: $($config['EXPO_PUBLIC_API_URL'])" -ForegroundColor Yellow
Write-Host "Message: $Message" -ForegroundColor Yellow
Write-Host ""

# Set environment variables
$env:EXPO_PUBLIC_API_URL = $config["EXPO_PUBLIC_API_URL"]
$env:EXPO_PUBLIC_APP_ENV = $config["EXPO_PUBLIC_APP_ENV"]

# Run EAS update
Write-Host "Running: npx eas update --branch $Env --message `"$Message`"" -ForegroundColor Green
npx eas update --branch $Env --message $Message
