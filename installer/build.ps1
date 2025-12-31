<#
.SYNOPSIS
    Builds the VDI-solid installer using Inno Setup (ISCC.exe).

.DESCRIPTION
    Expects:
        - vdi-solid_windows_x64.exe (in project root or dist)
    Produces:
        - dist/VDI-Setup-v<version>.exe

.PARAMETER Version
    Installer version (e.g. 0.4.1)
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

# Locate Inno Setup Compiler
$PossiblePaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles(x86)}\Inno Setup 5\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 5\ISCC.exe"
)

$ISCC = $null
foreach ($path in $PossiblePaths) {
    if (Test-Path $path) {
        $ISCC = $path
        break
    }
}

if (-not $ISCC) {
    Write-Error "Inno Setup Compiler (ISCC.exe) not found."
    exit 1
}

Write-Host "Found Inno Setup Compiler: $ISCC" -ForegroundColor Green

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Join-Path $ScriptDir ".."
$IssFile = Join-Path $ScriptDir "setup.iss"

# Normalize version
if ($Version -match '^v') {
    $Version = $Version.Substring(1)
}

Write-Host "Building VDI-solid Installer v$Version..."

# Run Inno Setup
$ISCCArgs = @(
    "/DMyAppVersion=$Version",
    $IssFile
)

& $ISCC $ISCCArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Inno Setup Compiler failed"
    exit 1
}

Write-Host "Installer built successfully." -ForegroundColor Green
