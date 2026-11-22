$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
        python -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python virtual environment setup failed.' }
    }
    & ./.venv/Scripts/python.exe -m pip install -r requirements-tools.txt
    if ($LASTEXITCODE -ne 0) { throw 'Local media-tool installation failed.' }
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'Project-local dependency installation failed.' }
    $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $projectRoot '.cache/ms-playwright'
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Local Chromium download failed.' }
    Write-Output 'Ready. Run npm run dev and open http://127.0.0.1:3000.'
    Write-Output 'Node dependencies: node_modules. Python tools: .venv. No backend services installed.'
} finally {
    Pop-Location
}
