$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Assemble image_gen artwork into fixed cells. No waves are drawn procedurally.
# The upper layer is one repeated image stamp; only the generated lower strips vary.
$ripplePackSource = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;
using System.IO;
using System.Collections.Generic;

public class RippleFrameInfo {
  public int number;
  public int x;
  public int y;
  public int width;
  public int height;
  public int[] visibleBounds;
  public bool sourceTouchesCellEdge;
}
public class RipplePackInfo {
  public int sourceWidth;
  public int sourceHeight;
  public int sourceCellWidth;
  public int sourceCellHeight;
  public int frozenUpperHeight;
  public int clearedLowAlphaPixels;
  public int clearedRedArtifacts;
  public List<RippleFrameInfo> frames = new List<RippleFrameInfo>();
}
public static class RippleFramePacker {
  public static RipplePackInfo Pack(string input, string outputDir) {
    using (var source = new Bitmap(input)) {
      if (source.Width % 6 != 0 || source.Height % 5 != 0)
        throw new Exception("Generated sheet is not divisible into6x5cells; inspect real boundaries first.");
      int sw=source.Width/6, sh=source.Height/5;
      if (sw!=229 || sh!=229) throw new Exception("Unexpected generated cell size; remeasure before export.");
      int size=256, px=13, py=20, freeze=138;
      var info = new RipplePackInfo {sourceWidth=source.Width,sourceHeight=source.Height,
        sourceCellWidth=sw,sourceCellHeight=sh,frozenUpperHeight=freeze+py};
      // Remove only invisible alpha residue and red background contamination.
      // The clean character contains gold/brown/cream pixels, not scarlet annotation.
      for(int y=0;y<source.Height;y++) for(int x=0;x<source.Width;x++) {
        Color c=source.GetPixel(x,y);
        if(c.A<16) { if(c.A>0) info.clearedLowAlphaPixels++; source.SetPixel(x,y,Color.Transparent); }
        else if(c.R>150 && c.G<50 && c.B<50) {
          info.clearedRedArtifacts++; source.SetPixel(x,y,Color.Transparent);
        }
      }
      Directory.CreateDirectory(Path.Combine(outputDir,"frames"));
      using(var atlas=new Bitmap(6*size,5*size,PixelFormat.Format32bppArgb))
      using(var ag=Graphics.FromImage(atlas)) {
        ag.Clear(Color.Transparent); ag.CompositingMode=CompositingMode.SourceCopy;
        ag.InterpolationMode=InterpolationMode.NearestNeighbor;
        ag.PixelOffsetMode=PixelOffsetMode.Half;
        for(int n=0;n<30;n++) {
          int col=n%6,row=n/6;
          bool touches=false;
          for(int t=0;t<sw;t++) {
            if(source.GetPixel(col*sw+t,row*sh).A>=16 || source.GetPixel(col*sw+t,(row+1)*sh-1).A>=16) touches=true;
          }
          for(int t=0;t<sh;t++) {
            if(source.GetPixel(col*sw,row*sh+t).A>=16 || source.GetPixel((col+1)*sw-1,row*sh+t).A>=16) touches=true;
          }
          using(var frame=new Bitmap(size,size,PixelFormat.Format32bppArgb))
          using(var fg=Graphics.FromImage(frame)) {
            fg.Clear(Color.Transparent); fg.CompositingMode=CompositingMode.SourceCopy;
            fg.InterpolationMode=InterpolationMode.NearestNeighbor;
            fg.PixelOffsetMode=PixelOffsetMode.Half;
            fg.DrawImage(source,new Rectangle(px,py,sw,freeze),new Rectangle(0,0,sw,freeze),GraphicsUnit.Pixel);
            fg.DrawImage(source,new Rectangle(px,py+freeze,sw,sh-freeze),
              new Rectangle(col*sw,row*sh+freeze,sw,sh-freeze),GraphicsUnit.Pixel);
            int minX=size,minY=size,maxX=-1,maxY=-1;
            for(int y=0;y<size;y++) for(int x=0;x<size;x++) {
              if(frame.GetPixel(x,y).A>=16) {
                minX=Math.Min(minX,x);minY=Math.Min(minY,y);maxX=Math.Max(maxX,x);maxY=Math.Max(maxY,y);
              }
            }
            frame.Save(Path.Combine(outputDir,"frames",String.Format("frame-{0:000}.png",n+1)),ImageFormat.Png);
            ag.DrawImageUnscaled(frame,col*size,row*size);
            info.frames.Add(new RippleFrameInfo{number=n+1,x=col*size,y=row*size,width=size,height=size,
              visibleBounds=new int[]{minX,minY,maxX+1,maxY+1},sourceTouchesCellEdge=touches});
          }
        }
        atlas.Save(Path.Combine(outputDir,"ripple-30f-sheet.png"),ImageFormat.Png);
        // Export individual PNGs from the assembled atlas, with no further drawing.
        // This keeps their decoded RGBA identical to the corresponding atlas cells.
        for(int n=0;n<30;n++) {
          using(var cell=atlas.Clone(new Rectangle((n%6)*size,(n/6)*size,size,size),PixelFormat.Format32bppArgb)) {
            cell.Save(Path.Combine(outputDir,"frames",String.Format("frame-{0:000}.png",n+1)),ImageFormat.Png);
          }
        }
      }
      return info;
    }
  }
}
'@

Add-Type -TypeDefinition $ripplePackSource -ReferencedAssemblies System.Drawing
$ripplePackRoot = $PSScriptRoot
$ripplePackInput = Join-Path $ripplePackRoot 'generated/ripple-sheet-attempt02.png'
$ripplePackResult = [RippleFramePacker]::Pack($ripplePackInput,$ripplePackRoot)
$ripplePackMeta = [ordered]@{
  image='ripple-30f-sheet.png';frameCount=30;columns=6;rows=5
  frameWidth=256;frameHeight=256;sheetWidth=1536;sheetHeight=1280
  order='row-major, left-to-right then top-to-bottom';frameNumbersStartAt=1
  defaultFps=30;loop=$true;defaultDurationSeconds=1
  anchor=[ordered]@{x=128;y=228};frozenUpperRows=[ordered]@{start=0;endExclusive=158}
  movingLowerRows=[ordered]@{start=158;endExclusive=256}
  direction='right90';palette='yellow';animation='lower jelly-skirt traveling ripple'
  generatedSource='generated/ripple-sheet-attempt02.png'
  processing='image_gen visual frames; measured229x229cells; no resampling; frozen upper image layer; transparent padding and alpha residue cleanup'
  sourceInfo=$ripplePackResult
  frames=@($ripplePackResult.frames | ForEach-Object {
    [ordered]@{number=$_.number;file=('frames/frame-{0:000}.png' -f $_.number)
      x=$_.x;y=$_.y;width=$_.width;height=$_.height;durationMs=(1000/30)
      visibleBounds=$_.visibleBounds;sourceTouchesCellEdge=$_.sourceTouchesCellEdge}
  })
}
[System.IO.File]::WriteAllText((Join-Path $ripplePackRoot 'frames.json'),($ripplePackMeta | ConvertTo-Json -Depth 10),(New-Object System.Text.UTF8Encoding $false))
[pscustomobject]$ripplePackMeta | Select-Object frameCount,frameWidth,frameHeight,sheetWidth,sheetHeight
$ripplePackResult | Select-Object sourceWidth,sourceHeight,clearedLowAlphaPixels,clearedRedArtifacts
