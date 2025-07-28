# Analisis de optimizacion del proyecto White Pearl Translation

Write-Host "ANALISIS DE OPTIMIZACION DEL PROYECTO" -ForegroundColor Green
Write-Host "======================================"

# Analisis inicial
$totalSize = (Get-ChildItem -Recurse -File | Measure-Object Length -Sum).Sum
$imageSize = (Get-ChildItem ".\Recursos\imagenes" -File | Measure-Object Length -Sum).Sum
$cssSize = (Get-ChildItem ".\styles" -File | Measure-Object Length -Sum).Sum
$jsSize = (Get-ChildItem ".\java" -File | Measure-Object Length -Sum).Sum

Write-Host "`nTAMANO DEL PROYECTO:" -ForegroundColor Cyan
Write-Host "   Total: $([math]::Round($totalSize/1MB,2)) MB"
Write-Host "   Imagenes: $([math]::Round($imageSize/1KB,2)) KB ($([math]::Round(($imageSize/$totalSize)*100,1))%)"
Write-Host "   CSS: $([math]::Round($cssSize/1KB,2)) KB ($([math]::Round(($cssSize/$totalSize)*100,1))%)"
Write-Host "   JavaScript: $([math]::Round($jsSize/1KB,2)) KB ($([math]::Round(($jsSize/$totalSize)*100,1))%)"

# Analizar imagenes grandes
Write-Host "`nIMAGENES PROBLEMATICAS:" -ForegroundColor Yellow
$largeImages = Get-ChildItem ".\Recursos\imagenes" -File | Where-Object { $_.Length -gt 500KB }
foreach ($img in $largeImages) {
    Write-Host "   CRITICO: $($img.Name) - $([math]::Round($img.Length/1KB,2)) KB" -ForegroundColor Red
}

# Analizar CSS
Write-Host "`nARCHIVOS CSS:" -ForegroundColor Yellow
$cssFiles = Get-ChildItem ".\styles" -Filter "*.css"
foreach ($css in $cssFiles) {
    $size = [math]::Round($css.Length/1KB,2)
    if ($size -gt 50) {
        Write-Host "   GRANDE: $($css.Name) - $size KB" -ForegroundColor Red
    } else {
        Write-Host "   $($css.Name) - $size KB"
    }
}

# Contar console.log
Write-Host "`nCONSOLE.LOG STATEMENTS:" -ForegroundColor Yellow
$jsFiles = Get-ChildItem ".\java" -Filter "*.js"
$totalConsole = 0
foreach ($js in $jsFiles) {
    $content = Get-Content $js.FullName
    $count = ($content | Select-String "console\." | Measure-Object).Count
    $totalConsole += $count
    if ($count -gt 0) {
        Write-Host "   $($js.Name): $count statements"
    }
}
Write-Host "   TOTAL: $totalConsole statements"

# Calcular ahorro potencial
$imagesSaving = $imageSize * 0.7  # 70% reduccion con WebP
$cssSaving = $cssSize * 0.2       # 20% con minificacion
$jsSaving = $jsSize * 0.1         # 10% removiendo console.log
$totalSaving = $imagesSaving + $cssSaving + $jsSaving

Write-Host "`nAHORRO POTENCIAL:" -ForegroundColor Green
Write-Host "   Imagenes (WebP): $([math]::Round($imagesSaving/1KB,2)) KB"
Write-Host "   CSS (minificar): $([math]::Round($cssSaving/1KB,2)) KB" 
Write-Host "   JS (limpiar): $([math]::Round($jsSaving/1KB,2)) KB"
Write-Host "   TOTAL: $([math]::Round($totalSaving/1KB,2)) KB ($([math]::Round(($totalSaving/$totalSize)*100,1))%)"

Write-Host "`nACCIONES RECOMENDADAS:" -ForegroundColor Magenta
Write-Host "1. Optimizar imagen de 4.4MB (CRITICO)"
Write-Host "2. Dividir home.css (57KB)"
Write-Host "3. Remover $totalConsole console.log"
Write-Host "4. Implementar lazy loading (YA HECHO)"
Write-Host "5. Minificar CSS/JS para produccion"

Write-Host "`nPARA APLICAR OPTIMIZACIONES:"
Write-Host "   .\optimize-images.ps1 -DryRun    # Ver que imagenes optimizar"
Write-Host "   .\clean-console-logs.ps1 -DryRun # Ver console.log a remover"
