$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-True([bool]$condition, [string]$message) {
    if (-not $condition) {
        $failures.Add($message)
    }
}

function Resolve-LocalReference([string]$htmlPath, [string]$reference) {
    $cleanReference = ($reference -split '[?#]')[0]
    if (-not $cleanReference -or $cleanReference -match '^(https?:|mailto:|tel:|javascript:|#)') {
        return $null
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $htmlPath) $cleanReference))
}

$htmlFiles = Get-ChildItem $projectRoot -Filter '*.html' -File -Recurse
foreach ($htmlFile in $htmlFiles) {
    $html = Get-Content $htmlFile.FullName -Raw
    $references = [regex]::Matches($html, '(?:src|href)="([^"]+)"')
    foreach ($match in $references) {
        $resolved = Resolve-LocalReference $htmlFile.FullName $match.Groups[1].Value
        if ($resolved) {
            Assert-True (Test-Path -LiteralPath $resolved) "Riferimento mancante in $($htmlFile.FullName): $($match.Groups[1].Value)"
        }
    }
}

$italianHome = Get-Content (Join-Path $projectRoot 'index.html') -Raw
$englishHome = Get-Content (Join-Path $projectRoot 'en\index.html') -Raw
$italianCards = ([regex]::Matches($italianHome, 'class="before-after-card"')).Count
$englishCards = ([regex]::Matches($englishHome, 'class="before-after-card"')).Count
Assert-True ($italianCards -eq 6) "La home italiana contiene $italianCards card prima/dopo invece di 6."
Assert-True ($englishCards -eq 6) "La home inglese contiene $englishCards card before/after invece di 6."

Add-Type -AssemblyName System.Drawing
$cardImages = [regex]::Matches($italianHome, '<img src="(assets/img/before-after/[^"]+)"[^>]*width="1200"[^>]*height="1200"')
Assert-True ($cardImages.Count -eq 6) "Le 6 immagini prima/dopo devono dichiarare width e height 1200."
foreach ($match in $cardImages) {
    $imagePath = Join-Path $projectRoot $match.Groups[1].Value
    if (Test-Path -LiteralPath $imagePath) {
        $image = [System.Drawing.Image]::FromFile($imagePath)
        try {
            Assert-True ($image.Width -eq 1200 -and $image.Height -eq 1200) "$($match.Groups[1].Value) non misura 1200x1200."
        }
        finally {
            $image.Dispose()
        }
        Assert-True ((Get-Item $imagePath).Length -lt 350KB) "$($match.Groups[1].Value) supera 350 KB."
    }
}

$manifestPath = Join-Path $projectRoot 'manifest.webmanifest'
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
foreach ($icon in $manifest.icons) {
    Assert-True (Test-Path -LiteralPath (Join-Path $projectRoot $icon.src)) "Icona manifest mancante: $($icon.src)"
}

$stylePath = Join-Path $projectRoot 'assets\style\style.css'
$style = Get-Content $stylePath -Raw
foreach ($flag in @('it.svg', 'gb.svg')) {
    $flagPath = Join-Path $projectRoot "assets\img\flags\$flag"
    Assert-True (Test-Path -LiteralPath $flagPath) "Bandiera mancante: assets/img/flags/$flag"
    Assert-True ($style.Contains("flags/$flag")) "La bandiera $flag non e collegata nel CSS."
}

Assert-True ($style.Contains('touch-action: pan-y')) 'I caroselli devono preservare lo scorrimento verticale touch.'
$script = Get-Content (Join-Path $projectRoot 'assets\script\script.js') -Raw
Assert-True ($script.Contains('lostpointercapture')) 'Manca la gestione dello swipe interrotto.'
Assert-True ($script.Contains('ResizeObserver')) 'Manca il riallineamento responsive dei caroselli.'

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    & $node.Source --check (Join-Path $projectRoot 'assets\script\script.js')
    Assert-True ($LASTEXITCODE -eq 0) 'La sintassi di assets/script/script.js non e valida.'
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Host "OK: $($htmlFiles.Count) pagine, riferimenti locali, 6+6 card, immagini web, manifest e JavaScript verificati."
