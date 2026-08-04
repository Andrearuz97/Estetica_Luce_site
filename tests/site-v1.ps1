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

    $blankLinks = [regex]::Matches($html, '<a\b[^>]*target="_blank"[^>]*>', 'IgnoreCase')
    foreach ($blankLink in $blankLinks) {
        Assert-True ($blankLink.Value -match 'rel="[^"]*noopener[^"]*"') "Link target=_blank senza noopener in $($htmlFile.FullName): $($blankLink.Value)"
    }

    $iframes = [regex]::Matches($html, '<iframe\b[^>]*>', 'IgnoreCase')
    foreach ($iframe in $iframes) {
        Assert-True ($iframe.Value -match 'title="[^"]+"') "Iframe senza nome accessibile in $($htmlFile.FullName)."
        Assert-True ($iframe.Value -match 'referrerpolicy="strict-origin-when-cross-origin"') "Iframe con referrerpolicy obsoleta in $($htmlFile.FullName)."
    }
}

$italianHome = Get-Content (Join-Path $projectRoot 'index.html') -Raw
$englishHome = Get-Content (Join-Path $projectRoot 'en\index.html') -Raw
$italianTreatments = Get-Content (Join-Path $projectRoot 'trattamenti\index.html') -Raw -Encoding utf8
$englishTreatments = Get-Content (Join-Path $projectRoot 'en\treatments\index.html') -Raw -Encoding utf8
$italianProducts = Get-Content (Join-Path $projectRoot 'prodotti\index.html') -Raw -Encoding utf8
$englishProducts = Get-Content (Join-Path $projectRoot 'en\products\index.html') -Raw -Encoding utf8
$italianCards = ([regex]::Matches($italianHome, 'class="before-after-card"')).Count
$englishCards = ([regex]::Matches($englishHome, 'class="before-after-card"')).Count
Assert-True ($italianCards -eq 6) "La home italiana contiene $italianCards card prima/dopo invece di 6."
Assert-True ($englishCards -eq 6) "La home inglese contiene $englishCards card before/after invece di 6."
Assert-True (([regex]::Matches($italianTreatments, 'data-treatment-card')).Count -eq 18) 'Il catalogo italiano deve contenere 18 trattamenti speciali.'
Assert-True (([regex]::Matches($englishTreatments, 'data-treatment-card')).Count -eq 18) 'Il catalogo inglese deve contenere 18 trattamenti speciali.'
Assert-True (([regex]::Matches($italianTreatments, 'data-category="massaggi"')).Count -eq 5) 'Il catalogo italiano deve contenere 5 massaggi.'
Assert-True (([regex]::Matches($englishTreatments, 'data-category="massaggi"')).Count -eq 5) 'Il catalogo inglese deve contenere 5 massaggi.'
Assert-True (-not ($italianTreatments -match 'Rituali')) 'La dicitura Rituali non deve comparire nel catalogo italiano.'
Assert-True (-not ($englishTreatments -match 'Rituals')) 'La dicitura Rituals non deve comparire nel catalogo inglese.'
Assert-True (-not ($italianTreatments.Contains([char]0x20AC) -or $italianTreatments.Contains('&euro;'))) 'Il catalogo trattamenti italiano non deve mostrare prezzi.'
Assert-True (-not ($englishTreatments.Contains([char]0x20AC) -or $englishTreatments.Contains('&euro;'))) 'Il catalogo trattamenti inglese non deve mostrare prezzi.'
Assert-True (([regex]::Matches($italianProducts, 'class="marzia-line-focus"')).Count -eq 12) 'Le 12 card prodotti italiane devono indicare l esigenza.'
Assert-True (([regex]::Matches($englishProducts, 'class="marzia-line-focus"')).Count -eq 12) 'Le 12 card prodotti inglesi devono indicare l esigenza.'
$allHtml = ($htmlFiles | ForEach-Object { Get-Content $_.FullName -Raw -Encoding utf8 }) -join "`n"
Assert-True (-not ([regex]::IsMatch($allHtml, 'footer-nav-block|class="footer-nav"'))) 'Il footer contiene ancora una navigazione ridondante.'
Assert-True (([regex]::Matches($allHtml, 'class="navbar-brand-text"')).Count -eq $htmlFiles.Count) 'Il lockup completo del brand deve apparire in ogni navbar.'
$ogImages = [regex]::Matches($allHtml, '<meta property="og:image" content="([^"]+)">')
$twitterImages = [regex]::Matches($allHtml, '<meta name="twitter:image" content="([^"]+)">')
Assert-True ($ogImages.Count -eq $htmlFiles.Count) 'Ogni pagina deve dichiarare una immagine Open Graph.'
Assert-True ($twitterImages.Count -eq $htmlFiles.Count) 'Ogni pagina deve dichiarare una immagine Twitter.'
Assert-True ((@($ogImages | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique).Count -eq 1) -and $ogImages[0].Groups[1].Value.EndsWith('/assets/img/og-estetica-luce.png')) 'Tutte le pagine devono usare la stessa immagine Open Graph ufficiale.'
Assert-True ((@($twitterImages | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique).Count -eq 1) -and $twitterImages[0].Groups[1].Value.EndsWith('/assets/img/og-estetica-luce.png')) 'Tutte le pagine devono usare la stessa immagine Twitter ufficiale.'

Add-Type -AssemblyName System.Drawing
$officialOgPath = Join-Path $projectRoot 'assets\img\og-estetica-luce.png'
Assert-True (Test-Path -LiteralPath $officialOgPath) 'Immagine social ufficiale mancante.'
$officialOg = [System.Drawing.Image]::FromFile($officialOgPath)
try {
    Assert-True ($officialOg.Width -eq 1200 -and $officialOg.Height -eq 630) 'L immagine social ufficiale deve misurare 1200x630.'
}
finally {
    $officialOg.Dispose()
}
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
Assert-True ([regex]::IsMatch($style, 'html\s*\{[^}]*-webkit-tap-highlight-color:\s*transparent', 'Singleline')) 'Il tap highlight mobile deve essere disattivato globalmente.'
Assert-True ([regex]::IsMatch($style, 'summary,\s*\[role="button"\]')) 'I controlli details devono ereditare la rimozione del tap highlight.'
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
