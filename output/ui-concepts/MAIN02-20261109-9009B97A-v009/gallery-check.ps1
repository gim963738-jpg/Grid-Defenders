$ErrorActionPreference='Stop'
$expression=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'check-gallery.js')
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page '34252a65-2a38-4eec-9733-7ee099066b7e' --expression $expression --json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'gallery-receipt.json')
$result=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'gallery-receipt.json')|ConvertFrom-Json
if(!$result.ok){throw 'Gallery evaluation failed'}
$check=$result.result.result|ConvertFrom-Json
$check|ConvertTo-Json -Depth 5
if(!$check.pass){throw 'Gallery checks failed'}
