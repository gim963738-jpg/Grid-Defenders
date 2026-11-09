$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
foreach($action in @('walk','run')){
  $folder=Join-Path $PSScriptRoot $action
  New-Item -ItemType Directory -Force -Path (Join-Path $folder 'frames') | Out-Null
  $sourceFile=if($action -eq 'run'){'run-assembled-v02.png'}else{'walk-generated-v01.png'}
  $source=[Drawing.Bitmap]::new((Join-Path $PSScriptRoot $sourceFile))
  if($source.Width -ne 1374 -or $source.Height -ne 1145){throw 'Unexpected source grid'}
  $sheet=[Drawing.Bitmap]::new(1536,1280,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $sg=[Drawing.Graphics]::FromImage($sheet);$sg.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
  for($i=0;$i -lt 30;$i++){
    $col=$i%6;$row=[Math]::Floor($i/6)
    $cell=$source.Clone([Drawing.Rectangle]::new($col*229,$row*229,229,229),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $frame=[Drawing.Bitmap]::new(256,256,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $fg=[Drawing.Graphics]::FromImage($frame);$fg.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
    $fg.DrawImageUnscaled($cell,13,13);$fg.Dispose()
    $frame.Save((Join-Path $folder ('frames/{0}-right-{1:d2}.png' -f $action,($i+1))),[Drawing.Imaging.ImageFormat]::Png)
    $sg.DrawImageUnscaled($frame,$col*256,$row*256)
    $cell.Dispose();$frame.Dispose()
  }
  $sg.Dispose();$sheet.Save((Join-Path $folder "$action-right-30f.png"),[Drawing.Imaging.ImageFormat]::Png)
  $font=[Drawing.Font]::new('Arial',15,[Drawing.FontStyle]::Bold)
  foreach($bg in @('light','dark')){
    $review=[Drawing.Bitmap]::new(1536,1280)
    $g=[Drawing.Graphics]::FromImage($review)
    $color=if($bg -eq 'light'){[Drawing.Color]::FromArgb(240,242,246)}else{[Drawing.Color]::FromArgb(29,36,49)}
    $g.Clear($color);$g.DrawImageUnscaled($sheet,0,0)
    for($i=0;$i -lt 30;$i++){
      $x=($i%6)*256+8;$y=[Math]::Floor($i/6)*256+7
      $g.FillRectangle([Drawing.Brushes]::MidnightBlue,$x,$y,37,28)
      $g.DrawString(('{0:d2}' -f ($i+1)),$font,[Drawing.Brushes]::White,$x+4,$y+2)
    }
    $g.Dispose();$review.Save((Join-Path $folder "review-$bg-numbered.png"),[Drawing.Imaging.ImageFormat]::Png);$review.Dispose()
  }
  $inspection=[Drawing.Bitmap]::new(1536,512)
  $g=[Drawing.Graphics]::FromImage($inspection);$g.Clear([Drawing.Color]::White)
  $indices=@(1,5,9,13,16,20,24,28,29,30,1,2)
  for($n=0;$n -lt $indices.Count;$n++){
    $i=$indices[$n]-1;$cell=$sheet.Clone([Drawing.Rectangle]::new(($i%6)*256,[Math]::Floor($i/6)*256,256,256),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $x=($n%6)*256;$y=[Math]::Floor($n/6)*256
    $g.DrawImageUnscaled($cell,$x,$y);$g.DrawString(('{0:d2}' -f ($i+1)),$font,[Drawing.Brushes]::Black,$x+5,$y+5)
    $cell.Dispose()
  }
  $g.Dispose();$inspection.Save((Join-Path $folder 'phase-and-seam-review.png'),[Drawing.Imaging.ImageFormat]::Png);$inspection.Dispose()
  $font.Dispose();$sheet.Dispose();$source.Dispose()
}
