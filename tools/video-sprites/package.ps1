param([Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$videoOutput=(Resolve-Path -LiteralPath $OutputPath).Path
$videoVerification=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $videoOutput 'verification.json')|ConvertFrom-Json
$videoBrowser=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $videoOutput 'browser-verification.json')|ConvertFrom-Json
$videoAtlas=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $videoOutput 'walk_right_60.json')|ConvertFrom-Json
$videoSource=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $videoOutput 'source-and-extraction.json')|ConvertFrom-Json
if($videoVerification.frame_count -ne 60 -or !$videoVerification.source_rgb_unchanged -or !$videoVerification.sheet_cells_match -or !$videoVerification.no_clipping -or $videoBrowser.status -ne 'passed'){throw 'File or visual review incomplete'}
if($videoAtlas.frames.Count -ne 60 -or @($videoAtlas.frames|Select-Object -ExpandProperty sourceFrameIndex -Unique).Count -ne 60){throw 'Frame count or source selection mismatch'}
if(@($videoAtlas.frames|Measure-Object -Property duration -Sum).Sum -ne $videoAtlas.meta.durationMs){throw 'Frame timings mismatch'}
$videoInputHash=(Get-FileHash -LiteralPath $videoSource.source.path -Algorithm SHA256).Hash.ToLowerInvariant()
if($videoInputHash -ne $videoSource.source.sha256){throw 'Source MP4 changed'}
$videoSource.review_status='file and visual verification passed'
$videoSource|Add-Member -NotePropertyName completed_on -NotePropertyValue '2026-11-07' -Force
$videoSource|Add-Member -NotePropertyName visual_review -NotePropertyValue ([pscustomobject]@{all_60_frames=$true;light_background=$true;dark_background=$true;native_100_percent=$true;playback=$true;loop_boundary='source start and end poses differ; no motion synthesis applied'}) -Force
$videoSource.source.decodedFrames=[int]$videoSource.source.decodedFrames
$videoAtlas.meta.source.decodedFrames=[int]$videoAtlas.meta.source.decodedFrames
[IO.File]::WriteAllText((Join-Path $videoOutput 'source-and-extraction.json'),($videoSource|ConvertTo-Json -Depth 14),[Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $videoOutput 'walk_right_60.json'),($videoAtlas|ConvertTo-Json -Depth 14),[Text.UTF8Encoding]::new($false))
$videoFiles=@(Get-ChildItem -LiteralPath $videoOutput -Recurse -File|Where-Object {$_.Extension -ne '.zip' -and $_.Name -notin 'archive-verification.json','manifest.json'}|Sort-Object FullName)
$videoManifest=@($videoFiles|ForEach-Object {[pscustomobject]@{file=$_.FullName.Substring($videoOutput.Length+1).Replace('\','/');bytes=$_.Length;sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()}})
[IO.File]::WriteAllText((Join-Path $videoOutput 'manifest.json'),($videoManifest|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
$videoFiles+=Get-Item -LiteralPath (Join-Path $videoOutput 'manifest.json')
$videoZipPath=Join-Path $videoOutput 'walk-right-60-complete.zip'
if(Test-Path -LiteralPath $videoZipPath){throw 'Output archive already exists; use a new version directory'}
$videoZip=[IO.Compression.ZipFile]::Open($videoZipPath,[IO.Compression.ZipArchiveMode]::Create)
try {foreach($videoFile in $videoFiles){$videoEntry=$videoFile.FullName.Substring($videoOutput.Length+1).Replace('\','/');[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($videoZip,$videoFile.FullName,$videoEntry,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}finally{$videoZip.Dispose()}
$videoZip=[IO.Compression.ZipFile]::OpenRead($videoZipPath)
try {
 if($videoZip.Entries.Count -ne $videoFiles.Count){throw 'Archive entry count mismatch'}
 foreach($videoEntry in $videoZip.Entries){
  $videoStream=$videoEntry.Open();$videoHash=[Security.Cryptography.SHA256]::Create()
  try {$videoDigest=[BitConverter]::ToString($videoHash.ComputeHash($videoStream)).Replace('-','').ToLowerInvariant()}finally{$videoStream.Dispose();$videoHash.Dispose()}
  $videoOriginalHash=(Get-FileHash -LiteralPath (Join-Path $videoOutput $videoEntry.FullName) -Algorithm SHA256).Hash.ToLowerInvariant()
  if($videoDigest -ne $videoOriginalHash){throw ('Archive bytes differ: '+$videoEntry.FullName)}
 }
 $videoArchiveReport=[pscustomobject]@{status='passed';entries=$videoZip.Entries.Count;individual_png_frames=@($videoZip.Entries|Where-Object {$_.FullName -like 'frames/*.png'}).Count;sheet_pngs=1;all_entry_bytes_match=$true;zip_sha256=(Get-FileHash -LiteralPath $videoZipPath -Algorithm SHA256).Hash.ToLowerInvariant();zip_bytes=(Get-Item -LiteralPath $videoZipPath).Length;source_mp4_unchanged=$true}
 [IO.File]::WriteAllText((Join-Path $videoOutput 'archive-verification.json'),($videoArchiveReport|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
 $videoArchiveReport|ConvertTo-Json -Compress
}finally{$videoZip.Dispose()}
