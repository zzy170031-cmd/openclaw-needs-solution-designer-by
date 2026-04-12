$workspace = Split-Path -Parent $PSScriptRoot
$output = Join-Path $workspace "data\spg-web-ui-v2.out.log"
$errorLog = Join-Path $workspace "data\spg-web-ui-v2.err.log"

if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}

if (Test-Path -LiteralPath $errorLog) {
    Remove-Item -LiteralPath $errorLog -Force
}

Set-Location -LiteralPath $workspace

try {
    cargo run -p spg-web 1>> $output 2>> $errorLog
}
catch {
    $_ | Out-String | Set-Content -LiteralPath $errorLog
    throw
}
