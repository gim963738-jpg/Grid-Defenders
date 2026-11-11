$ErrorActionPreference = 'Stop'
$taskRecordDir = $PSScriptRoot
$taskRoot = 'C:\Users\user\Desktop\Grid Defenders'
$orcaExecutable = 'C:\Users\user\AppData\Local\Programs\orca\resources\bin\orca.exe'
$retirementCheck = Get-Content -LiteralPath (Join-Path $taskRecordDir '정리전최종검증.json') -Raw -Encoding utf8 | ConvertFrom-Json
if (-not $retirementCheck.userRequestedRetirement -or -not $retirementCheck.allowedOnlyExactTargets) { throw 'Verified scope missing' }
$finished = @()
foreach ($retirementTarget in $retirementCheck.targets) {
    $expectedLabel = if ($retirementTarget.role -eq 'main02') { '메인02' } elseif ($retirementTarget.role -eq 'main03') { '메인03' } else { throw 'Unexpected role' }
    $expectedPath = [IO.Path]::GetFullPath((Join-Path 'C:\Users\user\orca\workspaces\Grid Defenders' $expectedLabel))
    $actualPath = (Resolve-Path -LiteralPath $retirementTarget.source).Path
    if ($actualPath -ne $expectedPath -or -not $retirementTarget.shaVerifiedAgain) { throw 'Exact source verification failed' }
    $archivePath = (Resolve-Path -LiteralPath $retirementTarget.archive).Path
    $expectedArchive = [IO.Path]::GetFullPath((Join-Path $taskRoot ('자료\메인인수\20261111\' + $retirementTarget.role + '\파일')))
    if ($archivePath -ne $expectedArchive) { throw 'Archive outside intended location' }
    $selector = 'id:de86d10c-8e2c-444d-8b0f-43b772894ad9::' + $actualPath.Replace('\','/')
    $receiptPath = Join-Path $taskRecordDir ($retirementTarget.role + '-폐지영수증.json')
    if (Test-Path -LiteralPath $receiptPath) { throw 'Receipt exists; inspect rather than repeating removal' }
    $receiptText = & $orcaExecutable worktree rm --worktree $selector --force --json
    $removeExit = $LASTEXITCODE
    $receiptText | Set-Content -LiteralPath $receiptPath -Encoding utf8
    $receiptData = ($receiptText -join "`n") | ConvertFrom-Json
    if ($removeExit -ne 0 -or -not $receiptData.ok) { throw ('Orca removal not confirmed: ' + $retirementTarget.role) }
    if (Test-Path -LiteralPath $actualPath) { throw 'Original path remains; do not delete it manually' }
    # Retain existing image/document links using a data-only junction to the verified archive.
    New-Item -ItemType Junction -Path $actualPath -Target $archivePath | Out-Null
    $junctionItem = Get-Item -LiteralPath $actualPath
    if ($junctionItem.LinkType -ne 'Junction' -or $junctionItem.Target -ne $archivePath) { throw 'Archive link verification failed' }
    $branchHead = (& git -C $taskRoot rev-parse ('refs/heads/' + $retirementTarget.branch)) -join ''
    if ($LASTEXITCODE -ne 0 -or $branchHead.Trim() -ne $retirementTarget.head) { throw 'Original branch preservation not confirmed' }
    $finished += [pscustomobject]@{ role=$retirementTarget.role; removedFromOrca=$true; originalBranchPreserved=$true; originalHead=$branchHead.Trim(); archive=$archivePath; compatibilityJunction=$actualPath }
    Write-Output ($retirementTarget.role + ': removed from Orca, branch kept, archive links preserved')
}
$finished | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $taskRecordDir '메인폐지결과.json') -Encoding utf8
