param([int]$First=1,[int]$Last=6)
$ErrorActionPreference='Stop'
$renderRoot=$PSScriptRoot
$renderUri=([uri](Join-Path $renderRoot 'concepts.html')).AbsoluteUri
$names=@('','01-soldier-summary','02-hero-summary','03-skill-description','04-full-stats-skills','05-item-information','06-item-comparison')
for($n=$First;$n -le $Last;$n++){
 $target=Join-Path $renderRoot ($names[$n]+'.png')
 Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--allow-file-access-from-files','--window-size=2400,1080','--force-device-scale-factor=1',('--user-data-dir="'+(Join-Path $renderRoot 'edge-profile')+'"'),('--screenshot="'+$target+'"'),('"'+$renderUri+'?n='+$n+'"')) -Wait
 if(!(Test-Path -LiteralPath $target)){throw "Missing PNG $n"}
 Write-Output $names[$n]
}

