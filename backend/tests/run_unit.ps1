param(
    [string]$Tests = "",
    [string]$HtmlReport = "",
    [switch]$Headless
)

$BackendDir = Split-Path -Parent $PSScriptRoot
Set-Location $BackendDir

$Env:PYTHONPATH = "$BackendDir;$BackendDir\tests"

$venvActivate = "$BackendDir\venv\Scripts\Activate.ps1"
. $venvActivate

$pytestArgs = @(
    "tests/unit",
    "-v"
)

if ($Tests) {
    $pytestArgs += "-k", $Tests
}

if ($HtmlReport) {
    $pytestArgs += "--html=$HtmlReport", "--self-contained-html"
}

Write-Host "Executing: pytest $($pytestArgs -join ' ')" -ForegroundColor Cyan
python -m pytest @pytestArgs

$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "All unit tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some unit tests failed (exit code: $exitCode)" -ForegroundColor Red
}
exit $exitCode
