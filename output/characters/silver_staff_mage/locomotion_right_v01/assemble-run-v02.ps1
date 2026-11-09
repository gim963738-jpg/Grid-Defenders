$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$sheet=[Drawing.Bitmap]::new(1374,1145,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sg=[Drawing.Graphics]::FromImage($sheet);$sg.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$outputIndex=0;$mapping=@()
$correctionSource=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot 'takes_v02/run/f.png'))
$correction=[Drawing.Bitmap]::new(916,458,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cg=[Drawing.Graphics]::FromImage($correction)
$cg.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
$cg.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$cg.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
$cg.DrawImage($correctionSource,[Drawing.Rectangle]::new(0,0,916,458),0,0,$correctionSource.Width,$correctionSource.Height,[Drawing.GraphicsUnit]::Pixel)
$cg.Dispose();$correctionSource.Dispose()
foreach($batch in @('a','b','c','d')){
  $sourcePath=Join-Path $PSScriptRoot "takes_v02/run/$batch.png"
  $source=[Drawing.Bitmap]::new($sourcePath)
  if($source.Width -ne 1774 -or $source.Height -ne 887){throw 'Unexpected 4x2 source dimensions'}
  # Uniform whole-atlas nearest-neighbour finishing. Fractional source cells
  # (443.5px) are normalized together; no frame-wise fitting or cropping.
  $normalized=[Drawing.Bitmap]::new(916,458,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[Drawing.Graphics]::FromImage($normalized)
  $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.DrawImage($source,[Drawing.Rectangle]::new(0,0,916,458),0,0,1774,887,[Drawing.GraphicsUnit]::Pixel)
  $g.Dispose();$normalized.Save((Join-Path $PSScriptRoot "takes_v02/run/$batch-normalized.png"),[Drawing.Imaging.ImageFormat]::Png)
  $start=if($batch -eq 'b' -or $batch -eq 'c'){1}else{0}
  for($i=$start;$i -lt 8;$i++){
    $chosen=if($batch -eq 'd' -and $i -ge 5){$correction}else{$normalized}
    $sourceName=if($batch -eq 'd' -and $i -ge 5){'f'}else{$batch}
    $cell=$chosen.Clone([Drawing.Rectangle]::new(($i%4)*229,[Math]::Floor($i/4)*229,229,229),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $sg.DrawImageUnscaled($cell,($outputIndex%6)*229,[Math]::Floor($outputIndex/6)*229)
    $mapping+=@{frame=$outputIndex+1;source="takes_v02/run/$sourceName.png";sourceCell=$i+1;normalizedCellSize=229}
    $cell.Dispose();$outputIndex++
  }
  $normalized.Dispose();$source.Dispose()
}
$correction.Dispose()
if($outputIndex -ne 30){throw 'Mapping did not produce 30 distinct source cells'}
$sg.Dispose();$sheet.Save((Join-Path $PSScriptRoot 'run-assembled-v02.png'),[Drawing.Imaging.ImageFormat]::Png);$sheet.Dispose()
$mapping | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'run-source-map.json') -Encoding UTF8
Write-Output 'Assembled A1-8, B2-8, C2-8, D1-5, F6-8: 30 source drawings; no repeated padding.'
