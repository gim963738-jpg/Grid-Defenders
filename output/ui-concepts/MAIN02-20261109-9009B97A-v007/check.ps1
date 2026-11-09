$ErrorActionPreference='Stop'
$browserPage='723fbeee-b82f-465a-89f2-5cf66f0d03df'
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' reload --page $browserPage --json | Out-Null
$expression=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'check-layout.js')
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page $browserPage --expression $expression --json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'layout-receipt.json')
$r=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'layout-receipt.json')|ConvertFrom-Json
if(!$r.ok){throw ($r|ConvertTo-Json -Depth 5)}
$q=$r.result.result|ConvertFrom-Json
$q|ConvertTo-Json -Depth 12|Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'button-map.json')
$q.checks|ConvertTo-Json
$q.rows|Where-Object{$_.small.Count -or $_.outside.Count -or $_.overlap.Count}|Select-Object state,small,outside,overlap|ConvertTo-Json -Depth 5
