param([Parameter(Mandatory=$true)][string]$ConfigPath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$config=Get-Content -Raw -Encoding UTF8 -LiteralPath $ConfigPath | ConvertFrom-Json
Add-Type -AssemblyName System.Drawing
$videoScriptDirectory=if($PSScriptRoot){$PSScriptRoot}else{Join-Path (Get-Location) 'tools/video-sprites'}
$code=[IO.File]::ReadAllText((Join-Path $videoScriptDirectory 'Extract-SkyGrassSprite.cs'),[Text.Encoding]::UTF8)
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition $code
$info=[SkyGrassSpriteExtractor]::Build([string[]]@($config.frames | ForEach-Object source_file),[int[]]@($config.frames | ForEach-Object source_index),$config.output,(Join-Path $config.scratch 'keyed'),10,16)
[IO.File]::WriteAllText((Join-Path $config.output 'extraction-stats.json'),($info|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
[pscustomobject]@{frames=$info.frames.Count;cell=@($info.cell_width,$info.cell_height);sheet=@($info.sheet_width,$info.sheet_height);crop=@($info.crop_x,$info.crop_y);output=$config.output}|ConvertTo-Json -Compress

