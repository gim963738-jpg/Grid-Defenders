$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class CharacterCatalogImage {
 public static object Read(string file) {
  using(Bitmap image=new Bitmap(file)) {
   bool zero=false,visible=false;
   if(Image.IsAlphaPixelFormat(image.PixelFormat)) {
    BitmapData data=image.LockBits(new Rectangle(0,0,image.Width,image.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
    try {
     int length=Math.Abs(data.Stride)*image.Height;
     byte[] pixels=new byte[length];Marshal.Copy(data.Scan0,pixels,0,length);
     for(int n=3;n<length;n+=4){int a=pixels[n];if(a==0)zero=true;if(a>=240)visible=true;if(zero&&visible)break;}
    } finally {image.UnlockBits(data);}
   } else visible=true;
   return new {width=image.Width,height=image.Height,transparentBackground=zero&&visible,alphaChannel=Image.IsAlphaPixelFormat(image.PixelFormat)};
  }
 }
}
'@
$catalogScanRoot=(Get-Location).Path
$catalogScanFolders=@(
 'output/characters',
 'output/character-redesign-6x2',
 'output/red-haired-adventurer-4views-v1',
 'output/illustration-final-test-2x4-v1',
 'output/silver-staff-8views-v1',
 'output/animation/dreamina-right-walk-60-v01',
 '자료/캐릭터그림체/GC9/원본',
 '자료/스플래시아트/SP13/원본',
 '자료/캐릭터제작/한손무기그립/원본',
 '자료/캐릭터제작/SD공통기준/원본'
)
$catalogScanRows=@()
foreach($catalogScanFolder in $catalogScanFolders){
 foreach($catalogScanFile in Get-ChildItem -LiteralPath (Join-Path $catalogScanRoot $catalogScanFolder) -Recurse -File){
  if($catalogScanFile.Extension.ToLowerInvariant() -notin '.png','.jpg','.jpeg','.jfif'){continue}
  if($catalogScanFolder -eq 'output/animation/dreamina-right-walk-60-v01' -and $catalogScanFile.Name -ne 'walk_right_60_10x6.png'){continue}
  $catalogScanInfo=[CharacterCatalogImage]::Read($catalogScanFile.FullName)
  $catalogScanRows += [pscustomobject]@{
   path=$catalogScanFile.FullName.Substring($catalogScanRoot.Length+1).Replace('\','/')
   sha256=(Get-FileHash -Algorithm SHA256 -LiteralPath $catalogScanFile.FullName).Hash.ToLowerInvariant()
   width=$catalogScanInfo.width;height=$catalogScanInfo.height
   transparentBackground=$catalogScanInfo.transparentBackground;alphaChannel=$catalogScanInfo.alphaChannel
   bytes=$catalogScanFile.Length
  }
 }
}
$catalogScanDestination=Join-Path $catalogScanRoot 'output/characters/catalog/image-metadata.json'
[IO.File]::WriteAllText($catalogScanDestination,($catalogScanRows|ConvertTo-Json -Depth 4),[Text.UTF8Encoding]::new($false))
[pscustomobject]@{scannedImages=$catalogScanRows.Count;metadata='output/characters/catalog/image-metadata.json'}|ConvertTo-Json -Compress
