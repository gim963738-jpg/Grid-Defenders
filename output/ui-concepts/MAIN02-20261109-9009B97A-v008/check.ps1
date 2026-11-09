$ErrorActionPreference='Stop'
$browserPage='0ee5b1e6-db99-4ba3-8a70-2daf891506a1'
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' reload --page $browserPage --json | Out-Null
$expression=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'check-layout.js')
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page $browserPage --expression $expression --json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'layout-receipt.json')
$result=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'layout-receipt.json')|ConvertFrom-Json
if(!$result.ok){throw 'Evaluation failed'}
$check=$result.result.result|ConvertFrom-Json
$check|ConvertTo-Json -Depth 12|Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'button-map.json')
$check.checks|ConvertTo-Json
$check.rows|Where-Object{$_.small.Count -or $_.outside.Count -or $_.overlap.Count}|Select-Object state,small,outside,overlap|ConvertTo-Json -Depth 5
