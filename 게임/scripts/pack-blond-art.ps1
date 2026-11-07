param([string]$SourceRoot,[string]$OutputRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$blondGameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$blondArchive = '자료/아트원본/character-design'
$blondDefaultSource = [IO.Path]::GetFullPath((Join-Path (Split-Path $blondGameRoot -Parent) $blondArchive))
if ([string]::IsNullOrWhiteSpace($SourceRoot)) { $SourceRoot = $blondDefaultSource }
$SourceRoot = [IO.Path]::GetFullPath($SourceRoot)
$blondInputSource = if ($SourceRoot -eq $blondDefaultSource) { $blondArchive } else { $SourceRoot }
$blondOutput = if ([string]::IsNullOrWhiteSpace($OutputRoot)) { Join-Path $blondGameRoot 'public/assets/heroes/blond-warrior-v1' } else { [IO.Path]::GetFullPath($OutputRoot) }
[IO.Directory]::CreateDirectory($blondOutput) | Out-Null
$blondPacker = @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public class BlondSource {
 public string file; public int[] bounds; public float pivotX,pivotY,scale;
}
public static class BlondAtlasPacker {
 public static List<BlondSource> Pack(string sourceRoot,string output) {
  string[] names={"01_front_000.png","02_front_right_045.png","03_right_090.png","04_back_right_135.png","05_back_180.png","06_back_left_225.png","07_left_270.png","08_front_left_315.png"};
  var records=new List<BlondSource>();
  using(var atlas=new Bitmap(1280,160,PixelFormat.Format32bppArgb))
  using(var g=Graphics.FromImage(atlas)) {
   g.Clear(Color.Transparent);g.CompositingMode=CompositingMode.SourceCopy;
   g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
   for(int n=0;n<8;n++) {
    string relative="characters/gc9_longsword_dagger/pixel_8views_v01/images/"+names[n];
    using(var image=new Bitmap(Path.Combine(sourceRoot,relative.Replace('/',Path.DirectorySeparatorChar)))) {
     var pixels=image.LockBits(new Rectangle(0,0,image.Width,image.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
     int stride=pixels.Stride;if(stride<=0)throw new Exception("Unexpected PNG row order");
     var data=new byte[stride*image.Height];Marshal.Copy(pixels.Scan0,data,0,data.Length);image.UnlockBits(pixels);
     int left=image.Width,top=image.Height,right=-1,bottom=-1;
     for(int y=0;y<image.Height;y++)for(int x=0;x<image.Width;x++)if(data[y*stride+x*4+3]>=16){left=Math.Min(left,x);top=Math.Min(top,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);}
     if(right<left)throw new Exception("Empty source: "+relative);
     double footSum=0;int footCount=0;
     for(int y=Math.Max(top,bottom-19);y<=bottom;y++)for(int x=left;x<=right;x++)if(data[y*stride+x*4+3]>=16){footSum+=x+.5;footCount++;}
     float pivotX=(float)(footSum/footCount),pivotY=bottom+1,scale=128f/(bottom-top+1);
     if(80+(left-pivotX)*scale<4||80+(right+1-pivotX)*scale>156)throw new Exception("Insufficient stationary gutter: "+relative);
     g.SetClip(new Rectangle(n*160,0,160,160));
     g.DrawImage(image,new RectangleF(n*160+80-pivotX*scale,144-pivotY*scale,image.Width*scale,image.Height*scale),new Rectangle(0,0,image.Width,image.Height),GraphicsUnit.Pixel);
     g.ResetClip();
     records.Add(new BlondSource{file=relative,bounds=new[]{left,top,right+1,bottom+1},pivotX=pivotX,pivotY=pivotY,scale=scale});
     if(n==0)using(var portrait=new Bitmap(256,256,PixelFormat.Format32bppArgb))using(var p=Graphics.FromImage(portrait)){
      p.Clear(Color.Transparent);p.CompositingMode=CompositingMode.SourceCopy;p.InterpolationMode=InterpolationMode.NearestNeighbor;p.PixelOffsetMode=PixelOffsetMode.Half;
      p.DrawImage(image,new Rectangle(0,0,256,256),new RectangleF(image.Width/2f-250,top,500,500),GraphicsUnit.Pixel);portrait.Save(Path.Combine(output,"portrait.png"),ImageFormat.Png);
     }
    }
   }
   atlas.Save(Path.Combine(output,"idle-8.png"),ImageFormat.Png);
  }
  using(var source=new Bitmap(Path.Combine(sourceRoot,"animation/dreamina-right-walk-60-v01/walk_right_60_10x6.png")))
  using(var atlas=new Bitmap(1680,1080,PixelFormat.Format32bppArgb))
  using(var g=Graphics.FromImage(atlas)){
   g.Clear(Color.Transparent);g.CompositingMode=CompositingMode.SourceCopy;g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
   for(int n=0;n<60;n++)g.DrawImage(source,new Rectangle(n%10*168,n/10*180,168,180),new Rectangle(n%10*672,n/10*720,672,720),GraphicsUnit.Pixel);
   atlas.Save(Path.Combine(output,"walk-right-60.png"),ImageFormat.Png);
  }
  return records;
 }
}
'@
Add-Type -TypeDefinition $blondPacker -ReferencedAssemblies System.Drawing
$blondSources = [BlondAtlasPacker]::Pack([IO.Path]::GetFullPath($SourceRoot),$blondOutput)
$blondAnimation = Join-Path $SourceRoot 'animation/dreamina-right-walk-60-v01'
$blondOriginal = Get-Content -LiteralPath (Join-Path $blondAnimation 'walk_right_60.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$blondVerification = Get-Content -LiteralPath (Join-Path $blondAnimation 'verification.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$blondMinY = ($blondVerification.frames | ForEach-Object {$_.bounds.y} | Measure-Object -Minimum).Minimum
$blondMaxY = ($blondVerification.frames | ForEach-Object {$_.bounds.y+$_.bounds.height} | Measure-Object -Maximum).Maximum
$blondBodyHeight = ($blondMaxY-$blondMinY)/4
$blondFrames = [ordered]@{
 idle = @(0..7 | ForEach-Object {@{x=$_*160;y=0;width=160;height=160;pivot=@{x=80;y=144};bodyHeight=128}})
 walk = @{durationMs=$blondOriginal.meta.durationMs;fps=$blondOriginal.meta.fps;frames=@(0..59 | ForEach-Object {@{x=($_%10)*168;y=[Math]::Floor($_/10)*180;width=168;height=180;pivot=@{x=68.25;y=175.75};bodyHeight=$blondBodyHeight;duration=$blondOriginal.frames[$_].duration}})}
}
$blondProvenance = [ordered]@{
 source='character-design worktree/output/characters/gc9_longsword_dagger/pixel_8views_v01 and output/animation/dreamina-right-walk-60-v01'
 inputSource=$blondInputSource
 archiveManifest=$(if ($SourceRoot -eq $blondDefaultSource) { '자료/아트원본/manifest.json' } else { $null })
 processing='Read-only originals; uniform nearest-neighbor stationary atlas with fixed foot anchor. Walking cells uniformly reduced to one quarter for mobile; all60 source frames, alpha, order, original durations and common pivot retained. No background removal, motion synthesis, interpolation or mirroring.'
 stationary=@($blondSources | ForEach-Object {@{file=$_.file;sha256=(Get-FileHash -LiteralPath (Join-Path $SourceRoot $_.file) -Algorithm SHA256).Hash.ToLowerInvariant();bounds=$_.bounds;pivot=@{x=$_.pivotX;y=$_.pivotY};scale=$_.scale}})
 walk=@{sheetSha256=(Get-FileHash -LiteralPath (Join-Path $blondAnimation 'walk_right_60_10x6.png') -Algorithm SHA256).Hash.ToLowerInvariant();metadataSha256=(Get-FileHash -LiteralPath (Join-Path $blondAnimation 'walk_right_60.json') -Algorithm SHA256).Hash.ToLowerInvariant();sourceCell=@{width=672;height=720;pivot=@{x=273;y=703}};scale=.25;frameCount=60;durationMs=$blondOriginal.meta.durationMs;originalLoopNote='Source first and final poses differ; looping retains this source boundary.'}
}
$blondEncoding = New-Object Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $blondOutput 'frames.json'),($blondFrames | ConvertTo-Json -Depth 8),$blondEncoding)
[IO.File]::WriteAllText((Join-Path $blondOutput 'sources.json'),($blondProvenance | ConvertTo-Json -Depth 8),$blondEncoding)
Write-Output ('Packed8 directions and60 walk frames. Walk body height: '+$blondBodyHeight)
