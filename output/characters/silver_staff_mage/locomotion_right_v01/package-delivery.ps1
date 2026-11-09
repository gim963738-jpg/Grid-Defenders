$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$base=[IO.Path]::GetFullPath($PSScriptRoot)
$zipPath=Join-Path $base 'silver-mage-walk-run-30f-v01.zip'
if(Test-Path -LiteralPath $zipPath){throw 'Versioned delivery ZIP already exists. Choose a new delivery version.'}
$files=@(Get-ChildItem -LiteralPath $base -File -Recurse | Where-Object { $_.Extension -ne '.zip' -and $_.Name -notin @('delivery-manifest.json','delivery-verification.json') -and $_.Name -notlike '*preview-animated.webp' })
$manifest=@($files | ForEach-Object { [ordered]@{file=$_.FullName.Substring($base.Length+1).Replace('\','/');bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower()} })
$manifestPath=Join-Path $base 'delivery-manifest.json'
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
$files+=Get-Item -LiteralPath $manifestPath
$archive=[IO.Compression.ZipFile]::Open($zipPath,[IO.Compression.ZipArchiveMode]::Create)
try{foreach($file in $files){$entry=$file.FullName.Substring($base.Length+1).Replace('\','/');[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$file.FullName,$entry,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}finally{$archive.Dispose()}
$archive=[IO.Compression.ZipFile]::OpenRead($zipPath)
try{
  $names=@($archive.Entries.FullName)
  foreach($required in @('preview.html','preview-inline.html','walk/walk-right-30f.png','run/run-right-30f.png','walk/walk-right-animated.png','run/run-right-animated.png','generation-records.json','delivery-manifest.json')){if($required -notin $names){throw "Missing $required"}}
  $frameCount=@($archive.Entries | Where-Object {$_.FullName -match '^(walk|run)/frames/(walk|run)-right-\d\d\.png$'}).Count
  if($frameCount -ne 60){throw 'Wrong frame count'}
  $hash=[Security.Cryptography.SHA256]::Create()
  foreach($item in $manifest){$entry=$archive.GetEntry($item.file);$stream=$entry.Open();try{$actual=[BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','').ToLower()}finally{$stream.Dispose()};if($actual -ne $item.sha256){throw "ZIP content mismatch: $($item.file)"}}
  $hash.Dispose()
  $count=$archive.Entries.Count
}finally{$archive.Dispose()}
$report=[ordered]@{file=[IO.Path]::GetFileName($zipPath);entries=$count;individualFrames=$frameCount;allManifestHashesMatch=$true;bytes=(Get-Item -LiteralPath $zipPath).Length;sha256=(Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLower()}
$report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $base 'delivery-verification.json') -Encoding UTF8
$report | ConvertTo-Json
