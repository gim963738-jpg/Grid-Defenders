param([string]$SourceRoot,[string]$OutputRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$slimeGameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$slimeArchive = '자료/아트원본/monster-design/round-slime'
$slimeDefaultSource = [IO.Path]::GetFullPath((Join-Path (Split-Path $slimeGameRoot -Parent) $slimeArchive))
if ([string]::IsNullOrWhiteSpace($SourceRoot)) { $SourceRoot = $slimeDefaultSource }
$SourceRoot = [IO.Path]::GetFullPath($SourceRoot)
$slimeInputSource = if ($SourceRoot -eq $slimeDefaultSource) { $slimeArchive } else { $SourceRoot }
$slimeOutput = if ([string]::IsNullOrWhiteSpace($OutputRoot)) { Join-Path $slimeGameRoot 'public/assets/monsters/slimes-v1' } else { [IO.Path]::GetFullPath($OutputRoot) }
[IO.Directory]::CreateDirectory($slimeOutput) | Out-Null

# Texture-atlas packaging only. The source worktree and its PNGs are never modified.
$slimePacker = @'
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Collections.Generic;
public class SlimePackedSource {
 public string palette,file,sha256;
 public int[] sourceSize,bounds;
 public int direction;
 public float scale;
}
public static class SlimeAtlasPacker {
 public static List<SlimePackedSource> Pack(string sourceRoot,string output) {
  string[] files={"01_front_000.png","02_front_right_045.png","03_right_090.png","04_back_right_135.png","05_back_180.png","06_back_left_225.png","07_left_270.png","08_front_left_315.png"};
  var records=new List<SlimePackedSource>();
  foreach(string palette in new[]{"yellow","blue","red"}) {
   using(var atlas=new Bitmap(1024,128,PixelFormat.Format32bppArgb))
   using(var g=Graphics.FromImage(atlas)) {
    g.Clear(Color.Transparent);g.CompositingMode=CompositingMode.SourceCopy;
    g.InterpolationMode=InterpolationMode.NearestNeighbor;g.PixelOffsetMode=PixelOffsetMode.Half;
    for(int n=0;n<files.Length;n++) {
     string relative="eight_views_v01/"+palette+"/images/"+files[n];
     string path=Path.Combine(sourceRoot,relative.Replace('/',Path.DirectorySeparatorChar));
     using(var image=new Bitmap(path)) {
      var pixels=image.LockBits(new Rectangle(0,0,image.Width,image.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
      int stride=pixels.Stride;if(stride<=0)throw new Exception("Unexpected PNG row order");
      var data=new byte[stride*image.Height];Marshal.Copy(pixels.Scan0,data,0,data.Length);image.UnlockBits(pixels);
      int left=image.Width,top=image.Height,right=-1,bottom=-1;
      for(int y=0;y<image.Height;y++)for(int x=0;x<image.Width;x++)if(data[y*stride+x*4+3]>=16) {
       left=Math.Min(left,x);top=Math.Min(top,y);right=Math.Max(right,x);bottom=Math.Max(bottom,y);
      }
      if(right<left||left==0||top==0||right==image.Width-1||bottom==image.Height-1)throw new Exception("Inspect clipped/empty source: "+relative);
      float scale=104f/(right-left+1);
      int cx=Math.Max(0,left-8),cy=Math.Max(0,top-8),cr=Math.Min(image.Width,right+9),cb=Math.Min(image.Height,bottom+9);
      var target=new RectangleF(n*128+64+(cx-(left+right+1)/2f)*scale,112+(cy-bottom-1)*scale,(cr-cx)*scale,(cb-cy)*scale);
      g.DrawImage(image,target,new Rectangle(cx,cy,cr-cx,cb-cy),GraphicsUnit.Pixel);
      string hash;using(var sha=SHA256.Create())using(var stream=File.OpenRead(path))hash=BitConverter.ToString(sha.ComputeHash(stream)).Replace("-","").ToLowerInvariant();
      records.Add(new SlimePackedSource{palette=palette,file=relative,sha256=hash,direction=n,sourceSize=new[]{image.Width,image.Height},bounds=new[]{left,top,right+1,bottom+1},scale=scale});
     }
    }
    atlas.Save(Path.Combine(output,"idle-"+palette+".png"),ImageFormat.Png);
   }
  }
  return records;
 }
}
'@
Add-Type -TypeDefinition $slimePacker -ReferencedAssemblies System.Drawing
$slimeSources = [SlimeAtlasPacker]::Pack([IO.Path]::GetFullPath($SourceRoot),$slimeOutput)
$slimeAnimation = Join-Path $SourceRoot 'yellow-right-ripple-30f-v01'
Copy-Item -LiteralPath (Join-Path $slimeAnimation 'ripple-30f-sheet.png') -Destination (Join-Path $slimeOutput 'yellow-right-ripple.png')
Copy-Item -LiteralPath (Join-Path $slimeAnimation 'frames.json') -Destination (Join-Path $slimeOutput 'yellow-right-ripple.frames.json')
$slimeFrameData = Get-Content -LiteralPath (Join-Path $slimeAnimation 'frames.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$slimeBounds = $slimeFrameData.frames | ForEach-Object { ,$_.visibleBounds }
$slimeLeft = ($slimeBounds | ForEach-Object { $_[0] } | Measure-Object -Minimum).Minimum
$slimeRight = ($slimeBounds | ForEach-Object { $_[2] } | Measure-Object -Maximum).Maximum
$slimeRecord = [ordered]@{
 source = 'monster-design worktree/output/monsters/round-slime'
 inputSource = $slimeInputSource
 archiveManifest = $(if ($SourceRoot -eq $slimeDefaultSource) { '자료/아트원본/manifest.json' } else { $null })
 processing = 'Read-only sources; 8-direction stationary atlas, uniform scale to104px visible width; fixed64/112 ground pivot; original30-frame animation copied byte-for-byte.'
 idle = @{cell=128;columns=8;visibleWidth=104;anchor=@{x=64;y=112}}
 animation = @{file='yellow-right-ripple.png';sha256=(Get-FileHash -LiteralPath (Join-Path $slimeOutput 'yellow-right-ripple.png') -Algorithm SHA256).Hash.ToLowerInvariant();visibleWidth=($slimeRight-$slimeLeft);frameCount=$slimeFrameData.frameCount;fps=$slimeFrameData.defaultFps;anchor=$slimeFrameData.anchor}
 sources = $slimeSources
}
$slimeJson = $slimeRecord | ConvertTo-Json -Depth 8
[IO.File]::WriteAllText((Join-Path $slimeOutput 'sources.json'),$slimeJson,(New-Object Text.UTF8Encoding($false)))
Write-Output ("Packed {0} directions. Animation body width: {1}. Output: {2}" -f $slimeSources.Count,($slimeRight-$slimeLeft),$slimeOutput)
