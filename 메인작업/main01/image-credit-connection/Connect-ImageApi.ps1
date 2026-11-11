param([switch]$Check)
$ErrorActionPreference = 'Stop'
$modelId = 'gpt-image-2.6-sunburst'
$privateDir = Join-Path $env:LOCALAPPDATA 'GridDefenders\ImageApi'
$secretPath = Join-Path $privateDir 'openai-key.dpapi'
$statusPath = Join-Path $privateDir 'connection-status.json'
$credential = $null
$keyText = $null
$pointer = [IntPtr]::Zero
function Write-Status([string]$state, [int]$httpStatus = 0) {
    $row = [ordered]@{
        status = $state
        model = $modelId
        httpStatus = $httpStatus
        checkedAt = (Get-Date).ToString('o')
        imageRequestsMade = 0
        imageCreditSpent = $false
        billingBalanceVerified = $false
        credentialStorage = 'Windows DPAPI; current Windows user'
    }
    $json = $row | ConvertTo-Json
    if (Test-Path -LiteralPath $privateDir) {
        [IO.File]::WriteAllText($statusPath, $json, [Text.UTF8Encoding]::new($false))
    }
    Write-Output $json
}
try {
    if ($Check) {
        if (-not (Test-Path -LiteralPath $secretPath)) {
            Write-Status 'credential_not_connected'
            exit 2
        }
        $credential = Get-Content -LiteralPath $secretPath -Raw | ConvertTo-SecureString
    } else {
        Write-Host 'Use a project API key from the organization containing your ChatGPT benefit credits.'
        Write-Host 'This checks model access only. It does NOT generate images or purchase credits.'
        $credential = Read-Host 'Paste the API key here (input hidden; never paste it into chat)' -AsSecureString
    }
    if ($credential.Length -eq 0) { Write-Status 'empty_key_not_saved'; exit 2 }
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential)
    $keyText = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ($keyText -notmatch '^sk-[A-Za-z0-9_-]+$') { Write-Status 'invalid_key_format_not_saved'; exit 2 }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $reply = Invoke-RestMethod -Method Get -Uri ('https://api.openai.com/v1/models/' + $modelId) -Headers @{ Authorization = 'Bearer ' + $keyText } -TimeoutSec 30 -MaximumRedirection 0
    if ($reply.id -ne $modelId) { Write-Status 'unexpected_model_not_saved'; exit 3 }
    if (-not $Check) {
        [IO.Directory]::CreateDirectory($privateDir) | Out-Null
        $encrypted = ConvertFrom-SecureString -SecureString $credential
        [IO.File]::WriteAllText($secretPath, $encrypted, [Text.Encoding]::ASCII)
    }
    Write-Status 'authenticated_model_access_verified' 200
} catch {
    $statusCode = 0
    try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { }
    # Never print request headers, raw exception objects, or credentials.
    Write-Status 'authentication_or_model_access_failed' $statusCode
    exit 1
} finally {
    $keyText = $null
    if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($null -ne $credential) { $credential.Dispose() }
}
