$ErrorActionPreference='Stop'
$expression=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'check-gallery.js')
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page '4ab60248-0bd1-40ed-bcd3-9aa07c2dd83a' --expression $expression --json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'gallery-receipt.json')
$result=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'gallery-receipt.json')|ConvertFrom-Json
if(!$result.ok){throw 'Gallery evaluation failed'}
$check=$result.result.result|ConvertFrom-Json
$check|ConvertTo-Json -Depth 5
if(!$check.pass){throw 'Gallery checks failed'}
