$ErrorActionPreference='Stop'
$expression=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'check-gallery.js')
& 'C:/Users/user/AppData/Local/Programs/orca/resources/bin/orca.exe' eval --page 36cc76c0-b670-4046-b48e-20f9ea95cf92 --expression $expression --json | Set-Content -Encoding UTF8 (Join-Path $PSScriptRoot 'gallery-receipt.json')
$r=Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'gallery-receipt.json')|ConvertFrom-Json
if(!$r.ok){throw ($r|ConvertTo-Json -Depth 5)}
$q=$r.result.result|ConvertFrom-Json
Write-Output ('Images '+$q.opened.Count+' pass '+$q.pass)
