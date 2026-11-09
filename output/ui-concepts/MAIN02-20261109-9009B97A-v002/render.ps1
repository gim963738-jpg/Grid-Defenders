param([int]$First=1,[int]$Last=10)
$ErrorActionPreference='Stop'
$renderRoot=$PSScriptRoot
$renderUri=([uri](Join-Path $renderRoot 'concepts.html')).AbsoluteUri
$conceptNames=@('01-snow-D1','02-snow-D2','03-snow-D3','04-desert-D1','05-desert-D2','06-desert-D3','07-coast-D1','08-coast-D2','09-coast-D3')
for($conceptIndex=$First;$conceptIndex -le $Last;$conceptIndex++){
 $renderTarget=Join-Path $renderRoot ($(if($conceptIndex -eq 10){'buttons-comparison'}else{$conceptNames[$conceptIndex-1]})+'.png')
 $renderPage=if($conceptIndex -eq 10){([uri](Join-Path $renderRoot 'buttons.html')).AbsoluteUri}else{$renderUri+'?n='+$conceptIndex}
 $renderHeight=if($conceptIndex -eq 10){2160}else{1080}
 $renderWindow='--window-size=2400,'+$renderHeight
 Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -WindowStyle Hidden -ArgumentList @('--headless','--disable-gpu','--hide-scrollbars','--no-first-run','--allow-file-access-from-files',$renderWindow,'--force-device-scale-factor=1',('--user-data-dir="'+(Join-Path $renderRoot 'edge-profile')+'"'),('--screenshot="'+$renderTarget+'"'),('"'+$renderPage+'"')) -Wait
 if(!(Test-Path -LiteralPath $renderTarget)){throw "Missing concept $conceptIndex"}
 Write-Output $renderTarget
}
