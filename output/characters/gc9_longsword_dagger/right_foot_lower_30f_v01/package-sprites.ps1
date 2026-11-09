param([string]$AssetDir = $PSScriptRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$AssetDir = [System.IO.Path]::GetFullPath($AssetDir)
$frameDir = Join-Path $AssetDir 'frames'
New-Item -ItemType Directory -Force -Path $frameDir | Out-Null
$source = [System.Drawing.Bitmap]::new((Join-Path $AssetDir 'right-foot-lower-30f-generated-v01.png'))
if ($source.Width -ne 1374 -or $source.Height -ne 1145) { throw 'Unexpected source grid dimensions.' }
$sheet = [System.Drawing.Bitmap]::new(1536, 1280, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
$sheetGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$frames = [ordered]@{}
$checks = @()
for ($index = 0; $index -lt 30; $index++) {
    $column = $index % 6
    $row = [Math]::Floor($index / 6)
    $sourceRect = [System.Drawing.Rectangle]::new($column * 229, $row * 229, 229, 229)
    $cell = $source.Clone($sourceRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $frame = [System.Drawing.Bitmap]::new(256, 256, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($frame)
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $graphics.DrawImageUnscaled($cell, 13, 13)
    $graphics.Dispose()
    $name = 'right-foot-lower-{0:d2}.png' -f ($index + 1)
    $path = Join-Path $frameDir $name
    $frame.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $sheetGraphics.DrawImageUnscaled($frame, $column * 256, $row * 256)
    $left = 256; $top = 256; $right = -1; $bottom = -1; $transparent = 0; $opaque = 0; $edgeVisible = 0
    for ($y = 0; $y -lt 256; $y++) {
        for ($x = 0; $x -lt 256; $x++) {
            $alpha = $frame.GetPixel($x, $y).A
            if ($alpha -eq 0) { $transparent++ }
            if ($alpha -eq 255) { $opaque++ }
            if ($alpha -ge 16) {
                $left = [Math]::Min($left, $x); $top = [Math]::Min($top, $y)
                $right = [Math]::Max($right, $x); $bottom = [Math]::Max($bottom, $y)
                if ($x -eq 0 -or $y -eq 0 -or $x -eq 255 -or $y -eq 255) { $edgeVisible++ }
            }
        }
    }
    $checks += [ordered]@{
        index = $index + 1; file = "frames/$name"; sha256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower()
        visibleBoundsAlpha16 = @{ x = $left; y = $top; w = $right - $left + 1; h = $bottom - $top + 1 }
        transparentPixels = $transparent; opaquePixels = $opaque; visiblePixelsOnCellEdge = $edgeVisible
    }
    $frames[$name] = [ordered]@{
        frame = @{ x = $column * 256; y = $row * 256; w = 256; h = 256 }
        rotated = $false; trimmed = $false
        spriteSourceSize = @{ x = 0; y = 0; w = 256; h = 256 }
        sourceSize = @{ w = 256; h = 256 }
        pivot = @{ x = 0.5; y = 0.9140625 }
        duration = 2000.0 / 30
    }
    $frame.Dispose(); $cell.Dispose()
}
$sheetGraphics.Dispose()
$sheet.Save((Join-Path $AssetDir 'right-foot-lower-30f.png'), [System.Drawing.Imaging.ImageFormat]::Png)
foreach ($background in @('light', 'dark')) {
    $review = [System.Drawing.Bitmap]::new(1536, 1280)
    $graphics = [System.Drawing.Graphics]::FromImage($review)
    $color = if ($background -eq 'light') { [System.Drawing.Color]::FromArgb(241,243,247) } else { [System.Drawing.Color]::FromArgb(33,39,51) }
    $graphics.Clear($color)
    $graphics.DrawImageUnscaled($sheet, 0, 0)
    $review.Save((Join-Path $AssetDir "review-$background.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose(); $review.Dispose()
}
$metadata = [ordered]@{
    frames = $frames
    animations = @{ 'right-foot-lower' = @($frames.Keys) }
    meta = [ordered]@{
        image = 'right-foot-lower-30f.png'; format = 'RGBA8888'; size = @{ w = 1536; h = 1280 }; scale = '1'
        columns = 6; rows = 5; frameCount = 30; fps = 15; durationMs = 2000; loop = $false
        direction = 'right'; directionDegrees = 90; frameOrder = 'row-major'
        cellSize = @{ w = 256; h = 256 }; originPixels = @{ x = 128; y = 234 }
        originNote = 'Fixed visual ground anchor; independent of collision / damage bounds. Frame cells are never individually trimmed.'
        source = 'right-foot-lower-30f-generated-v01.png'; sourceCellSize = 229
        padding = @{ left = 13; top = 13; right = 14; bottom = 14 }; resampled = $false
        tool = 'built-in image_gen'; prompt = 'generation-prompt.txt'
    }
}
$metadata | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $AssetDir 'right-foot-lower-30f.json')
$verification = [ordered]@{
    frameCount = $checks.Count; uniquePngHashes = @($checks.sha256 | Select-Object -Unique).Count
    allFramesHaveTransparency = @($checks | Where-Object { $_.transparentPixels -eq 0 }).Count -eq 0
    allFramesHaveOpaqueContent = @($checks | Where-Object { $_.opaquePixels -eq 0 }).Count -eq 0
    allCellEdgesClearAlpha16 = @($checks | Where-Object { $_.visiblePixelsOnCellEdge -ne 0 }).Count -eq 0
    sourceSize = @{ w = $source.Width; h = $source.Height }; sourceCell = 229
    sheetSize = @{ w = 1536; h = 1280 }; finalCell = 256; noResampling = $true
    frames = $checks
}
$verification | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $AssetDir 'verification.json')
$sheet.Dispose(); $source.Dispose()
[pscustomobject]$verification | Select-Object frameCount,uniquePngHashes,allFramesHaveTransparency,allFramesHaveOpaqueContent,allCellEdgesClearAlpha16 | ConvertTo-Json

