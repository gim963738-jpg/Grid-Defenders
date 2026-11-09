param([Parameter(Mandatory=$true)][string]$ConfigPath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$config=Get-Content -Raw -Encoding UTF8 -LiteralPath $ConfigPath | ConvertFrom-Json
$stats=Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $config.output 'extraction-stats.json') | ConvertFrom-Json
Add-Type -AssemblyName System.Drawing
$videoScriptDirectory=if($PSScriptRoot){$PSScriptRoot}else{Join-Path (Get-Location) 'tools/video-sprites'}
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition ([IO.File]::ReadAllText((Join-Path $videoScriptDirectory 'Extract-SkyGrassSprite.cs'),[Text.Encoding]::UTF8))
$result=[SkyGrassSpriteExtractor]::Verify([string[]]@($config.frames|ForEach-Object source_file),[string[]]@($stats.frames|ForEach-Object {Join-Path $config.output $_.file}),(Join-Path $config.output $stats.sheet),$stats.columns,$stats.crop_x,$stats.crop_y)
[IO.File]::WriteAllText((Join-Path $config.output 'verification.json'),($result|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
[pscustomobject]@{frames=$result.frame_count;alpha=$result.alpha;sheet_cells_match=$result.sheet_cells_match;source_rgb_unchanged=$result.source_rgb_unchanged;no_clipping=$result.no_clipping}|ConvertTo-Json -Compress
