param([int]$First=1,[int]$Last=18)
$ErrorActionPreference='Stop'
$renderRoot=$PSScriptRoot
$renderUri=([uri](Join-Path $renderRoot 'concepts.html')).AbsoluteUri
$names=@('','01-initial-deploy','02-soldier-placement','03-hero-selection','04-unit-move','05-ready','06-equipment','07-equipped','08-auto-battle','09-maintenance-return','10-hero-page2','11-next-boss','12-equipment-transfer-preview','13-buy-hero-preview','14-buy-hero-complete','15-buy-storage-preview','16-buy-storage-complete','17-hero-to-storage-preview','18-hero-to-storage-complete')
for($n=$First;$n -le $Last;$n++){
 $target=Join-Path $renderRoot ($names[$n]+'.png')
 Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--allow-file-access-from-files','--window-size=2400,1080','--force-device-scale-factor=1',('--user-data-dir="'+(Join-Path $renderRoot 'edge-profile')+'"'),('--screenshot="'+$target+'"'),('"'+$renderUri+'?n='+$n+'"')) -Wait
 if(!(Test-Path -LiteralPath $target)){throw "Missing PNG $n"}
 Write-Output $target
}
