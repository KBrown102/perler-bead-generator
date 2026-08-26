# =====================================================================
#  Perler bead palette importer
#  Source: open dataset maxcleme/beadcolors (used by BeadSurge / Kandi Pad)
#  Action: download raw/*.csv, parse RGB per brand, write palettes.js
#          next to index.html (which auto-loads it to override built-ins).
#
#  Usage (on a machine with internet, in PowerShell):
#      cd <this folder>
#      .\import-palette.ps1
#
#  It prints the first 5 colors of each brand for you to verify.
# =====================================================================
param()
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13

$root   = $PSScriptRoot
$zipUrl = 'https://codeload.github.com/maxcleme/beadcolors/zip/refs/heads/master'
$zipPath = Join-Path $root '_beadcolors.zip'
$tmpDir  = Join-Path $root '_beadcolors_tmp'
$outPath = Join-Path $root 'palettes.js'

# ---------- CSV helpers ----------
function Split-CsvLine([string]$line) {
    $fields = @()
    $sb = New-Object System.Text.StringBuilder
    $inQuotes = $false
    for ($i = 0; $i -lt $line.Length; $i++) {
        $ch = $line[$i]
        if ($inQuotes) {
            if ($ch -eq '"') {
                if (($i + 1) -lt $line.Length -and $line[$i + 1] -eq '"') { [void]$sb.Append('"'); $i++ }
                else { $inQuotes = $false }
            } else { [void]$sb.Append($ch) }
        } else {
            if ($ch -eq '"') { $inQuotes = $true }
            elseif ($ch -eq ',') { $fields += $sb.ToString(); [void]$sb.Clear() }
            else { [void]$sb.Append($ch) }
        }
    }
    $fields += $sb.ToString()
    return ,$fields
}

function Parse-BeadCsv([string]$path) {
    $colors = New-Object System.Collections.Generic.List[object]
    foreach ($line in (Get-Content $path -Encoding UTF8)) {
        $t = $line.Trim()
        if (-not $t -or $t.StartsWith('#')) { continue }
        $f = Split-CsvLine $t
        if ($f.Count -lt 3) { continue }
        $code = $f[0].Trim()
        # skip header rows (first field is a pure keyword)
        if ($code -match '(?i)^(code|name|id|number|num|nr|color|colour|rgb|hex|brand)$') { continue }
        $hex = $null; $r = $null; $g = $null; $b = $null; $name = ''
        for ($i = 1; $i -lt $f.Count; $i++) {
            $v = $f[$i].Trim()
            if (-not $v) { continue }
            if ($v -match '^#?[0-9a-fA-F]{6}$') { $hex = $v -replace '^#', ''; continue }
            if ($v -match '^[0-9]{1,3}$') {
                $n = [int]$v
                if ($n -ge 0 -and $n -le 255) {
                    if ($null -eq $r) { $r = $n } elseif ($null -eq $g) { $g = $n } elseif ($null -eq $b) { $b = $n }
                    continue
                }
            }
            if (-not $name -and $v -match '[A-Za-z]') { $name = $v }
        }
        if (-not $hex -and $null -ne $r -and $null -ne $g -and $null -ne $b) {
            $hex = '{0:X2}{1:X2}{2:X2}' -f $r, $g, $b
        }
        if (-not $hex -or -not $code) { continue }
        if (-not $name) { $name = $code }
        $colors.Add([pscustomobject]@{ code = $code; name = $name; hex = ('#' + $hex) })
    }
    return ,$colors
}

function Brand-KeyFromFilename([string]$name) {
    $base = [IO.Path]::GetFileNameWithoutExtension($name).ToLower()
    if ($base -match 'perler')   { return 'perler' }
    if ($base -match 'hama')     { return 'hama' }
    if ($base -match 'artkal')   { return 'artkal' }
    if ($base -match 'mard')     { return 'mard' }
    if ($base -match 'nabbi')    { return 'nabbi' }
    if ($base -match 'photon')   { return 'photon' }
    if ($base -match 'playmais') { return 'playmais' }
    return ($base -replace '[^a-z0-9]', '')
}

