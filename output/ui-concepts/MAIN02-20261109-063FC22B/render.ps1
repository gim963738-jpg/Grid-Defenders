$ErrorActionPreference='Stop'
$renderRoot=$PSScriptRoot
$renderUri=([uri](Join-Path $renderRoot 'concepts.html')).AbsoluteUri
$conceptNames=@('01-A-wave','02-A-boss','03-B-wave','04-B-boss','05-C-wave','06-C-boss','07-placement','08-tower-upgrade','09-shop','10-shared-bag','11-equipment-combination','12-hero','13-skill','14-pause','15-boss-formation','16-boss-allies')
for($conceptIndex=1;$conceptIndex -le 16;$conceptIndex++){
  $renderTarget=Join-Path $renderRoot ($conceptNames[$conceptIndex-1]+'.png')
  Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--allow-file-access-from-files','--window-size=2400,1080','--force-device-scale-factor=1',('--user-data-dir="'+(Join-Path $renderRoot 'edge-profile')+'"'),('--screenshot="'+$renderTarget+'"'),('"'+$renderUri+'?n='+$conceptIndex+'"')) -Wait
  if(!(Test-Path -LiteralPath $renderTarget)){throw "Missing concept $conceptIndex"}
  Write-Output $renderTarget
}
