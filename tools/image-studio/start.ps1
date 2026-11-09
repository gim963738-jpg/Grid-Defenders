$ErrorActionPreference = 'Stop'
if (-not $env:OPENAI_API_KEY) {
    $env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'User')
}
if (-not $env:OPENAI_API_KEY) {
    $env:OPENAI_API_KEY = [Environment]::GetEnvironmentVariable('OPENAI_API_KEY', 'Machine')
}
& node (Join-Path $PSScriptRoot 'server.mjs')
exit $LASTEXITCODE