# ---------- main ----------
Write-Host ''
Write-Host '==> Downloading maxcleme/beadcolors ...' -ForegroundColor Cyan
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -TimeoutSec 120

Write-Host '==> Extracting ...' -ForegroundColor Cyan
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force

$repoDir = Get-ChildItem $tmpDir -Directory | Select-Object -First 1
if (-not $repoDir) { throw 'Extract failed: repo folder not found.' }
$rawDir = Join-Path $repoDir.FullName 'raw'
if (-not (Test-Path $rawDir)) { throw "raw folder not found: $rawDir" }

$csvFiles = @(Get-ChildItem $rawDir -Filter *.csv)
if ($csvFiles.Count -eq 0) { throw 'No CSV files found under raw/.' }
Write-Host "==> Found $($csvFiles.Count) CSV file(s), parsing ..." -ForegroundColor Cyan

$brands = @{}
foreach ($csv in $csvFiles) {
    $key = Brand-KeyFromFilename $csv.Name
    $colors = Parse-BeadCsv $csv.FullName
    if (-not $brands.ContainsKey($key)) { $brands[$key] = New-Object System.Collections.Generic.List[object] }
    foreach ($c in $colors) { $brands[$key].Add($c) }
}

# de-duplicate by code
$brandColors = @{}
foreach ($key in ($brands.Keys | Sort-Object)) {
    $seen = @{}
    $uniq = New-Object System.Collections.Generic.List[object]
    foreach ($c in $brands[$key]) {
        if (-not $seen.ContainsKey($c.code)) { $seen[$c.code] = $true; $uniq.Add($c) }
    }
    $brandColors[$key] = $uniq
}

# split Mard into base 221 (A-H + M) and full 291
if ($brandColors.ContainsKey('mard')) {
    $mardFull = $brandColors['mard']
    $mardBasic = New-Object System.Collections.Generic.List[object]
    foreach ($c in $mardFull) {
        if ($c.code -match '^[A-HM]') { $mardBasic.Add($c) }
    }
    $brandColors['mard221'] = $mardBasic
    $brandColors['mard291'] = $mardFull
    $brandColors.Remove('mard')
}

# generate palettes.js
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('// generated by import-palette.ps1; source: https://github.com/maxcleme/beadcolors')
[void]$sb.AppendLine('window.PALETTE_DEFS = {')
foreach ($key in ($brandColors.Keys | Sort-Object)) {
    $uniq = $brandColors[$key]
    if ($key -eq 'mard221') { $brandName = 'Mard 221' }
    elseif ($key -eq 'mard291') { $brandName = 'Mard 291' }
    else { $brandName = ($key.Substring(0, 1).ToUpper() + $key.Substring(1)) }
    [void]$sb.AppendLine("  '$key': {")
    [void]$sb.AppendLine("    name: '$brandName',")
    [void]$sb.AppendLine('    colors: [')
    for ($i = 0; $i -lt $uniq.Count; $i++) {
        $c = $uniq[$i]
        $comma = if ($i -lt ($uniq.Count - 1)) { ',' } else { '' }
        $hex = $c.hex.ToUpper()
        $nm = ($c.name -replace "'", "\'")
        [void]$sb.AppendLine("      {code:'$($c.code)',name:'$nm',hex:'$hex'}$comma")
    }
    [void]$sb.AppendLine('    ]')
    [void]$sb.AppendLine('  },')
}
[void]$sb.AppendLine('};')

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($outPath, $sb.ToString(), $utf8NoBom)

Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '==> Done. Verify each brand (first 5 colors):' -ForegroundColor Green
foreach ($key in ($brandColors.Keys | Sort-Object)) {
    $uniq = $brandColors[$key]
    Write-Host ("[{0}] {1} colors" -f $key, $uniq.Count) -ForegroundColor Yellow
    $uniq | Select-Object -First 5 | ForEach-Object {
        Write-Host ("    {0,-10} {1,-24} {2}" -f $_.code, $_.name, $_.hex)
    }
}
Write-Host ''
Write-Host "==> Written to: $outPath" -ForegroundColor Green
Write-Host '==> Refresh index.html to use the accurate palettes.' -ForegroundColor Green
