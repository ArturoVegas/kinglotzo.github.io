# Análisis de rendimiento móvil para kinglotzo.github.io

Write-Host "ANÁLISIS DE RENDIMIENTO MÓVIL" -ForegroundColor Green
Write-Host "=============================="

# Revisar CSS problemático para móviles
Write-Host "`nPROBLEMAS IDENTIFICADOS EN CSS:" -ForegroundColor Yellow

$cssFiles = Get-ChildItem ".\styles" -Filter "*.css"
$mobileProblems = @()

foreach ($css in $cssFiles) {
    $content = Get-Content $css.FullName -Raw
    
    # Detectar problemas de rendimiento móvil
    if ($content -match 'backdrop-filter.*blur') {
        $mobileProblems += "❌ $($css.Name): backdrop-filter con blur (muy pesado en móviles)"
    }
    
    if ($content -match 'filter.*drop-shadow') {
        $mobileProblems += "❌ $($css.Name): drop-shadow filters (consume GPU en móviles)"
    }
    
    if ($content -match 'animation.*\d+s.*infinite') {
        $mobileProblems += "⚠️  $($css.Name): Animaciones infinitas (drenan batería)"
    }
    
    if ($content -match 'transform.*scale|translateY.*-\d+px') {
        $mobileProblems += "ℹ️  $($css.Name): Múltiples transforms (revisar rendimiento)"
    }
    
    if ($content -match 'box-shadow.*\d+px.*\d+px.*\d+px') {
        $mobileProblems += "⚠️  $($css.Name): Box-shadows complejos"
    }
}

$mobileProblems | ForEach-Object { Write-Host "   $_" }

# Revisar JavaScript problemático
Write-Host "`nPROBLEMAS EN JAVASCRIPT:" -ForegroundColor Yellow

$jsFiles = Get-ChildItem ".\java" -Filter "*.js"
$jsProblems = @()

foreach ($js in $jsFiles) {
    $content = Get-Content $js.FullName -Raw
    
    if ($content -match 'setInterval|setTimeout.*\d+') {
        $jsProblems += "⚠️  $($js.Name): Timers frecuentes (pueden trabar en móviles)"
    }
    
    if ($content -match 'addEventListener.*scroll') {
        $jsProblems += "❌ $($js.Name): Event listeners de scroll (muy pesado en móviles)"
    }
    
    if ($content -match 'FileReader|canvas|toDataURL') {
        $jsProblems += "⚠️  $($js.Name): Procesamiento de imágenes (puede trabar en móviles lentos)"
    }
}

$jsProblems | ForEach-Object { Write-Host "   $_" }

# Verificar meta tags móviles
Write-Host "`nCONFIGURACIÓN MÓVIL:" -ForegroundColor Cyan

$indexContent = Get-Content ".\index.html" -Raw

if ($indexContent -match 'viewport.*width=device-width') {
    Write-Host "   ✅ Viewport meta tag configurado correctamente"
} else {
    Write-Host "   ❌ Falta meta viewport adecuado"
}

if ($indexContent -match 'preconnect') {
    Write-Host "   ✅ Preconnect configurado (bueno para móviles)"
} else {
    Write-Host "   ❌ Sin preconnect (DNS lento en móviles)"
}

# Calcular peso de recursos críticos
$criticalCSS = Get-ChildItem ".\styles\home.css"
$cssSize = [math]::Round($criticalCSS.Length / 1KB, 2)

Write-Host "`nPESO DE RECURSOS CRÍTICOS:" -ForegroundColor Magenta
Write-Host "   CSS principal (home.css): $cssSize KB"

if ($cssSize -gt 50) {
    Write-Host "   ❌ CSS demasiado grande para móviles (>50KB)" -ForegroundColor Red
} elseif ($cssSize -gt 30) {
    Write-Host "   ⚠️  CSS grande para móviles lentos" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Tamaño CSS aceptable para móviles" -ForegroundColor Green
}

Write-Host "`nRECOMENDACIONES PARA MÓVILES:" -ForegroundColor Green
Write-Host "1. 🚀 Reducir backdrop-filter blur"
Write-Host "2. 📱 Lazy loading para imágenes"
Write-Host "3. 🔋 Pausar animaciones en móviles"
Write-Host "4. ⚡ Dividir CSS en crítico y no-crítico"
Write-Host "5. 🎯 Usar Intersection Observer para scroll"
Write-Host "6. 📶 Optimizar para conexiones lentas"
