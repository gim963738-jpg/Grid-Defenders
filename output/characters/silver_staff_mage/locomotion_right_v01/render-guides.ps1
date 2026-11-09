$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
foreach($action in @('walk','run')) {
 foreach($batch in @('full','a','b','c','d')) {
  $all=Get-Content -LiteralPath (Join-Path $PSScriptRoot "guides/$action-poses.json") -Raw | ConvertFrom-Json
  $poses=switch($batch){'full'{$all};'a'{$all[0..7]};'b'{$all[7..14]};'c'{$all[14..21]};'d'{$all[22..29]}}
  $columns=if($batch -eq 'full'){6}else{4};$rows=if($batch -eq 'full'){5}else{2}
  $bmp=[Drawing.Bitmap]::new(($columns*300),($rows*300))
  $g=[Drawing.Graphics]::FromImage($bmp);$g.Clear([Drawing.Color]::White)
  $g.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $font=[Drawing.Font]::new('Arial',13)
  $gray=[Drawing.Pen]::new([Drawing.Color]::FromArgb(115,121,128),4)
  $far=[Drawing.Pen]::new([Drawing.Color]::FromArgb(202,65,133),5)
  $near=[Drawing.Pen]::new([Drawing.Color]::FromArgb(0,139,194),5)
  $light=[Drawing.Pen]::new([Drawing.Color]::FromArgb(214,219,224),1)
  function Line($pen,$a,$b){$g.DrawLine($pen,[single]$a[0],[single]$a[1],[single]$b[0],[single]$b[1])}
  $i=-1
  foreach($p in $poses){
    $state=$g.Save();$i++
    $g.TranslateTransform(($i%$columns)*300,[Math]::Floor($i/$columns)*300);$g.ScaleTransform((300.0/229),(300.0/229))
    $g.DrawRectangle($light,0,0,229,229)
    $g.DrawString(('{0:d2}' -f $p.frame),$font,[Drawing.Brushes]::Black,5,3)
    Line $light @(22,214) @(207,214)
    foreach($side in @('far','near')){
      $leg=$p.$side;$pen=if($side -eq 'far'){$far}else{$near}
      Line $pen $leg.hip $leg.knee;Line $pen $leg.knee $leg.ankle
      $angle=$leg.footAngle*[Math]::PI/180
      $heel=@(($leg.ankle[0]-6*[Math]::Cos($angle)),($leg.ankle[1]+6-6*[Math]::Sin($angle)))
      $toe=@(($leg.ankle[0]+12*[Math]::Cos($angle)),($leg.ankle[1]+6+12*[Math]::Sin($angle)))
      Line $pen $heel $toe
      $g.DrawEllipse($pen,[single]($leg.knee[0]-2),[single]($leg.knee[1]-2),4,4)
    }
    Line $gray $p.hip $p.shoulder
    Line $gray $p.shoulder @($p.head[0],($p.head[1]+20))
    $g.DrawEllipse($gray,[single]($p.head[0]-21),[single]($p.head[1]-25),42,50)
    Line $gray @(($p.head[0]+17),$p.head[1]) @(($p.head[0]+27),($p.head[1]+3))
    Line $far $p.shoulder $p.grip;Line $gray $p.staffTop $p.staffBottom
    Line $near $p.shoulder $p.elbow;Line $near $p.elbow $p.hand
    $g.Restore($state)
  }
  $filename=if($batch -eq 'full'){"$action-pose-guide.png"}else{"$action-$batch-pose-guide.png"}
  $g.Dispose();$bmp.Save((Join-Path $PSScriptRoot "guides/$filename"),[Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose();$font.Dispose();$gray.Dispose();$far.Dispose();$near.Dispose();$light.Dispose()
 }
}
