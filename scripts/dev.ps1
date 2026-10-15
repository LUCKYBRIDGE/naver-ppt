<#
.SYNOPSIS
Run project commands with a compatible Node runtime without changing system settings.
#>
param([ValidateSet('install', 'check', 'dev', 'build')][string]$Task = 'check')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction Stop
$npmCli = Join-Path (Split-Path -Parent $npmCommand.Source) 'node_modules\npm\bin\npm-cli.js'
if (-not (Test-Path -LiteralPath $npmCli)) { throw 'Cannot locate npm CLI next to npm.cmd.' }
$runtimePath = if ($nodeCommand) { $nodeCommand.Source } else { $null }
if ($runtimePath) {
    $runtimeVersion = [version]((& $runtimePath -p 'process.versions.node') | Select-Object -Last 1)
}
if (-not $runtimePath -or -not (($runtimeVersion.Major -eq 22 -and $runtimeVersion -ge [version]'22.12.0') -or $runtimeVersion.Major -eq 24 -or $runtimeVersion.Major -ge 26)) {
    $bundledRuntime = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (-not (Test-Path -LiteralPath $bundledRuntime)) { throw 'Install Node 24 LTS or configure a compatible runtime.' }
    $runtimePath = $bundledRuntime
}
$originalPath = $env:PATH
try {
    $env:PATH = (Split-Path -Parent $runtimePath) + ';' + $originalPath
    Push-Location -LiteralPath $projectRoot
    try {
        Write-Host "Node: $(& $runtimePath --version); task: $Task"
        if ($Task -eq 'install') { & $runtimePath $npmCli ci }
        else { & $runtimePath $npmCli run $Task }
        if ($LASTEXITCODE -ne 0) { throw "Project command failed (exit $LASTEXITCODE)." }
    } finally { Pop-Location }
} finally { $env:PATH = $originalPath }
