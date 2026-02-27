Param(
    [string]$VenvPath = ".\.venv",
    [string]$ExeName = "run_server",
    [string]$DistDir = ".\dist"
)

Write-Host "== Build backend script started =="

# Create venv if missing
if (-not (Test-Path $VenvPath)) {
    Write-Host "Creating virtual environment at $VenvPath..."
    python -m venv $VenvPath
} else {
    Write-Host "Virtual environment exists at $VenvPath"
}

$pythonExe = Join-Path $VenvPath "Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Error "Python executable not found at $pythonExe. Ensure Python is installed and venv created.";
    exit 1
}

# Upgrade pip and install requirements
Write-Host "Upgrading pip and installing requirements..."
& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install -r requirements.txt
& $pythonExe -m pip install pyinstaller

# Ensure dist dir exists
if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir | Out-Null
}

# Run PyInstaller
Write-Host "Running PyInstaller... this may take a while. Output will go to $DistDir"
& $pythonExe -m PyInstaller --onefile run_server.py --name $ExeName --distpath $DistDir --workpath build --specpath build --clean

# Verify result
$exePath = Join-Path $DistDir ($ExeName + ".exe")
if (Test-Path $exePath) {
    Write-Host "Success: Backend exe created at $exePath"
    exit 0
} else {
    Write-Error "Failed to create exe. Check PyInstaller output above and files under build\ and dist\"
    exit 2
}
