param(
    [string]$Tests = "",
    [string]$HtmlReport = "",
    [switch]$Headless
)

$BackendDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $BackendDir

$Env:PYTHONPATH = "$BackendDir;$BackendDir\tests\e2e"

$venvActivate = "$BackendDir\venv\Scripts\Activate.ps1"
. $venvActivate

$pytestArgs = @(
    "tests/e2e/tests",
    "--rootdir=tests/e2e",
    "-v"
)

if ($Tests) {
    $pytestArgs += "-k", $Tests
}

if ($HtmlReport) {
    $pytestArgs += "--html=$HtmlReport", "--self-contained-html"
}

if ($Headless) {
    $Env:HEADLESS = "1"
}

Write-Host "Executing: python -m pytest $($pytestArgs -join ' ')" -ForegroundColor Cyan
python -m pytest @pytestArgs

$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed (exit code: $exitCode)" -ForegroundColor Red
}
exit $exitCode
