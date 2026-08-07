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

    $jsonLdBlocks = [regex]::Matches($html, '<script type="application/ld\+json">([\s\S]*?)</script>', 'IgnoreCase')
    foreach ($jsonLdBlock in $jsonLdBlocks) {
        try {
            $null = $jsonLdBlock.Groups[1].Value | ConvertFrom-Json
        }
        catch {
            Assert-True $false "JSON-LD non valido in $($htmlFile.FullName): $($_.Exception.Message)"
        }
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
Assert-True (([regex]::Matches($italianTreatments, 'data-treatment-need=')).Count -eq 6) 'La guida italiana deve offrire 6 filtri per esigenza.'
Assert-True (([regex]::Matches($englishTreatments, 'data-treatment-need=')).Count -eq 6) 'La guida inglese deve offrire 6 filtri per esigenza.'
Assert-True (([regex]::Matches($italianHome, 'trattamenti/index\.html\?categoria=')).Count -eq 4) 'I quattro percorsi della home italiana devono aprire il catalogo gia filtrato.'
Assert-True (([regex]::Matches($englishHome, 'treatments/index\.html\?category=')).Count -eq 4) 'I quattro percorsi della home inglese devono aprire il catalogo gia filtrato.'
Assert-True (([regex]::Matches($italianHome, 'trattamenti/index\.html#belly-plus')).Count -eq 2) 'I due risultati Belly Plus italiani devono collegarsi al trattamento.'
Assert-True (([regex]::Matches($englishHome, 'treatments/index\.html#belly-plus')).Count -eq 2) 'I due risultati Belly Plus inglesi devono collegarsi al trattamento.'
Assert-True ($italianTreatments -match 'data-treatment-view-share') 'La guida italiana deve permettere di condividere una selezione.'
Assert-True ($englishTreatments -match 'data-treatment-view-share') 'La guida inglese deve permettere di condividere una selezione.'
Assert-True (-not ($italianTreatments -match 'Rituali')) 'La dicitura Rituali non deve comparire nel catalogo italiano.'
Assert-True (-not ($englishTreatments -match 'Rituals')) 'La dicitura Rituals non deve comparire nel catalogo inglese.'
Assert-True (-not ($italianTreatments.Contains([char]0x20AC) -or $italianTreatments.Contains('&euro;'))) 'Il catalogo trattamenti italiano non deve mostrare prezzi.'
Assert-True (-not ($englishTreatments.Contains([char]0x20AC) -or $englishTreatments.Contains('&euro;'))) 'Il catalogo trattamenti inglese non deve mostrare prezzi.'
Assert-True (([regex]::Matches($italianProducts, 'class="marzia-line-focus"')).Count -eq 12) 'Le 12 card prodotti italiane devono indicare l esigenza.'
Assert-True (([regex]::Matches($englishProducts, 'class="marzia-line-focus"')).Count -eq 12) 'Le 12 card prodotti inglesi devono indicare l esigenza.'
foreach ($page in @($italianTreatments, $englishTreatments, $italianProducts, $englishProducts)) {
    Assert-True ($page -match 'class="page-hero (?:treatments|products)-hero"') 'Le pagine guida devono condividere la stessa struttura hero.'
    Assert-True ($page -match 'class="page-hero-title"') 'Le pagine guida devono condividere la stessa gerarchia tipografica hero.'
}
$allHtml = ($htmlFiles | ForEach-Object { Get-Content $_.FullName -Raw -Encoding utf8 }) -join "`n"
$descriptivePages = @($italianHome, $englishHome, $italianTreatments, $englishTreatments, $italianProducts, $englishProducts) -join "`n"
$treatmentGuides = @($italianTreatments, $englishTreatments) -join "`n"
$indexedPages = @($italianHome, $englishHome, $italianTreatments, $englishTreatments, $italianProducts, $englishProducts)
$legalPages = @(
    (Get-Content (Join-Path $projectRoot 'privacy-policy\index.html') -Raw -Encoding utf8),
    (Get-Content (Join-Path $projectRoot 'cookie-policy\index.html') -Raw -Encoding utf8),
    (Get-Content (Join-Path $projectRoot 'en\privacy-policy\index.html') -Raw -Encoding utf8),
    (Get-Content (Join-Path $projectRoot 'en\cookie-policy\index.html') -Raw -Encoding utf8)
)
Assert-True (-not ($treatmentGuides -match 'data-treatment-price|treatment-total|treatment-cart|booking-summary')) 'La guida trattamenti deve restare descrittiva, senza prezzi, somme, carrello o riepilogo di prenotazione.'
Assert-True (([regex]::Matches($allHtml, 'class="btn-floating btn-whatsapp-float"')).Count -eq $htmlFiles.Count) 'Ogni pagina deve mantenere il pulsante WhatsApp flottante.'
Assert-True ($italianHome -match '<a href="#contatti">Prenota Ora</a>' -and $italianHome -match '>Prenota ora</a>') 'La Home italiana deve mantenere i CTA originali di prenotazione.'
Assert-True ($englishHome -match '<a href="#contatti">Book Now</a>' -and $englishHome -match '>Book now</a>') 'La Home inglese deve mantenere i CTA originali di prenotazione.'
Assert-True (([regex]::Matches($italianHome, 'class="img-placeholder[^\"]*trattamento-preview-')).Count -eq 4) 'Le quattro anteprime italiane devono avere un visual coerente dedicato.'
Assert-True (([regex]::Matches($englishHome, 'class="img-placeholder[^\"]*trattamento-preview-')).Count -eq 4) 'Le quattro anteprime inglesi devono avere un visual coerente dedicato.'
Assert-True ($italianTreatments -match 'id="contatti" class="contact-section"' -and $englishTreatments -match 'id="contact" class="contact-section"') 'La guida trattamenti deve mantenere il CTA di contatto finale.'
Assert-True ($italianProducts -match 'id="contatti" class="contact-section"' -and $englishProducts -match 'id="contatti" class="contact-section"') 'La guida prodotti deve mantenere il CTA di contatto finale.'
Assert-True ($italianProducts -match '>Contattaci</a>' -and $englishProducts -match '>Contact us</a>') 'Il CTA prodotti deve usare una voce collettiva e neutra.'
Assert-True (-not (($treatmentGuides + $italianProducts + $englishProducts) -match 'Chiedi a Gaia|Ti risponde Gaia|Ask Gaia|Gaia will reply|Selezione fatta da Gaia|Selected by Gaia')) 'I CTA e i consigli devono parlare a nome del centro, senza nominare Gaia.'
foreach ($page in $indexedPages) {
    Assert-True ($page -match '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">') 'Ogni pagina principale deve consentire indicizzazione e anteprime ampie.'
    Assert-True (([regex]::Matches($page, '<link rel="alternate" hreflang=')).Count -eq 3) 'Ogni pagina principale deve dichiarare italiano, inglese e x-default.'
}
foreach ($page in $legalPages) {
    Assert-True ($page -match '<meta name="robots" content="noindex, follow">') 'Le pagine legali non devono competere nei risultati di ricerca.'
}
$canonicals = [regex]::Matches($allHtml, '<link rel="canonical" href="https://andrearuz97\.github\.io/Estetica_Luce_site/[^\"]*">')
Assert-True ($canonicals.Count -eq $htmlFiles.Count) 'Ogni pagina deve dichiarare il proprio URL canonical GitHub Pages.'
$robotsPath = Join-Path $projectRoot 'robots.txt'
$sitemapPath = Join-Path $projectRoot 'sitemap.xml'
Assert-True (Test-Path -LiteralPath $robotsPath) 'robots.txt mancante.'
Assert-True (Test-Path -LiteralPath $sitemapPath) 'sitemap.xml mancante.'
if (Test-Path -LiteralPath $robotsPath) {
    $robots = Get-Content $robotsPath -Raw -Encoding utf8
    Assert-True ($robots -match 'Sitemap: https://andrearuz97\.github\.io/Estetica_Luce_site/sitemap\.xml') 'robots.txt deve indicare la sitemap GitHub Pages.'
}
if (Test-Path -LiteralPath $sitemapPath) {
    try {
        [xml]$sitemap = Get-Content $sitemapPath -Raw -Encoding utf8
        $sitemapUrls = @($sitemap.urlset.url)
        Assert-True ($sitemapUrls.Count -eq 6) 'La sitemap deve contenere le 6 pagine principali italiane e inglesi.'
        Assert-True (-not (($sitemapUrls.loc -join "`n") -match 'privacy-policy|cookie-policy')) 'Le pagine legali noindex non devono apparire nella sitemap.'
    }
    catch {
        Assert-True $false "sitemap.xml non valida: $($_.Exception.Message)"
    }
}
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
foreach ($imageVariable in @('--img-trattamento-viso:', '--img-trattamento-corpo:', '--img-trattamento-presso:', '--img-trattamento-massaggi:')) {
    Assert-True ($style.Contains($imageVariable)) "Manca la fotografia coerente dedicata: $imageVariable"
}
Assert-True ($style.Contains("--hero-background-image: url('../img/optimized/specchio-1800.jpg')")) 'La home deve usare un immagine identitaria diversa dalle cabine trattamenti.'
Assert-True ($style.Contains("--img-trattamento-presso: url('../img/optimized/pressoterapia-1200.jpg')")) 'La pressoterapia deve usare la fotografia locale adattata.'
Assert-True (([regex]::Matches($italianHome, 'class="gallery-slide')).Count -eq 5) 'Il carosello italiano deve mantenere tutte le cinque fotografie originali.'
Assert-True (([regex]::Matches($englishHome, 'class="gallery-slide')).Count -eq 5) 'Il carosello inglese deve mantenere tutte le cinque fotografie originali.'
Assert-True ($style.Contains('.products-guide-step')) 'L introduzione prodotti deve essere una guida utile e non una fotografia duplicata.'
$script = Get-Content (Join-Path $projectRoot 'assets\script\script.js') -Raw
Assert-True ($script.Contains('lostpointercapture')) 'Manca la gestione dello swipe interrotto.'
Assert-True ($script.Contains('ResizeObserver')) 'Manca il riallineamento responsive dei caroselli.'
Assert-True ($script.Contains('window.addEventListener("hashchange"')) 'I link diretti ai trattamenti devono reagire ai cambi di URL.'
Assert-True ($script.Contains('navigator.clipboard')) 'Le card trattamenti devono permettere di copiare il link diretto.'
Assert-True ($script.Contains('https://wa.me/?text=')) 'Le card trattamenti devono poter essere condivise su WhatsApp.'
Assert-True ($script.Contains('const treatmentNeedMap')) 'I trattamenti devono essere associati alle 6 esigenze della guida.'
Assert-True ($script.Contains('needStatusLabels')) 'Il filtro per esigenza deve comunicare quanti trattamenti mostra.'
Assert-True ($script.Contains('const guideRouting')) 'Categorie ed esigenze devono avere URL condivisibili.'
Assert-True ($script.Contains('navigator.share')) 'La selezione filtrata deve usare la condivisione nativa quando disponibile.'
Assert-True ($script.Contains('const setupPageTransitions')) 'Manca la transizione coerente tra pagine e sezioni interne.'
Assert-True ($script.Contains('history.pushState(null, "", nextUrl)')) 'I salti interni devono aggiornare l URL senza mostrare lo scorrimento lungo.'
Assert-True ($script.Contains('window.location.assign(url.href)')) 'I collegamenti interni tra pagine devono usare la stessa transizione.'
Assert-True ($script.Contains('target.matches?.("section[id]")')) 'Le sezioni raggiunte dai link devono condividere la stessa correzione di allineamento.'
Assert-True ($script.Contains('sectionPadding * 0.35')) 'La posizione delle sezioni deve compensare leggermente il padding superiore.'
Assert-True ($script.Contains('const alignInitialHash')) 'I link con ancora provenienti da altre pagine devono essere riallineati al caricamento.'
Assert-True ($script.Contains('const finishInitialHashAlignment')) 'Il riallineamento finale deve attendere l assestamento del layout.'
Assert-True ($style.Contains('body.is-navigation-fading')) 'Manca lo stato visivo della transizione di navigazione.'
Assert-True ($style.Contains('@keyframes site-transition-reveal')) 'Manca la dissolvenza coerente in entrata.'
Assert-True ($style.Contains("background: url('../img/logo-estetica-luce-transparent.png')")) 'La transizione deve mostrare il logo ufficiale sul fondo crema.'
Assert-True ($style.Contains('.treatment-card.is-linked')) 'Il trattamento aperto da un link diretto deve essere evidenziato.'
Assert-True ($style.Contains('.treatment-card-share')) 'Le azioni di condivisione devono avere uno stile dedicato.'
Assert-True ($style.Contains('.treatment-need.is-active')) 'L esigenza selezionata deve essere riconoscibile visivamente.'
Assert-True ($style.Contains('.treatment-view-share')) 'La condivisione della selezione deve avere uno stile dedicato.'
Assert-True ($style.Contains('.before-after-treatment-link')) 'I risultati identificati devono poter rimandare al trattamento.'

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
