# 🚀 OPTIMIZADOR COMPLETO - White Pearl Translation
# Script para optimizar rendimiento del sitio web

param(
    [switch]$DryRun = $false,
    [switch]$Images = $true,
    [switch]$CSS = $true,
    [switch]$JS = $true,
    [switch]$CleanUp = $true
)

$originalLocation = Get-Location
Set-Location $PSScriptRoot

Write-Host "🚀 INICIANDO OPTIMIZACIÓN COMPLETA DEL PROYECTO" -ForegroundColor Magenta
Write-Host "=================================================" -ForegroundColor Magenta

# Crear directorio de reportes
$reportDir = ".\optimization-reports"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "$reportDir\optimization-report-$timestamp.txt"

function Write-Report {
    param($Message, $Color = "White")
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $reportFile -Value "$(Get-Date -Format 'HH:mm:ss') - $Message"
}

# ===== 1. ANÁLISIS INICIAL =====
Write-Report "📊 ANÁLISIS INICIAL DEL PROYECTO" "Cyan"

$totalSizeBefore = (Get-ChildItem -Recurse -File | Measure-Object Length -Sum).Sum
$imageSize = (Get-ChildItem ".\Recursos\imagenes" -File | Measure-Object Length -Sum).Sum
$cssSize = (Get-ChildItem ".\styles" -File | Measure-Object Length -Sum).Sum
$jsSize = (Get-ChildItem ".\java" -File | Measure-Object Length -Sum).Sum

Write-Report "   Tamaño total: $([math]::Round($totalSizeBefore/1MB,2)) MB"
Write-Report "   Imágenes: $([math]::Round($imageSize/1KB,2)) KB ($([math]::Round(($imageSize/$totalSizeBefore)*100,1))%)"
Write-Report "   CSS: $([math]::Round($cssSize/1KB,2)) KB ($([math]::Round(($cssSize/$totalSizeBefore)*100,1))%)"
Write-Report "   JavaScript: $([math]::Round($jsSize/1KB,2)) KB ($([math]::Round(($jsSize/$totalSizeBefore)*100,1))%)"

# ===== 2. OPTIMIZACIÓN DE IMÁGENES =====
if ($Images) {
    Write-Report "`n🖼️  OPTIMIZACIÓN DE IMÁGENES" "Green"
    
    # Detectar imágenes problemáticas
    $largeImages = Get-ChildItem ".\Recursos\imagenes" -File | Where-Object { $_.Length -gt 500KB }
    $pngImages = Get-ChildItem ".\Recursos\imagenes" -Filter "*.png" | Where-Object { $_.Length -gt 50KB }
    
    Write-Report "   Imágenes grandes (>500KB): $($largeImages.Count)"
    Write-Report "   PNG grandes (>50KB): $($pngImages.Count)"
    
    foreach ($img in $largeImages) {
        Write-Report "   ⚠️  CRÍTICO: $($img.Name) - $([math]::Round($img.Length/1KB,2)) KB" "Red"
    }
    
    if (-not $DryRun) {
        Write-Report "   💡 Para optimizar imágenes, ejecuta: .\optimize-images.ps1" "Yellow"
    }
}

# ===== 3. OPTIMIZACIÓN CSS =====
if ($CSS) {
    Write-Report "`n🎨 ANÁLISIS DE CSS" "Green"
    
    $cssFiles = Get-ChildItem ".\styles" -Filter "*.css"
    $duplicateRules = @()
    
    # Detectar CSS sin usar en HTML
    $htmlContent = Get-Content ".\index.html" -Raw
    $unusedCSS = @()
    
    foreach ($css in $cssFiles) {
        $cssName = $css.BaseName
        if ($htmlContent -notmatch $cssName -and $css.Name -ne "home.css") {
            $unusedCSS += $css
        }
    }
    
    Write-Report "   Archivos CSS totales: $($cssFiles.Count)"
    Write-Report "   CSS potencialmente sin usar: $($unusedCSS.Count)"
    
    foreach ($css in $unusedCSS) {
        Write-Report "   ❓ Revisar: $($css.Name) - $([math]::Round($css.Length/1KB,2)) KB" "Yellow"
    }
    
    # home.css es muy grande, analizar
    $homeCSS = Get-ChildItem ".\styles\home.css"
    if ($homeCSS.Length -gt 50KB) {
        Write-Report "   ⚠️  home.css es muy grande: $([math]::Round($homeCSS.Length/1KB,2)) KB" "Yellow"
        Write-Report "   💡 Considerar dividir en módulos más pequeños" "Yellow"
    }
}

