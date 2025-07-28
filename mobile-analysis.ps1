# Análisis de rendimiento móvil

Write-Host "ANÁLISIS DE RENDIMIENTO MÓVIL" -ForegroundColor Green
Write-Host "=============================="

# Revisar home.css para problemas móviles
$homeCss = Get-Content ".\styles\home.css" -Raw

Write-Host "`nPROBLEMAS IDENTIFICADOS:" -ForegroundColor Red

if ($homeCss -match 'backdrop-filter.*blur') {
    Write-Host "❌ backdrop-filter blur (MUY PESADO en móviles)"
}

if ($homeCss -match 'filter.*drop-shadow') {
    Write-Host "❌ drop-shadow filters (consume GPU móvil)"
}

if ($homeCss -match 'animation.*infinite') {
    Write-Host "⚠️  Animaciones infinitas (drenan batería)"
}

# Revisar JavaScript problemático
$jsProblems = 0
$jsFiles = Get-ChildItem ".\java" -Filter "*.js"

foreach ($js in $jsFiles) {
    $content = Get-Content $js.FullName -Raw
    if ($content -match 'addEventListener.*scroll') {
        Write-Host "❌ Event listeners de scroll en $($js.Name)"
        $jsProblems++
    }
    if ($content -match 'canvas|toDataURL') {
        Write-Host "⚠️  Procesamiento canvas en $($js.Name) (puede trabar)"
        $jsProblems++
    }
}

# Tamaño CSS crítico
$cssSize = (Get-ChildItem ".\styles\home.css").Length / 1KB
Write-Host "`nTAMAÑO CSS CRÍTICO: $([math]::Round($cssSize, 2)) KB"

if ($cssSize -gt 50) {
    Write-Host "❌ MUY GRANDE para móviles" -ForegroundColor Red
} else {
    Write-Host "✅ Tamaño aceptable" -ForegroundColor Green
}

Write-Host "`nIMPACTO EN MÓVILES:" -ForegroundColor Yellow
Write-Host "- backdrop-filter: Puede causar lag en scroll"
Write-Host "- Animaciones: Drenan batería rápidamente"  
Write-Host "- Canvas: Puede trabar en móviles lentos"
Write-Host "- CSS grande: Bloquea renderizado inicial"

Write-Host "`nSOLUCIONES NECESARIAS:" -ForegroundColor Green
Write-Host "1. Detectar móviles y reducir efectos"
Write-Host "2. Lazy loading inteligente"
Write-Host "3. Pausar animaciones en batería baja"
Write-Host "4. Debounce para eventos scroll"
