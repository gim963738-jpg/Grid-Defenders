$ErrorActionPreference='Stop'
$browserPage='f7bb9f25-8fbe-4a48-9656-04b70d1cabd6'
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' reload --page $browserPage --json | Out-Null
$expression=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'check-layout.js')
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page $browserPage --expression $expression --json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'layout-receipt.json')
$r=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'layout-receipt.json')|ConvertFrom-Json
if(!$r.ok){throw ($r|ConvertTo-Json -Depth 5)}
$qa=$r.result.result|ConvertFrom-Json
$qa|ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'button-map.json')
$qa.checks|ConvertTo-Json
$qa.results|Where-Object { $_.undersized.Count -or $_.outside.Count -or $_.overlap.Count }|Select-Object state,undersized,outside,overlap|ConvertTo-Json -Depth 5