# ===== 4. OPTIMIZACIÓN JAVASCRIPT =====
if ($JS) {
    Write-Report "`n⚡ ANÁLISIS DE JAVASCRIPT" "Green"
    
    $jsFiles = Get-ChildItem ".\java" -Filter "*.js"
    $consoleStatements = 0
    $totalJSLines = 0
    
    foreach ($js in $jsFiles) {
        $content = Get-Content $js.FullName
        $totalJSLines += $content.Count
        $consoleCount = ($content | Select-String "console\." | Measure-Object).Count
        $consoleStatements += $consoleCount
        
        if ($consoleCount -gt 5) {
            Write-Report "   🐛 $($js.Name): $consoleCount console.log statements" "Yellow"
        }
    }
    
    Write-Report "   Archivos JS: $($jsFiles.Count)"
    Write-Report "   Total líneas: $totalJSLines"
    Write-Report "   Console statements: $consoleStatements"
    
    # Detectar imports/exports para optimización
    $moduleFiles = $jsFiles | Where-Object { 
        (Get-Content $_.FullName -Raw) -match "import|export" 
    }
    Write-Report "   Archivos con ES6 modules: $($moduleFiles.Count)"
}

# ===== 5. LIMPIEZA GENERAL =====
if ($CleanUp) {
    Write-Report "`n🧹 LIMPIEZA Y ARCHIVOS OBSOLETOS" "Green"
    
    # Buscar archivos temporales, backups, etc.
    $tempFiles = Get-ChildItem -Recurse | Where-Object { 
        $_.Name -match '\.(tmp|bak|old|backup)$|~$' 
    }
    
    $emptyFolders = Get-ChildItem -Recurse -Directory | Where-Object { 
        (Get-ChildItem $_.FullName -Recurse -File | Measure-Object).Count -eq 0 
    }
    
    Write-Report "   Archivos temporales: $($tempFiles.Count)"
    Write-Report "   Carpetas vacías: $($emptyFolders.Count)"
    
    # Revisar README vacio
    $readme = Get-ChildItem "README" -ErrorAction SilentlyContinue
    if ($readme -and $readme.Length -lt 100) {
        Write-Report "   README esta casi vacio ($($readme.Length) bytes)" "Yellow"
    }
}

# ===== 6. RECOMENDACIONES DE RENDIMIENTO WEB =====
Write-Report "`nRECOMENDACIONES DE RENDIMIENTO WEB" "Cyan"

# Revisar index.html para optimizaciones
$indexContent = Get-Content ".\index.html" -Raw

$recommendations = @()

if ($indexContent -match 'cdn\.jsdelivr\.net') {
    $recommendations += "✅ Usando CDN para Bootstrap (correcto)"
}

if ($indexContent -match 'preconnect') {
    $recommendations += "✅ Preconnect configurado (correcto)"
}

if ($indexContent -notmatch 'defer|async') {
    $recommendations += "⚠️  Considerar async/defer en scripts"
}

if ($indexContent -match 'console\.log') {
    $recommendations += "⚠️  Remover console.log en producción"
}

# Checking for lazy loading
if ($indexContent -notmatch 'loading="lazy"') {
    $recommendations += "💡 Implementar lazy loading para imágenes"
}

foreach ($rec in $recommendations) {
    Write-Report "   $rec"
}

# ===== 7. RESUMEN Y ACCIONES =====
Write-Report "`nPLAN DE ACCION PRIORITARIO" "Magenta"

Write-Report "1. CRITICO: Optimizar imagen de 4.4MB con WebP"
Write-Report "2. Dividir home.css (57KB) en modulos"
Write-Report "3. Remover $consoleStatements console.log statements"
Write-Report "4. Implementar lazy loading"
Write-Report "5. Considerar minificacion de CSS/JS"

# Cálculo de ahorro potencial
$potentialSavings = ($imageSize * 0.7) + ($cssSize * 0.2) + ($jsSize * 0.1)
Write-Report "`nAHORRO POTENCIAL ESTIMADO: $([math]::Round($potentialSavings/1KB,2)) KB" "Green"
Write-Report "   Reduccion estimada: $([math]::Round(($potentialSavings/$totalSizeBefore)*100,1))% del tamaño total" "Green"

if ($DryRun) {
    Write-Report "`n⚠️  MODO DRY-RUN: Análisis completado sin cambios" "Yellow"
} else {
    Write-Report "`n✅ ANÁLISIS COMPLETADO - Reporte guardado en: $reportFile" "Green"
}

Write-Report "`nSIGUIENTE PASO: Ejecutar optimizaciones especificas con los scripts individuales" "Cyan"

Set-Location $originalLocation
