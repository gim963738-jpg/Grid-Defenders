param([int]$First=0,[int]$Last=7)
$ErrorActionPreference='Stop'
$renderRoot=$PSScriptRoot
$renderUri=([uri](Join-Path $renderRoot 'concepts.html')).AbsoluteUri
$names=@('00-D3-main','01-soldier-five','02-hero-page1','03-hero-page2','04-shop-integrated','05-shop-buy','06-shop-transfer','07-next-boss')
for($n=$First;$n -le $Last;$n++){
 $target=Join-Path $renderRoot ($names[$n]+'.png')
 Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--allow-file-access-from-files','--window-size=2400,1080','--force-device-scale-factor=1',('--user-data-dir="'+(Join-Path $renderRoot 'edge-profile')+'"'),('--screenshot="'+$target+'"'),('"'+$renderUri+'?n='+$n+'"')) -Wait
 if(!(Test-Path -LiteralPath $target)){throw "Missing PNG $n"}
 Write-Output $target
}
