$ErrorActionPreference='Stop'
$renderRoot=$PSScriptRoot
$renderUri=([uri](Join-Path $renderRoot 'concepts.html')).AbsoluteUri
$conceptNames=@('01-war-gate','02-war-trench','03-war-citadel','04-forest-golden','05-forest-creek','06-forest-oak','07-demon-fissure','08-demon-grove','09-demon-fortress')
for($conceptIndex=1;$conceptIndex -le 9;$conceptIndex++){
 $renderTarget=Join-Path $renderRoot ($conceptNames[$conceptIndex-1]+'.png')
 Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--allow-file-access-from-files','--window-size=2400,1080','--force-device-scale-factor=1',('--user-data-dir="'+(Join-Path $renderRoot 'edge-profile')+'"'),('--screenshot="'+$renderTarget+'"'),('"'+$renderUri+'?n='+$conceptIndex+'"')) -Wait
 if(!(Test-Path -LiteralPath $renderTarget)){throw "Missing concept $conceptIndex"}
 Write-Output $renderTarget
}
