param([string]$AssetDir = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$AssetDir = [IO.Path]::GetFullPath($AssetDir)
$parent = Split-Path -Parent $AssetDir
$prefix = @(1,2,3,4,5,9,10,11,13,14,15,16,21,22,23)
$sources = @()
foreach ($number in $prefix) {
    $sources += @{ segment='prefix'; sourceNumber=$number; source=('walk_right_30f_v01/frames/walk-right-{0:d2}.png' -f $number); label=('앞 {0:d2}' -f $number) }
}
foreach ($number in @(9,10,11,18,30)) {
    $sources += @{ segment='forward'; sourceNumber=$number; source=('right_step_forward_30f_v01/frames/right-step-forward-{0:d2}.png' -f $number); label=('새 {0:d2}' -f $number) }
}
New-Item -ItemType Directory -Force -Path (Join-Path $AssetDir 'frames') | Out-Null
$atlas = [Drawing.Bitmap]::new(1280,1024,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [Drawing.Graphics]::FromImage($atlas)
$graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
$frames = [ordered]@{}
$mapping = @()
for ($index=0; $index -lt $sources.Count; $index++) {
    $entry = $sources[$index]
    $sourceFile = Join-Path $parent $entry.source
    $name = 'connected-walk-{0:d2}.png' -f ($index+1)
    $destination = Join-Path $AssetDir ('frames/' + $name)
    Copy-Item -LiteralPath $sourceFile -Destination $destination
    $sourceHash = (Get-FileHash -LiteralPath $sourceFile).Hash.ToLower()
    $copyHash = (Get-FileHash -LiteralPath $destination).Hash.ToLower()
    if ($sourceHash -ne $copyHash) { throw 'Copied frame differs from source.' }
    $image = [Drawing.Bitmap]::new($destination)
    if ($image.Width -ne 256 -or $image.Height -ne 256) { throw 'Frame is not 256px.' }
    $column = $index % 5; $row = [Math]::Floor($index/5)
    $graphics.DrawImageUnscaled($image,$column*256,$row*256)
    $image.Dispose()
    $mapping += [ordered]@{ frame=$index+1; file=('frames/'+$name); segment=$entry.segment; sourceFrame=$entry.sourceNumber; label=$entry.label; source=('../'+$entry.source); sha256=$copyHash; byteIdenticalToSource=$true }
    $frames[$name] = [ordered]@{
        frame=@{x=$column*256;y=$row*256;w=256;h=256}; rotated=$false; trimmed=$false
        spriteSourceSize=@{x=0;y=0;w=256;h=256}; sourceSize=@{w=256;h=256}
        pivot=@{x=0.5;y=0.9140625}; duration=1000.0/15; sourceLabel=$entry.label
    }
}
$graphics.Dispose()
$atlas.Save((Join-Path $AssetDir 'connected-walk-20f.png'),[Drawing.Imaging.ImageFormat]::Png)
$atlas.Dispose()
$metadata = [ordered]@{
    frames=$frames; animations=@{'connected-walk'=@($frames.Keys)}
    meta=@{image='connected-walk-20f.png';format='RGBA8888';size=@{w=1280;h=1024};scale='1';columns=5;rows=4;frameCount=20;fps=15;durationMs=(20000.0/15);loop=$false;originPixels=@{x=128;y=234};frameOrder='row-major';resampled=$false;seam=@{lastPrefix=15;firstForward=16};sourceMap='sequence.json'}
}
$metadata | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $AssetDir 'connected-walk-20f.json')
[ordered]@{prefixOrder=$prefix;prefixCount=15;forwardOrder=@(9,10,11,18,30);forwardCount=5;frameCount=20;fps=15;durationMs=(20000.0/15);loop=$false;seam=@{combinedBefore=15;sourceBefore='앞 23';combinedAfter=16;sourceAfter='새 09'};frames=$mapping} | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $AssetDir 'sequence.json')
[ordered]@{frameCount=$mapping.Count;allFramesByteIdenticalToSources=($mapping.byteIdenticalToSource -notcontains $false);sheetSize=@{w=1280;h=1024};cell=256;resampled=$false;seamIndex=@(15,16)} | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $AssetDir 'verification.json')
Write-Output 'Assembled 20 source-identical frames: 15 selected prefix + forward 9,10,11,18,30.'


