using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public sealed class SpriteFrameInfo {
 public int index,source_index,x,y,w,h,visible_x,visible_y,visible_w,visible_h,opaque_pixels,filled_holes;
 public string file;
}
public sealed class SpriteBuildInfo {
 public int source_width,source_height,cell_width,cell_height,sheet_width,sheet_height,columns,rows,crop_x,crop_y,source_min_x,source_min_y,source_max_x,source_max_y;
 public string sheet;
 public List<SpriteFrameInfo> frames=new List<SpriteFrameInfo>();
}
public static class SkyGrassSpriteExtractor {
 static byte[] ReadPixels(string path,out int w,out int h) {
  using(Bitmap original=new Bitmap(path))
  using(Bitmap image=new Bitmap(original.Width,original.Height,PixelFormat.Format32bppArgb)) {
   using(Graphics g=Graphics.FromImage(image)) {g.CompositingMode=System.Drawing.Drawing2D.CompositingMode.SourceCopy;g.DrawImageUnscaled(original,0,0);}
   w=image.Width;h=image.Height;
   BitmapData d=image.LockBits(new Rectangle(0,0,w,h),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
   try {byte[] p=new byte[w*h*4];for(int y=0;y<h;y++)Marshal.Copy(IntPtr.Add(d.Scan0,y*d.Stride),p,y*w*4,w*4);return p;}
   finally {image.UnlockBits(d);}
  }
 }
 static void WritePixels(string path,int w,int h,byte[] p) {
  using(Bitmap image=new Bitmap(w,h,PixelFormat.Format32bppArgb)) {
   BitmapData d=image.LockBits(new Rectangle(0,0,w,h),ImageLockMode.WriteOnly,PixelFormat.Format32bppArgb);
   try {for(int y=0;y<h;y++)Marshal.Copy(p,y*w*4,IntPtr.Add(d.Scan0,y*d.Stride),w*4);}
   finally {image.UnlockBits(d);}
   image.Save(path,ImageFormat.Png);
  }
 }
 static bool IsBackdrop(int r,int g,int b) {
  // This palette rule is specific to the supplied blue-sky/green-grass clip.
  // Bright cyan on the sword is foreground.
  bool cyan=g-r>=80 && b-r>=95 && b>=190 && g>=170;
  if(cyan)return false;
  bool sky=b-r>12 && g-r>8 && g*100>=b*74 && g*100<=b*120;
  bool grass=g*100>=r*94 && g*100>=b*108 && g-r>=-5 && g>=30;
  return sky||grass;
 }
 static byte[] Segment(byte[] rgb,int w,int h,out SpriteFrameInfo info) {
  int n=w*h;
  bool[] candidate=new bool[n];
  for(int i=0;i<n;i++) {int p=i*4;candidate[i]=!IsBackdrop(rgb[p+2],rgb[p+1],rgb[p]);}
  int[] labels=new int[n],queue=new int[n];int label=0,best=0,bestSize=0;
  for(int start=0;start<n;start++) {
   if(!candidate[start]||labels[start]!=0)continue;
   label++;int head=0,tail=0;queue[tail++]=start;labels[start]=label;
   while(head<tail) {
    int p=queue[head++],px=p%w,py=p/w;
    for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++) {
     if(dx==0&&dy==0)continue;int xx=px+dx,yy=py+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;
     int next=yy*w+xx;if(candidate[next]&&labels[next]==0){labels[next]=label;queue[tail++]=next;}
    }
   }
   if(tail>bestSize){bestSize=tail;best=label;}
  }
  if(bestSize<n/30)throw new Exception("No reliable character component.");
  bool[] mask=new bool[n];
  for(int i=0;i<n;i++)mask[i]=labels[i]==best;
  // Restore enclosed surface pixels while retaining real gaps in the silhouette.
  Array.Clear(labels,0,n);int filled=0;
  for(int start=0;start<n;start++) {
   if(mask[start]||labels[start]!=0)continue;
   int head=0,tail=0,candidateInside=0;bool border=false;queue[tail++]=start;labels[start]=1;
   while(head<tail) {
    int p=queue[head++],xx=p%w,yy=p/w;if(candidate[p])candidateInside++;
    if(xx==0||xx==w-1||yy==0||yy==h-1)border=true;
    int[] neighbors={xx>0?p-1:-1,xx+1<w?p+1:-1,yy>0?p-w:-1,yy+1<h?p+w:-1};
    for(int k=0;k<4;k++){int q=neighbors[k];if(q>=0&&!mask[q]&&labels[q]==0){labels[q]=1;queue[tail++]=q;}}
   }
   if(!border&&(tail<=128||(tail<=2048&&candidateInside*5>=tail))){for(int k=0;k<tail;k++)mask[queue[k]]=true;filled+=tail;}
  }
  int minX=w,minY=h,maxX=-1,maxY=-1,area=0;
  for(int i=0;i<n;i++) {
   int p=i*4;
   if(mask[i]) {rgb[p+3]=255;int xx=i%w,yy=i/w;minX=Math.Min(minX,xx);minY=Math.Min(minY,yy);maxX=Math.Max(maxX,xx);maxY=Math.Max(maxY,yy);area++;}
   else {rgb[p]=rgb[p+1]=rgb[p+2]=rgb[p+3]=0;}
  }
  info=new SpriteFrameInfo {visible_x=minX,visible_y=minY,visible_w=maxX-minX+1,visible_h=maxY-minY+1,opaque_pixels=area,filled_holes=filled};
  return rgb;
 }
 public static object Verify(string[] sources,string[] outputs,string sheetPath,int columns,int cropX,int cropY) {
  int sw,sh;byte[] atlas=ReadPixels(sheetPath,out sw,out sh);int cellW=0,cellH=0;
  List<object> checks=new List<object>();
  for(int i=0;i<outputs.Length;i++) {
   int w,h,sourceW,sourceH;byte[] cell=ReadPixels(outputs[i],out w,out h),source=ReadPixels(sources[i],out sourceW,out sourceH);
   if(i>0&&(w!=cellW||h!=cellH))throw new Exception("Cell size mismatch.");cellW=w;cellH=h;
   int minX=w,minY=h,maxX=-1,maxY=-1,zero=0,opaque=0;
   for(int y=0;y<h;y++)for(int x=0;x<w;x++) {
    int p=(y*w+x)*4,ap=(((i/columns)*h+y)*sw+(i%columns)*w+x)*4;
    for(int c=0;c<4;c++)if(cell[p+c]!=atlas[ap+c])throw new Exception("Sheet cell mismatch: "+i);
    if(cell[p+3]==0){zero++;continue;}
    if(cell[p+3]!=255)throw new Exception("Unexpected alpha level.");
    int sx=x+cropX,sy=y+cropY;
    if(sx<0||sx>=sourceW||sy<0||sy>=sourceH)throw new Exception("Opaque padding outside source.");
    int sp=(sy*sourceW+sx)*4;
    for(int c=0;c<3;c++)if(cell[p+c]!=source[sp+c])throw new Exception("Foreground pixel changed: "+i);
    opaque++;minX=Math.Min(minX,x);minY=Math.Min(minY,y);maxX=Math.Max(maxX,x);maxY=Math.Max(maxY,y);
   }
   if(zero==0||opaque==0||minX<=0||minY<=0||maxX>=w-1||maxY>=h-1)throw new Exception("Missing alpha or clipping: "+i);
   checks.Add(new {index=i,transparent_pixels=zero,opaque_pixels=opaque,bounds=new {x=minX,y=minY,width=maxX-minX+1,height=maxY-minY+1},sheet_cell_matches=true,source_rgb_unchanged=true});
  }
  if(sw!=cellW*columns||sh!=cellH*((outputs.Length+columns-1)/columns))throw new Exception("Sheet dimensions mismatch.");
  return new {frame_count=outputs.Length,cell_width=cellW,cell_height=cellH,sheet_width=sw,sheet_height=sh,alpha=true,sheet_cells_match=true,source_rgb_unchanged=true,no_clipping=true,frames=checks};
 }
 public static SpriteBuildInfo Build(string[] sources,int[] sourceIndices,string destination,string scratch,int columns,int padding) {
  Directory.CreateDirectory(destination);Directory.CreateDirectory(Path.Combine(destination,"frames"));Directory.CreateDirectory(scratch);
  int minX=int.MaxValue,minY=int.MaxValue,maxX=-1,maxY=-1,w=0,h=0;
  SpriteBuildInfo result=new SpriteBuildInfo();
  for(int i=0;i<sources.Length;i++) {
   int ww,hh;byte[] rgb=ReadPixels(sources[i],out ww,out hh);
   if(i>0&&(w!=ww||h!=hh))throw new Exception("Source frame size changed.");
   w=ww;h=hh;SpriteFrameInfo info;byte[] rgba=Segment(rgb,w,h,out info);
   info.index=i;info.source_index=sourceIndices[i];info.file="frames/walk_right_"+i.ToString("000")+".png";
   result.frames.Add(info);
   minX=Math.Min(minX,info.visible_x);minY=Math.Min(minY,info.visible_y);
   maxX=Math.Max(maxX,info.visible_x+info.visible_w-1);maxY=Math.Max(maxY,info.visible_y+info.visible_h-1);
   WritePixels(Path.Combine(scratch,i.ToString("000")+".png"),w,h,rgba);
  }
  int cw=((maxX-minX+1+padding*2+15)/16)*16,ch=((maxY-minY+1+padding*2+15)/16)*16;
  int ox=minX-(cw-(maxX-minX+1))/2,oy=minY-(ch-(maxY-minY+1))/2;
  int rows=(sources.Length+columns-1)/columns,sw=cw*columns,sh=ch*rows;
  byte[] sheet=new byte[sw*sh*4];
  for(int i=0;i<sources.Length;i++) {
   int ww,hh;byte[] rgba=ReadPixels(Path.Combine(scratch,i.ToString("000")+".png"),out ww,out hh);
   byte[] cell=new byte[cw*ch*4];
   for(int y=0;y<ch;y++) {
    int sy=y+oy;if(sy<0||sy>=h)continue;int x0=Math.Max(0,-ox),x1=Math.Min(cw,w-ox);
    if(x1>x0)Buffer.BlockCopy(rgba,(sy*w+ox+x0)*4,cell,(y*cw+x0)*4,(x1-x0)*4);
   }
   string output=Path.Combine(destination,result.frames[i].file);
   WritePixels(output,cw,ch,cell);
   int tx=(i%columns)*cw,ty=(i/columns)*ch;
   for(int y=0;y<ch;y++)Buffer.BlockCopy(cell,y*cw*4,sheet,((ty+y)*sw+tx)*4,cw*4);
   result.frames[i].x=tx;result.frames[i].y=ty;result.frames[i].w=cw;result.frames[i].h=ch;
   result.frames[i].visible_x-=ox;result.frames[i].visible_y-=oy;
  }
  string sheetPath=Path.Combine(destination,"walk_right_60_10x6.png");WritePixels(sheetPath,sw,sh,sheet);
  result.source_width=w;result.source_height=h;result.cell_width=cw;result.cell_height=ch;
  result.sheet_width=sw;result.sheet_height=sh;result.columns=columns;result.rows=rows;result.crop_x=ox;result.crop_y=oy;
  result.source_min_x=minX;result.source_min_y=minY;result.source_max_x=maxX;result.source_max_y=maxY;result.sheet="walk_right_60_10x6.png";
  return result;
 }
}

